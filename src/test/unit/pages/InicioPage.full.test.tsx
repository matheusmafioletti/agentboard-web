import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { SWRConfig } from "swr";
import InicioPage from "../../../pages/InicioPage";

const server = setupServer(
  http.get("http://localhost:8081/api/v1/projects", () =>
    HttpResponse.json([{ id: "p1" }, { id: "p2" }, { id: "p3" }])
  ),
  http.get("http://localhost:8081/api/v1/work-items", () =>
    HttpResponse.json([
      { id: "f1", status: "SPECIFY" },
      { id: "f2", status: "IN_DEVELOPMENT" },
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

  it("renders three summary cards", async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getAllByRole("article").length).toBeGreaterThanOrEqual(3)
    );
  });

  it("shows zero state when no features open", async () => {
    server.use(
      http.get("http://localhost:8081/api/v1/work-items", () =>
        HttpResponse.json([])
      )
    );
    renderPage();
    await waitFor(() =>
      expect(screen.getByText(/nenhuma feature em aberto/i)).toBeInTheDocument()
    );
  });

  it("quick action 'Nova Feature' links to /features", async () => {
    renderPage();
    await waitFor(() => screen.getAllByRole("article"));
    const link = screen.getByRole("link", { name: /nova feature/i });
    expect(link).toHaveAttribute("href", "/features");
  });

  it("quick action 'Nova User Story' links to /user-stories", async () => {
    renderPage();
    await waitFor(() => screen.getAllByRole("article"));
    const link = screen.getByRole("link", { name: /nova user story/i });
    expect(link).toHaveAttribute("href", "/user-stories");
  });
});
