import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { boardApi, type WorkItem, type TenantUser } from "../../services/boardApi";
import WorkItemColumn from "./WorkItemColumn";
import { WorkItemCardDisplay } from "./WorkItemCard";
import ParentFilterSelector from "./ParentFilterSelector";
import CardModal from "../card-modal/CardModal";
import CreateWorkItemModal from "./CreateWorkItemModal";
import MaterialIcon from "../shared/MaterialIcon";
import WorkItemTypeGlyph from "../shared/WorkItemTypeGlyph";
import AssigneeAvatar from "../shared/AssigneeAvatar";
import { emailToDisplayName } from "../shared/AssigneeAvatar";

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

function KanbanDragOverlay({
  items,
  activeProjectName,
  usersById,
}: {
  items: WorkItem[];
  activeProjectName?: string;
  usersById?: Map<string, string>;
}) {
  const { active } = useDndContext();
  const id = active?.id != null ? String(active.id) : null;
  const item = id ? items.find((i) => i.id === id) : undefined;
  return (
    <DragOverlay dropAnimation={kanbanDropAnimation}>
      {item ? (
        <WorkItemCardDisplay
          variant="dragShadow"
          workItem={item}
          activeProjectName={activeProjectName}
          usersById={usersById}
        />
      ) : null}
    </DragOverlay>
  );
}

interface WorkItemBoardProps {
  projectId: string;
  activeProjectName?: string;
}

/** Unified kanban board that adapts its columns based on the selected WorkItem type. */
export default function WorkItemBoard({ projectId, activeProjectName }: WorkItemBoardProps) {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const typeParam = (searchParams.get("type") as WorkItemType) ?? "FEATURE";
  const parentIdParam = searchParams.get("parentId") ?? undefined;
  const assigneeFilterParam = searchParams.get("assignee") ?? undefined;

  const [toast, setToast] = useState<string | null>(null);
  const [newItemMenuOpen, setNewItemMenuOpen] = useState(false);
  const [createModalType, setCreateModalType] = useState<WorkItemType | null>(null);
  const newItemMenuRef = useRef<HTMLDivElement>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [assigneeMenuOpen, setAssigneeMenuOpen] = useState(false);
  const assigneeMenuRef = useRef<HTMLDivElement>(null);
  const [detailWorkItemId, setDetailWorkItemId] = useState<string | null>(null);
  const suppressDetailOpenUntilRef = useRef(0);

  // Per-type filter memory: saves parentId + assignee when switching tabs so
  // returning to a type restores the filters that were active before leaving it.
  const filterMemory = useRef<Partial<Record<WorkItemType, { parentId?: string; assignee?: string }>>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const includeParent =
    (typeParam === "USER_STORY" || typeParam === "TASK") && Boolean(parentIdParam);

  const swrKey = projectId
    ? `work-items-${projectId}-${typeParam}-${parentIdParam ?? "all"}-${includeParent ? "p1" : "p0"}-${assigneeFilterParam ?? "any"}`
    : null;

  const { data: items = [], mutate: reloadItems } = useSWR<WorkItem[]>(
    swrKey,
    () =>
      boardApi.listWorkItems({
        projectId,
        type: typeParam,
        parentId: parentIdParam,
        includeParent,
        assigneeId: assigneeFilterParam,
      }),
    { refreshInterval: 3000 }
  );

  const { data: users = [] } = useSWR<TenantUser[]>(
    "tenant-users",
    () => boardApi.listUsers(),
    { revalidateOnFocus: false }
  );

  const usersById = useMemo(() => {
    const m = new Map<string, string>();
    for (const u of users) m.set(u.id, u.email);
    return m;
  }, [users]);

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

  // Clear filter memory + URL filters when the active project changes.
  useEffect(() => {
    filterMemory.current = {};
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("parentId");
      next.delete("assignee");
      return next;
    }, { replace: true });
  // NOTE: intentionally only runs when projectId changes, not on every searchParams change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (newItemMenuRef.current && !newItemMenuRef.current.contains(e.target as Node)) {
        setNewItemMenuOpen(false);
      }
      if (assigneeMenuRef.current && !assigneeMenuRef.current.contains(e.target as Node)) {
        setAssigneeMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectType(nextType: WorkItemType) {
    // Save current filters before leaving this type
    filterMemory.current[typeParam] = {
      parentId: parentIdParam,
      assignee: assigneeFilterParam,
    };
    // Restore saved filters for the incoming type
    const saved = filterMemory.current[nextType] ?? {};
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("type", nextType);
      if (saved.parentId && nextType !== "FEATURE") {
        next.set("parentId", saved.parentId);
      } else {
        next.delete("parentId");
      }
      if (saved.assignee) {
        next.set("assignee", saved.assignee);
      } else {
        next.delete("assignee");
      }
      return next;
    });
  }

  function selectAssignee(id: string | null) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (id) next.set("assignee", id);
      else next.delete("assignee");
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
  const hasActiveFilters = Boolean(parentIdParam) || Boolean(assigneeFilterParam);
  const selectedAssigneeEmail = assigneeFilterParam ? (usersById.get(assigneeFilterParam) ?? null) : null;

  return (
    <div className="flex flex-col h-full">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-white dark:bg-[#1C1C1E] border border-black/[0.08] dark:border-white/[0.08] text-[#1D1D1F] dark:text-[#F5F5F7] px-4 py-2.5 rounded-card shadow-card-hover text-sm font-medium">
          {toast}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2 shrink-0 border-b border-black/[0.06] dark:border-white/[0.06] flex-wrap justify-between">
        <div
          role="radiogroup"
          aria-label="Tipo de item no quadro"
          className="inline-flex flex-wrap rounded-full bg-[#F2F2F7] dark:bg-[#1C1C1E] p-1 gap-0.5"
        >
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="radio"
              aria-checked={typeParam === tab.value}
              data-testid={`board-type-tab-${tab.value}`}
              onClick={() => selectType(tab.value)}
              className={[
                "h-8 sm:h-9 px-3 sm:px-4 rounded-full text-sm font-medium transition-all duration-[120ms]",
                "inline-flex items-center gap-2 shrink-0",
                typeParam === tab.value
                  ? "bg-accent text-white shadow-sm"
                  : "text-[#6E6E73] dark:text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7]",
              ].join(" ")}
            >
              <WorkItemTypeGlyph type={tab.value} sizePx={14} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {/* Funnel filter toggle button */}
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            aria-label="Painel de filtros"
            aria-expanded={filtersOpen}
            className={[
              "relative inline-flex h-9 w-9 items-center justify-center rounded-chip transition-colors duration-150",
              filtersOpen || hasActiveFilters
                ? "text-accent bg-accent/10 dark:bg-accent/[0.15]"
                : "text-[#6E6E73] dark:text-[#8E8E93] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]",
            ].join(" ")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3z" />
            </svg>
            {hasActiveFilters && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent" aria-hidden />
            )}
          </button>

          <div ref={newItemMenuRef} className="relative shrink-0">
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
      </div>

      {/* Collapsible filter row */}
      {filtersOpen && (
        <div className="flex items-center gap-3 px-4 py-2.5 shrink-0 border-b border-black/[0.06] dark:border-white/[0.06] bg-[#F9F9FB] dark:bg-[#111114] flex-wrap">
          <span className="text-[11px] font-semibold uppercase tracking-caps text-[#6E6E73] dark:text-[#8E8E93] shrink-0">
            Filtros
          </span>

          {/* Parent filter — only for USER_STORY and TASK */}
          {(typeParam === "USER_STORY" || typeParam === "TASK") && (
            <div className="flex items-center gap-0.5 shrink-0">
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
                renderBoardTrigger={(openModal, modalOpen) => (
                  <button
                    type="button"
                    onClick={openModal}
                    aria-label="Filtrar por item pai"
                    aria-haspopup="dialog"
                    aria-expanded={modalOpen}
                    className={[
                      "inline-flex h-8 items-center gap-1.5 px-3 text-sm font-medium transition-colors duration-150",
                      parentIdParam
                        ? "rounded-l-chip bg-accent/10 text-accent dark:bg-accent/[0.15]"
                        : "rounded-chip border border-black/[0.08] dark:border-white/[0.08] text-[#6E6E73] dark:text-[#8E8E93] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]",
                    ].join(" ")}
                  >
                    <span>
                      {typeParam === "USER_STORY" ? "Feature" : "User Story"}
                      {parentIdParam ? " · selecionado" : ""}
                    </span>
                  </button>
                )}
              />
              {parentIdParam && (
                <button
                  type="button"
                  aria-label="Remover filtro de pai"
                  onClick={() =>
                    setSearchParams((prev) => {
                      const next = new URLSearchParams(prev);
                      next.delete("parentId");
                      return next;
                    })
                  }
                  className="h-8 w-7 inline-flex items-center justify-center rounded-r-chip bg-accent/10 text-accent dark:bg-accent/[0.15] hover:bg-accent/20 transition-colors duration-100"
                >
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Assignee filter */}
          <div ref={assigneeMenuRef} className="relative flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={() => setAssigneeMenuOpen((v) => !v)}
              aria-haspopup="listbox"
              aria-expanded={assigneeMenuOpen}
              aria-label="Filtrar por responsável"
              className={[
                "inline-flex h-8 items-center gap-1.5 px-3 text-sm font-medium transition-colors duration-150",
                assigneeFilterParam
                  ? "rounded-l-chip bg-accent/10 text-accent dark:bg-accent/[0.15]"
                  : "rounded-chip border border-black/[0.08] dark:border-white/[0.08] text-[#6E6E73] dark:text-[#8E8E93] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]",
              ].join(" ")}
            >
              <AssigneeAvatar email={selectedAssigneeEmail} sizePx={16} />
              <span>
                {selectedAssigneeEmail
                  ? emailToDisplayName(selectedAssigneeEmail)
                  : "Responsável"}
              </span>
              {!assigneeFilterParam && (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`shrink-0 transition-transform duration-150 ${assigneeMenuOpen ? "rotate-180" : ""}`}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              )}
            </button>
            {assigneeFilterParam && (
              <button
                type="button"
                aria-label="Remover filtro de responsável"
                onClick={() => {
                  selectAssignee(null);
                  setAssigneeMenuOpen(false);
                }}
                className="h-8 w-7 inline-flex items-center justify-center rounded-r-chip bg-accent/10 text-accent dark:bg-accent/[0.15] hover:bg-accent/20 transition-colors duration-100"
              >
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            )}


            {assigneeMenuOpen && (
              <div
                className="absolute left-0 top-full mt-1.5 w-64 bg-white dark:bg-[#1C1C1E] rounded-card shadow-modal border border-black/[0.08] dark:border-white/[0.08] z-30 py-1.5"
                role="listbox"
                aria-label="Filtrar por responsável"
              >
                <p className="px-4 pt-1 pb-2 text-[11px] font-semibold uppercase tracking-caps text-[#6E6E73] dark:text-[#8E8E93]">
                  Responsável
                </p>
                <ul className="max-h-72 overflow-y-auto">
                  <li>
                    <button
                      type="button"
                      role="option"
                      aria-selected={!assigneeFilterParam}
                      onClick={() => { selectAssignee(null); setAssigneeMenuOpen(false); }}
                      className={[
                        "w-full text-left px-4 py-2 text-sm transition-colors duration-150 flex items-center gap-2.5",
                        !assigneeFilterParam
                          ? "bg-accent/[0.08] dark:bg-accent/[0.12] text-accent font-medium"
                          : "text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]",
                      ].join(" ")}
                    >
                      <AssigneeAvatar email={null} sizePx={22} />
                      <span>Todos</span>
                    </button>
                  </li>
                  {users.map((u) => (
                    <li key={u.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={assigneeFilterParam === u.id}
                        onClick={() => { selectAssignee(u.id); setAssigneeMenuOpen(false); }}
                        className={[
                          "w-full text-left px-4 py-2 text-sm transition-colors duration-150 flex items-center gap-2.5",
                          assigneeFilterParam === u.id
                            ? "bg-accent/[0.08] dark:bg-accent/[0.12] text-accent font-medium"
                            : "text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]",
                        ].join(" ")}
                      >
                        <AssigneeAvatar email={u.email} sizePx={22} />
                        <span className="truncate">{emailToDisplayName(u.email)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Clear all filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setSearchParams((prev) => {
                  const next = new URLSearchParams(prev);
                  next.delete("parentId");
                  next.delete("assignee");
                  return next;
                });
              }}
              className="ml-auto text-[11px] font-medium text-[#6E6E73] dark:text-[#8E8E93] hover:text-accent transition-colors duration-150"
            >
              Limpar filtros
            </button>
          )}
        </div>
      )}

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
              activeProjectName={activeProjectName}
              usersById={usersById}
              onOpenWorkItem={(id) => {
                if (Date.now() < suppressDetailOpenUntilRef.current) return;
                setDetailWorkItemId(id);
              }}
            />
          ))}
        </div>
        {createPortal(
          <KanbanDragOverlay items={items} activeProjectName={activeProjectName} usersById={usersById} />,
          document.body
        )}
      </DndContext>
    </div>
  );
}
