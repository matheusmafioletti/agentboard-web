import { useState } from "react";
import { useProjectStore, Project } from "../../hooks/useProjectStore";
import CreateProjectModal from "./CreateProjectModal";

/** Dropdown selector for the active project. */
export default function ProjectSelector() {
  const { projects, activeProject, setActiveProject, mutate } = useProjectStore();
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  function select(project: Project) {
    setActiveProject(project.id);
    setOpen(false);
  }

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="flex items-center gap-2 h-8 px-3 rounded-chip border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] text-sm font-medium text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors duration-150"
        >
          <span className="max-w-[160px] truncate">
            {activeProject?.name ?? "Selecione um projeto…"}
          </span>
          <svg
            className={`w-3.5 h-3.5 transition-transform shrink-0 text-[#6E6E73] dark:text-[#8E8E93] ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {open && (
          <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-[#1C1C1E] rounded-card shadow-card-hover border border-black/[0.08] dark:border-white/[0.08] z-20">
            <ul className="py-1 max-h-60 overflow-y-auto">
              {projects.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => select(p)}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors duration-150 ${
                      p.id === activeProject?.id
                        ? "bg-accent/10 dark:bg-accent/[0.15] text-accent font-medium"
                        : "text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                    }`}
                  >
                    {p.name}
                  </button>
                </li>
              ))}
              {projects.length === 0 && (
                <li className="px-4 py-2 text-sm text-[#6E6E73] dark:text-[#8E8E93]">
                  Nenhum projeto
                </li>
              )}
            </ul>
            <div className="border-t border-black/[0.06] dark:border-white/[0.06] p-1">
              <button
                onClick={() => { setOpen(false); setShowCreate(true); }}
                className="w-full text-left px-4 py-2 text-sm text-accent hover:bg-accent/[0.06] dark:hover:bg-accent/[0.10] rounded transition-colors duration-150"
              >
                + Novo projeto
              </button>
            </div>
          </div>
        )}
      </div>
      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { mutate(); setShowCreate(false); }}
        />
      )}
    </>
  );
}
