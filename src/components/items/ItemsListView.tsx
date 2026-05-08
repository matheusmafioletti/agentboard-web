import { useMemo, useRef, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import useSWR from "swr";
import { boardApi, type WorkItem, type TenantUser } from "../../services/boardApi";
import MaterialIcon from "../shared/MaterialIcon";
import WorkItemTypeBadge from "../shared/WorkItemTypeBadge";
import AssigneeAvatar, { emailToDisplayName } from "../shared/AssigneeAvatar";
import CardModal from "../card-modal/CardModal";

type WorkItemType = "FEATURE" | "USER_STORY" | "TASK" | "";

const TYPE_OPTIONS: Array<{ value: WorkItemType; label: string }> = [
  { value: "FEATURE", label: "Feature" },
  { value: "USER_STORY", label: "User Story" },
  { value: "TASK", label: "Task" },
];

const STATUS_OPTIONS = [
  { value: "BACKLOG", label: "Backlog" },
  { value: "SPECIFY", label: "Specify" },
  { value: "CLARIFY", label: "Clarify" },
  { value: "PLAN", label: "Plan" },
  { value: "TASKS", label: "Tasks" },
  { value: "READY", label: "Ready" },
  { value: "IN_DEVELOPMENT", label: "Em Dev" },
  { value: "PR_REVIEW", label: "PR Review" },
  { value: "DONE", label: "Done" },
  { value: "IN_PROGRESS", label: "Em Progresso" },
  { value: "NEW", label: "Novo" },
  { value: "ACTIVE", label: "Ativo" },
  { value: "CLOSED", label: "Fechado" },
];

const STATUS_LABEL: Record<string, string> = Object.fromEntries(
  STATUS_OPTIONS.map((s) => [s.value, s.label])
);

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}m atrás`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h atrás`;
  const days = Math.floor(hrs / 24);
  return `${days}d atrás`;
}

function readTypeFromSearchParams(searchParams: URLSearchParams): WorkItemType {
  const v = searchParams.get("type") ?? "";
  if (v === "" || v === "FEATURE" || v === "USER_STORY" || v === "TASK") return v;
  return "";
}

function sortWorkItems(rows: WorkItem[]): WorkItem[] {
  return [...rows].sort(
    (a, b) => a.displayOrder - b.displayOrder || a.title.localeCompare(b.title)
  );
}

function groupByParentId(items: WorkItem[]) {
  const m = new Map<string, WorkItem[]>();
  for (const wi of items) {
    const key = wi.parentId ?? "__root__";
    if (!m.has(key)) m.set(key, []);
    m.get(key)!.push(wi);
  }
  for (const list of m.values()) sortWorkItems(list);
  return m;
}

function StatusChip({ status }: { status: string }) {
  const label = STATUS_LABEL[status] ?? status;
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-[#F2F2F7] dark:bg-[#2C2C2E] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-caps text-[#6E6E73] dark:text-[#8E8E93]">
      {label}
    </span>
  );
}

interface ItemsListViewProps {
  projectId: string;
}

function TreeOutline({
  item,
  byParentId,
  depth,
  onOpenDetail,
}: {
  item: WorkItem;
  byParentId: Map<string, WorkItem[]>;
  depth: number;
  onOpenDetail: (id: string) => void;
}) {
  const kids = byParentId.get(item.id) ?? [];
  const [expanded, setExpanded] = useState(depth < 1);

  return (
    <li className="list-none">
      <div
        className="flex items-center gap-1 py-1.5 rounded-chip hover:bg-[#F5F5F7] dark:hover:bg-[#2C2C2E] transition-colors"
        style={{ paddingLeft: depth * 14 }}
      >
        {kids.length > 0 ? (
          <button
            type="button"
            aria-expanded={expanded}
            onClick={() => setExpanded((v) => !v)}
            className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-chip text-[#6E6E73] dark:text-[#8E8E93] hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
          >
            <MaterialIcon name={expanded ? "expand_more" : "chevron_right"} iconSizePx={18} />
          </button>
        ) : (
          <span className="inline-flex h-7 w-7 shrink-0" aria-hidden />
        )}
        <button
          type="button"
          onClick={() => onOpenDetail(item.id)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <WorkItemTypeBadge type={item.type} size="compact" />
          <span className="text-[11px] font-semibold text-[#6E6E73] dark:text-[#8E8E93] shrink-0">
            {item.displayKey}
          </span>
          <span className="truncate text-[13px] font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">
            {item.title}
          </span>
          <StatusChip status={item.status} />
        </button>
      </div>
      {expanded && kids.length > 0 ? (
        <ul className="border-l border-black/[0.06] dark:border-white/[0.06] ml-3 md:ml-4">
          {kids.map((c) => (
            <TreeOutline
              key={c.id}
              item={c}
              byParentId={byParentId}
              depth={depth + 1}
              onOpenDetail={onOpenDetail}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function ItemsTreeView({
  items,
  onOpenDetail,
}: {
  items: WorkItem[];
  onOpenDetail: (id: string) => void;
}) {
  const byParentId = useMemo(() => groupByParentId(items), [items]);
  const roots = useMemo(
    () => sortWorkItems(items.filter((w) => w.type === "FEATURE" && !w.parentId)),
    [items]
  );

  return (
    <div
      data-testid="items-tree-root"
      className="rounded-card border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#141418] p-4 shadow-card"
    >
      {roots.length === 0 ? (
        <p className="text-sm text-[#6E6E73] dark:text-[#8E8E93] font-medium py-8 text-center">
          Nenhuma Feature raiz encontrada neste projeto.
        </p>
      ) : (
        <ul className="flex flex-col gap-0.5">
          {roots.map((r) => (
            <TreeOutline
              key={r.id}
              item={r}
              byParentId={byParentId}
              depth={0}
              onOpenDetail={onOpenDetail}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

/** Reusable filter chip with optional clear button as a sibling (no nested buttons). */
function FilterChip({
  label,
  active,
  open,
  onToggle,
  onClear,
  children,
}: {
  label: string;
  active: boolean;
  open: boolean;
  onToggle: () => void;
  onClear?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-0.5 shrink-0">
      <button
        type="button"
        onClick={onToggle}
        className={[
          "inline-flex h-8 items-center gap-1.5 px-3 text-sm font-medium transition-colors duration-150",
          active
            ? "rounded-l-chip bg-accent/10 text-accent dark:bg-accent/[0.15]"
            : "rounded-chip border border-black/[0.08] dark:border-white/[0.08] text-[#6E6E73] dark:text-[#8E8E93] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]",
        ].join(" ")}
      >
        <span>{label}</span>
        {!active && (
          <svg
            width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2"
            className={`shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        )}
      </button>
      {active && onClear && (
        <button
          type="button"
          aria-label={`Remover filtro: ${label}`}
          onClick={onClear}
          className="h-8 w-7 inline-flex items-center justify-center rounded-r-chip bg-accent/10 text-accent dark:bg-accent/[0.15] hover:bg-accent/20 transition-colors duration-100"
        >
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      )}
      {children}
    </div>
  );
}

/** Table and tree modes for all work items in the active project. */
export default function ItemsListView({ projectId }: ItemsListViewProps) {
  // NOTE: outer container must be flex-1 min-h-0 overflow-hidden for this component
  // to stay in-viewport. The table/tree sections use overflow-y-auto to scroll internally.
  const [searchParams, setSearchParams] = useSearchParams();
  const typeFilter = readTypeFromSearchParams(searchParams);
  const assigneeFilter = searchParams.get("assignee") ?? "";
  const statusFilter = searchParams.get("status") ?? "";

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [assigneeMenuOpen, setAssigneeMenuOpen] = useState(false);
  const [view, setView] = useState<"list" | "tree">("list");
  const [detailWorkItemId, setDetailWorkItemId] = useState<string | null>(null);

  const typeMenuRef = useRef<HTMLDivElement>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);
  const assigneeMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (typeMenuRef.current && !typeMenuRef.current.contains(e.target as Node)) {
        setTypeMenuOpen(false);
      }
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) {
        setStatusMenuOpen(false);
      }
      if (assigneeMenuRef.current && !assigneeMenuRef.current.contains(e.target as Node)) {
        setAssigneeMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const listSwrKey = projectId
    ? `items-list-${projectId}-${typeFilter}-${statusFilter}-${assigneeFilter}`
    : null;

  const { data: listItems = [], isLoading: listLoading } = useSWR<WorkItem[]>(
    listSwrKey,
    () =>
      boardApi.listWorkItems({
        projectId,
        type: typeFilter || undefined,
        status: statusFilter || undefined,
        assigneeId: assigneeFilter || undefined,
      }),
    { refreshInterval: 3000 }
  );

  const treeSwrKey = projectId && view === "tree" ? `items-tree-${projectId}` : null;
  const { data: treeItems = [], isLoading: treeLoading } = useSWR<WorkItem[]>(
    treeSwrKey,
    () => boardApi.listWorkItems({ projectId }),
    { refreshInterval: 3000 }
  );

  function setParam(key: string, value: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value);
      else next.delete(key);
      return next;
    });
  }

  const items = view === "list" ? listItems : treeItems;
  const isLoading = view === "list" ? listLoading : treeLoading;
  const hasActiveFilters = Boolean(typeFilter) || Boolean(statusFilter) || Boolean(assigneeFilter);

  const selectedAssigneeEmail = assigneeFilter ? (usersById.get(assigneeFilter) ?? null) : null;
  const selectedStatusLabel = statusFilter ? (STATUS_LABEL[statusFilter] ?? statusFilter) : null;
  const selectedTypeLabel = typeFilter
    ? (TYPE_OPTIONS.find((o) => o.value === typeFilter)?.label ?? typeFilter)
    : null;

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div
          className="inline-flex rounded-full border border-black/[0.08] dark:border-white/[0.08] p-0.5 bg-[#F5F5F7] dark:bg-[#1C1C1E]"
          role="group"
          aria-label="Modo de visualização"
        >
          <button
            type="button"
            onClick={() => setView("list")}
            className={[
              "h-8 px-4 rounded-full text-xs font-medium transition-all duration-[120ms]",
              view === "list" ? "bg-accent text-white" : "text-[#6E6E73] dark:text-[#8E8E93]",
            ].join(" ")}
          >
            Lista
          </button>
          <button
            type="button"
            onClick={() => setView("tree")}
            className={[
              "h-8 px-4 rounded-full text-xs font-medium transition-all duration-[120ms]",
              view === "tree" ? "bg-accent text-white" : "text-[#6E6E73] dark:text-[#8E8E93]",
            ].join(" ")}
          >
            Árvore
          </button>
        </div>

        {/* Funnel filter button */}
        {view === "list" && (
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            aria-label="Painel de filtros"
            aria-expanded={filtersOpen}
            className={[
              "relative inline-flex h-9 w-9 items-center justify-center rounded-chip transition-colors duration-150",
              filtersOpen || hasActiveFilters
                ? "text-accent bg-accent/10 dark:bg-accent/[0.15]"
                : "text-[#6E6E73] dark:text-[#8E8E93] border border-black/[0.08] dark:border-white/[0.08] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]",
            ].join(" ")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3z" />
            </svg>
            {hasActiveFilters && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent" aria-hidden />
            )}
          </button>
        )}

        <span className="text-[11px] font-semibold text-[#6E6E73] dark:text-[#8E8E93] uppercase tracking-caps ml-auto">
          {view === "list"
            ? `${items.length} ${items.length === 1 ? "item" : "itens"}`
            : "Todos os tipos"}
        </span>
      </div>

      {/* Collapsible filter row — list mode only */}
      {filtersOpen && view === "list" && (
        <div className="flex items-center gap-3 flex-wrap px-0 py-2 border-y border-black/[0.06] dark:border-white/[0.06]">
          <span className="text-[11px] font-semibold uppercase tracking-caps text-[#6E6E73] dark:text-[#8E8E93] shrink-0">
            Filtros
          </span>

          {/* Type filter */}
          <div ref={typeMenuRef} className="relative">
            <FilterChip
              label={selectedTypeLabel ?? "Tipo"}
              active={Boolean(typeFilter)}
              open={typeMenuOpen}
              onToggle={() => setTypeMenuOpen((v) => !v)}
              onClear={() => setParam("type", "")}
            />
            {typeMenuOpen && (
              <div
                className="absolute left-0 top-full mt-1.5 w-52 bg-white dark:bg-[#1C1C1E] rounded-card shadow-modal border border-black/[0.08] dark:border-white/[0.08] z-30 py-1.5"
                role="listbox"
              >
                <ul className="max-h-60 overflow-y-auto">
                  {TYPE_OPTIONS.map((opt) => (
                    <li key={opt.value}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={typeFilter === opt.value}
                        onClick={() => {
                          setParam("type", opt.value);
                          setTypeMenuOpen(false);
                        }}
                        className={[
                          "w-full text-left px-4 py-2 text-sm transition-colors duration-150",
                          typeFilter === opt.value
                            ? "bg-accent/[0.08] dark:bg-accent/[0.12] text-accent font-medium"
                            : "text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]",
                        ].join(" ")}
                      >
                        {opt.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Status filter */}
          <div ref={statusMenuRef} className="relative">
            <FilterChip
              label={selectedStatusLabel ?? "Status"}
              active={Boolean(statusFilter)}
              open={statusMenuOpen}
              onToggle={() => setStatusMenuOpen((v) => !v)}
              onClear={() => setParam("status", "")}
            />
            {statusMenuOpen && (
              <div
                className="absolute left-0 top-full mt-1.5 w-52 bg-white dark:bg-[#1C1C1E] rounded-card shadow-modal border border-black/[0.08] dark:border-white/[0.08] z-30 py-1.5"
                role="listbox"
              >
                <ul className="max-h-60 overflow-y-auto">
                  {STATUS_OPTIONS.map((opt) => (
                    <li key={opt.value}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={statusFilter === opt.value}
                        onClick={() => {
                          setParam("status", opt.value);
                          setStatusMenuOpen(false);
                        }}
                        className={[
                          "w-full text-left px-4 py-2 text-sm transition-colors duration-150",
                          statusFilter === opt.value
                            ? "bg-accent/[0.08] dark:bg-accent/[0.12] text-accent font-medium"
                            : "text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]",
                        ].join(" ")}
                      >
                        {opt.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Assignee filter */}
          <div ref={assigneeMenuRef} className="relative flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => setAssigneeMenuOpen((v) => !v)}
              aria-haspopup="listbox"
              aria-expanded={assigneeMenuOpen}
              className={[
                "inline-flex h-8 items-center gap-1.5 px-3 text-sm font-medium transition-colors duration-150",
                assigneeFilter
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
              {!assigneeFilter && (
                <svg
                  width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2"
                  className={`shrink-0 transition-transform duration-150 ${assigneeMenuOpen ? "rotate-180" : ""}`}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              )}
            </button>
            {assigneeFilter && (
              <button
                type="button"
                aria-label="Remover filtro de responsável"
                onClick={() => { setParam("assignee", ""); setAssigneeMenuOpen(false); }}
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
                <ul className="max-h-64 overflow-y-auto">
                  <li>
                    <button
                      type="button"
                      role="option"
                      aria-selected={!assigneeFilter}
                      onClick={() => { setParam("assignee", ""); setAssigneeMenuOpen(false); }}
                      className={[
                        "w-full text-left px-4 py-2 text-sm flex items-center gap-2.5 transition-colors duration-150",
                        !assigneeFilter
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
                        aria-selected={assigneeFilter === u.id}
                        onClick={() => { setParam("assignee", u.id); setAssigneeMenuOpen(false); }}
                        className={[
                          "w-full text-left px-4 py-2 text-sm flex items-center gap-2.5 transition-colors duration-150",
                          assigneeFilter === u.id
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

          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setSearchParams((prev) => {
                  const next = new URLSearchParams(prev);
                  next.delete("type");
                  next.delete("status");
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

      {view === "tree" ? (
        isLoading ? (
          <div className="skeleton-shimmer h-40 rounded-card w-full shrink-0" />
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto">
            <ItemsTreeView items={treeItems} onOpenDetail={(id) => setDetailWorkItemId(id)} />
          </div>
        )
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto rounded-card border border-black/[0.08] dark:border-white/[0.08] shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/[0.06] dark:border-white/[0.06] bg-[#F5F5F7] dark:bg-[#141418]">
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-caps text-[#6E6E73] dark:text-[#8E8E93] w-36">
                  ID
                </th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-caps text-[#6E6E73] dark:text-[#8E8E93] w-36">
                  Tipo
                </th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-caps text-[#6E6E73] dark:text-[#8E8E93]">
                  Título
                </th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-caps text-[#6E6E73] dark:text-[#8E8E93] w-44">
                  Responsável
                </th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-caps text-[#6E6E73] dark:text-[#8E8E93] w-32">
                  Status
                </th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-caps text-[#6E6E73] dark:text-[#8E8E93] w-32">
                  Atualizado
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center">
                    <div className="skeleton-shimmer h-5 rounded-chip w-48 mx-auto" />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-sm text-[#6E6E73] dark:text-[#8E8E93]"
                  >
                    Nenhum item encontrado.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setDetailWorkItemId(item.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setDetailWorkItemId(item.id);
                      }
                    }}
                    className="border-b border-black/[0.04] dark:border-white/[0.04] last:border-0 hover:bg-[#F5F5F7] dark:hover:bg-[#2C2C2E] transition-colors duration-100 cursor-pointer"
                  >
                    <td className="px-4 py-3 text-[11px] font-semibold text-[#6E6E73] dark:text-[#8E8E93]">
                      {item.displayKey}
                    </td>
                    <td className="px-4 py-3">
                      <WorkItemTypeBadge type={item.type} size="compact" />
                    </td>
                    <td className="px-4 py-3 text-[#1D1D1F] dark:text-[#F5F5F7] font-medium">
                      {item.title}
                    </td>
                    <td className="px-4 py-3">
                      <AssigneeAvatar
                        email={item.assigneeId ? (usersById.get(item.assigneeId) ?? null) : null}
                        sizePx={20}
                        showLabel
                      />
                    </td>
                    <td className="px-4 py-3 text-[#6E6E73] dark:text-[#8E8E93] text-[13px]">
                      {STATUS_LABEL[item.status] ?? item.status}
                    </td>
                    <td className="px-4 py-3 text-[#6E6E73] dark:text-[#8E8E93] text-[13px]">
                      {relativeTime(item.updatedAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {detailWorkItemId ? (
        <CardModal
          projectId={projectId}
          workItemId={detailWorkItemId}
          onClose={() => setDetailWorkItemId(null)}
          onSaved={() => setDetailWorkItemId(null)}
        />
      ) : null}
    </div>
  );
}
