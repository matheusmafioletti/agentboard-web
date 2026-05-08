import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAllWorkItems, type WorkItem, type Project } from "../services/boardApi";
import WorkItemTypeGlyph from "../components/shared/WorkItemTypeGlyph";

// ---------------------------------------------------------------------------
// Status categorisation per work-item type
// ---------------------------------------------------------------------------

function categoriseFeature(status: string): "done" | "inProgress" | "notStarted" {
  if (status === "DONE") return "done";
  if (status === "BACKLOG") return "notStarted";
  return "inProgress";
}

function categoriseUserStory(status: string): "done" | "inProgress" | "notStarted" {
  if (status === "DONE") return "done";
  if (status === "READY") return "notStarted";
  return "inProgress";
}

function categoriseTask(status: string): "done" | "inProgress" | "notStarted" {
  if (status === "CLOSED") return "done";
  if (status === "NEW") return "notStarted";
  return "inProgress";
}

interface TypeStats {
  total: number;
  done: number;
  inProgress: number;
  notStarted: number;
}

function computeStats(
  items: WorkItem[],
  type: WorkItem["type"],
  categorise: (s: string) => "done" | "inProgress" | "notStarted"
): TypeStats {
  const filtered = items.filter((i) => i.type === type);
  const stats: TypeStats = { total: filtered.length, done: 0, inProgress: 0, notStarted: 0 };
  for (const item of filtered) {
    stats[categorise(item.status)]++;
  }
  return stats;
}

function itemsUrl(params: Record<string, string>): string {
  return `/itens?${new URLSearchParams(params).toString()}`;
}

// ---------------------------------------------------------------------------
// Mini stat card (done / in-progress / not-started)
// ---------------------------------------------------------------------------

interface MiniStatCardProps {
  count: number;
  href: string;
  bgClass: string;
  hoverBgClass: string;
  countClass: string;
  ariaLabel: string;
}

function MiniStatCard({ count, href, bgClass, hoverBgClass, countClass, ariaLabel }: MiniStatCardProps) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={() => navigate(href)}
      className={[
        "flex-1 flex items-center justify-center rounded-chip py-4 transition-colors duration-150 active:scale-[0.98]",
        bgClass,
        hoverBgClass,
      ].join(" ")}
    >
      <span className={`text-[26px] font-semibold leading-none tabular-nums ${countClass}`}>{count}</span>
    </button>
  );
}

function StatLegend() {
  return (
    <div className="flex items-center justify-center gap-4 mt-1">
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[#C7C7CC] dark:bg-[#48484A] shrink-0" />
        <span className="text-[10px] font-medium text-[#6E6E73] dark:text-[#8E8E93]">Não iniciado</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-accent shrink-0" />
        <span className="text-[10px] font-medium text-[#6E6E73] dark:text-[#8E8E93]">Em andamento</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-emerald-400 dark:bg-emerald-500 shrink-0" />
        <span className="text-[10px] font-medium text-[#6E6E73] dark:text-[#8E8E93]">Concluído</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// WorkItem type stat card
// ---------------------------------------------------------------------------

interface WorkItemStatCardProps {
  title: string;
  icon: React.ReactNode;
  stats: TypeStats;
  notStartedUrl: string;
  inProgressUrl: string;
  doneUrl: string;
  headerAccent: string;
  iconAccent: string;
}

function WorkItemStatCard({
  title,
  icon,
  stats,
  notStartedUrl,
  inProgressUrl,
  doneUrl,
  headerAccent,
  iconAccent,
}: WorkItemStatCardProps) {
  return (
    <div className="rounded-card bg-white dark:bg-[#141418] border border-black/[0.08] dark:border-white/[0.08] shadow-card p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-chip ${iconAccent}`}>
          {icon}
        </span>
        <span className={`text-[13px] font-semibold ${headerAccent}`}>{title}</span>
        <span className="ml-auto text-[32px] font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] leading-none tabular-nums">
          {stats.total}
        </span>
      </div>

      {/* Mini stat cards — order: not started / in progress / done */}
      <div className="flex gap-2">
        <MiniStatCard
          count={stats.notStarted}
          href={notStartedUrl}
          bgClass="bg-[#F2F2F7] dark:bg-[#2C2C2E]"
          hoverBgClass="hover:bg-[#E5E5EA] dark:hover:bg-[#3A3A3C]"
          countClass="text-[#1D1D1F] dark:text-[#F5F5F7]"
          ariaLabel="Não iniciados"
        />
        <MiniStatCard
          count={stats.inProgress}
          href={inProgressUrl}
          bgClass="bg-accent/[0.08] dark:bg-accent/[0.12]"
          hoverBgClass="hover:bg-accent/[0.15] dark:hover:bg-accent/[0.20]"
          countClass="text-accent"
          ariaLabel="Em andamento"
        />
        <MiniStatCard
          count={stats.done}
          href={doneUrl}
          bgClass="bg-emerald-50 dark:bg-emerald-900/20"
          hoverBgClass="hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
          countClass="text-emerald-600 dark:text-emerald-400"
          ariaLabel="Concluídos"
        />
      </div>
      <StatLegend />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Project ranking card (full width)
// ---------------------------------------------------------------------------

const MEDALS = ["🥇", "🥈", "🥉"];

function ProjectRankingCard({
  projects,
  allItems,
}: {
  projects: Project[];
  allItems: WorkItem[];
}) {
  const ranked = useMemo(() => {
    const countByProject = new Map<string, number>();
    for (const item of allItems) {
      countByProject.set(item.projectId, (countByProject.get(item.projectId) ?? 0) + 1);
    }
    return [...projects]
      .map((p) => ({ project: p, count: countByProject.get(p.id) ?? 0 }))
      .sort((a, b) => b.count - a.count);
  }, [projects, allItems]);

  return (
    <div className="rounded-card bg-white dark:bg-[#141418] border border-black/[0.08] dark:border-white/[0.08] shadow-card p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-chip bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0" />
          </svg>
        </span>
        <span className="text-[13px] font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">Ranking de projetos</span>
      </div>

      {ranked.length === 0 ? (
        <p className="text-sm text-[#6E6E73] dark:text-[#8E8E93] py-2">Nenhum projeto com itens.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/[0.06] dark:border-white/[0.06]">
              <th className="pb-2 text-left text-[11px] font-semibold uppercase tracking-caps text-[#6E6E73] dark:text-[#8E8E93] w-10">#</th>
              <th className="pb-2 text-left text-[11px] font-semibold uppercase tracking-caps text-[#6E6E73] dark:text-[#8E8E93]">Projeto</th>
              <th className="pb-2 text-right text-[11px] font-semibold uppercase tracking-caps text-[#6E6E73] dark:text-[#8E8E93] w-24">Itens</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((entry, idx) => (
              <tr
                key={entry.project.id}
                className="border-b border-black/[0.04] dark:border-white/[0.04] last:border-0"
              >
                <td className="py-2.5 text-[16px] leading-none">{MEDALS[idx] ?? `${idx + 1}.`}</td>
                <td className="py-2.5 font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">
                  {entry.project.name}
                </td>
                <td className="py-2.5 text-right font-semibold tabular-nums text-[#6E6E73] dark:text-[#8E8E93]">
                  {entry.count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}


// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

/** Início dashboard with per-type stats cards and project ranking. */
export default function InicioPage() {
  const { projects, allItems, isLoading } = useAllWorkItems();

  const featureStats = useMemo(() => computeStats(allItems, "FEATURE", categoriseFeature), [allItems]);
  const userStoryStats = useMemo(() => computeStats(allItems, "USER_STORY", categoriseUserStory), [allItems]);
  const taskStats = useMemo(() => computeStats(allItems, "TASK", categoriseTask), [allItems]);

  return (
    <div className="p-8 max-w-5xl mx-auto overflow-y-auto h-full">
      <h1 className="text-[28px] font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-heading mb-7">
        Início
      </h1>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          <div className="skeleton-shimmer rounded-card h-20 w-full" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton-shimmer rounded-card h-40" />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Ranking — full width */}
          <ProjectRankingCard projects={projects} allItems={allItems} />

          {/* Type cards — 3 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <WorkItemStatCard
              title="Features"
              icon={<WorkItemTypeGlyph type="FEATURE" sizePx={16} className="" />}
              stats={featureStats}
              headerAccent="text-purple-600 dark:text-purple-400"
              iconAccent="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
              notStartedUrl={itemsUrl({ type: "FEATURE", status: "BACKLOG" })}
              inProgressUrl={itemsUrl({ type: "FEATURE" })}
              doneUrl={itemsUrl({ type: "FEATURE", status: "DONE" })}
            />
            <WorkItemStatCard
              title="User Stories"
              icon={<WorkItemTypeGlyph type="USER_STORY" sizePx={16} className="" />}
              stats={userStoryStats}
              headerAccent="text-green-600 dark:text-green-400"
              iconAccent="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
              notStartedUrl={itemsUrl({ type: "USER_STORY", status: "READY" })}
              inProgressUrl={itemsUrl({ type: "USER_STORY", status: "IN_PROGRESS" })}
              doneUrl={itemsUrl({ type: "USER_STORY", status: "DONE" })}
            />
            <WorkItemStatCard
              title="Tasks"
              icon={<WorkItemTypeGlyph type="TASK" sizePx={16} className="" />}
              stats={taskStats}
              headerAccent="text-amber-600 dark:text-amber-400"
              iconAccent="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
              notStartedUrl={itemsUrl({ type: "TASK", status: "NEW" })}
              inProgressUrl={itemsUrl({ type: "TASK", status: "ACTIVE" })}
              doneUrl={itemsUrl({ type: "TASK", status: "CLOSED" })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
