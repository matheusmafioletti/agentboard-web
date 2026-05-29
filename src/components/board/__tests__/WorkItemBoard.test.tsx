import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import WorkItemBoard from "../WorkItemBoard";
import type { WorkItem } from "../../../services/boardApi";

vi.mock("../../../services/boardApi", () => ({
  boardApi: {
    listWorkItems: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock("../../../hooks/useProjectStore", () => ({
  useProjectStore: () => ({ activeProject: { id: "proj-1" } }),
}));

vi.mock("../../../hooks/useAuth", () => ({
  useAuth: () => ({ user: { token: "tok" } }),
}));

vi.mock("../../../hooks/useBoardWebSocket", () => ({
  useBoardWebSocket: vi.fn(),
}));

vi.mock("swr", () => ({
  default: (key: unknown, fetcher: (() => Promise<WorkItem[]>) | null) => {
    const data = key && fetcher ? [] : undefined;
    return { data, mutate: vi.fn() };
  },
}));

function makeWrapper(path: string) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>;
  };
}

describe("WorkItemBoard", () => {
  it("renders Feature type selector by default", () => {
    render(<WorkItemBoard projectId="proj-1" />, { wrapper: makeWrapper("/board") });
    expect(screen.getByText(/Feature/i)).toBeInTheDocument();
  });

  it("shows User Story parent filter when Task tab filters panel is open", () => {
    render(<WorkItemBoard projectId="proj-1" />, { wrapper: makeWrapper("/board") });
    fireEvent.click(screen.getByTestId("board-type-tab-TASK"));
    fireEvent.click(screen.getByRole("button", { name: /painel de filtros/i }));
    expect(screen.getByRole("button", { name: /filtrar por item pai/i })).toHaveTextContent(
      /User Story/i
    );
  });

  it("shows TASK columns when parentId is present in URL", () => {
    render(<WorkItemBoard projectId="proj-1" />, {
      wrapper: makeWrapper("/board?type=TASK&parentId=us-1"),
    });
    expect(screen.getAllByText(/^NEW$/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/^ACTIVE$/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/^CLOSED$/i).length).toBeGreaterThan(0);
  });

  it("Feature board shows BACKLOG column", () => {
    render(<WorkItemBoard projectId="proj-1" />, { wrapper: makeWrapper("/board") });
    expect(screen.getAllByText(/^BACKLOG$/i).length).toBeGreaterThan(0);
  });

  it("Task board with parent shows NEW column, not BACKLOG", () => {
    render(<WorkItemBoard projectId="proj-1" />, {
      wrapper: makeWrapper("/board?type=TASK&parentId=us-2"),
    });
    expect(screen.queryByText(/^BACKLOG$/i)).not.toBeInTheDocument();
    expect(screen.getAllByText(/^NEW$/i).length).toBeGreaterThan(0);
  });
});
