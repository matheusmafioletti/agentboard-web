import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import TenantPicker from "../components/auth/TenantPicker";
import { isTenantSelection, type TenantSelectionResponse } from "../services/authApi";

/** Login page with optional workspace selection step. */
export default function LoginPage() {
  const { login, selectTenant } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selection, setSelection] = useState<TenantSelectionResponse | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

  async function handleCredentials(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await login({ email, password });
      if (isTenantSelection(result)) {
        setSelection(result);
        setSelectedTenantId(result.memberships[0]?.tenantId ?? null);
      } else {
        navigate("/inicio");
      }
    } catch {
      setError("E-mail ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectWorkspace(e: FormEvent) {
    e.preventDefault();
    if (!selectedTenantId) return;
    setError(null);
    setLoading(true);
    try {
      await selectTenant({ email, password, tenantId: selectedTenantId });
      navigate("/inicio");
    } catch {
      setError("Não foi possível entrar no workspace selecionado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#0A0A0F] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white dark:bg-[#1C1C1E] rounded-modal shadow-modal p-8">
        <h1 className="text-[22px] font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-heading mb-1 text-center">
          AgentBoard
        </h1>
        <p className="text-sm text-[#6E6E73] dark:text-[#8E8E93] text-center mb-7">
          {selection ? "Selecione o workspace" : "Entre com sua conta"}
        </p>

        {!selection ? (
          <form onSubmit={handleCredentials} className="space-y-4">
            <div>
              <label
                className="block text-[11px] font-semibold text-[#6E6E73] dark:text-[#8E8E93] uppercase tracking-caps mb-1.5"
                htmlFor="email"
              >
                E-mail
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-black/[0.08] dark:border-white/[0.08] bg-transparent rounded-card px-3 py-2.5 text-sm text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>
            <div>
              <label
                className="block text-[11px] font-semibold text-[#6E6E73] dark:text-[#8E8E93] uppercase tracking-caps mb-1.5"
                htmlFor="password"
              >
                Senha
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-black/[0.08] dark:border-white/[0.08] bg-transparent rounded-card px-3 py-2.5 text-sm text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-chip">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-9 bg-accent hover:brightness-110 disabled:opacity-50 text-white font-medium rounded-full text-sm transition-all duration-[120ms]"
            >
              {loading ? "Entrando…" : "Entrar"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSelectWorkspace} className="space-y-4">
            <TenantPicker
              memberships={selection.memberships}
              selectedId={selectedTenantId}
              onSelect={setSelectedTenantId}
            />
            {error && (
              <p className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-chip">
                {error}
              </p>
            )}
            <button
              type="button"
              onClick={() => setSelection(null)}
              className="w-full border border-accent/40 text-accent rounded-full h-9 text-sm font-medium hover:bg-accent/[0.06] transition-all duration-[120ms]"
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={loading || !selectedTenantId}
              className="w-full h-9 bg-accent hover:brightness-110 disabled:opacity-50 text-white font-medium rounded-full text-sm transition-all duration-[120ms]"
            >
              {loading ? "Entrando…" : "Continuar"}
            </button>
          </form>
        )}

        <p className="mt-5 text-center text-sm text-[#6E6E73] dark:text-[#8E8E93]">
          Não tem conta?{" "}
          <Link to="/register" className="text-accent font-medium hover:opacity-90 transition-all">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}
