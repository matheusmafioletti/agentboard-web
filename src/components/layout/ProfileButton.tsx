import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useDarkMode } from "../../hooks/useDarkMode";
import ChangePasswordModal from "../auth/ChangePasswordModal";

interface ProfileButtonProps {
  expanded: boolean;
}

function deriveInitials(email: string | undefined): string {
  if (!email) return "?";
  const local = email.split("@")[0] ?? "";
  return local.charAt(0).toUpperCase() || "?";
}

function deriveDisplayName(email: string | undefined): string {
  if (!email) return "Usuário";
  const local = email.split("@")[0] ?? "";
  return local
    .replace(/[._-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 opacity-40">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

/** Profile button pinned to sidebar bottom with user info, dark mode toggle, logout, and change-password. */
export default function ProfileButton({ expanded }: ProfileButtonProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { isDark, toggle: toggleDark } = useDarkMode();
  const [open, setOpen] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const initials = user ? deriveInitials(user.email) : "?";
  const displayName = user ? deriveDisplayName(user.email) : "Usuário";

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        aria-label="Perfil"
        onClick={() => setOpen((p) => !p)}
        className={[
          "flex items-center gap-2.5 w-full rounded-chip px-2 py-2 text-sm",
          "text-[#1D1D1F] dark:text-[#F5F5F7]",
          "hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors duration-150",
        ].join(" ")}
      >
        <span className="shrink-0 w-8 h-8 rounded-full bg-[#1D1D1F] dark:bg-[#3A3A3C] text-white flex items-center justify-center">
          {expanded ? (
            <span className="text-xs font-semibold leading-none">{initials}</span>
          ) : (
            <PersonIcon />
          )}
        </span>
        {expanded && user && (
          <>
            <div className="flex flex-col items-start min-w-0 flex-1">
              <span className="truncate text-[13px] font-medium text-[#1D1D1F] dark:text-[#F5F5F7] leading-tight">
                {displayName}
              </span>
              <span className="truncate text-[11px] text-[#6E6E73] dark:text-[#8E8E93] leading-tight">
                {user.email}
              </span>
            </div>
            <ChevronRightIcon />
          </>
        )}
      </button>

      {open && (
        <div className="absolute bottom-full left-0 z-[200] mb-2 w-60 bg-white dark:bg-[#1C1C1E] border border-black/[0.08] dark:border-white/[0.08] rounded-card shadow-modal py-1.5">
          {user && (
            <div className="px-4 py-2.5 border-b border-black/[0.06] dark:border-white/[0.06]">
              <p className="text-[13px] font-medium text-[#1D1D1F] dark:text-[#F5F5F7] truncate">{displayName}</p>
              <p className="text-[11px] text-[#6E6E73] dark:text-[#8E8E93] truncate mt-0.5">{user.email}</p>
            </div>
          )}

          <button
            onClick={() => { toggleDark(); setOpen(false); }}
            className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors duration-150"
          >
            <span>{isDark ? "Modo claro" : "Modo escuro"}</span>
            <span className="text-[#6E6E73] dark:text-[#8E8E93]">
              {isDark ? <SunIcon /> : <MoonIcon />}
            </span>
          </button>

          <div className="border-t border-black/[0.06] dark:border-white/[0.06] my-1" />

          <button
            onClick={() => {
              setOpen(false);
              setShowChangePassword(true);
            }}
            className="w-full text-left px-4 py-2.5 text-sm text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors duration-150"
          >
            Trocar Senha
          </button>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2.5 text-sm text-red-500 dark:text-red-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors duration-150"
          >
            Sair
          </button>
        </div>
      )}

      {showChangePassword &&
        createPortal(
          <ChangePasswordModal onClose={() => setShowChangePassword(false)} />,
          document.body
        )}
    </div>
  );
}
