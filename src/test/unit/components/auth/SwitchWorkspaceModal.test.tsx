import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import SwitchWorkspaceModal from "../../../../components/auth/SwitchWorkspaceModal";

const switchTenant = vi.fn();
const createTenant = vi.fn();

vi.mock("../../../../hooks/useAuth", () => ({
  useAuth: () => ({
    user: {
      userId: "user-1",
      tenantId: "tenant-a",
      tenantName: "Alpha",
      token: "token",
      email: "user@example.com",
      name: "User",
      role: "ADMIN",
    },
    switchTenant,
    createTenant,
  }),
}));

const server = setupServer(
  http.get("http://localhost:8080/auth/me/memberships", () =>
    HttpResponse.json({
      memberships: [
        {
          tenantId: "tenant-a",
          tenantName: "Alpha",
          role: "ADMIN",
          joinedAt: "2026-01-01T00:00:00Z",
        },
        {
          tenantId: "tenant-b",
          tenantName: "Beta",
          role: "USER",
          joinedAt: "2026-01-02T00:00:00Z",
        },
      ],
    })
  )
);

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  switchTenant.mockReset();
  createTenant.mockReset();
});
afterAll(() => server.close());

describe("SwitchWorkspaceModal", () => {
  it("lists memberships and switches workspace", async () => {
    switchTenant.mockResolvedValue({});
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { href: "" },
    });

    render(<SwitchWorkspaceModal onClose={vi.fn()} />);
    await waitFor(() => expect(screen.getByText("Beta")).toBeInTheDocument());
    await userEvent.click(screen.getByText("Beta"));
    expect(switchTenant).toHaveBeenCalledWith("tenant-b");
  });

  it("opens create workspace flow from modal footer", async () => {
    render(<SwitchWorkspaceModal onClose={vi.fn()} />);
    await waitFor(() => expect(screen.getByText("Beta")).toBeInTheDocument());
    await userEvent.click(screen.getByRole("button", { name: /criar workspace/i }));
    expect(screen.getByText("Criar workspace", { selector: "h2" })).toBeInTheDocument();
  });
});
