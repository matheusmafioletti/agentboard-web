import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import ProjectDetailPage from "../ProjectDetailPage";

const PROJECT = {
  id: "proj-1",
  name: "My Project",
  constitutionContent: "# Constitution\n\nSome content.",
  apiKey: "key-1",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

vi.mock("swr", () => ({
  default: (key: unknown) => {
    if (typeof key === "string" && key.startsWith("project-")) {
      return { data: PROJECT, isLoading: false, mutate: vi.fn() };
    }
    return { data: undefined, isLoading: false, mutate: vi.fn() };
  },
}));

vi.mock("../../services/boardApi", () => ({
  boardApi: {
    getProject: vi.fn(() => Promise.resolve(PROJECT)),
    updateProject: vi.fn(() => Promise.resolve(PROJECT)),
  },
}));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/projetos/proj-1"]}>
      <Routes>
        <Route path="/projetos/:id" element={<ProjectDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("ProjectDetailPage", () => {
  it("renders project name and Markdown preview in read mode", () => {
    renderPage();
    expect(screen.getByText("My Project")).toBeInTheDocument();
  });

  it("edit mode uses textarea-only — no preview pane rendered", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /editar/i }));
    expect(screen.queryByTestId("markdown-preview-pane")).not.toBeInTheDocument();
  });

  it("edit mode shows no fullscreen enter control", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /editar/i }));
    expect(screen.queryByTestId("markdown-fullscreen-enter")).not.toBeInTheDocument();
  });
});
