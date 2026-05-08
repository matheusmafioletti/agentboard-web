import { render, screen, fireEvent } from "@testing-library/react";
import { DndContext } from "@dnd-kit/core";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import WorkItemCard from "../WorkItemCard";
import type { WorkItem } from "../../../services/boardApi";

const detailWithChildren = {
  id: "card-1",
  projectId: "p",
  tenantId: "t",
  type: "FEATURE" as const,
  title: "Titulo Feature",
  description: null,
  status: "BACKLOG",
  parentId: null,
  priority: 5,
  displayOrder: 0,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  displayKey: "F1",
  artifacts: [],
  commandExecutions: [],
  children: [
    {
      id: "c1",
      projectId: "p",
      tenantId: "t",
      type: "USER_STORY" as const,
      title: "Open US",
      description: null,
      status: "READY",
      parentId: "card-1",
      priority: 1,
      displayOrder: 0,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
      displayKey: "U2",
    },
  ],
};

const cardItem: WorkItem = {
  id: detailWithChildren.id,
  projectId: detailWithChildren.projectId,
  tenantId: detailWithChildren.tenantId,
  type: detailWithChildren.type,
  title: detailWithChildren.title,
  description: detailWithChildren.description,
  status: detailWithChildren.status,
  parentId: detailWithChildren.parentId,
  priority: detailWithChildren.priority,
  displayOrder: detailWithChildren.displayOrder,
  createdAt: detailWithChildren.createdAt,
  updatedAt: detailWithChildren.updatedAt,
  displayKey: detailWithChildren.displayKey,
};

vi.mock("swr", () => ({
  default: (key: unknown) => {
    if (typeof key === "string" && key.startsWith("board-card-children-")) {
      return { data: detailWithChildren, isLoading: false, mutate: vi.fn() };
    }
    return { data: undefined, isLoading: false, mutate: vi.fn() };
  },
}));

function wrap(ui: React.ReactElement) {
  return (
    <MemoryRouter>
      <DndContext onDragEnd={() => undefined}>{ui}</DndContext>
    </MemoryRouter>
  );
}

describe("WorkItemCard", () => {
  it("renders title, displayKey (F1 format), and projeto context line", () => {
    render(wrap(<WorkItemCard workItem={cardItem} activeProjectName="Proj A" />));
    expect(screen.getByText("Titulo Feature")).toBeInTheDocument();
    expect(screen.getByText("F1")).toBeInTheDocument();
    expect(screen.getByText(/Projeto · Proj A/)).toBeInTheDocument();
  });

  it("children section is collapsed by default", () => {
    render(wrap(<WorkItemCard workItem={cardItem} activeProjectName="Proj A" />));
    expect(screen.queryByTestId("card-child-link-c1")).not.toBeInTheDocument();
  });

  it("expands children section when toggle is clicked", () => {
    render(wrap(<WorkItemCard workItem={cardItem} activeProjectName="Proj A" />));
    const toggle = screen.getByRole("button", { name: /expandir/i });
    fireEvent.click(toggle);
    expect(screen.getByTestId("card-child-link-c1")).toBeInTheDocument();
  });

  it("collapses children section after expand then collapse", () => {
    render(wrap(<WorkItemCard workItem={cardItem} activeProjectName="Proj A" />));
    const toggle = screen.getByRole("button", { name: /expandir/i });
    fireEvent.click(toggle);
    expect(screen.getByTestId("card-child-link-c1")).toBeInTheDocument();
    const collapseToggle = screen.getByRole("button", { name: /recolher/i });
    fireEvent.click(collapseToggle);
    expect(screen.queryByTestId("card-child-link-c1")).not.toBeInTheDocument();
  });

  it("shows child titles as links when expanded and calls onOpenRelatedId on click", () => {
    const onRelated = vi.fn();
    render(
      wrap(
        <WorkItemCard
          workItem={cardItem}
          activeProjectName="Proj A"
          onOpenRelatedId={onRelated}
        />
      )
    );
    fireEvent.click(screen.getByRole("button", { name: /expandir/i }));
    const childLink = screen.getByTestId("card-child-link-c1");
    expect(childLink).toBeInTheDocument();
    fireEvent.click(childLink);
    expect(onRelated).toHaveBeenCalledWith("c1");
  });

  it("opens parent via link when TASK has parentPreview (T3 format)", () => {
    const onRelated = vi.fn();
    const taskItem: WorkItem = {
      ...cardItem,
      id: "task-1",
      type: "TASK",
      title: "Task title",
      displayKey: "T3",
      parentId: "us-77",
      parentPreview: {
        id: "us-77",
        type: "USER_STORY",
        title: "Some US",
        displayKey: "U2",
      },
    };
    render(
      wrap(
        <WorkItemCard
          workItem={taskItem}
          activeProjectName="Proj A"
          onOpenRelatedId={onRelated}
        />
      )
    );
    const parentBtn = screen.getByTestId("card-open-parent-link");
    fireEvent.click(parentBtn);
    expect(onRelated).toHaveBeenCalledWith("us-77");
  });
});
