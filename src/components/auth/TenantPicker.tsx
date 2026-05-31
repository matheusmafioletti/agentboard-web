import type { TenantMembershipSummary } from "../../services/authApi";

interface TenantPickerProps {
  memberships: TenantMembershipSummary[];
  selectedId: string | null;
  onSelect: (tenantId: string) => void;
}

/** Lists available workspaces for the user to choose after login. */
export default function TenantPicker({
  memberships,
  selectedId,
  onSelect,
}: TenantPickerProps) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-caps text-[#6E6E73] dark:text-[#8E8E93] mb-3">
        Escolha o workspace
      </p>
      {memberships.map((m) => {
        const active = selectedId === m.tenantId;
        return (
          <button
            key={m.tenantId}
            type="button"
            onClick={() => onSelect(m.tenantId)}
            className={[
              "w-full text-left rounded-card px-4 py-3 border transition-all duration-[120ms]",
              active
                ? "border-accent bg-accent/10"
                : "border-black/[0.08] dark:border-white/[0.08] hover:bg-black/[0.03] dark:hover:bg-white/[0.04]",
            ].join(" ")}
          >
            <p className="text-sm font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">
              {m.tenantName}
            </p>
            <p className="text-[11px] text-[#6E6E73] dark:text-[#8E8E93] mt-0.5">
              {m.role === "ADMIN" ? "Administrador" : "Usuário"}
            </p>
          </button>
        );
      })}
    </div>
  );
}
