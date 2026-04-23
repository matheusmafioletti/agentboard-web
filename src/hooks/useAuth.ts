import { useState, useCallback } from "react";
import {
  login as apiLogin,
  register as apiRegister,
  type LoginPayload,
  type RegisterPayload,
} from "../api/auth";

interface AuthUser {
  userId: string;
  tenantId: string;
  token: string;
}

const TOKEN_KEY = "agentboard_token";
const USER_KEY = "agentboard_user";

function loadStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

/** Provides authentication state and actions backed by localStorage. */
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(loadStoredUser);

  const persistUser = useCallback((u: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, u.token);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setUser(u);
  }, []);

  const login = useCallback(
    async (payload: LoginPayload) => {
      const response = await apiLogin(payload);
      persistUser({
        userId: response.userId,
        tenantId: response.tenantId,
        token: response.token,
      });
      return response;
    },
    [persistUser]
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const response = await apiRegister(payload);
      persistUser({
        userId: response.userId,
        tenantId: response.tenantId,
        token: response.token,
      });
      return response;
    },
    [persistUser]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  return { user, login, register, logout };
}
