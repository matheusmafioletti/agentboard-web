import { useState } from "react";
import { Link } from "react-router-dom";
import useSWR from "swr";
import { boardApi, type Project } from "../services/boardApi";
import MarkdownField from "../components/shared/MarkdownField";

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-[#6E6E73] dark:text-[#8E8E93] text-sm mb-4">Nenhum projeto cadastrado</p>
      <button
        onClick={onNew}
        className="h-9 px-5 text-sm font-medium text-white bg-accent rounded-full hover:brightness-110 transition-all duration-[120ms]"
      >
        Novo Projeto
      </button>
    </div>
  );
}

interface CreateFormProps {
  onCancel: () => void;
  onCreated: () => void;
}

function CreateProjectForm({ onCancel, onCreated }: CreateFormProps) {
  const [name, setName] = useState("");
  const [constitution, setConstitution] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNameError(null);
    if (!name.trim()) {
      setNameError("Nome é obrigatório");
      return;
    }
    if (name.length > 200) {
      setNameError("Nome não pode exceder 200 caracteres");
      return;
    }
    setSubmitting(true);
    try {
      await boardApi.createProject({ name: name.trim(), constitutionContent: constitution });
      onCreated();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-[#1C1C1E] rounded-card shadow-card p-6 space-y-4">
      <h2 className="text-base font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">Novo Projeto</h2>
      <div>
        <label htmlFor="project-name" className="block text-[11px] font-semibold text-[#6E6E73] dark:text-[#8E8E93] uppercase tracking-caps mb-1.5">
          Nome <span className="text-red-500">*</span>
        </label>
        <input
          id="project-name"
          type="text"
          value={name}
          maxLength={200}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-black/[0.08] dark:border-white/[0.08] bg-transparent rounded-card px-3 py-2.5 text-sm text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
        <p className="text-xs text-[#6E6E73] dark:text-[#8E8E93] mt-1 text-right">{name.length}/200</p>
        {nameError && <p className="text-xs text-red-500 mt-1">{nameError}</p>}
      </div>
        <label
          htmlFor="project-constitution-md"
          id="project-constitution-label"
          className="block text-[11px] font-semibold text-[#6E6E73] dark:text-[#8E8E93] uppercase tracking-caps mb-1.5"
        >
          Constituição
        </label>
        <MarkdownField
          variant="split"
          labelledBy="project-constitution-label"
          inputId="project-constitution-md"
          showFullscreenToggle
          value={constitution}
          onChange={setConstitution}
          placeholder="# Constituição do projeto"
        />
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="h-9 px-5 rounded-full border border-accent/40 text-accent text-sm font-medium hover:bg-accent/[0.06] transition-all duration-[120ms]"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={submitting}
          aria-label="Criar"
          className="h-9 px-5 rounded-full bg-accent hover:brightness-110 disabled:opacity-50 text-white text-sm font-medium transition-all duration-[120ms]"
        >
          {submitting ? "Criando..." : "Criar"}
        </button>
      </div>
    </form>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const excerpt = project.constitutionContent?.slice(0, 120) ?? "";
  return (
    <Link
      to={`/projetos/${project.id}`}
      className="block bg-white dark:bg-[#1C1C1E] rounded-card shadow-card p-5 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 ease-out"
    >
      <h3 className="text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] mb-1 truncate">{project.name}</h3>
      {excerpt && (
        <p className="text-xs text-[#6E6E73] dark:text-[#8E8E93] line-clamp-3 font-mono">{excerpt}</p>
      )}
    </Link>
  );
}

/** Project registration and management page. */
export default function ProjetosPage() {
  const { data: projects = [], mutate } = useSWR<Project[]>("projects", () =>
    boardApi.listProjects()
  );
  const [showForm, setShowForm] = useState(false);

  async function handleCreated() {
    await mutate();
    setShowForm(false);
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-7">
        <h1 className="text-[28px] font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-heading">Projetos</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="h-9 px-5 text-sm font-medium text-white bg-accent rounded-full hover:brightness-110 transition-all duration-[120ms]"
          >
            Novo Projeto
          </button>
        )}
      </div>

      {showForm && (
        <div className="mb-6">
          <CreateProjectForm onCancel={() => setShowForm(false)} onCreated={handleCreated} />
        </div>
      )}

      {!showForm && projects.length === 0 && (
        <EmptyState onNew={() => setShowForm(true)} />
      )}

      {projects.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}
