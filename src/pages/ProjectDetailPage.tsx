import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import useSWR from "swr";
import { boardApi, type Project } from "../services/boardApi";
import MarkdownField from "../components/shared/MarkdownField";
import MaterialIcon from "../components/shared/MaterialIcon";

/** Project detail and edit page — reached from /projetos/:id. */
export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: project, mutate } = useSWR<Project>(
    id ? `project-${id}` : null,
    () => boardApi.getProject(id!)
  );
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [constitution, setConstitution] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEdit() {
    setName(project?.name ?? "");
    setConstitution(project?.constitutionContent ?? "");
    setEditing(true);
    setSuccess(false);
    setError(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    setError(null);
    try {
      await boardApi.updateProject(id, { name, constitutionContent: constitution });
      await mutate();
      setEditing(false);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  if (!project) {
    return (
      <div className="p-8">
        <p className="text-[#6E6E73] dark:text-[#8E8E93] text-sm">Carregando projeto...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-5">
        <Link
          to="/projetos"
          className="text-sm font-medium text-accent hover:text-accent-600 transition-colors duration-150"
        >
          ← Projetos
        </Link>
      </div>

      {success && (
        <p className="mb-4 text-sm text-emerald-600 dark:text-emerald-400 font-medium">Salvo com sucesso!</p>
      )}

      {!editing ? (
        <div>
          <div className="flex items-start justify-between mb-5">
            <h1 className="text-[28px] font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-heading">{project.name}</h1>
            <button
              onClick={startEdit}
              aria-label="Editar"
              className="h-9 w-9 inline-flex items-center justify-center rounded-full border border-accent/40 text-accent hover:bg-accent/[0.06] transition-all duration-[120ms]"
            >
              <MaterialIcon name="edit" />
            </button>
          </div>
          <div className="bg-[#F2F2F7] dark:bg-[#1C1C1E] rounded-card p-5">
            <MarkdownField variant="preview-only" value={project.constitutionContent ?? ""} />
          </div>
          <div className="mt-4 text-xs text-[#6E6E73] dark:text-[#8E8E93]">
            <span>ID: {project.id}</span>
            <span className="mx-2">·</span>
            <span>Criado: {new Date(project.createdAt).toLocaleDateString("pt-BR")}</span>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-4">
          <h1 className="text-[28px] font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-heading">Editar Projeto</h1>
          <div>
            <label htmlFor="edit-name" className="block text-[11px] font-semibold text-[#6E6E73] dark:text-[#8E8E93] uppercase tracking-caps mb-1.5">
              Nome
            </label>
            <input
              id="edit-name"
              type="text"
              value={name}
              maxLength={200}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-black/[0.08] dark:border-white/[0.08] bg-transparent rounded-card px-3 py-2.5 text-sm text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </div>
          <label
            htmlFor="edit-constitution-md"
            id="edit-constitution-label"
            className="block text-[11px] font-semibold text-[#6E6E73] dark:text-[#8E8E93] uppercase tracking-caps mb-1.5"
          >
            Constituição
          </label>
          <MarkdownField
            variant="split"
            labelledBy="edit-constitution-label"
            inputId="edit-constitution-md"
            showFullscreenToggle
            value={constitution}
            onChange={setConstitution}
          />
          {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="h-9 px-5 rounded-full border border-accent/40 text-accent text-sm font-medium hover:bg-accent/[0.06] transition-all duration-[120ms]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              aria-label="Salvar"
              className="h-9 px-5 rounded-full bg-accent hover:brightness-110 disabled:opacity-50 text-white text-sm font-medium transition-all duration-[120ms]"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
