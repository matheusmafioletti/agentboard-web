import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import InviteStepIndicator from "../components/auth/InviteStepIndicator";
import {
  acceptInvite,
  getInvitePreview,
  identifyInvite,
  verifyInviteCredentials,
  type InvitePreviewResponse,
} from "../services/authApi";
import { useAuth } from "../hooks/useAuth";

const INPUT_CLS =
  "w-full border border-black/[0.08] dark:border-white/[0.08] bg-transparent rounded-card px-3 py-2.5 text-sm text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-accent/40";
const READONLY_CLS =
  "w-full border border-black/[0.08] dark:border-white/[0.08] bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-card px-3 py-2.5 text-sm text-[#6E6E73] dark:text-[#8E8E93]";
const LABEL_CLS =
  "block text-[11px] font-semibold text-[#6E6E73] dark:text-[#8E8E93] uppercase tracking-caps mb-1.5";

/** Public page to preview and accept a workspace invitation in steps. */
export default function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { applySession } = useAuth();
  const [preview, setPreview] = useState<InvitePreviewResponse | null>(null);
  const [step, setStep] = useState(1);
  const [accountExists, setAccountExists] = useState<boolean | null>(null);
  const [tenantName, setTenantName] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileName, setProfileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    getInvitePreview(token)
      .then((p) => {
        setPreview(p);
        setEmail(p.email);
        setTenantName(p.tenantName);
      })
      .catch(() => setError("Convite inválido ou expirado."));
  }, [token]);

  const totalSteps = 3;

  function mapError(err: unknown): string {
    const status = (err as { status?: number })?.status;
    if (status === 403) return "E-mail não corresponde ao convite.";
    if (status === 401) return "Senha incorreta.";
    if (status === 410) return "Convite expirado ou cancelado.";
    if (status === 409) return "Você já é membro deste workspace.";
    return "Não foi possível continuar.";
  }

  async function handleStep1(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setLoading(true);
    try {
      const result = await identifyInvite(token, email.trim());
      setTenantName(result.tenantName);
      setAccountExists(result.accountExists);
      setStep(2);
    } catch (err: unknown) {
      setError(mapError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleStep2New(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    setStep(3);
  }

  async function handleStep2Existing(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setLoading(true);
    try {
      const profile = await verifyInviteCredentials(token, email.trim(), password);
      setProfileName(profile.name);
      setStep(3);
    } catch (err: unknown) {
      setError(mapError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setLoading(true);
    try {
      const session = await acceptInvite(
        token,
        accountExists
          ? { email: email.trim(), password }
          : { name: name.trim(), password }
      );
      applySession(session);
      navigate("/inicio");
    } catch (err: unknown) {
      setError(mapError(err));
    } finally {
      setLoading(false);
    }
  }

  if (!preview && !error) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#0A0A0F] flex items-center justify-center">
        <p className="text-sm text-[#6E6E73] dark:text-[#8E8E93]">Carregando convite…</p>
      </div>
    );
  }

  if (error && !preview) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#0A0A0F] flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white dark:bg-[#1C1C1E] rounded-modal shadow-modal p-8 text-center">
          <p className="text-sm text-red-500 dark:text-red-400 mb-4">{error}</p>
          <Link to="/login" className="text-accent font-medium text-sm">
            Ir para login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#0A0A0F] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white dark:bg-[#1C1C1E] rounded-modal shadow-modal p-8">
        <h1 className="text-[22px] font-semibold tracking-heading text-[#1D1D1F] dark:text-[#F5F5F7] mb-1 text-center">
          Convite
        </h1>
        <p className="text-sm text-[#6E6E73] dark:text-[#8E8E93] text-center mb-6">
          Você foi convidado para{" "}
          <span className="font-medium text-accent">{tenantName}</span>
        </p>

        <InviteStepIndicator currentStep={step} totalSteps={totalSteps} />

        {step === 1 && (
          <form onSubmit={handleStep1} className="space-y-4">
            <div>
              <label htmlFor="email" className={LABEL_CLS}>
                E-mail
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={INPUT_CLS}
              />
            </div>
            {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-9 bg-accent hover:brightness-110 disabled:opacity-50 text-white font-medium rounded-full text-sm transition-all duration-[120ms]"
            >
              {loading ? "Verificando…" : "Continuar"}
            </button>
          </form>
        )}

        {step === 2 && accountExists === false && (
          <form onSubmit={handleStep2New} className="space-y-4">
            <div>
              <label htmlFor="name" className={LABEL_CLS}>
                Nome
              </label>
              <input
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label htmlFor="password" className={LABEL_CLS}>
                Senha
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className={LABEL_CLS}>
                Confirmar senha
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={INPUT_CLS}
              />
            </div>
            {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 border border-accent/40 text-accent rounded-full h-9 px-5 text-sm font-medium hover:bg-accent/[0.06] transition-all duration-[120ms]"
              >
                Voltar
              </button>
              <button
                type="submit"
                className="flex-1 h-9 bg-accent hover:brightness-110 text-white font-medium rounded-full text-sm transition-all duration-[120ms]"
              >
                Continuar
              </button>
            </div>
          </form>
        )}

        {step === 2 && accountExists === true && (
          <form onSubmit={handleStep2Existing} className="space-y-4">
            <div>
              <label htmlFor="existingEmail" className={LABEL_CLS}>
                E-mail
              </label>
              <input
                id="existingEmail"
                type="email"
                readOnly
                value={email}
                className={READONLY_CLS}
              />
            </div>
            <div>
              <label htmlFor="existingPassword" className={LABEL_CLS}>
                Senha
              </label>
              <input
                id="existingPassword"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={INPUT_CLS}
              />
            </div>
            {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 border border-accent/40 text-accent rounded-full h-9 px-5 text-sm font-medium hover:bg-accent/[0.06] transition-all duration-[120ms]"
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 h-9 bg-accent hover:brightness-110 disabled:opacity-50 text-white font-medium rounded-full text-sm transition-all duration-[120ms]"
              >
                {loading ? "Verificando…" : "Continuar"}
              </button>
            </div>
          </form>
        )}

        {step === 3 && accountExists === false && (
          <form onSubmit={handleAccept} className="space-y-4">
            <div>
              <label htmlFor="confirmName" className={LABEL_CLS}>
                Nome
              </label>
              <input
                id="confirmName"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label htmlFor="confirmEmail" className={LABEL_CLS}>
                E-mail
              </label>
              <input
                id="confirmEmail"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Workspace</label>
              <input readOnly value={tenantName} className={READONLY_CLS} />
            </div>
            {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-9 bg-accent hover:brightness-110 disabled:opacity-50 text-white font-medium rounded-full text-sm transition-all duration-[120ms]"
              >
                {loading ? "Confirmando…" : "Confirmar"}
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full border border-accent/40 text-accent rounded-full h-9 px-5 text-sm font-medium hover:bg-accent/[0.06] transition-all duration-[120ms]"
              >
                Voltar
              </button>
            </div>
          </form>
        )}

        {step === 3 && accountExists === true && (
          <form onSubmit={handleAccept} className="space-y-4">
            <div>
              <label className={LABEL_CLS}>Nome</label>
              <input readOnly value={profileName} className={READONLY_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>E-mail</label>
              <input readOnly value={email} className={READONLY_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>Workspace</label>
              <input readOnly value={tenantName} className={READONLY_CLS} />
            </div>
            {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-9 bg-accent hover:brightness-110 disabled:opacity-50 text-white font-medium rounded-full text-sm transition-all duration-[120ms]"
              >
                {loading ? "Confirmando…" : "Confirmar"}
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full border border-accent/40 text-accent rounded-full h-9 px-5 text-sm font-medium hover:bg-accent/[0.06] transition-all duration-[120ms]"
              >
                Voltar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
