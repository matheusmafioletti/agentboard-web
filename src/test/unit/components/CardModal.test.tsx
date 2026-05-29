import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import CardModal from "../../../components/card-modal/CardModal";
import type { WorkItemDetail } from "../../../services/boardApi";

vi.mock("../../../services/boardApi", () => ({
  boardApi: {
    getWorkItem: vi.fn(),
    patchWorkItem: vi.fn(),
  },
}));

import { boardApi } from "../../../services/boardApi";

function detail(overrides: Partial<WorkItemDetail> = {}): WorkItemDetail {
  const base = {
    id: "card-1",
    projectId: "proj-1",
    tenantId: "tenant-1",
    type: "FEATURE" as const,
    title: "Test Feature",
    description: "## Doc\n\nLine",
    status: "BACKLOG",
    parentId: null,
    priority: 5,
    displayOrder: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    displayKey: "F1",
    children: [],
    artifacts: [],
    commandExecutions: [],
    ...overrides,
  };
  return base as WorkItemDetail;
}

describe("CardModal — work item Markdown detail", () => {
  beforeEach(() => {
    vi.mocked(boardApi.getWorkItem).mockResolvedValue(detail());
    vi.mocked(boardApi.patchWorkItem).mockResolvedValue(detail({ title: "Updated Title" }));
  });

  it("loads detail and renders title field", async () => {
    render(
      <CardModal projectId="proj-1" workItemId="card-1" onClose={vi.fn()} onSaved={vi.fn()} />
    );
    await waitFor(() => {
      expect(boardApi.getWorkItem).toHaveBeenCalledWith("card-1");
    });
    expect(screen.getByDisplayValue("Test Feature")).toBeInTheDocument();
  });

  it("calls onClose when Fechar is clicked", async () => {
    const onClose = vi.fn();
    render(<CardModal projectId="proj-1" workItemId="card-1" onClose={onClose} onSaved={vi.fn()} />);
    await waitFor(() => expect(screen.getByDisplayValue("Test Feature")).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText("Fechar"));
    expect(onClose).toHaveBeenCalled();
  });

  it("shows sanitized Markdown preview in read-only mode by default", async () => {
    render(<CardModal projectId="proj-1" workItemId="card-1" onClose={vi.fn()} onSaved={vi.fn()} />);
    const readPane = await screen.findByTestId("card-modal-description-read");
    expect(within(readPane).getByRole("heading", { level: 2 })).toHaveTextContent("Doc");
  });

  it("calls patchWorkItem when form is submitted", async () => {
    const onSaved = vi.fn();
    render(<CardModal projectId="proj-1" workItemId="card-1" onClose={vi.fn()} onSaved={onSaved} />);
    await waitFor(() => expect(screen.getByDisplayValue("Test Feature")).toBeInTheDocument());

    fireEvent.change(screen.getByDisplayValue("Test Feature"), {
      target: { value: "Updated Title" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() =>
      expect(boardApi.patchWorkItem).toHaveBeenCalledWith("card-1", {
        title: "Updated Title",
        description: "## Doc\n\nLine",
        assignee: { clear: true },
      })
    );
    expect(onSaved).toHaveBeenCalled();
  });
});
