import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useState } from "react";
import type { BoardData, FeatureCardSummary } from "../../api/board";
import Column from "./Column";
import FeatureCard from "./FeatureCard";

interface BoardProps {
  board: BoardData;
  onCardClick: (card: FeatureCardSummary) => void;
  onMoveCard: (
    cardId: string,
    fromColumnId: string,
    toColumnId: string,
    displayOrder: number
  ) => Promise<void>;
  newCardInput?: React.ReactNode;
}

/**
 * Kanban board with drag-and-drop support for moving Feature Cards between columns
 * and reordering within a column.
 */
export default function Board({
  board,
  onCardClick,
  onMoveCard,
  newCardInput,
}: BoardProps) {
  const [activeCard, setActiveCard] = useState<FeatureCardSummary | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  function findColumnForCard(cardId: string) {
    return board.columns.find((col) =>
      col.featureCards.some((c) => c.id === cardId)
    );
  }

  function findColumnById(columnId: string) {
    return board.columns.find((col) => col.id === columnId);
  }

  function handleDragStart({ active }: DragStartEvent) {
    const col = findColumnForCard(String(active.id));
    const card = col?.featureCards.find((c) => c.id === active.id);
    setActiveCard(card ?? null);
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveCard(null);
    if (!over) return;

    const fromColumn = findColumnForCard(String(active.id));
    if (!fromColumn) return;

    const card = fromColumn.featureCards.find((c) => c.id === active.id);
    if (!card) return;

    const overId = String(over.id);
    const toColumn =
      findColumnById(overId) ?? findColumnForCard(overId);

    if (!toColumn) return;

    const isSameColumn = fromColumn.id === toColumn.id;

    if (isSameColumn && active.id === over.id) return;

    let displayOrder: number;
    if (findColumnById(overId)) {
      displayOrder = toColumn.featureCards.length;
    } else {
      const overIndex = toColumn.featureCards.findIndex((c) => c.id === overId);
      displayOrder = overIndex >= 0 ? overIndex : toColumn.featureCards.length;
    }

    onMoveCard(String(active.id), fromColumn.id, toColumn.id, displayOrder);
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 min-w-max">
        {board.columns.map((column) => (
          <Column
            key={column.id}
            column={column}
            onCardClick={onCardClick}
            newCardInput={column.stage === "BACKLOG" ? newCardInput : undefined}
          />
        ))}
      </div>

      <DragOverlay>
        {activeCard && (
          <div className="rotate-2 shadow-xl opacity-90">
            <FeatureCard card={activeCard} onClick={() => {}} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
