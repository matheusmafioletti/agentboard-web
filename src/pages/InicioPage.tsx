import { Link } from "react-router-dom";
import SummaryCard from "../components/dashboard/SummaryCard";
import {
  useOpenFeaturesCount,
  useOpenUserStoriesCount,
  useProjectsCount,
} from "../services/boardApi";

function FeaturesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function StoriesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 12h6M9 16h4" />
    </svg>
  );
}

function ProjectsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

/** Início dashboard page with summary cards and quick actions. */
export default function InicioPage() {
  const featuresCount = useOpenFeaturesCount();
  const userStoriesCount = useOpenUserStoriesCount();
  const projectsCount = useProjectsCount();

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-[28px] font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-heading mb-7">
        Início
      </h1>

      {/* Summary cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-10">
        <SummaryCard
          label="Features em aberto"
          count={featuresCount}
          emptyText="Nenhuma feature em aberto"
          icon={<FeaturesIcon />}
        />
        <SummaryCard
          label="User Stories em aberto"
          count={userStoriesCount}
          emptyText="Nenhuma user story em aberto"
          icon={<StoriesIcon />}
        />
        <SummaryCard
          label="Projetos ativos"
          count={projectsCount}
          emptyText="Nenhum projeto cadastrado"
          icon={<ProjectsIcon />}
        />
      </section>

      {/* Quick actions */}
      <section>
        <h2 className="text-[11px] font-semibold text-[#6E6E73] dark:text-[#8E8E93] uppercase tracking-caps mb-3">
          Ações rápidas
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/features"
            aria-label="Nova Feature"
            className="inline-flex items-center gap-1.5 h-9 px-5 text-sm font-medium text-white bg-accent rounded-full hover:brightness-110 transition-all duration-[120ms]"
          >
            + Nova Feature
          </Link>
          <Link
            to="/user-stories"
            aria-label="Nova User Story"
            className="inline-flex items-center gap-1.5 h-9 px-5 text-sm font-medium text-accent border border-accent/40 rounded-full hover:bg-accent/[0.06] transition-all duration-[120ms]"
          >
            + Nova User Story
          </Link>
        </div>
      </section>
    </div>
  );
}
