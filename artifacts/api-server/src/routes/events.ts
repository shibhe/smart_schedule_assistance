import { Router, type IRouter } from "express";
import { eq, and, gte, lte } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { db, eventsTable } from "@workspace/db";
import {
  ListEventsQueryParams,
  CreateEventBody,
  GetEventParams,
  UpdateEventParams,
  UpdateEventBody,
  DeleteEventParams,
} from "@workspace/api-zod";

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

router.get("/events/today", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId as string;
  const todayStr = new Date().toISOString().split("T")[0];

  const events = await db
    .select()
    .from(eventsTable)
    .where(and(eq(eventsTable.date, todayStr), eq(eventsTable.userId, userId)))
    .orderBy(eventsTable.startTime);

  const completedCount = events.filter((e) => e.completed).length;
  const now = new Date();
  const nextEvent = events.find((e) => new Date(e.startTime) > now) ?? null;

  res.json({
    events: events.map(formatEvent),
    totalCount: events.length,
    completedCount,
    ...(nextEvent ? { nextEvent: formatEvent(nextEvent) } : {}),
  });
});

router.get("/events/upcoming", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId as string;
  const now = new Date();
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const events = await db
    .select()
    .from(eventsTable)
    .where(
      and(
        eq(eventsTable.userId, userId),
        gte(eventsTable.startTime, now),
        lte(eventsTable.startTime, sevenDaysLater),
      ),
    )
    .orderBy(eventsTable.startTime);

  res.json(events.map(formatEvent));
});

router.get("/events/stats", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId as string;
  const allEvents = await db
    .select()
    .from(eventsTable)
    .where(eq(eventsTable.userId, userId));

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const thisWeek = allEvents.filter((e) => new Date(e.startTime) >= weekStart).length;
  const thisMonth = allEvents.filter((e) => new Date(e.startTime) >= monthStart).length;
  const completedCount = allEvents.filter((e) => e.completed).length;

  const categoryMap = new Map<string, number>();
  const priorityMap = new Map<string, number>();

  for (const event of allEvents) {
    categoryMap.set(event.category, (categoryMap.get(event.category) ?? 0) + 1);
    priorityMap.set(event.priority, (priorityMap.get(event.priority) ?? 0) + 1);
  }

  res.json({
    totalEvents: allEvents.length,
    thisWeek,
    thisMonth,
    completedCount,
    categoryBreakdown: Array.from(categoryMap.entries()).map(([category, count]) => ({ category, count })),
    priorityBreakdown: Array.from(priorityMap.entries()).map(([priority, count]) => ({ priority, count })),
  });
});

router.get("/events", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId as string;
  const parsed = ListEventsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { date, start, end } = parsed.data;
  const conditions: ReturnType<typeof eq>[] = [eq(eventsTable.userId, userId)];

  if (date) {
    conditions.push(eq(eventsTable.date, date));
  } else {
    if (start) conditions.push(gte(eventsTable.date, start));
    if (end) conditions.push(lte(eventsTable.date, end));
  }

  const events = await db
    .select()
    .from(eventsTable)
    .where(and(...conditions))
    .orderBy(eventsTable.startTime);

  res.json(events.map(formatEvent));
});

router.post("/events", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId as string;
  const parsed = CreateEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;
  const [event] = await db
    .insert(eventsTable)
    .values({
      userId,
      title: data.title,
      description: data.description ?? null,
      startTime: data.startTime instanceof Date ? data.startTime : new Date(data.startTime as string),
      endTime: data.endTime ? (data.endTime instanceof Date ? data.endTime : new Date(data.endTime as string)) : null,
      date: data.date,
      category: data.category ?? "general",
      priority: data.priority ?? "medium",
      color: data.color ?? null,
      location: (data as any).location ?? null,
    })
    .returning();

  res.status(201).json(formatEvent(event));
});

router.get("/events/:id", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId as string;
  const params = GetEventParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [event] = await db
    .select()
    .from(eventsTable)
    .where(and(eq(eventsTable.id, params.data.id), eq(eventsTable.userId, userId)));

  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }

  res.json(formatEvent(event));
});

router.patch("/events/:id", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId as string;
  const params = UpdateEventParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;
  const updateData: Record<string, unknown> = {};

  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.startTime !== undefined) updateData.startTime = data.startTime instanceof Date ? data.startTime : new Date(data.startTime as string);
  if (data.endTime !== undefined) updateData.endTime = data.endTime ? (data.endTime instanceof Date ? data.endTime : new Date(data.endTime as string)) : null;
  if (data.date !== undefined) updateData.date = data.date;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.completed !== undefined) updateData.completed = data.completed;
  if (data.color !== undefined) updateData.color = data.color;
  if ((data as any).location !== undefined) updateData.location = (data as any).location;

  const [event] = await db
    .update(eventsTable)
    .set(updateData)
    .where(and(eq(eventsTable.id, params.data.id), eq(eventsTable.userId, userId)))
    .returning();

  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }

  res.json(formatEvent(event));
});

router.delete("/events/:id", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId as string;
  const params = DeleteEventParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [event] = await db
    .delete(eventsTable)
    .where(and(eq(eventsTable.id, params.data.id), eq(eventsTable.userId, userId)))
    .returning();

  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }

  res.sendStatus(204);
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

export default router;
