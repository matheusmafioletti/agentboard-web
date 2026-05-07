import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const INPUT_CLS =
  "w-full border border-black/[0.08] dark:border-white/[0.08] bg-transparent rounded-card px-3 py-2.5 text-sm text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-accent/40";

const LABEL_CLS =
  "block text-[11px] font-semibold text-[#6E6E73] dark:text-[#8E8E93] uppercase tracking-caps mb-1.5";

/** Registration page that creates a new tenant and user. */
export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await register({ name, email, password, tenantName });
      setApiKey(response.apiKey);
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      setError(
        status === 409 ? "E-mail já cadastrado." : "Falha no cadastro. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  }

  if (apiKey) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#0A0A0F] flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white dark:bg-[#1C1C1E] rounded-modal shadow-modal p-8">
          <h1 className="text-[22px] font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-heading mb-2">
            Conta criada!
          </h1>
          <p className="text-sm text-[#6E6E73] dark:text-[#8E8E93] mb-4">
            Guarde sua API key abaixo — ela não será exibida novamente.
          </p>
          <div className="bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-card px-3 py-2.5 font-mono text-xs break-all select-all text-[#1D1D1F] dark:text-[#F5F5F7] mb-6">
            {apiKey}
          </div>
          <button
            onClick={() => navigate("/inicio")}
            className="w-full h-9 bg-accent hover:brightness-110 text-white font-medium rounded-full text-sm transition-all duration-[120ms]"
          >
            Ir para o início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#0A0A0F] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white dark:bg-[#1C1C1E] rounded-modal shadow-modal p-8">
        <h1 className="text-[22px] font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-heading mb-1 text-center">
          Criar conta
        </h1>
        <p className="text-sm text-[#6E6E73] dark:text-[#8E8E93] text-center mb-7">
          Configure seu time e workspace
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={LABEL_CLS} htmlFor="name">Seu nome</label>
            <input
              id="name"
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={INPUT_CLS}
            />
          </div>
          <div>
            <label className={LABEL_CLS} htmlFor="tenantName">Time / empresa</label>
            <input
              id="tenantName"
              type="text"
              required
              value={tenantName}
              onChange={(e) => setTenantName(e.target.value)}
              className={INPUT_CLS}
            />
          </div>
          <div>
            <label className={LABEL_CLS} htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={INPUT_CLS}
            />
          </div>
          <div>
            <label className={LABEL_CLS} htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={INPUT_CLS}
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
            {loading ? "Criando conta…" : "Criar conta"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-[#6E6E73] dark:text-[#8E8E93]">
          Já tem uma conta?{" "}
          <Link to="/login" className="text-accent font-medium hover:opacity-90 transition-all">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
