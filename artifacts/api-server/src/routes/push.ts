import { Router, type IRouter } from "express";
import webPush from "web-push";
import { db, pushSubscriptionsTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/authMiddleware";

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidEmail = process.env.VAPID_EMAIL ?? "mailto:admin@smartscheduler.app";

if (vapidPublicKey && vapidPrivateKey) {
  webPush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
}

const router: IRouter = Router();


router.get("/push/vapid-key", (_req, res): void => {
  if (!vapidPublicKey) {
    res.status(503).json({ error: "Push notifications not configured" });
    return;
  }
  res.json({ publicKey: vapidPublicKey });
});

router.post("/push/subscribe", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const userId = req.userId as number;
  const { endpoint, keys } = req.body;

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    res.status(400).json({ error: "Invalid subscription data" });
    return;
  }

  const existing = await db
    .select()
    .from(pushSubscriptionsTable)
    .where(and(eq(pushSubscriptionsTable.userId, userId), eq(pushSubscriptionsTable.endpoint, endpoint)));

  if (existing.length === 0) {
    await db.insert(pushSubscriptionsTable).values({
      userId,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    });
  }

  res.status(201).json({ success: true });
});

router.delete("/push/subscribe", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const userId = req.userId as number;
  const { endpoint } = req.body;

  if (!endpoint) {
    res.status(400).json({ error: "Missing endpoint" });
    return;
  }

  await db
    .delete(pushSubscriptionsTable)
    .where(and(eq(pushSubscriptionsTable.userId, userId), eq(pushSubscriptionsTable.endpoint, endpoint)));

  res.json({ success: true });
});

export async function sendPushToUser(
  userId: number,
  payload: { title: string; body: string; icon?: string },
): Promise<void> {
  if (!vapidPublicKey || !vapidPrivateKey) return;

  const subscriptions = await db
    .select()
    .from(pushSubscriptionsTable)
    .where(eq(pushSubscriptionsTable.userId, userId));

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webPush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
        );
      } catch {
        await db.delete(pushSubscriptionsTable).where(eq(pushSubscriptionsTable.id, sub.id));
      }
    }),
  );
}

export default router;
