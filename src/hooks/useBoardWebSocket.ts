import { useEffect, useRef, useCallback } from "react";
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";

export interface BoardEvent {
  type: string;
  entityType: "FEATURE" | "USER_STORY";
  entityId: string;
  newStage: string;
  timestamp: string;
}

interface UseBoardWebSocketOptions {
  projectId: string | null;
  token: string | null;
  onFeatureUpdate?: (event: BoardEvent) => void;
  onUserStoryUpdate?: (event: BoardEvent) => void;
}

const BOARD_SERVICE_URL =
  (import.meta as { env?: { VITE_BOARD_SERVICE_URL?: string } }).env
    ?.VITE_BOARD_SERVICE_URL ?? "http://localhost:8081";

/**
 * Subscribes to project-scoped STOMP topics for real-time board updates.
 *
 * <p>Connects to {@code /ws} via SockJS and subscribes to:
 * <ul>
 *   <li>{@code /topic/projects/{projectId}/features}</li>
 *   <li>{@code /topic/projects/{projectId}/user-stories}</li>
 * </ul>
 */
export function useBoardWebSocket({
  projectId,
  token,
  onFeatureUpdate,
  onUserStoryUpdate,
}: UseBoardWebSocketOptions): void {
  const clientRef = useRef<Client | null>(null);
  const onFeatureRef = useRef(onFeatureUpdate);
  const onUserStoryRef = useRef(onUserStoryUpdate);

  useEffect(() => {
    onFeatureRef.current = onFeatureUpdate;
  }, [onFeatureUpdate]);

  useEffect(() => {
    onUserStoryRef.current = onUserStoryUpdate;
  }, [onUserStoryUpdate]);

  const handleMessage = useCallback((msg: IMessage, type: "feature" | "user-story") => {
    const event: BoardEvent = JSON.parse(msg.body) as BoardEvent;
    if (type === "feature") {
      onFeatureRef.current?.(event);
    } else {
      onUserStoryRef.current?.(event);
    }
  }, []);

  useEffect(() => {
    if (!projectId || !token) return;

    const stompClient = new Client({
      webSocketFactory: () => new SockJS(`${BOARD_SERVICE_URL}/ws`),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 3000,
      onConnect: () => {
        stompClient.subscribe(
          `/topic/projects/${projectId}/features`,
          (msg) => handleMessage(msg, "feature")
        );
        stompClient.subscribe(
          `/topic/projects/${projectId}/user-stories`,
          (msg) => handleMessage(msg, "user-story")
        );
      },
    });

    stompClient.activate();
    clientRef.current = stompClient;

    return () => {
      stompClient.deactivate().catch(() => undefined);
    };
  }, [projectId, token, handleMessage]);
}
