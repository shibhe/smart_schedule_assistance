import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_dev_only";
const userSockets = new Map<number, Set<WebSocket>>();

export function attachWebSocketServer(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req, socket, head) => {
    const url = req.url ?? "";
    const isWsPath =
      url === "/api/ws" || url.startsWith("/api/ws?") ||
      url === "/ws" || url.startsWith("/ws?");
    if (!isWsPath) {
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  });

  wss.on("connection", (ws) => {
    let userId: number | null = null;

    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.ping();
    }, 30000);

    ws.on("message", async (data) => {
      try {
        const msg = JSON.parse(data.toString());

        if (msg.type === "auth" && typeof msg.token === "string") {
          try {
            const payload = jwt.verify(msg.token, JWT_SECRET) as { userId: number };
            userId = payload.userId;

            if (!userSockets.has(userId)) userSockets.set(userId, new Set());
            userSockets.get(userId)!.add(ws);

            ws.send(JSON.stringify({ type: "authenticated" }));
          } catch {
            ws.send(JSON.stringify({ type: "error", message: "Invalid token" }));
            ws.close();
          }
        }
      } catch {
        // ignore non-JSON
      }
    });

    ws.on("close", () => {
      clearInterval(pingInterval);
      if (userId) {
        userSockets.get(userId)?.delete(ws);
        if (userSockets.get(userId)?.size === 0) userSockets.delete(userId);
      }
    });

    ws.on("error", () => ws.close());
  });

  return wss;
}

export function broadcastToUser(userId: number, data: unknown): void {
  const sockets = userSockets.get(userId);
  if (!sockets) return;
  const message = JSON.stringify(data);
  for (const ws of sockets) {
    if (ws.readyState === WebSocket.OPEN) ws.send(message);
  }
}
