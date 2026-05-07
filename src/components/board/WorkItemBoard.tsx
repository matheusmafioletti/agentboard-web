import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";
import useSWR from "swr";
import {
  DndContext,
  type DropAnimation,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useDndContext,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useAuth } from "../../hooks/useAuth";
import { useBoardWebSocket, BoardEvent } from "../../hooks/useBoardWebSocket";
import { boardApi, type WorkItem } from "../../services/boardApi";
import WorkItemColumn from "./WorkItemColumn";
import { WorkItemCardDisplay } from "./WorkItemCard";
import ParentFilterSelector from "./ParentFilterSelector";
import CardModal from "../card-modal/CardModal";
import CreateWorkItemModal from "./CreateWorkItemModal";
import MaterialIcon from "../shared/MaterialIcon";

type WorkItemType = "FEATURE" | "USER_STORY" | "TASK";

const FEATURE_COLUMNS = [
  { status: "BACKLOG", label: "BACKLOG" },
  { status: "SPECIFY", label: "SPECIFY" },
  { status: "CLARIFY", label: "CLARIFY" },
  { status: "PLAN", label: "PLAN" },
  { status: "TASKS", label: "TASKS" },
  { status: "READY", label: "READY" },
  { status: "IN_DEVELOPMENT", label: "IN_DEVELOPMENT", autoOnly: true },
  { status: "PR_REVIEW", label: "PR_REVIEW", autoOnly: true },
  { status: "DONE", label: "DONE" },
];

const USER_STORY_COLUMNS = [
  { status: "READY", label: "READY" },
  { status: "IN_PROGRESS", label: "IN_PROGRESS" },
  { status: "DONE", label: "DONE", autoOnly: true },
];

const TASK_COLUMNS = [
  { status: "NEW", label: "NEW" },
  { status: "ACTIVE", label: "ACTIVE" },
  { status: "CLOSED", label: "CLOSED" },
];

const COLUMNS_BY_TYPE: Record<WorkItemType, typeof FEATURE_COLUMNS> = {
  FEATURE: FEATURE_COLUMNS,
  USER_STORY: USER_STORY_COLUMNS,
  TASK: TASK_COLUMNS,
};

const TYPE_TABS: Array<{ value: WorkItemType; label: string }> = [
  { value: "FEATURE", label: "Feature" },
  { value: "USER_STORY", label: "User Story" },
  { value: "TASK", label: "Task" },
];

const kanbanDropAnimation = {
  duration: 170,
  easing: "cubic-bezier(0.25, 1, 0.5, 1)",
  sideEffects: null,
  keyframes: ({ transform: { initial: initialTransform } }) => {
    const matrix = CSS.Transform.toString(initialTransform);
    return [
      { transform: matrix, opacity: 1 },
      { transform: matrix, opacity: 0 },
    ];
  },
} satisfies DropAnimation;

function KanbanDragOverlay({ items }: { items: WorkItem[] }) {
  const { active } = useDndContext();
  const id = active?.id != null ? String(active.id) : null;
  const item = id ? items.find((i) => i.id === id) : undefined;
  return (
    <DragOverlay dropAnimation={kanbanDropAnimation}>
      {item ? <WorkItemCardDisplay variant="dragShadow" workItem={item} /> : null}
    </DragOverlay>
  );
}

interface WorkItemBoardProps {
  projectId: string;
}

/** Unified kanban board that adapts its columns based on the selected WorkItem type. */
export default function WorkItemBoard({ projectId }: WorkItemBoardProps) {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const typeParam = (searchParams.get("type") as WorkItemType) ?? "FEATURE";
  const parentIdParam = searchParams.get("parentId") ?? undefined;

  const [toast, setToast] = useState<string | null>(null);
  const [newItemMenuOpen, setNewItemMenuOpen] = useState(false);
  const [createModalType, setCreateModalType] = useState<WorkItemType | null>(null);
  const newItemMenuRef = useRef<HTMLDivElement>(null);
  const [detailWorkItemId, setDetailWorkItemId] = useState<string | null>(null);
  const suppressDetailOpenUntilRef = useRef(0);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const swrKey = projectId
    ? `work-items-${projectId}-${typeParam}-${parentIdParam ?? "all"}`
    : null;

  const { data: items = [], mutate: reloadItems } = useSWR<WorkItem[]>(
    swrKey,
    () =>
      boardApi.listWorkItems({
        projectId,
        type: typeParam,
        parentId: parentIdParam,
      }),
    { refreshInterval: 3000 }
  );

  const onBoardUpdate = useCallback(
    (_event: BoardEvent) => {
      void reloadItems();
    },
    [reloadItems]
  );

  useBoardWebSocket({
    projectId: projectId ?? null,
    token: user?.token ?? null,
    onFeatureUpdate: onBoardUpdate,
    onUserStoryUpdate: onBoardUpdate,
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (newItemMenuRef.current && !newItemMenuRef.current.contains(e.target as Node)) {
        setNewItemMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectType(nextType: WorkItemType) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("type", nextType);
      if (nextType === "FEATURE") {
        next.delete("parentId");
      }
      return next;
    });
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function handleDragEnd(event: DragEndEvent) {
    suppressDetailOpenUntilRef.current = Date.now() + 400;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const newStatus = over.id as string;
    const column = COLUMNS_BY_TYPE[typeParam].find((c) => c.status === newStatus);
    if (column?.autoOnly) {
      showToast("Esta coluna é gerenciada automaticamente.");
      return;
    }
    try {
      await boardApi.moveWorkItemStatus(active.id as string, newStatus);
      await reloadItems();
    } catch {
      showToast("Falha ao mover item. Tente novamente.");
    }
  }

  const columns = COLUMNS_BY_TYPE[typeParam];
  const boardNeedsParent =
    (typeParam === "USER_STORY" || typeParam === "TASK") && !parentIdParam;

  return (
    <div className="flex flex-col h-full">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-white dark:bg-[#1C1C1E] border border-black/[0.08] dark:border-white/[0.08] text-[#1D1D1F] dark:text-[#F5F5F7] px-4 py-2.5 rounded-card shadow-card-hover text-sm font-medium">
          {toast}
        </div>
      )}

      <div className="flex items-center gap-2 px-4 pt-4 pb-2 shrink-0 border-b border-black/[0.06] dark:border-white/[0.06] flex-wrap justify-between">
        {TYPE_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => selectType(tab.value)}
            className={[
              "h-9 px-5 rounded-full text-sm font-medium transition-all duration-[120ms]",
              typeParam === tab.value
                ? "bg-accent text-white"
                : "border border-accent/40 text-accent hover:bg-accent/[0.06]",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
        {(typeParam === "USER_STORY" || typeParam === "TASK") && (
          <div className="ml-2">
            <ParentFilterSelector
              projectId={projectId}
              childType={typeParam}
              selectedParentId={parentIdParam}
              variant="board"
              onSelect={(id) =>
                setSearchParams((prev) => {
                  const next = new URLSearchParams(prev);
                  next.set("parentId", id);
                  return next;
                })
              }
            />
          </div>
        )}
        <div ref={newItemMenuRef} className="relative ml-auto shrink-0">
          <button
            type="button"
            onClick={() => setNewItemMenuOpen((v) => !v)}
            aria-haspopup="listbox"
            aria-expanded={newItemMenuOpen}
            className="flex items-center gap-2 h-9 pl-5 pr-3 rounded-full text-sm font-medium bg-accent text-white hover:brightness-110 transition-all duration-[120ms]"
          >
            <MaterialIcon name="edit_square" className="text-white shrink-0" />
            Novo item
            <MaterialIcon
              name="expand_more"
              className={`text-white shrink-0 transition-transform duration-150 ${newItemMenuOpen ? "rotate-180" : ""}`}
            />
          </button>
          {newItemMenuOpen && (
            <div
              className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-[#1C1C1E] rounded-card shadow-card-hover border border-black/[0.08] dark:border-white/[0.08] z-30 py-1"
              role="listbox"
              aria-label="Tipo de item a criar"
            >
              <ul className="max-h-60 overflow-y-auto">
                {TYPE_TABS.map((tab) => (
                  <li key={tab.value}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={false}
                      onClick={() => {
                        setCreateModalType(tab.value);
                        setNewItemMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors duration-150"
                    >
                      {tab.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {createModalType && (
        <CreateWorkItemModal
          projectId={projectId}
          type={createModalType}
          onClose={() => setCreateModalType(null)}
          onCreated={() => void reloadItems()}
        />
      )}

      {detailWorkItemId && (
        <CardModal
          projectId={projectId}
          workItemId={detailWorkItemId}
          onClose={() => setDetailWorkItemId(null)}
          onSaved={() => void reloadItems()}
        />
      )}

      <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
      {boardNeedsParent ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center min-h-0">
          <p className="text-sm font-medium text-[#6E6E73] dark:text-[#8E8E93] max-w-md">
            {typeParam === "USER_STORY"
              ? "Selecione uma Feature no filtro acima para exibir este quadro."
              : "Selecione uma User Story no filtro acima para exibir este quadro."}
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          autoScroll={{ layoutShiftCompensation: false }}
          onDragEnd={handleDragEnd}
          onDragCancel={() => {
            suppressDetailOpenUntilRef.current = Date.now() + 400;
          }}
        >
          <div className="flex gap-3 overflow-x-auto p-4 flex-1 min-h-0 h-full">
            {columns.map((col) => (
              <WorkItemColumn
                key={col.status}
                status={col.status}
                label={col.label}
                isAutoOnly={col.autoOnly}
                items={items.filter((i) => i.status === col.status)}
                onOpenDetail={(id) => {
                  if (Date.now() < suppressDetailOpenUntilRef.current) return;
                  setDetailWorkItemId(id);
                }}
              />
            ))}
          </div>
          {createPortal(<KanbanDragOverlay items={items} />, document.body)}
        </DndContext>
      )}
      </div>
    </div>
  );
}
