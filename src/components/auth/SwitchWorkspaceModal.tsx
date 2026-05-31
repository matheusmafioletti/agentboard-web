import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../hooks/useAuth";
import { listMyMemberships } from "../../services/authApi";
import CreateWorkspaceModal from "./CreateWorkspaceModal";
import TenantPicker from "./TenantPicker";

interface SwitchWorkspaceModalProps {
  onClose: () => void;
}

/** Modal to switch active workspace or create a new one. */
export default function SwitchWorkspaceModal({ onClose }: SwitchWorkspaceModalProps) {
  const { user, switchTenant, createTenant } = useAuth();
  const [memberships, setMemberships] = useState<Awaited<ReturnType<typeof listMyMemberships>>["memberships"]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void listMyMemberships()
      .then((res) => {
        if (!cancelled) setMemberships(res.memberships);
      })
      .catch(() => {
        if (!cancelled) setError("Não foi possível carregar workspaces.");
      })
      .finally(() => {
        if (!cancelled) setFetching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.tenantId]);

  async function handleSelect(tenantId: string) {
    if (!user || tenantId === user.tenantId) return;
    setLoading(true);
    setError(null);
    try {
      await switchTenant(tenantId);
      onClose();
      window.location.href = "/inicio";
    } catch {
      setError("Não foi possível trocar de workspace.");
      setLoading(false);
    }
  }

  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
        onClick={onClose}
      >
        <div
          className="bg-white dark:bg-[#1C1C1E] rounded-modal shadow-modal p-7 w-full max-w-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-[22px] font-semibold tracking-heading text-[#1D1D1F] dark:text-[#F5F5F7] mb-1">
            Trocar workspace
          </h2>
          <p className="text-sm text-[#6E6E73] dark:text-[#8E8E93] mb-5">
            Workspace atual:{" "}
            <span className="font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">
              {user?.tenantName}
            </span>
          </p>

          {fetching ? (
            <p className="text-sm text-[#6E6E73] dark:text-[#8E8E93] mb-5">Carregando…</p>
          ) : (
            <TenantPicker
              memberships={memberships}
              selectedId={user?.tenantId ?? null}
              onSelect={handleSelect}
            />
          )}

          {error && (
            <p className="text-sm text-red-500 dark:text-red-400 mt-3">{error}</p>
          )}

          <div className="flex gap-3 justify-between mt-6 pt-5 border-t border-black/[0.06] dark:border-white/[0.06]">
            <button
              type="button"
              disabled={loading}
              onClick={() => setShowCreateWorkspace(true)}
              className="border border-accent/40 text-accent rounded-full h-9 px-5 text-sm font-medium hover:bg-accent/[0.06] transition-all duration-[120ms] disabled:opacity-50"
            >
              Criar workspace
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-accent text-white rounded-full h-9 px-5 text-sm font-medium hover:brightness-110 transition-all duration-[120ms]"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>

      {showCreateWorkspace && (
        <CreateWorkspaceModal
          onClose={() => setShowCreateWorkspace(false)}
          onSubmit={async (tenantName) => {
            const res = await createTenant({ tenantName });
            onClose();
            return { apiKey: res.apiKey };
          }}
        />
      )}
    </>,
    document.body
  );
}
