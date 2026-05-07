import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../../hooks/useAuth", () => ({
  useAuth: () => ({
    user: { userId: "user-1", tenantId: "t-1", token: "tok", email: "ana@example.com" },
  }),
}));

vi.mock("../../../../hooks/useChangePassword", () => ({
  useChangePassword: () => ({
    submit: vi.fn().mockResolvedValue(undefined),
    loading: false,
    error: null,
    success: false,
    reset: vi.fn(),
  }),
}));

import ChangePasswordModal from "../../../../components/auth/ChangePasswordModal";

function renderModal(onClose = vi.fn()) {
  return render(<ChangePasswordModal onClose={onClose} />);
}

describe("ChangePasswordModal", () => {
  it("renders the three password fields", () => {
    renderModal();
    expect(screen.getByLabelText(/senha atual/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^nova senha$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmar nova senha/i)).toBeInTheDocument();
  });

  it("shows validation error when current password is blank on submit", async () => {
    renderModal();
    await userEvent.click(screen.getByRole("button", { name: /salvar/i }));
    expect(screen.getByText(/senha atual é obrigatória/i)).toBeInTheDocument();
  });

  it("shows error when new password and confirm do not match", async () => {
    renderModal();
    await userEvent.type(screen.getByLabelText(/senha atual/i), "current123");
    await userEvent.type(screen.getByLabelText(/^nova senha$/i), "newPass1");
    await userEvent.type(screen.getByLabelText(/confirmar nova senha/i), "different");
    await userEvent.click(screen.getByRole("button", { name: /salvar/i }));
    expect(screen.getByText(/senhas não conferem/i)).toBeInTheDocument();
  });

  it("shows dialog role for accessibility", () => {
    renderModal();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
