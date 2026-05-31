import { FormEvent, useState } from "react";
import { createPortal } from "react-dom";

interface CreateInviteModalProps {
  onClose: () => void;
  onSubmit: (email: string) => Promise<string>;
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

/** Modal for admins to generate a shareable invite link. */
export default function CreateInviteModal({ onClose, onSubmit }: CreateInviteModalProps) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [email, setEmail] = useState("");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const url = await onSubmit(email.trim());
      setInviteUrl(url);
      setStep("success");
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      setError(status === 409 ? "Convite pendente ou membro já existe." : "Falha ao gerar link.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return createPortal(
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#1C1C1E] rounded-modal shadow-modal p-7 w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {step === "form" ? (
          <>
            <h2 className="text-[22px] font-semibold tracking-heading text-[#1D1D1F] dark:text-[#F5F5F7] mb-1">
              Novo convite
            </h2>
            <p className="text-sm text-[#6E6E73] dark:text-[#8E8E93] mb-5">
              Informe o e-mail do convidado para gerar um link de aceite.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="inviteEmail"
                  className="block text-[11px] font-semibold text-[#6E6E73] dark:text-[#8E8E93] uppercase tracking-caps mb-1.5"
                >
                  E-mail
                </label>
                <input
                  id="inviteEmail"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemplo.com"
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
                  {loading ? "Gerando…" : "Gerar link"}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <h2 className="text-[22px] font-semibold tracking-heading text-[#1D1D1F] dark:text-[#F5F5F7] mb-1">
              Link gerado
            </h2>
            <p className="text-sm text-[#6E6E73] dark:text-[#8E8E93] mb-4">
              Compartilhe o link abaixo com o convidado. Ele expira em 7 dias.
            </p>
            <div className="flex items-start gap-2 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-card px-4 py-3 mb-5">
              <p className="text-xs break-all text-[#1D1D1F] dark:text-[#F5F5F7] flex-1 min-w-0">
                {inviteUrl}
              </p>
              <button
                type="button"
                onClick={handleCopy}
                aria-label={copied ? "Link copiado" : "Copiar link"}
                title={copied ? "Copiado!" : "Copiar link"}
                className="shrink-0 p-1.5 rounded-chip text-[#6E6E73] dark:text-[#8E8E93] hover:text-accent hover:bg-accent/[0.06] transition-all duration-[120ms]"
              >
                <CopyIcon />
              </button>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="bg-accent text-white rounded-full h-9 px-5 text-sm font-medium hover:brightness-110 transition-all duration-[120ms]"
              >
                Fechar
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
