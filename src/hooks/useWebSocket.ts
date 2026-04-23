import { useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import type { Dispatch } from "react";
import type { BoardAction } from "../store/boardReducer";
import type { FeatureCardDetail, TaskData } from "../api/board";

/**
 * Connects to the board-service WebSocket and dispatches reducer actions on incoming events.
 * On every reconnect (after the initial connect) the full board state is refreshed via onReconnect.
 *
 * @param token       JWT bearer token; hook is inactive when null
 * @param tenantId    the tenant whose topic to subscribe to; hook is inactive when null
 * @param dispatch    reducer dispatch from useBoard
 * @param onReconnect called on every reconnect to trigger a full board reload
 */
export function useWebSocket(
  token: string | null,
  tenantId: string | null,
  dispatch: Dispatch<BoardAction>,
  onReconnect: () => Promise<void>
): void {
  const connectedOnceRef = useRef(false);

  useEffect(() => {
    if (!token || !tenantId) return;

    connectedOnceRef.current = false;

    const client = new Client({
      brokerURL: `ws://localhost:8081/ws`,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 3000,
      onConnect: () => {
        if (connectedOnceRef.current) {
          onReconnect();
        }
        connectedOnceRef.current = true;

        client.subscribe(
          `/topic/tenant/${tenantId}/board-events`,
          (frame) => {
            try {
              const event = JSON.parse(frame.body) as Record<string, unknown>;
              const action = mapEventToAction(event);
              if (action) dispatch(action);
            } catch {
              // NOTE: malformed WS frames are silently dropped
            }
          }
        );
      },
    });

    client.activate();
    return () => {
      client.deactivate();
    };
  }, [token, tenantId, dispatch, onReconnect]);
}

function mapEventToAction(
  event: Record<string, unknown>
): BoardAction | null {
  switch (event.type) {
    case "CARD_MOVED":
      return {
        type: "MOVE_CARD",
        payload: {
          cardId: event.featureCardId as string,
          fromColumnId: event.fromColumnId as string,
          toColumnId: event.toColumnId as string,
          displayOrder: event.displayOrder as number,
        },
      };

    case "CARD_CREATED": {
      const featureCard = event.featureCard as FeatureCardDetail;
      return {
        type: "ADD_CARD",
        payload: { columnId: featureCard.columnId, card: featureCard },
      };
    }

    case "CARD_UPDATED":
      return {
        type: "WS_CARD_UPDATED",
        payload: {
          cardId: event.featureCardId as string,
          title: event.title as string | undefined,
          description: event.description as string | null | undefined,
          reExecutionPending: event.reExecutionPending as boolean | undefined,
          updatedAt: event.updatedAt as string | undefined,
        },
      };

    case "CARD_DELETED":
      return {
        type: "WS_CARD_DELETED",
        payload: { cardId: event.featureCardId as string },
      };

    case "TASKS_CREATED": {
      const tasks = event.tasks as TaskData[];
      return {
        type: "WS_TASKS_CREATED",
        payload: {
          featureCardId: event.featureCardId as string,
          count: tasks?.length ?? 0,
        },
      };
    }

    case "TASK_UPDATED": {
      const task = event.task as TaskData;
      return task?.completed
        ? {
            type: "WS_TASK_COMPLETED",
            payload: { featureCardId: event.featureCardId as string },
          }
        : null;
    }

    default:
      return null;
  }
}
