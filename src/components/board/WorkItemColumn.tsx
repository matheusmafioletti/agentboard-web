import { useDroppable } from "@dnd-kit/core";
import type { WorkItem } from "../../services/boardApi";
import WorkItemCard from "./WorkItemCard";

interface WorkItemColumnProps {
  status: string;
  label: string;
  items: WorkItem[];
  isAutoOnly?: boolean;
  onOpenDetail?: (workItemId: string) => void;
}

/** A droppable kanban column for a single status bucket of WorkItems. */
export default function WorkItemColumn({
  status,
  label,
  items,
  isAutoOnly,
  onOpenDetail,
}: WorkItemColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={[
        "flex flex-col flex-shrink-0 w-[220px] rounded-card",
        "bg-[#F2F2F7] dark:bg-[#1C1C1E]",
        "transition-colors duration-150",
        isOver && !isAutoOnly ? "ring-2 ring-accent/40" : "",
      ].join(" ")}
    >
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <span className="text-[11px] font-semibold uppercase tracking-caps text-[#6E6E73] dark:text-[#8E8E93]">
          {label}
        </span>
        <span className="bg-accent/[0.15] text-accent text-[11px] font-semibold rounded-full px-2 py-0.5">
          {items.length}
        </span>
      </div>

      <div className="flex flex-col gap-2 px-2 pb-2 flex-1 min-h-[60px]">
        {items.map((item) => (
          <WorkItemCard
            key={item.id}
            workItem={item}
            disabled={isAutoOnly}
            onOpenDetail={
              !isAutoOnly ? () => onOpenDetail?.(item.id) : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}
