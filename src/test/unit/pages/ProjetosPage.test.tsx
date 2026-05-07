import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { SWRConfig } from "swr";
import ProjetosPage from "../../../pages/ProjetosPage";

const mockProjects = [
  {
    id: "proj-1",
    tenantId: "t-1",
    name: "Projeto Alpha",
    constitutionContent: "# Constituição Alpha",
    apiKey: "agb_test",
    createdAt: "2026-04-23T00:00:00Z",
    updatedAt: "2026-04-23T00:00:00Z",
  },
];

const server = setupServer(
  http.get("http://localhost:8081/api/v1/projects", () =>
    HttpResponse.json(mockProjects)
  ),
  http.post("http://localhost:8081/api/v1/projects", async ({ request }) => {
    const body = (await request.json()) as { name: string; constitutionContent: string };
    return HttpResponse.json(
      { id: "proj-2", ...body, tenantId: "t-1", apiKey: "agb_new",
        createdAt: "2026-04-23T00:00:00Z", updatedAt: "2026-04-23T00:00:00Z" },
      { status: 201 }
    );
  })
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
        <ProjetosPage />
      </MemoryRouter>
    </SWRConfig>
  );
}

describe("ProjetosPage", () => {
  it("renders page heading", async () => {
    renderPage();
    expect(screen.getByRole("heading", { name: "Projetos" })).toBeInTheDocument();
  });

  it("shows project list after load", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText("Projeto Alpha")).toBeInTheDocument());
  });

  it("shows empty state when no projects", async () => {
    server.use(http.get("http://localhost:8081/api/v1/projects", () => HttpResponse.json([])));
    renderPage();
    await waitFor(() =>
      expect(screen.getByText(/nenhum projeto cadastrado/i)).toBeInTheDocument()
    );
  });

  it("shows create form when 'Novo Projeto' is clicked", async () => {
    renderPage();
    await waitFor(() => screen.getByText("Projeto Alpha"));
    await userEvent.click(screen.getByRole("button", { name: /novo projeto/i }));
    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
  });

  it("shows validation error for blank name on submit", async () => {
    renderPage();
    await waitFor(() => screen.getByText("Projeto Alpha"));
    await userEvent.click(screen.getByRole("button", { name: /novo projeto/i }));
    await userEvent.click(screen.getByRole("button", { name: /criar/i }));
    expect(screen.getByText(/nome é obrigatório/i)).toBeInTheDocument();
  });
});
