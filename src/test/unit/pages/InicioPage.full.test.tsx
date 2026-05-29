import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { SWRConfig } from "swr";
import InicioPage from "../../../pages/InicioPage";

const server = setupServer(
  http.get("http://localhost:8081/api/v1/projects", () =>
    HttpResponse.json([
      { id: "p1", name: "Alpha", tenantId: "t1", createdAt: "2026-01-01T00:00:00Z" },
      { id: "p2", name: "Beta", tenantId: "t1", createdAt: "2026-01-01T00:00:00Z" },
    ])
  ),
  http.get("http://localhost:8081/api/v1/work-items", () =>
    HttpResponse.json([
      {
        id: "f1",
        projectId: "p1",
        tenantId: "t1",
        type: "FEATURE",
        title: "F",
        status: "SPECIFY",
        parentId: null,
        priority: 5,
        displayOrder: 0,
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
        displayKey: "F1",
      },
      {
        id: "u1",
        projectId: "p1",
        tenantId: "t1",
        type: "USER_STORY",
        title: "U",
        status: "READY",
        parentId: "f1",
        priority: 5,
        displayOrder: 0,
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
        displayKey: "U1",
      },
    ])
  )
);

beforeAll(() => {
  server.listen();
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }));
  localStorage.setItem("agentboard_token", `header.${payload}.sig`);
});
afterEach(() => server.resetHandlers());
afterAll(() => {
  server.close();
  localStorage.removeItem("agentboard_token");
});

function renderPage() {
  return render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <MemoryRouter>
        <InicioPage />
      </MemoryRouter>
    </SWRConfig>
  );
}

describe("InicioPage (dashboard)", () => {
  it("renders the Início heading", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: "Início" })).toBeInTheDocument();
  });

  it("renders per-type stat cards", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("Features")).toBeInTheDocument();
      expect(screen.getByText("User Stories")).toBeInTheDocument();
      expect(screen.getByText("Tasks")).toBeInTheDocument();
    });
  });

  it("renders project ranking section", async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByText("Ranking de projetos")).toBeInTheDocument()
    );
  });

  it("does not show quick actions section", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText("Features")).toBeInTheDocument());
    expect(screen.queryByText(/ações rápidas/i)).not.toBeInTheDocument();
  });
});
