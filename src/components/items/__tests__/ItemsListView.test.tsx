import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ItemsListView from "../ItemsListView";

vi.mock("../../../services/boardApi", () => ({
  boardApi: {
    listWorkItems: vi.fn(),
  },
}));

const { boardApi } = await import("../../../services/boardApi");

const mockItems = [
  {
    id: "1",
    type: "FEATURE",
    title: "Feature A",
    status: "BACKLOG",
    parentId: null,
    priority: 5,
    displayOrder: 0,
    projectId: "p1",
    tenantId: "t1",
    description: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "2",
    type: "TASK",
    title: "Task B",
    status: "ACTIVE",
    parentId: "us-1",
    priority: 3,
    displayOrder: 0,
    projectId: "p1",
    tenantId: "t1",
    description: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
];

function renderView(projectId = "p1") {
  return render(
    <MemoryRouter>
      <ItemsListView projectId={projectId} />
    </MemoryRouter>
  );
}

describe("ItemsListView", () => {
  beforeEach(() => {
    vi.mocked(boardApi.listWorkItems).mockResolvedValue(mockItems as never);
  });

  it("renders table columns", async () => {
    renderView();
    expect(screen.getAllByText(/tipo/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/título/i)).toBeDefined();
    expect(screen.getByText(/status/i)).toBeDefined();
  });

  it("shows items returned from the API", async () => {
    renderView();
    await waitFor(() => {
      expect(screen.getByText("Feature A")).toBeDefined();
      expect(screen.getByText("Task B")).toBeDefined();
    });
  });

  it("type filter changes the API call", async () => {
    const user = userEvent.setup();
    renderView();
    await user.click(screen.getByRole("button", { name: /todos os tipos/i }));
    await user.click(screen.getByRole("option", { name: /^task$/i }));
    await waitFor(() => {
      expect(boardApi.listWorkItems).toHaveBeenCalledWith(
        expect.objectContaining({ type: "TASK" })
      );
    });
  });
});
