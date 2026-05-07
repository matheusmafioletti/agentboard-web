import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import useSWR from "swr";
import { boardApi, type WorkItem } from "../../services/boardApi";
import MaterialIcon from "../shared/MaterialIcon";

type WorkItemType = "FEATURE" | "USER_STORY" | "TASK" | "";

const TYPE_OPTIONS: Array<{ value: WorkItemType; label: string }> = [
  { value: "", label: "Todos os tipos" },
  { value: "FEATURE", label: "Feature" },
  { value: "USER_STORY", label: "User Story" },
  { value: "TASK", label: "Task" },
];

const STATUS_LABEL: Record<string, string> = {
  BACKLOG: "Backlog",
  SPECIFY: "Specify",
  CLARIFY: "Clarify",
  PLAN: "Plan",
  TASKS: "Tasks",
  READY: "Ready",
  IN_DEVELOPMENT: "Em Dev",
  PR_REVIEW: "PR Review",
  DONE: "Done",
  IN_PROGRESS: "Em Progresso",
  NEW: "Novo",
  ACTIVE: "Ativo",
  CLOSED: "Fechado",
};

const TYPE_BADGE: Record<string, string> = {
  FEATURE: "bg-accent/10 text-accent",
  USER_STORY: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  TASK: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
};

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
  if (v === "" || v === "FEATURE" || v === "USER_STORY" || v === "TASK") {
    return v;
  }
  return "";
}

interface ItemsListViewProps {
  projectId: string;
}

export default function ItemsListView({ projectId }: ItemsListViewProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const typeFilter = readTypeFromSearchParams(searchParams);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);
  const typeMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (typeMenuRef.current && !typeMenuRef.current.contains(e.target as Node)) {
        setTypeMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const swrKey = projectId
    ? `items-list-${projectId}-${typeFilter}-${statusFilter}`
    : null;

  const { data: items = [], isLoading } = useSWR<WorkItem[]>(
    swrKey,
    () =>
      boardApi.listWorkItems({
        projectId,
        type: typeFilter || undefined,
        status: statusFilter || undefined,
      }),
    { refreshInterval: 3000 }
  );

  function handleTypeChange(value: WorkItemType) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set("type", value);
      else next.delete("type");
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div ref={typeMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setTypeMenuOpen((v) => !v)}
            aria-haspopup="listbox"
            aria-expanded={typeMenuOpen}
            className="flex items-center gap-2 h-9 px-3 rounded-chip border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] text-sm font-medium text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors duration-150 min-w-[180px]"
          >
            <span className="truncate flex-1 text-left">
              {TYPE_OPTIONS.find((o) => o.value === typeFilter)?.label ?? "Tipo"}
            </span>
            <MaterialIcon
              name="expand_more"
              className={`text-[#6E6E73] dark:text-[#8E8E93] shrink-0 transition-transform duration-150 ${typeMenuOpen ? "rotate-180" : ""}`}
            />
          </button>
          {typeMenuOpen && (
            <div
              className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-[#1C1C1E] rounded-card shadow-card-hover border border-black/[0.08] dark:border-white/[0.08] z-20"
              role="listbox"
            >
              <ul className="py-1 max-h-60 overflow-y-auto">
                {TYPE_OPTIONS.map((opt) => (
                  <li key={opt.value === "" ? "all-types" : opt.value}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={typeFilter === opt.value}
                      onClick={() => {
                        handleTypeChange(opt.value);
                        setTypeMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors duration-150 ${
                        typeFilter === opt.value
                          ? "bg-accent/10 dark:bg-accent/[0.15] text-accent font-medium"
                          : "text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <input
          type="text"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value.toUpperCase())}
          placeholder="Filtrar por status..."
          className="h-9 px-3 rounded-chip text-sm text-[#1D1D1F] dark:text-[#F5F5F7] bg-white dark:bg-[#1C1C1E] border border-black/[0.08] dark:border-white/[0.08] placeholder-[#6E6E73] dark:placeholder-[#8E8E93] focus:outline-none focus:ring-2 focus:ring-accent/40 min-w-[180px]"
        />

        <span className="text-[11px] font-semibold text-[#6E6E73] dark:text-[#8E8E93] uppercase tracking-caps ml-auto">
          {items.length} {items.length === 1 ? "item" : "itens"}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-card border border-black/[0.08] dark:border-white/[0.08] overflow-hidden shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/[0.06] dark:border-white/[0.06] bg-[#F5F5F7] dark:bg-[#141418]">
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-caps text-[#6E6E73] dark:text-[#8E8E93] w-28">
                Tipo
              </th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-caps text-[#6E6E73] dark:text-[#8E8E93]">
                Título
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
                <td colSpan={4} className="px-4 py-8 text-center">
                  <div className="skeleton-shimmer h-5 rounded-chip w-48 mx-auto" />
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-12 text-center text-sm text-[#6E6E73] dark:text-[#8E8E93]"
                >
                  Nenhum item encontrado.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-black/[0.04] dark:border-white/[0.04] last:border-0 hover:bg-[#F5F5F7] dark:hover:bg-[#2C2C2E] transition-colors duration-100"
                >
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-chip text-[11px] font-semibold ${
                        TYPE_BADGE[item.type] ?? ""
                      }`}
                    >
                      {item.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#1D1D1F] dark:text-[#F5F5F7] font-medium">
                    {item.title}
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
    </div>
  );
}
