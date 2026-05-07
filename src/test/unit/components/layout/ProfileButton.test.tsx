import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

// Mock useAuth to return a test user
vi.mock("../../../../hooks/useAuth", () => ({
  useAuth: () => ({
    user: { userId: "user-1", tenantId: "t-1", token: "tok", email: "ana@example.com" },
    logout: vi.fn(),
  }),
}));

import ProfileButton from "../../../../components/layout/ProfileButton";

function renderButton(expanded = false) {
  return render(
    <MemoryRouter>
      <ProfileButton expanded={expanded} />
    </MemoryRouter>
  );
}

describe("ProfileButton", () => {
  it("renders the user's initials when expanded", () => {
    renderButton(true);
    // email "ana@example.com" → first letter "A"
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("opens popover with user email when clicked", async () => {
    renderButton();
    await userEvent.click(screen.getByRole("button", { name: /perfil/i }));
    expect(screen.getByText("ana@example.com")).toBeInTheDocument();
  });

  it("shows 'Sair' and 'Trocar Senha' actions in popover", async () => {
    renderButton();
    await userEvent.click(screen.getByRole("button", { name: /perfil/i }));
    expect(screen.getByRole("button", { name: /sair/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /trocar senha/i })).toBeInTheDocument();
  });

  it("opens ChangePasswordModal when 'Trocar Senha' is clicked", async () => {
    renderButton();
    await userEvent.click(screen.getByRole("button", { name: /perfil/i }));
    await userEvent.click(screen.getByRole("button", { name: /trocar senha/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
