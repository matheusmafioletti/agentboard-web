import { useEffect, useRef, useState } from "react";
import { useChangePassword } from "../../hooks/useChangePassword";

interface ChangePasswordModalProps {
  onClose: () => void;
}

/** Modal dialog for changing the current user's password. */
export default function ChangePasswordModal({ onClose }: ChangePasswordModalProps) {
  const { submit, loading, error, success, reset } = useChangePassword();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        reset();
        onClose();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [success, reset, onClose]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError(null);

    if (!currentPassword) {
      setValidationError("Senha atual é obrigatória");
      return;
    }
    if (!newPassword) {
      setValidationError("Nova senha é obrigatória");
      return;
    }
    if (newPassword !== confirmPassword) {
      setValidationError("Senhas não conferem");
      return;
    }

    submit(currentPassword, newPassword, confirmPassword);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-password-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-[#1C1C1E] rounded-modal shadow-modal w-full max-w-md p-7">
        <h2 id="change-password-title" className="text-xl font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] mb-5">
          Trocar Senha
        </h2>

        {success && (
          <p className="mb-4 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
            Senha alterada com sucesso!
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="current-password" className="block text-[11px] font-semibold text-[#6E6E73] dark:text-[#8E8E93] uppercase tracking-caps mb-1.5">
              Senha atual
            </label>
            <input
              ref={firstInputRef}
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full border border-black/[0.08] dark:border-white/[0.08] bg-transparent rounded-card px-3 py-2.5 text-sm text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </div>

          <div>
            <label htmlFor="new-password" className="block text-[11px] font-semibold text-[#6E6E73] dark:text-[#8E8E93] uppercase tracking-caps mb-1.5">
              Nova senha
            </label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border border-black/[0.08] dark:border-white/[0.08] bg-transparent rounded-card px-3 py-2.5 text-sm text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </div>

          <div>
            <label htmlFor="confirm-new-password" className="block text-[11px] font-semibold text-[#6E6E73] dark:text-[#8E8E93] uppercase tracking-caps mb-1.5">
              Confirmar nova senha
            </label>
            <input
              id="confirm-new-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-black/[0.08] dark:border-white/[0.08] bg-transparent rounded-card px-3 py-2.5 text-sm text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </div>

          {(validationError ?? error) && (
            <p className="text-sm text-red-500 dark:text-red-400">{validationError ?? error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
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
              aria-label="Salvar"
              className="h-9 px-5 rounded-full bg-accent hover:brightness-110 disabled:opacity-50 text-white text-sm font-medium transition-all duration-[120ms]"
            >
              {loading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
