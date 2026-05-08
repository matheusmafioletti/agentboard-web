import { useState } from "react";
import useSWR from "swr";
import { useDraggable, useDndContext } from "@dnd-kit/core";

import { boardApi, type WorkItem } from "../../services/boardApi";
import WorkItemTypeGlyph from "../shared/WorkItemTypeGlyph";
import AssigneeAvatar from "../shared/AssigneeAvatar";
import {
  WORK_ITEM_TYPE_CHROMA,
  WORK_ITEM_TYPE_BORDER,
} from "../shared/workItemTypeTokens";

function coerceWorkItemType(type: string | undefined): WorkItem["type"] | null {
  if (type === "FEATURE" || type === "USER_STORY" || type === "TASK") return type;
  return null;
}

function isDoneChild(child: WorkItem, parentType: WorkItem["type"]): boolean {
  if (parentType === "FEATURE") return child.status === "DONE";
  return child.status === "CLOSED";
}

function partitionChildren(type: WorkItem["type"], children: WorkItem[]) {
  if (type === "FEATURE") {
    return [
      ...children.filter((c) => c.status !== "DONE"),
      ...children.filter((c) => c.status === "DONE"),
    ];
  }
  return [
    ...children.filter((c) => c.status !== "CLOSED"),
    ...children.filter((c) => c.status === "CLOSED"),
  ];
}

function ParentContextBlock({
  workItem,
  onOpenRelatedId,
}: {
  workItem: WorkItem;
  onOpenRelatedId?: (id: string) => void;
}) {
  const pp = workItem.parentPreview;
  if (!pp) return null;
  const pt = coerceWorkItemType(pp.type) ?? ("FEATURE" as WorkItem["type"]);
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <span
        className={[
          "inline-flex shrink-0 rounded-full p-0.5 items-center justify-center",
          WORK_ITEM_TYPE_CHROMA[pt],
        ].join(" ")}
        aria-hidden
      >
        <WorkItemTypeGlyph type={pt} sizePx={10} />
      </span>
      <button
        type="button"
        data-testid="card-open-parent-link"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onOpenRelatedId?.(pp.id);
        }}
        className="text-left text-[11px] font-medium text-accent hover:underline truncate min-w-0"
      >
        {pp.displayKey} · {pp.title}
      </button>
    </div>
  );
}

// Small filled/empty circle indicating done status inside expanded list
function ChildDoneIndicator({ done }: { done: boolean }) {
  if (done) {
    return (
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0 text-emerald-500 dark:text-emerald-400"
        aria-label="Concluído"
      >
        <path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
      </svg>
    );
  }
  return (
    <span
      className="shrink-0 w-3 h-3 rounded-full border-2 border-[#C7C7CC] dark:border-[#48484A]"
      aria-label="Pendente"
    />
  );
}

interface WorkItemCardInnerProps {
  workItem: WorkItem;
  activeProjectName?: string | undefined;
  usersById?: Map<string, string>;
  onOpenRelatedId?: (id: string) => void;
}

function WorkItemCardInner({ workItem, usersById, onOpenRelatedId }: WorkItemCardInnerProps) {
  const [childrenOpen, setChildrenOpen] = useState(false);
  const canHaveChildren = workItem.type === "FEATURE" || workItem.type === "USER_STORY";
  const assigneeEmail = workItem.assigneeId ? (usersById?.get(workItem.assigneeId) ?? null) : null;
  const hasParentContext = workItem.type !== "FEATURE" && workItem.parentPreview != null;

  // Always fetch children for cards that can have them so summary is available when collapsed.
  const { data, isLoading: childrenLoading } = useSWR(
    canHaveChildren ? `board-card-children-${workItem.id}` : null,
    () => boardApi.getWorkItem(workItem.id),
    { revalidateOnFocus: false }
  );
  const allChildren = data?.children ?? [];
  const orderedChildren = canHaveChildren ? partitionChildren(workItem.type, allChildren) : [];
  const childType: WorkItem["type"] = workItem.type === "FEATURE" ? "USER_STORY" : "TASK";
  const doneCount = allChildren.filter((c) => isDoneChild(c, workItem.type)).length;
  const totalCount = allChildren.length;

  return (
    <div
      className={[
        "min-h-0 min-w-0 flex-1 overflow-hidden rounded-card bg-white shadow-card-hover dark:bg-[#2C2C2E] p-3 flex flex-col gap-1.5",
        "border-l-4",
        WORK_ITEM_TYPE_BORDER[workItem.type],
      ].join(" ")}
    >
      {/* Header row: type badge + displayKey + expand chevron */}
      <div className="flex items-center gap-1.5 min-w-0">
        <span
          className={[
            "inline-flex shrink-0 rounded-full p-0.5 items-center justify-center",
            WORK_ITEM_TYPE_CHROMA[workItem.type],
          ].join(" ")}
          aria-hidden
        >
          <WorkItemTypeGlyph type={workItem.type} sizePx={12} />
        </span>
        <p className="flex-1 min-w-0 text-[11px] font-semibold text-[#6E6E73] dark:text-[#8E8E93] truncate">
          {workItem.displayKey}
        </p>
        {canHaveChildren && (
          <button
            type="button"
            aria-label={childrenOpen ? "Recolher itens relacionados" : "Expandir itens relacionados"}
            aria-expanded={childrenOpen}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setChildrenOpen((v) => !v);
            }}
            className="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-chip text-[#6E6E73] dark:text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors duration-100"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {childrenOpen ? <path d="M18 15l-6-6-6 6" /> : <path d="M6 9l6 6 6-6" />}
            </svg>
          </button>
        )}
      </div>

      {/* Title */}
      <p className="text-[13px] font-medium leading-snug line-clamp-2 text-[#1D1D1F] dark:text-[#F5F5F7]">
        {workItem.title}
      </p>

      {/* Parent link for US / Task */}
      {hasParentContext && (
        <ParentContextBlock workItem={workItem} onOpenRelatedId={onOpenRelatedId} />
      )}

      {/* Collapsed child summary: [ChildIcon] done/total */}
      {canHaveChildren && !childrenLoading && totalCount > 0 && (
        <div className="flex items-center gap-1 mt-0.5">
          <span
            className={[
              "inline-flex shrink-0 rounded-full p-0.5 items-center justify-center",
              WORK_ITEM_TYPE_CHROMA[childType],
            ].join(" ")}
            aria-hidden
          >
            <WorkItemTypeGlyph type={childType} sizePx={10} />
          </span>
          <span className="text-[11px] font-medium text-[#6E6E73] dark:text-[#8E8E93] tabular-nums">
            {doneCount}
            <span className="text-[#C7C7CC] dark:text-[#48484A] mx-0.5">/</span>
            {totalCount}
          </span>
        </div>
      )}

      {/* Assignee */}
      <div className="flex items-center gap-1 mt-0.5">
        <AssigneeAvatar email={assigneeEmail} sizePx={16} showLabel />
      </div>

      {/* Expanded children list with done indicator */}
      {canHaveChildren && childrenOpen && (
        <div className="mt-1.5 border-t border-black/[0.06] dark:border-white/[0.06] pt-2 min-w-0">
          {childrenLoading ? (
            <div className="skeleton-shimmer h-4 rounded-chip w-3/4" />
          ) : orderedChildren.length === 0 ? (
            <p className="text-[11px] text-[#6E6E73] dark:text-[#8E8E93]">Nenhum item filho.</p>
          ) : (
            <ul className="space-y-1.5">
              {orderedChildren.map((c) => {
                const done = isDoneChild(c, workItem.type);
                return (
                  <li key={c.id} className="flex items-center gap-1.5 min-w-0">
                    <ChildDoneIndicator done={done} />
                    <button
                      type="button"
                      data-testid={`card-child-link-${c.id}`}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenRelatedId?.(c.id);
                      }}
                      className={[
                        "text-left text-[11px] font-medium leading-snug line-clamp-1 min-w-0 flex-1",
                        done
                          ? "text-[#6E6E73] dark:text-[#8E8E93] line-through"
                          : "text-accent hover:underline",
                      ].join(" ")}
                    >
                      {c.title}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

interface WorkItemCardDisplayProps {
  workItem: WorkItem;
  activeProjectName?: string;
  usersById?: Map<string, string>;
  className?: string;
  variant?: "default" | "dragShadow";
  onOpenRelatedId?: (id: string) => void;
}

export function WorkItemCardDisplay({
  workItem,
  activeProjectName,
  usersById,
  className = "",
  variant = "default",
  onOpenRelatedId,
}: WorkItemCardDisplayProps) {
  const shellOuter =
    variant === "dragShadow"
      ? "border border-dashed border-accent/35 shadow-[0_20px_50px_-14px_rgba(0,0,0,0.32)] dark:shadow-[0_20px_50px_-14px_rgba(0,0,0,0.72)] ring-1 ring-black/[0.06] dark:ring-white/[0.1]"
      : "";

  return (
    <div
      data-work-item-card-visual
      className={[
        shellOuter,
        "rounded-card overflow-hidden",
        variant === "dragShadow" ? "pointer-events-none" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        className={
          variant === "dragShadow" ? "bg-white/88 dark:bg-[#2C2C2E]/92 backdrop-blur-sm" : ""
        }
      >
        <WorkItemCardInner
          workItem={workItem}
          activeProjectName={activeProjectName}
          usersById={usersById}
          onOpenRelatedId={variant === "dragShadow" ? undefined : onOpenRelatedId}
        />
      </div>
    </div>
  );
}

interface WorkItemCardProps {
  workItem: WorkItem;
  activeProjectName?: string;
  usersById?: Map<string, string>;
  disabled?: boolean;
  onOpenDetail?: () => void;
  onOpenRelatedId?: (id: string) => void;
}

export default function WorkItemCard({
  workItem,
  activeProjectName,
  usersById,
  disabled,
  onOpenDetail,
  onOpenRelatedId,
}: WorkItemCardProps) {
  const { active } = useDndContext();
  const isDraggingSource = active?.id === workItem.id;
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: workItem.id,
    disabled: disabled ?? false,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...(disabled ? {} : listeners)}
      tabIndex={disabled ? undefined : 0}
      aria-grabbed={isDraggingSource ? true : undefined}
      className={[
        "rounded-card touch-manipulation outline-none transition-[opacity,box-shadow] duration-150 ease-out",
        disabled
          ? ""
          : "cursor-grab active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-accent/40",
        isDraggingSource ? "pointer-events-none opacity-[0.52] shadow-inner ring-2 ring-accent/20" : "",
      ].join(" ")}
      onClick={() => {
        if (disabled) return;
        onOpenDetail?.();
      }}
    >
      <WorkItemCardDisplay
        workItem={workItem}
        activeProjectName={activeProjectName}
        usersById={usersById}
        variant="default"
        onOpenRelatedId={disabled ? undefined : onOpenRelatedId}
      />
    </div>
  );
}
