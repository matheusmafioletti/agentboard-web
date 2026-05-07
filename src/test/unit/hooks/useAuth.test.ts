import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuth } from "../../../hooks/useAuth";

vi.mock("../../../services/authApi", () => ({
  login: vi.fn(),
  register: vi.fn(),
}));

import * as authApi from "../../../services/authApi";

const mockLogin = vi.mocked(authApi.login);
const mockRegister = vi.mocked(authApi.register);

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe("useAuth", () => {
  it("starts with null user when localStorage is empty", () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toBeNull();
  });

  it("login sets user and stores token in localStorage", async () => {
    mockLogin.mockResolvedValue({
      token: "jwt-token",
      userId: "user-1",
      tenantId: "tenant-1",
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login({ email: "a@b.com", password: "pw" });
    });

    expect(result.current.user).not.toBeNull();
    expect(result.current.user?.token).toBe("jwt-token");
    expect(result.current.user?.userId).toBe("user-1");
    expect(localStorage.getItem("agentboard_token")).toBe("jwt-token");
  });

  it("register sets user and stores token in localStorage", async () => {
    mockRegister.mockResolvedValue({
      token: "jwt-register",
      userId: "user-2",
      tenantId: "tenant-2",
      apiKey: "raw-key",
      board: { id: "board-1", name: "My Board" },
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.register({
        name: "Test",
        email: "test@example.com",
        password: "password123",
        tenantName: "Corp",
      });
    });

    expect(result.current.user?.token).toBe("jwt-register");
    expect(localStorage.getItem("agentboard_token")).toBe("jwt-register");
  });

  it("logout clears user and removes token from localStorage", async () => {
    mockLogin.mockResolvedValue({
      token: "jwt-token",
      userId: "user-1",
      tenantId: "tenant-1",
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login({ email: "a@b.com", password: "pw" });
    });

    expect(result.current.user).not.toBeNull();

    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(localStorage.getItem("agentboard_token")).toBeNull();
  });

  it("restores user from localStorage on hook initialisation", () => {
    const stored = { userId: "u1", tenantId: "t1", token: "stored-jwt" };
    localStorage.setItem("agentboard_user", JSON.stringify(stored));

    const { result } = renderHook(() => useAuth());
    expect(result.current.user?.token).toBe("stored-jwt");
  });
});
