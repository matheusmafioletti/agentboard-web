const AUTH_BASE_URL =
  (import.meta as { env?: { VITE_AUTH_SERVICE_URL?: string } }).env
    ?.VITE_AUTH_SERVICE_URL ?? "http://localhost:8080";

function getToken(): string {
  return localStorage.getItem("agentboard_token") ?? "";
}

async function publicFetch<T>(path: string, body: unknown, method = "POST"): Promise<T> {
  const res = await fetch(`${AUTH_BASE_URL}${path}`, {
    method,
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
  if (res.status === 204) return undefined as T;
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

export type MembershipRole = "ADMIN" | "USER";

export interface TenantMembershipSummary {
  tenantId: string;
  tenantName: string;
  role: MembershipRole;
  joinedAt: string;
}

export interface SessionResponse {
  token: string;
  userId: string;
  tenantId: string;
  tenantName: string;
  email: string;
  name: string;
  role: MembershipRole;
}

export interface TenantSelectionResponse {
  requiresTenantSelection: true;
  userId: string;
  email: string;
  name: string;
  memberships: TenantMembershipSummary[];
}

export type LoginResult = SessionResponse | TenantSelectionResponse;

export function isTenantSelection(
  result: LoginResult
): result is TenantSelectionResponse {
  return "requiresTenantSelection" in result && result.requiresTenantSelection;
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
  tenantName: string;
  token: string;
  role: MembershipRole;
  apiKey: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SelectTenantPayload {
  email: string;
  password: string;
  tenantId: string;
}

export interface CreateTenantPayload {
  tenantName: string;
}

export interface CreateTenantResponse {
  session: SessionResponse;
  apiKey: string;
}

export interface ChangePasswordPayload {
  userId: string;
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface MemberResponse {
  userId: string;
  name: string;
  email: string;
  role: MembershipRole;
  joinedAt: string;
}

export interface InviteResponse {
  id: string;
  email: string;
  status: string;
  createdAt?: string;
  expiresAt: string;
  inviteUrl?: string | null;
}

export interface InvitePreviewResponse {
  tenantName: string;
  email: string;
  status: string;
  expiresAt: string;
  requiresRegistration: boolean;
}

export interface AcceptInvitePayload {
  name?: string;
  password?: string;
  email?: string;
}

export interface IdentifyInviteResponse {
  tenantName: string;
  inviteEmail: string;
  accountExists: boolean;
}

export interface VerifyInviteCredentialsResponse {
  name: string;
  email: string;
}

export interface MembershipListResponse {
  memberships: TenantMembershipSummary[];
}

export interface SwitchTenantPayload {
  tenantId: string;
}

export function login(payload: LoginPayload): Promise<LoginResult> {
  return publicFetch<LoginResult>("/auth/login", payload);
}

export function selectTenant(payload: SelectTenantPayload): Promise<SessionResponse> {
  return publicFetch<SessionResponse>("/auth/select-tenant", payload);
}

export function register(payload: RegisterPayload): Promise<RegisterResponse> {
  return publicFetch<RegisterResponse>("/auth/register", payload);
}

export function createTenant(payload: CreateTenantPayload): Promise<CreateTenantResponse> {
  return authFetch<CreateTenantResponse>("/auth/tenants", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function changePassword(payload: ChangePasswordPayload): Promise<void> {
  return authFetch<void>("/auth/change-password", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function listMembers(tenantId: string): Promise<{ members: MemberResponse[] }> {
  return authFetch(`/auth/tenants/${tenantId}/members`);
}

export function listInvites(tenantId: string): Promise<{ invites: InviteResponse[] }> {
  return authFetch(`/auth/tenants/${tenantId}/invites`);
}

export function createInvite(
  tenantId: string,
  email: string
): Promise<InviteResponse> {
  return authFetch(`/auth/tenants/${tenantId}/invites`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function cancelInvite(tenantId: string, inviteId: string): Promise<void> {
  return authFetch(`/auth/tenants/${tenantId}/invites/${inviteId}`, {
    method: "DELETE",
  });
}

export function revokeMember(tenantId: string, userId: string): Promise<void> {
  return authFetch(`/auth/tenants/${tenantId}/members/${userId}`, {
    method: "DELETE",
  });
}

export function getInvitePreview(token: string): Promise<InvitePreviewResponse> {
  return fetch(`${AUTH_BASE_URL}/auth/invites/${token}`).then(async (res) => {
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      throw Object.assign(new Error(data.message ?? res.statusText), {
        status: res.status,
      });
    }
    return res.json() as Promise<InvitePreviewResponse>;
  });
}

export function acceptInvite(
  token: string,
  payload: AcceptInvitePayload
): Promise<SessionResponse> {
  return publicFetch<SessionResponse>(`/auth/invites/${token}/accept`, payload);
}

export function identifyInvite(
  token: string,
  email: string
): Promise<IdentifyInviteResponse> {
  return publicFetch<IdentifyInviteResponse>(`/auth/invites/${token}/identify`, { email });
}

export function verifyInviteCredentials(
  token: string,
  email: string,
  password: string
): Promise<VerifyInviteCredentialsResponse> {
  return publicFetch<VerifyInviteCredentialsResponse>(
    `/auth/invites/${token}/verify-credentials`,
    { email, password }
  );
}

export function listMyMemberships(): Promise<MembershipListResponse> {
  return authFetch<MembershipListResponse>("/auth/me/memberships");
}

export function switchTenant(payload: SwitchTenantPayload): Promise<SessionResponse> {
  return authFetch<SessionResponse>("/auth/switch-tenant", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
