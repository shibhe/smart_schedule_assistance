import { Router, type IRouter } from "express";
import { db, chatMessagesTable, eventsTable } from "@workspace/db";
import { desc, eq, and } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { broadcastToUser } from "../websocket/wsServer";
import { sendPushToUser } from "./push";

const router: IRouter = Router();

function requireAuth(req: any, res: any, next: any) {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.userId = userId;
  next();
}

router.get("/chat/history", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId as string;
  const messages = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.userId, userId))
    .orderBy(chatMessagesTable.createdAt);

  res.json(messages.map(formatMessage));
});

router.post("/chat/message", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId as string;
  const { message } = req.body;

  if (!message || typeof message !== "string") {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  await db.insert(chatMessagesTable).values({ userId, role: "user", content: message });

  const today = new Date().toISOString().split("T")[0];
  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const recentEvents = await db
    .select()
    .from(eventsTable)
    .where(eq(eventsTable.userId, userId))
    .orderBy(desc(eventsTable.startTime))
    .limit(10);

  const eventsContext =
    recentEvents.length > 0
      ? `Current events in the schedule:\n${recentEvents
          .map(
            (e) =>
              `- ID:${e.id} "${e.title}" on ${e.date} at ${new Date(e.startTime).toLocaleTimeString()} (${e.category}, ${e.priority} priority, ${e.completed ? "completed" : "pending"})`,
          )
          .join("\n")}`
      : "No events currently scheduled.";

  const systemPrompt = `You are an intelligent scheduling assistant for the Smart Scheduler app. Today is ${todayFormatted} (${today}).

You help users manage their schedule by creating, updating, deleting, and retrieving events through natural language.

${eventsContext}

When the user wants to perform a scheduling action, respond with a JSON block in your message like this:
<action>
{
  "type": "create" | "update" | "delete" | "list",
  "event": {
    "title": "string",
    "description": "string (optional)",
    "startTime": "ISO 8601 datetime",
    "endTime": "ISO 8601 datetime (optional)",
    "date": "YYYY-MM-DD",
    "category": "work" | "personal" | "health" | "social" | "general",
    "priority": "low" | "medium" | "high"
  },
  "eventId": number (for update/delete operations)
}
</action>

Rules:
- If the user says "tomorrow", calculate based on today being ${todayFormatted}
- For times without AM/PM context, use context to determine (morning/afternoon/evening)
- If a category isn't clear, default to "general"
- If priority isn't specified, default to "medium"
- For delete/update, find the most likely matching event by ID from the context above
- Always confirm the action you performed in a friendly, concise way
- If you can't determine what event to update/delete, ask for clarification
- Keep responses brief and conversational`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 1024,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
    });

    const aiResponse = completion.choices[0]?.message?.content ?? "I couldn't process your request.";

    let action = null;
    let createdEvent = null;
    let updatedEvent = null;
    let eventId: number | null = null;

    const actionMatch = aiResponse.match(/<action>([\s\S]*?)<\/action>/);
    if (actionMatch) {
      try {
        const actionData = JSON.parse(actionMatch[1].trim());
        action = actionData.type;
        eventId = actionData.eventId ?? null;

        if (actionData.type === "create" && actionData.event) {
          const evt = actionData.event;
          const [newEvent] = await db
            .insert(eventsTable)
            .values({
              userId,
              title: evt.title,
              description: evt.description ?? null,
              startTime: new Date(evt.startTime),
              endTime: evt.endTime ? new Date(evt.endTime) : null,
              date: evt.date || evt.startTime?.split("T")[0] || today,
              category: evt.category ?? "general",
              priority: evt.priority ?? "medium",
            })
            .returning();

          createdEvent = newEvent;
          eventId = newEvent.id;

          broadcastToUser(userId, { type: "event_created", event: formatEvent(newEvent) });
          sendPushToUser(userId, {
            title: "📅 Event Scheduled",
            body: `"${evt.title}" added to your schedule`,
          }).catch(() => {});

          await db.insert(chatMessagesTable).values({
            userId,
            role: "assistant",
            content: aiResponse.replace(/<action>[\s\S]*?<\/action>/, "").trim(),
            eventAction: "create",
            eventId: newEvent.id,
          });
        } else if (actionData.type === "update" && actionData.eventId && actionData.event) {
          const evt = actionData.event;
          const updateData: Record<string, unknown> = {};

          if (evt.title) updateData.title = evt.title;
          if (evt.description !== undefined) updateData.description = evt.description;
          if (evt.startTime) updateData.startTime = new Date(evt.startTime);
          if (evt.endTime) updateData.endTime = new Date(evt.endTime);
          if (evt.date) updateData.date = evt.date;
          if (evt.category) updateData.category = evt.category;
          if (evt.priority) updateData.priority = evt.priority;

          const [updEvt] = await db
            .update(eventsTable)
            .set(updateData)
            .where(and(eq(eventsTable.id, actionData.eventId), eq(eventsTable.userId, userId)))
            .returning();

          updatedEvent = updEvt;

          if (updEvt) broadcastToUser(userId, { type: "event_updated", event: formatEvent(updEvt) });

          await db.insert(chatMessagesTable).values({
            userId,
            role: "assistant",
            content: aiResponse.replace(/<action>[\s\S]*?<\/action>/, "").trim(),
            eventAction: "update",
            eventId: updEvt?.id ?? actionData.eventId,
          });
        } else if (actionData.type === "delete" && actionData.eventId) {
          await db
            .delete(eventsTable)
            .where(and(eq(eventsTable.id, actionData.eventId), eq(eventsTable.userId, userId)));

          broadcastToUser(userId, { type: "event_deleted", eventId: actionData.eventId });

          await db.insert(chatMessagesTable).values({
            userId,
            role: "assistant",
            content: aiResponse.replace(/<action>[\s\S]*?<\/action>/, "").trim(),
            eventAction: "delete",
            eventId: actionData.eventId,
          });
        } else {
          await db.insert(chatMessagesTable).values({
            userId,
            role: "assistant",
            content: aiResponse.replace(/<action>[\s\S]*?<\/action>/, "").trim(),
          });
        }
      } catch {
        await db.insert(chatMessagesTable).values({
          userId,
          role: "assistant",
          content: aiResponse.replace(/<action>[\s\S]*?<\/action>/, "").trim(),
        });
      }
    } else {
      await db.insert(chatMessagesTable).values({ userId, role: "assistant", content: aiResponse });
    }

    const cleanResponse = aiResponse.replace(/<action>[\s\S]*?<\/action>/, "").trim();

    res.json({
      message: cleanResponse,
      action,
      ...(createdEvent ? { event: formatEvent(createdEvent) } : {}),
      ...(updatedEvent ? { event: formatEvent(updatedEvent) } : {}),
    });
  } catch (err) {
    req.log.error({ err }, "OpenAI API error");
    res.status(500).json({ error: "Failed to process message" });
  }
});

function formatEvent(event: typeof eventsTable.$inferSelect) {
  return {
    ...event,
    startTime: event.startTime.toISOString(),
    endTime: event.endTime ? event.endTime.toISOString() : null,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  };
}

function formatMessage(message: typeof chatMessagesTable.$inferSelect) {
  return {
    ...message,
    createdAt: message.createdAt.toISOString(),
  };
}

export default router;
