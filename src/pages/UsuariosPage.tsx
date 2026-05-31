import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import CreateInviteModal from "../components/auth/CreateInviteModal";
import { useAuth } from "../hooks/useAuth";
import {
  cancelInvite,
  createInvite,
  listInvites,
  listMembers,
  revokeMember,
  type InviteResponse,
  type MemberResponse,
} from "../services/authApi";

/** Admin page for member and invite management. */
export default function UsuariosPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<MemberResponse[]>([]);
  const [invites, setInvites] = useState<InviteResponse[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tenantId = user?.tenantId ?? "";

  const refresh = useCallback(async () => {
    if (!tenantId) return;
    const [memberRes, inviteRes] = await Promise.all([
      listMembers(tenantId),
      listInvites(tenantId),
    ]);
    setMembers(memberRes.members);
    setInvites(inviteRes.invites);
  }, [tenantId]);

  useEffect(() => {
    if (!tenantId) return;
    let cancelled = false;

    void (async () => {
      try {
        await refresh();
      } catch {
        if (!cancelled) setError("Não foi possível carregar usuários.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tenantId, refresh]);

  async function handleCreateInvite(email: string): Promise<string> {
    if (!tenantId) throw new Error("Tenant required");
    const created = await createInvite(tenantId, email);
    await refresh();
    if (!created.inviteUrl) throw new Error("Invite URL missing");
    return created.inviteUrl;
  }

  async function handleRevoke(userId: string) {
    if (!tenantId) return;
    try {
      await revokeMember(tenantId, userId);
      await refresh();
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      setError(status === 409 ? "Não é possível remover o último administrador." : "Falha ao revogar.");
    }
  }

  async function handleCancelInvite(inviteId: string) {
    if (!tenantId) return;
    try {
      await cancelInvite(tenantId, inviteId);
      await refresh();
    } catch {
      setError("Falha ao cancelar convite.");
    }
  }

  const pendingInvites = invites.filter((i) => i.status === "PENDING");

  return (
    <div className="p-8 max-w-3xl mx-auto overflow-y-auto h-full">
      <div className="flex items-center justify-between gap-4 mb-7">
        <h1 className="text-[28px] font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-heading">
          Usuários
        </h1>
        <button
          type="button"
          onClick={() => setShowInviteModal(true)}
          className="bg-accent text-white rounded-full h-9 px-5 text-sm font-medium hover:brightness-110 transition-all duration-[120ms] shrink-0"
        >
          Novo convite
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-500 dark:text-red-400 mb-6">{error}</p>
      )}

      <div className="flex flex-col gap-8">
        <section>
          <p className="text-[11px] font-semibold uppercase tracking-caps text-[#6E6E73] dark:text-[#8E8E93] mb-3">
            Membros ({members.length})
          </p>
          <div className="rounded-card bg-white dark:bg-[#141418] border border-black/[0.08] dark:border-white/[0.08] shadow-card overflow-hidden">
            {members.length === 0 ? (
              <p className="px-5 py-4 text-sm text-[#6E6E73] dark:text-[#8E8E93]">
                Nenhum membro encontrado.
              </p>
            ) : (
              members.map((m) => (
                <div
                  key={m.userId}
                  className="flex items-center justify-between px-5 py-3.5 border-b border-black/[0.06] dark:border-white/[0.06] last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">{m.name}</p>
                    <p className="text-[11px] text-[#6E6E73] dark:text-[#8E8E93]">{m.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-medium text-accent bg-accent/10 px-2.5 py-0.5 rounded-chip">
                      {m.role}
                    </span>
                    {m.userId !== user?.userId && m.role === "USER" && (
                      <button
                        type="button"
                        onClick={() => handleRevoke(m.userId)}
                        className="border border-red-500/30 text-red-500 dark:text-red-400 rounded-full h-8 px-3 text-[11px] font-medium hover:bg-red-500/[0.06] transition-all duration-[120ms]"
                      >
                        Revogar
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section>
          <p className="text-[11px] font-semibold uppercase tracking-caps text-[#6E6E73] dark:text-[#8E8E93] mb-3">
            Convites pendentes ({pendingInvites.length})
          </p>
          <div className="rounded-card bg-white dark:bg-[#141418] border border-black/[0.08] dark:border-white/[0.08] shadow-card overflow-hidden">
            {pendingInvites.length === 0 ? (
              <p className="px-5 py-4 text-sm text-[#6E6E73] dark:text-[#8E8E93]">
                Nenhum convite pendente.
              </p>
            ) : (
              pendingInvites.map((i) => (
                <div
                  key={i.id}
                  className="flex items-center justify-between px-5 py-3.5 border-b border-black/[0.06] dark:border-white/[0.06] last:border-0"
                >
                  <span className="text-sm text-[#1D1D1F] dark:text-[#F5F5F7]">{i.email}</span>
                  <button
                    type="button"
                    onClick={() => handleCancelInvite(i.id)}
                    className="border border-accent/40 text-accent rounded-full h-8 px-3 text-[11px] font-medium hover:bg-accent/[0.06] transition-all duration-[120ms]"
                  >
                    Cancelar
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {showInviteModal &&
        createPortal(
          <CreateInviteModal
            onClose={() => setShowInviteModal(false)}
            onSubmit={handleCreateInvite}
          />,
          document.body
        )}
    </div>
  );
}
