import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";

export function useWebSocket() {
  const { getToken, isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountedRef = useRef(false);

  const invalidateEvents = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    queryClient.invalidateQueries({ queryKey: ["/api/events/today"] });
    queryClient.invalidateQueries({ queryKey: ["/api/events/upcoming"] });
    queryClient.invalidateQueries({ queryKey: ["/api/events/stats"] });
  }, [queryClient]);

  const connect = useCallback(async () => {
    if (!isSignedIn || unmountedRef.current) return;

    try {
      const token = await getToken();
      if (!token || unmountedRef.current) return;

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(`${protocol}//${window.location.host}/api/ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: "auth", token }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string);
          if (["event_created", "event_updated", "event_deleted"].includes(msg.type)) {
            invalidateEvents();
          }
        } catch {
          // ignore
        }
      };

      ws.onclose = () => {
        if (!unmountedRef.current) {
          reconnectRef.current = setTimeout(connect, 3000);
        }
      };

      ws.onerror = () => ws.close();
    } catch {
      if (!unmountedRef.current) {
        reconnectRef.current = setTimeout(connect, 3000);
      }
    }
  }, [isSignedIn, getToken, invalidateEvents]);

  useEffect(() => {
    unmountedRef.current = false;
    connect();

    return () => {
      unmountedRef.current = true;
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [connect]);
}
