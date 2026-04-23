import { vi, describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useWebSocket } from "../../../hooks/useWebSocket";
import type { BoardAction } from "../../../store/boardReducer";
import type { Dispatch } from "react";

const mockActivate = vi.fn();
const mockDeactivate = vi.fn();
let capturedOnConnect: ((receipt: unknown) => void) | undefined;
let capturedSubscriptionHandler: ((frame: { body: string }) => void) | undefined;
let capturedSubscribedTopic: string | undefined;

vi.mock("@stomp/stompjs", () => ({
  Client: vi.fn().mockImplementation(
    (config: { onConnect?: (r: unknown) => void }) => {
      capturedOnConnect = config.onConnect;
      return {
        subscribe: vi.fn().mockImplementation(
          (topic: string, handler: (frame: { body: string }) => void) => {
            capturedSubscribedTopic = topic;
            capturedSubscriptionHandler = handler;
          }
        ),
        activate: mockActivate,
        deactivate: mockDeactivate,
      };
    }
  ),
}));

describe("useWebSocket", () => {
  let dispatch: Dispatch<BoardAction>;
  let onReconnect: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockActivate.mockClear();
    mockDeactivate.mockClear();
    capturedOnConnect = undefined;
    capturedSubscriptionHandler = undefined;
    capturedSubscribedTopic = undefined;
    dispatch = vi.fn();
    onReconnect = vi.fn().mockResolvedValue(undefined);
  });

  it("activates STOMP client when token and tenantId are provided", () => {
    renderHook(() =>
      useWebSocket("my-token", "tenant-123", dispatch, onReconnect)
    );
    expect(mockActivate).toHaveBeenCalledOnce();
  });

  it("does not activate when token is null", () => {
    renderHook(() => useWebSocket(null, "tenant-123", dispatch, onReconnect));
    expect(mockActivate).not.toHaveBeenCalled();
  });

  it("does not activate when tenantId is null", () => {
    renderHook(() => useWebSocket("my-token", null, dispatch, onReconnect));
    expect(mockActivate).not.toHaveBeenCalled();
  });

  it("subscribes to correct tenant topic on connect", () => {
    renderHook(() =>
      useWebSocket("my-token", "tenant-123", dispatch, onReconnect)
    );
    capturedOnConnect?.({});

    expect(capturedSubscribedTopic).toBe("/topic/tenant/tenant-123/board-events");
    expect(capturedSubscriptionHandler).toBeDefined();
  });

  it("dispatches MOVE_CARD action on CARD_MOVED event", () => {
    renderHook(() =>
      useWebSocket("my-token", "tenant-123", dispatch, onReconnect)
    );
    capturedOnConnect?.({});

    capturedSubscriptionHandler?.({
      body: JSON.stringify({
        type: "CARD_MOVED",
        featureCardId: "card-1",
        fromColumnId: "col-1",
        toColumnId: "col-2",
        displayOrder: 0,
      }),
    });

    expect(dispatch).toHaveBeenCalledWith({
      type: "MOVE_CARD",
      payload: {
        cardId: "card-1",
        fromColumnId: "col-1",
        toColumnId: "col-2",
        displayOrder: 0,
      },
    });
  });

  it("dispatches ADD_CARD action on CARD_CREATED event", () => {
    renderHook(() =>
      useWebSocket("my-token", "tenant-123", dispatch, onReconnect)
    );
    capturedOnConnect?.({});

    const card = {
      id: "card-1",
      columnId: "col-1",
      title: "New Card",
      description: null,
      reExecutionPending: false,
      displayOrder: 0,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
      tasks: [],
      artifacts: [],
      commandExecutions: [],
    };

    capturedSubscriptionHandler?.({
      body: JSON.stringify({ type: "CARD_CREATED", featureCard: card }),
    });

    expect(dispatch).toHaveBeenCalledWith({
      type: "ADD_CARD",
      payload: { columnId: "col-1", card: expect.objectContaining({ id: "card-1" }) },
    });
  });

  it("dispatches WS_CARD_UPDATED action on CARD_UPDATED event", () => {
    renderHook(() =>
      useWebSocket("my-token", "tenant-123", dispatch, onReconnect)
    );
    capturedOnConnect?.({});

    capturedSubscriptionHandler?.({
      body: JSON.stringify({
        type: "CARD_UPDATED",
        featureCardId: "card-1",
        title: "Updated",
        description: null,
        reExecutionPending: false,
        updatedAt: "2026-01-01T00:00:00Z",
      }),
    });

    expect(dispatch).toHaveBeenCalledWith({
      type: "WS_CARD_UPDATED",
      payload: expect.objectContaining({ cardId: "card-1" }),
    });
  });

  it("dispatches WS_CARD_DELETED action on CARD_DELETED event", () => {
    renderHook(() =>
      useWebSocket("my-token", "tenant-123", dispatch, onReconnect)
    );
    capturedOnConnect?.({});

    capturedSubscriptionHandler?.({
      body: JSON.stringify({ type: "CARD_DELETED", featureCardId: "card-1" }),
    });

    expect(dispatch).toHaveBeenCalledWith({
      type: "WS_CARD_DELETED",
      payload: { cardId: "card-1" },
    });
  });

  it("calls onReconnect on subsequent connects (after initial)", () => {
    renderHook(() =>
      useWebSocket("my-token", "tenant-123", dispatch, onReconnect)
    );

    capturedOnConnect?.({});
    expect(onReconnect).not.toHaveBeenCalled();

    capturedOnConnect?.({});
    expect(onReconnect).toHaveBeenCalledOnce();
  });

  it("deactivates client on unmount", () => {
    const { unmount } = renderHook(() =>
      useWebSocket("my-token", "tenant-123", dispatch, onReconnect)
    );
    unmount();
    expect(mockDeactivate).toHaveBeenCalledOnce();
  });
});
