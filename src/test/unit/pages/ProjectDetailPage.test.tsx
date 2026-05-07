import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import ProjectDetailPage from "../../../pages/ProjectDetailPage";

const project = {
  id: "proj-1",
  tenantId: "t-1",
  name: "Alpha Project",
  constitutionContent: "# My Constitution",
  apiKey: "agb_test",
  createdAt: "2026-04-23T00:00:00Z",
  updatedAt: "2026-04-23T00:00:00Z",
};

const server = setupServer(
  http.get("http://localhost:8081/api/v1/projects/proj-1", () =>
    HttpResponse.json(project)
  ),
  http.put("http://localhost:8081/api/v1/projects/proj-1", async ({ request }) => {
    const body = (await request.json()) as { name?: string; constitutionContent?: string };
    return HttpResponse.json({ ...project, ...body });
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
    <MemoryRouter initialEntries={["/projetos/proj-1"]}>
      <Routes>
        <Route path="/projetos/:id" element={<ProjectDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("ProjectDetailPage", () => {
  it("renders project name and constitution", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText("Alpha Project")).toBeInTheDocument());
    expect(screen.getByRole("heading", { name: "My Constitution" })).toBeInTheDocument();
  });

  it("shows edit form when 'Editar' is clicked", async () => {
    renderPage();
    await waitFor(() => screen.getByText("Alpha Project"));
    await userEvent.click(screen.getByRole("button", { name: /editar/i }));
    expect(screen.getByDisplayValue("Alpha Project")).toBeInTheDocument();
  });

  it("shows success message after save", async () => {
    renderPage();
    await waitFor(() => screen.getByText("Alpha Project"));
    await userEvent.click(screen.getByRole("button", { name: /editar/i }));
    await userEvent.click(screen.getByRole("button", { name: /salvar/i }));
    await waitFor(() =>
      expect(screen.getByText(/salvo com sucesso/i)).toBeInTheDocument()
    );
  });
});
