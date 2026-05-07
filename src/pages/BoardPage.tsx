import ProjectSelector from "../components/layout/ProjectSelector";
import WorkItemBoard from "../components/board/WorkItemBoard";
import { useProjectStore } from "../hooks/useProjectStore";

/** Page for the unified work item board with type selector. */
export default function BoardPage() {
  const { activeProject } = useProjectStore();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-[#0A0A0F] shrink-0">
        <span className="text-[11px] font-semibold text-[#6E6E73] dark:text-[#8E8E93] uppercase tracking-caps">
          Projeto
        </span>
        <ProjectSelector />
      </div>
      <main className="animate-page-enter flex-1 overflow-hidden">
        {activeProject ? (
          <WorkItemBoard projectId={activeProject.id} />
        ) : (
          <div className="flex items-center justify-center h-full text-[#6E6E73] dark:text-[#8E8E93] text-sm">
            Selecione um projeto para ver o board.
          </div>
        )}
      </main>
    </div>
  );
}
