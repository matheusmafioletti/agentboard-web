import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import AdminRoute from "../AdminRoute";

vi.mock("../../../hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "../../../hooks/useAuth";

describe("AdminRoute", () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReset();
  });

  it("redirects non-admin users", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        userId: "1",
        tenantId: "t",
        token: "x",
        email: "u@x.com",
        name: "U",
        tenantName: "T",
        role: "USER",
      },
      login: vi.fn(),
      selectTenant: vi.fn(),
      register: vi.fn(),
      createTenant: vi.fn(),
      logout: vi.fn(),
      applySession: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/usuarios"]}>
        <Routes>
          <Route path="/usuarios" element={<AdminRoute><div>Secret</div></AdminRoute>} />
          <Route path="/inicio" element={<div>Inicio</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Inicio")).toBeInTheDocument();
  });

  it("renders children for admin", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        userId: "1",
        tenantId: "t",
        token: "x",
        email: "a@x.com",
        name: "A",
        tenantName: "T",
        role: "ADMIN",
      },
      login: vi.fn(),
      selectTenant: vi.fn(),
      register: vi.fn(),
      createTenant: vi.fn(),
      logout: vi.fn(),
      applySession: vi.fn(),
    });

    render(
      <MemoryRouter>
        <AdminRoute><div>Secret</div></AdminRoute>
      </MemoryRouter>
    );

    expect(screen.getByText("Secret")).toBeInTheDocument();
  });
});
