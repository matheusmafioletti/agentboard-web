import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth";

/**
 * Listens for the global `auth:expired` event dispatched by `apiFetch` when a
 * 401 response is received or the local token is detected as expired before a
 * request. Clears auth state and redirects to /login so the user is never left
 * on a protected page with a stale session.
 */
export function useSessionGuard() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    function handleExpired() {
      logout();
      navigate("/login", { replace: true });
    }

    window.addEventListener("auth:expired", handleExpired);
    return () => window.removeEventListener("auth:expired", handleExpired);
  }, [logout, navigate]);
}
