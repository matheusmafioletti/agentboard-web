import { useState, useCallback } from "react";
import { clearActiveProject } from "./useProjectStore";
import {
  login as apiLogin,
  register as apiRegister,
  selectTenant as apiSelectTenant,
  createTenant as apiCreateTenant,
  switchTenant as apiSwitchTenant,
  isTenantSelection,
  type LoginPayload,
  type RegisterPayload,
  type SelectTenantPayload,
  type SessionResponse,
  type MembershipRole,
  type CreateTenantPayload,
  type CreateTenantResponse,
} from "../services/authApi";

export interface AuthUser {
  userId: string;
  tenantId: string;
  token: string;
  email: string;
  name: string;
  tenantName: string;
  role: MembershipRole;
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

function sessionToUser(session: SessionResponse): AuthUser {
  return {
    userId: session.userId,
    tenantId: session.tenantId,
    token: session.token,
    email: session.email,
    name: session.name,
    tenantName: session.tenantName,
    role: session.role,
  };
}

/** Provides authentication state and actions backed by localStorage. */
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(loadStoredUser);

  const persistUser = useCallback((u: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, u.token);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setUser(u);
  }, []);

  const applySession = useCallback(
    (session: SessionResponse) => {
      clearActiveProject();
      persistUser(sessionToUser(session));
      return session;
    },
    [persistUser]
  );

  const login = useCallback(
    async (payload: LoginPayload) => {
      const response = await apiLogin(payload);
      if (isTenantSelection(response)) {
        return response;
      }
      applySession(response);
      return response;
    },
    [applySession]
  );

  const selectTenant = useCallback(
    async (payload: SelectTenantPayload) => {
      const session = await apiSelectTenant(payload);
      applySession(session);
      return session;
    },
    [applySession]
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const response = await apiRegister(payload);
      clearActiveProject();
      persistUser({
        userId: response.userId,
        tenantId: response.tenantId,
        token: response.token,
        email: payload.email,
        name: payload.name,
        tenantName: response.tenantName,
        role: response.role,
      });
      return response;
    },
    [persistUser]
  );

  const createTenant = useCallback(
    async (payload: CreateTenantPayload): Promise<CreateTenantResponse> => {
      const response = await apiCreateTenant(payload);
      applySession(response.session);
      return response;
    },
    [applySession]
  );

  const switchTenant = useCallback(
    async (tenantId: string) => {
      const session = await apiSwitchTenant({ tenantId });
      applySession(session);
      return session;
    },
    [applySession]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    clearActiveProject();
    setUser(null);
  }, []);

  return {
    user,
    login,
    selectTenant,
    register,
    createTenant,
    switchTenant,
    logout,
    applySession,
  };
}
