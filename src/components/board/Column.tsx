import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ColumnData, FeatureCardSummary } from "../../api/board";
import FeatureCard from "./FeatureCard";

interface SortableCardProps {
  card: FeatureCardSummary;
  onCardClick: (card: FeatureCardSummary) => void;
}

function SortableCard({ card, onCardClick }: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
        aria-label={`Drag ${card.title}`}
      >
        <FeatureCard card={card} onClick={onCardClick} />
      </div>
    </div>
  );
}

interface ColumnProps {
  column: ColumnData;
  onCardClick: (card: FeatureCardSummary) => void;
  newCardInput?: React.ReactNode;
}

/** A single Kanban column with sortable Feature Cards and a droppable drop zone. */
export default function Column({ column, onCardClick, newCardInput }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  const cardIds = column.featureCards.map((c) => c.id);

  return (
    <div className="w-64 flex-shrink-0 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          {column.name}
        </span>
        <span className="text-xs text-gray-400">{column.featureCards.length}</span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex flex-col gap-2 flex-1 rounded-xl p-3 min-h-[80px] transition-colors ${
          isOver ? "bg-indigo-50 ring-2 ring-indigo-300" : "bg-gray-100"
        }`}
      >
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {column.featureCards.map((card) => (
            <SortableCard key={card.id} card={card} onCardClick={onCardClick} />
          ))}
        </SortableContext>

        {newCardInput && (
          <div className="mt-1 pt-3 border-t border-gray-200">{newCardInput}</div>
        )}
      </div>
    </div>
  );
}
