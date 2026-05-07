const AUTH_BASE_URL =
  (import.meta as { env?: { VITE_AUTH_SERVICE_URL?: string } }).env
    ?.VITE_AUTH_SERVICE_URL ?? "http://localhost:8080";

function getToken(): string {
  return localStorage.getItem("agentboard_token") ?? "";
}

async function publicFetch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${AUTH_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      message?: string;
    };
    throw Object.assign(new Error(data.message ?? res.statusText), {
      status: res.status,
      code: data.error,
    });
  }
  return res.json() as Promise<T>;
}

async function authFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${AUTH_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      message?: string;
    };
    throw Object.assign(new Error(data.message ?? res.statusText), {
      status: res.status,
      code: data.error,
    });
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  tenantName: string;
}

export interface RegisterResponse {
  userId: string;
  tenantId: string;
  token: string;
  apiKey: string;
  board: { id: string; name: string };
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  userId: string;
  tenantId: string;
  email: string;
}

export interface ChangePasswordPayload {
  userId: string;
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export function login(payload: LoginPayload): Promise<LoginResponse> {
  return publicFetch<LoginResponse>("/auth/login", payload);
}

export function register(payload: RegisterPayload): Promise<RegisterResponse> {
  return publicFetch<RegisterResponse>("/auth/register", payload);
}

export function changePassword(payload: ChangePasswordPayload): Promise<void> {
  return authFetch<void>("/auth/change-password", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
