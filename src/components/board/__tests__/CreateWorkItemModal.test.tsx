import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import CreateWorkItemModal from "../CreateWorkItemModal";

const createWorkItem = vi.fn();

vi.mock("../../../services/boardApi", () => ({
  boardApi: {
    createWorkItem: (...args: unknown[]) => createWorkItem(...args),
  },
}));

describe("CreateWorkItemModal", () => {
  beforeEach(() => {
    createWorkItem.mockReset();
    createWorkItem.mockResolvedValue({});
  });

  it("FEATURE submit omits parentId in payload", async () => {
    const onClose = vi.fn();
    const onCreated = vi.fn();
    render(
      <CreateWorkItemModal
        projectId="proj-a"
        type="FEATURE"
        onClose={onClose}
        onCreated={onCreated}
      />
    );
    fireEvent.change(screen.getByLabelText(/Título/i), { target: { value: "Nova" } });
    fireEvent.click(screen.getByRole("button", { name: /Criar$/i }));
    await waitFor(() => expect(createWorkItem).toHaveBeenCalled());
    expect(createWorkItem).toHaveBeenCalledWith(
      "proj-a",
      expect.objectContaining({
        type: "FEATURE",
        title: "Nova",
        priority: 5,
        assigneeId: null,
      })
    );
  });

  it("does not render project picker rows for FEATURE flow", () => {
    render(
      <CreateWorkItemModal
        projectId="proj-a"
        type="FEATURE"
        onClose={vi.fn()}
        onCreated={vi.fn()}
      />
    );
    expect(screen.queryByText(/Projeto/i)).not.toBeInTheDocument();
  });
});
