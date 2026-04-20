import { lt, and, eq, isNull, or } from "drizzle-orm";
import { db, eventsTable } from "@workspace/db";
import { broadcastToUser } from "./websocket/wsServer";
import { logger } from "./lib/logger";

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
        broadcastToUser(userId, { type: "events_auto_closed", count: closed.filter((e) => e.userId === userId).length });
      }
    }
  } catch (err) {
    logger.error({ err }, "Failed to auto-close past events");
  }
}

export function startScheduler(): void {
  autoClosePassedEvents();
  setInterval(autoClosePassedEvents, 2 * 60 * 1000);
}
