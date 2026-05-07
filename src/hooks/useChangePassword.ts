import { useState, useCallback } from "react";
import { changePassword } from "../services/authApi";
import { useAuth } from "./useAuth";

interface ChangePasswordState {
  loading: boolean;
  error: string | null;
  success: boolean;
}

/** Wraps the change-password API call with loading/error/success state. */
export function useChangePassword() {
  const { user } = useAuth();
  const [state, setState] = useState<ChangePasswordState>({
    loading: false,
    error: null,
    success: false,
  });

  const submit = useCallback(
    async (currentPassword: string, newPassword: string, confirmNewPassword: string) => {
      if (!user) return;
      setState({ loading: true, error: null, success: false });
      try {
        await changePassword({
          userId: user.userId,
          currentPassword,
          newPassword,
          confirmNewPassword,
        });
        setState({ loading: false, error: null, success: true });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao trocar senha";
        setState({ loading: false, error: message, success: false });
      }
    },
    [user]
  );

  const reset = useCallback(() => {
    setState({ loading: false, error: null, success: false });
  }, []);

  return { ...state, submit, reset };
}
