import { FormEvent, useState } from "react";
import { createPortal } from "react-dom";

interface CreateWorkspaceModalProps {
  onClose: () => void;
  onSubmit: (tenantName: string) => Promise<{ apiKey: string }>;
}

/** Modal for authenticated users to create an additional workspace. */
export default function CreateWorkspaceModal({
  onClose,
  onSubmit,
}: CreateWorkspaceModalProps) {
  const [tenantName, setTenantName] = useState("");
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await onSubmit(tenantName.trim());
      setApiKey(result.apiKey);
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      setError(
        status === 409
          ? "Nome de workspace já está em uso."
          : "Não foi possível criar o workspace."
      );
    } finally {
      setLoading(false);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60]"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#1C1C1E] rounded-modal shadow-modal p-7 w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-[22px] font-semibold tracking-heading text-[#1D1D1F] dark:text-[#F5F5F7] mb-1">
          Criar workspace
        </h2>
        <p className="text-sm text-[#6E6E73] dark:text-[#8E8E93] mb-5">
          Você será administrador do novo workspace.
        </p>

        {apiKey ? (
          <>
            <p className="text-sm text-[#6E6E73] dark:text-[#8E8E93] mb-3">
              Workspace criado. Guarde a API key — ela não será exibida novamente.
            </p>
            <div className="bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-card px-3 py-2.5 font-mono text-xs break-all select-all text-[#1D1D1F] dark:text-[#F5F5F7] mb-5">
              {apiKey}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full h-9 bg-accent text-white rounded-full text-sm font-medium hover:brightness-110 transition-all duration-[120ms]"
            >
              Concluir
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="tenantName"
                className="block text-[11px] font-semibold text-[#6E6E73] dark:text-[#8E8E93] uppercase tracking-caps mb-1.5"
              >
                Nome do workspace
              </label>
              <input
                id="tenantName"
                required
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                className="w-full border border-black/[0.08] dark:border-white/[0.08] bg-transparent rounded-card px-3 py-2.5 text-sm text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>
            {error && (
              <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
            )}
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="border border-accent/40 text-accent rounded-full h-9 px-5 text-sm font-medium hover:bg-accent/[0.06] transition-all duration-[120ms]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-accent text-white rounded-full h-9 px-5 text-sm font-medium hover:brightness-110 transition-all duration-[120ms] disabled:opacity-50"
              >
                {loading ? "Criando…" : "Criar"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
