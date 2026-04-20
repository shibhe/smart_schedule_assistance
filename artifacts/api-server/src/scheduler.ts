import { lt, and, eq, isNull, or, gte, lte, ne } from "drizzle-orm";
import { db, eventsTable } from "@workspace/db";
import { broadcastToUser } from "./websocket/wsServer";
import { sendPushToUser } from "./routes/push";
import { logger } from "./lib/logger";

const reminderSentIds = new Set<number>();

async function autoClosePassedEvents(): Promise<void> {
  const now = new Date();
  try {
    const closed = await db
      .update(eventsTable)
      .set({ completed: true, updatedAt: now })
      .where(
        and(
          eq(eventsTable.completed, false),
          or(
            and(isNull(eventsTable.endTime), lt(eventsTable.startTime, now)),
            lt(eventsTable.endTime, now)
          )
        )
      )
      .returning({ id: eventsTable.id, userId: eventsTable.userId });

    if (closed.length > 0) {
      logger.info({ count: closed.length }, "Auto-closed past events");
      const userIds = [...new Set(closed.map((e) => e.userId).filter(Boolean))] as string[];
      for (const userId of userIds) {
        broadcastToUser(userId, {
          type: "events_auto_closed",
          count: closed.filter((e) => e.userId === userId).length,
        });
      }
    }
  } catch (err) {
    logger.error({ err }, "Failed to auto-close past events");
  }
}

async function sendEventReminders(): Promise<void> {
  const now = new Date();
  const windowStart = new Date(now.getTime() + 13 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 16 * 60 * 1000);

  try {
    const upcoming = await db
      .select()
      .from(eventsTable)
      .where(
        and(
          eq(eventsTable.completed, false),
          gte(eventsTable.startTime, windowStart),
          lte(eventsTable.startTime, windowEnd)
        )
      );

    for (const event of upcoming) {
      if (reminderSentIds.has(event.id)) continue;
      reminderSentIds.add(event.id);

      const userId = event.userId;
      if (!userId) continue;

      const minsUntil = Math.round((event.startTime.getTime() - now.getTime()) / 60000);
      logger.info({ eventId: event.id, title: event.title, minsUntil }, "Sending event reminder");

      broadcastToUser(userId, {
        type: "event_reminder",
        event: {
          id: event.id,
          title: event.title,
          startTime: event.startTime.toISOString(),
        },
      });

      await sendPushToUser(userId, {
        title: "Upcoming event in 15 minutes",
        body: event.title,
        icon: "/logo.svg",
      });
    }
  } catch (err) {
    logger.error({ err }, "Failed to send event reminders");
  }
}

export function startScheduler(): void {
  autoClosePassedEvents();
  sendEventReminders();
  setInterval(() => {
    autoClosePassedEvents();
    sendEventReminders();
  }, 60 * 1000);
}
