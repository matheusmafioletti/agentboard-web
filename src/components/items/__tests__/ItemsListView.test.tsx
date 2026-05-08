import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import ItemsListView from "../ItemsListView";
import type { WorkItem } from "../../../services/boardApi";

const SAMPLE: WorkItem = {
  id: "feat-1",
  projectId: "p",
  tenantId: "t",
  type: "FEATURE",
  title: "Root Feature",
  description: null,
  status: "BACKLOG",
  parentId: null,
  priority: 5,
  displayOrder: 0,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  displayKey: "F1",
};

vi.mock("../../../services/boardApi", () => ({
  boardApi: {
    listWorkItems: vi.fn(() => Promise.resolve([SAMPLE])),
  },
}));

vi.mock("swr", () => ({
  default: (key: unknown) => {
    if (typeof key === "string" && key.startsWith("items-tree")) {
      return { data: [SAMPLE], isLoading: false, mutate: vi.fn() };
    }
    if (typeof key === "string" && key.startsWith("items-list")) {
      return { data: [SAMPLE], isLoading: false, mutate: vi.fn() };
    }
    return { data: undefined, isLoading: false, mutate: vi.fn() };
  },
}));

vi.mock("../../card-modal/CardModal", () => ({
  default: ({ workItemId }: { workItemId: string }) => (
    <div data-testid="card-modal">{workItemId}</div>
  ),
}));

describe("ItemsListView", () => {
  it("opens detail modal when a list row is activated", async () => {
    render(
      <MemoryRouter>
        <ItemsListView projectId="p" />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText("Root Feature"));
    expect(await screen.findByTestId("card-modal")).toHaveTextContent("feat-1");
  });

  it("shows tree container when Árvore mode is selected", () => {
    render(
      <MemoryRouter>
        <ItemsListView projectId="p" />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole("button", { name: /Árvore/i }));
    expect(screen.getByTestId("items-tree-root")).toBeInTheDocument();
  });
});
