import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:8080" });

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
}

/** Registers a new user and tenant, returning a JWT and API key. */
export async function register(payload: RegisterPayload): Promise<RegisterResponse> {
  const { data } = await api.post<RegisterResponse>("/auth/register", payload);
  return data;
}

/** Authenticates an existing user, returning a JWT. */
export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/auth/login", payload);
  return data;
}
