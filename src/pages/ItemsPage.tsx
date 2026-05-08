import ItemsListView from "../components/items/ItemsListView";
import ProjectSelector from "../components/layout/ProjectSelector";
import { useProjectStore } from "../hooks/useProjectStore";

/** Page displaying all work items for the active project with filtering. */
export default function ItemsPage() {
  const { activeProject } = useProjectStore();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-[#0A0A0F] shrink-0">
        <span className="text-[11px] font-semibold text-[#6E6E73] dark:text-[#8E8E93] uppercase tracking-caps">
          Projeto
        </span>
        <ProjectSelector />
      </div>
      <main className="animate-page-enter flex-1 min-h-0 overflow-hidden flex flex-col px-6 py-5 gap-5">
        <h1 className="text-[28px] font-semibold tracking-heading text-[#1D1D1F] dark:text-[#F5F5F7] shrink-0">
          Itens
        </h1>
        {activeProject ? (
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            <ItemsListView projectId={activeProject.id} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-48 text-[#6E6E73] dark:text-[#8E8E93] text-sm">
            Selecione um projeto para ver os itens.
          </div>
        )}
      </main>
    </div>
  );
}
