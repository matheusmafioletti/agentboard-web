import { useDraggable, useDndContext, type DraggableAttributes } from "@dnd-kit/core";

import type { WorkItem } from "../../services/boardApi";
import MaterialIcon from "../shared/MaterialIcon";

const TYPE_COLORS: Record<string, string> = {
  FEATURE: "bg-accent/10 text-accent",
  USER_STORY: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  TASK: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
};

const TYPE_LABELS: Record<string, string> = {
  FEATURE: "Feature",
  USER_STORY: "US",
  TASK: "Task",
};

type CardDraggableListeners = ReturnType<typeof useDraggable>["listeners"];

interface WorkItemCardDisplayProps {
  workItem: WorkItem;
  className?: string;
  variant?: "default" | "dragShadow";
}

export function WorkItemCardDisplay({
  workItem,
  className = "",
  variant = "default",
}: WorkItemCardDisplayProps) {
  const shell =
    variant === "dragShadow"
      ? [
          "rounded-card p-3 select-none pointer-events-none",
          "border border-dashed border-accent/35",
          "bg-white/88 dark:bg-[#2C2C2E]/92 backdrop-blur-sm",
          "shadow-[0_20px_50px_-14px_rgba(0,0,0,0.32)] dark:shadow-[0_20px_50px_-14px_rgba(0,0,0,0.72)]",
          "ring-1 ring-black/[0.06] dark:ring-white/[0.1]",
        ].join(" ")
      : [
          "bg-white dark:bg-[#2C2C2E] rounded-card p-3 select-none shadow-card-hover",
          "pointer-events-none",
        ].join(" ");

  return (
    <div data-work-item-card-visual className={[shell, className].join(" ")}>
      <div className="flex items-start gap-2">
        <span className="mt-px shrink-0 p-1 text-[#6E6E73] dark:text-[#8E8E93]">
          <MaterialIcon name="drag_indicator" iconSizePx={18} />
        </span>
        <div className="min-w-0 flex-1 flex flex-col gap-1">
          <p
            className={[
              "text-[13px] font-medium leading-snug line-clamp-2 text-left rounded-chip min-w-0",
              variant === "dragShadow"
                ? "text-[#1D1D1F]/88 dark:text-[#F5F5F7]/88"
                : "text-[#1D1D1F] dark:text-[#F5F5F7]",
            ].join(" ")}
          >
            {workItem.title}
          </p>
          <div className="flex items-center gap-1.5">
            <span
              className={[
                "text-[11px] px-2 py-0.5 rounded-full font-medium",
                TYPE_COLORS[workItem.type] ??
                  "bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#6E6E73] dark:text-[#8E8E93]",
              ].join(" ")}
            >
              {TYPE_LABELS[workItem.type] ?? workItem.type}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface WorkItemCardDraggableProps {
  workItem: WorkItem;
  disabled?: boolean;
  isDragging?: boolean;
  onOpenDetail?: () => void;
  setNodeRef: (element: HTMLElement | null) => void;
  listeners: CardDraggableListeners;
  attributes: DraggableAttributes;
}

export function WorkItemCardDraggable({
  workItem,
  disabled,
  isDragging,
  onOpenDetail,
  setNodeRef,
  listeners,
  attributes,
}: WorkItemCardDraggableProps) {
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...(disabled ? {} : listeners)}
      tabIndex={disabled ? undefined : 0}
      aria-grabbed={isDragging === true ? true : undefined}
      className={[
        "rounded-card touch-manipulation outline-none transition-[opacity,box-shadow] duration-150 ease-out",
        disabled ? "" : "cursor-grab active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-accent/40",
        isDragging ? "pointer-events-none opacity-[0.52] shadow-inner ring-2 ring-accent/20" : "",
      ].join(" ")}
      onClick={() => {
        if (disabled) return;
        onOpenDetail?.();
      }}
    >
      <WorkItemCardDisplay workItem={workItem} />
    </div>
  );
}

interface WorkItemCardProps {
  workItem: WorkItem;
  disabled?: boolean;
  onOpenDetail?: () => void;
}

export default function WorkItemCard({ workItem, disabled, onOpenDetail }: WorkItemCardProps) {
  const { active } = useDndContext();
  const isDraggingSource = active?.id === workItem.id;
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: workItem.id,
    disabled: disabled ?? false,
  });

  return (
    <WorkItemCardDraggable
      workItem={workItem}
      disabled={disabled}
      isDragging={isDraggingSource}
      onOpenDetail={onOpenDetail}
      setNodeRef={setNodeRef}
      listeners={listeners}
      attributes={attributes}
    />
  );
}
