import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { DragEndEvent } from "@dnd-kit/core";
import Board from "../../../components/board/Board";
import type { BoardData, FeatureCardSummary } from "../../../api/board";

const mockOnDragEndRef: { handler: ((event: DragEndEvent) => void) | null } = {
  handler: null,
};

vi.mock("@dnd-kit/core", async () => {
  const actual = await vi.importActual<typeof import("@dnd-kit/core")>(
    "@dnd-kit/core"
  );
  return {
    ...actual,
    DndContext: ({
      children,
      onDragEnd,
    }: {
      children: React.ReactNode;
      onDragEnd?: (event: DragEndEvent) => void;
    }) => {
      mockOnDragEndRef.handler = onDragEnd ?? null;
      return <div>{children}</div>;
    },
    DragOverlay: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    useSensor: () => ({}),
    useSensors: (...args: unknown[]) => args,
  };
});

vi.mock("@dnd-kit/sortable", async () => {
  const actual = await vi.importActual<typeof import("@dnd-kit/sortable")>(
    "@dnd-kit/sortable"
  );
  return {
    ...actual,
    useSortable: () => ({
      attributes: {},
      listeners: {},
      setNodeRef: () => {},
      transform: null,
      transition: undefined,
      isDragging: false,
    }),
  };
});

vi.mock("@dnd-kit/utilities", () => ({
  CSS: { Transform: { toString: () => "" } },
}));

function makeCard(id: string, columnId: string, displayOrder = 0): FeatureCardSummary {
  return {
    id,
    title: `Card ${id}`,
    description: null,
    reExecutionPending: false,
    taskCount: 0,
    completedTaskCount: 0,
    displayOrder,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function makeBoard(): BoardData {
  const backlogId = "col-backlog";
  const specifyId = "col-specify";

  return {
    id: "board-1",
    name: "AgentBoard",
    tenantId: "tenant-1",
    columns: [
      {
        id: backlogId,
        name: "Backlog",
        stage: "BACKLOG",
        displayOrder: 0,
        featureCards: [makeCard("card-1", backlogId, 0)],
      },
      {
        id: specifyId,
        name: "Specify",
        stage: "SPECIFY",
        displayOrder: 1,
        featureCards: [],
      },
    ],
  };
}

describe("Board", () => {
  let onMoveCard: (
    cardId: string,
    fromColumnId: string,
    toColumnId: string,
    displayOrder: number
  ) => Promise<void>;
  let onCardClick: (card: FeatureCardSummary) => void;

  beforeEach(() => {
    onMoveCard = vi
      .fn<[string, string, string, number], Promise<void>>()
      .mockResolvedValue(undefined);
    onCardClick = vi.fn();
    mockOnDragEndRef.handler = null;
  });

  it("renders all column names", () => {
    render(
      <Board
        board={makeBoard()}
        onCardClick={onCardClick}
        onMoveCard={onMoveCard}
      />
    );
    expect(screen.getByText("Backlog")).toBeTruthy();
    expect(screen.getByText("Specify")).toBeTruthy();
  });

  it("renders cards in their initial columns", () => {
    render(
      <Board
        board={makeBoard()}
        onCardClick={onCardClick}
        onMoveCard={onMoveCard}
      />
    );
    expect(screen.getByText("Card card-1")).toBeTruthy();
  });

  it("calls onMoveCard when drag ends over a different column", () => {
    render(
      <Board
        board={makeBoard()}
        onCardClick={onCardClick}
        onMoveCard={onMoveCard}
      />
    );

    const dragEndEvent = {
      active: { id: "card-1", data: { current: {} } },
      over: { id: "col-specify", data: { current: {} } },
      activatorEvent: new MouseEvent("click"),
      collisions: [],
      delta: { x: 0, y: 0 },
    } as unknown as DragEndEvent;

    mockOnDragEndRef.handler?.(dragEndEvent);

    expect(onMoveCard).toHaveBeenCalledWith(
      "card-1",
      "col-backlog",
      "col-specify",
      0
    );
  });

  it("does not call onMoveCard when dropped outside any column", () => {
    render(
      <Board
        board={makeBoard()}
        onCardClick={onCardClick}
        onMoveCard={onMoveCard}
      />
    );

    const dragEndEvent = {
      active: { id: "card-1", data: { current: {} } },
      over: null,
      activatorEvent: new MouseEvent("click"),
      collisions: [],
      delta: { x: 0, y: 0 },
    } as unknown as DragEndEvent;

    mockOnDragEndRef.handler?.(dragEndEvent);

    expect(onMoveCard).not.toHaveBeenCalled();
  });

  it("does not call onMoveCard when dropped on the same card (no position change)", () => {
    render(
      <Board
        board={makeBoard()}
        onCardClick={onCardClick}
        onMoveCard={onMoveCard}
      />
    );

    const dragEndEvent = {
      active: { id: "card-1", data: { current: {} } },
      over: { id: "card-1", data: { current: {} } },
      activatorEvent: new MouseEvent("click"),
      collisions: [],
      delta: { x: 0, y: 0 },
    } as unknown as DragEndEvent;

    mockOnDragEndRef.handler?.(dragEndEvent);

    expect(onMoveCard).not.toHaveBeenCalled();
  });
});
