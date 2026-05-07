import { useState } from "react";
import { boardApi } from "../../services/boardApi";

interface CreateProjectModalProps {
  onClose: () => void;
  onCreated: () => void;
}

/**
 * Modal for creating a new project.
 * Shows the generated API key after successful creation.
 */
export default function CreateProjectModal({ onClose, onCreated }: CreateProjectModalProps) {
  const [name, setName] = useState("");
  const [constitution, setConstitution] = useState("");
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const project = await boardApi.createProject({
        name,
        constitutionContent: constitution || undefined,
      });
      setApiKey(project.apiKey);
      onCreated();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-[#1C1C1E] rounded-modal shadow-modal w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-7 py-5 border-b border-black/[0.06] dark:border-white/[0.06]">
          <h2 className="text-base font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">Novo Projeto</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-[#6E6E73] dark:text-[#8E8E93] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors duration-150 text-lg leading-none"
          >
            ×
          </button>
        </div>
        {apiKey ? (
          <div className="px-7 py-6">
            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mb-3">
              Projeto criado! Salve sua API key — ela não será exibida novamente.
            </p>
            <div className="bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-card px-3 py-2.5 font-mono text-xs break-all select-all text-[#1D1D1F] dark:text-[#F5F5F7]">
              {apiKey}
            </div>
            <button
              onClick={onClose}
              className="mt-5 w-full h-9 bg-accent text-white rounded-full text-sm font-medium hover:brightness-110 transition-all duration-[120ms]"
            >
              Concluído
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-7 py-6 space-y-4">
            {error && (
              <p className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-chip">{error}</p>
            )}
            <div>
              <label className="block text-[11px] font-semibold text-[#6E6E73] dark:text-[#8E8E93] uppercase tracking-caps mb-1.5">
                Nome do projeto <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={255}
                className="w-full border border-black/[0.08] dark:border-white/[0.08] bg-transparent rounded-card px-3 py-2.5 text-sm text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#6E6E73] dark:text-[#8E8E93] uppercase tracking-caps mb-1.5">
                Constituição <span className="text-[#6E6E73] dark:text-[#8E8E93] normal-case font-normal">(opcional)</span>
              </label>
              <textarea
                value={constitution}
                onChange={(e) => setConstitution(e.target.value)}
                rows={4}
                placeholder="Cole a constituição do projeto aqui, ou deixe em branco para usar o template padrão…"
                className="w-full border border-black/[0.08] dark:border-white/[0.08] bg-transparent rounded-card px-3 py-2.5 text-sm font-mono text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none placeholder:text-[#6E6E73]/50"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="h-9 px-5 rounded-full border border-accent/40 text-accent text-sm font-medium hover:bg-accent/[0.06] transition-all duration-[120ms]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="h-9 px-5 rounded-full bg-accent hover:brightness-110 disabled:opacity-50 text-white text-sm font-medium transition-all duration-[120ms]"
              >
                {loading ? "Criando…" : "Criar projeto"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
