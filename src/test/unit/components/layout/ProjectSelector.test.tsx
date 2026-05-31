import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { SWRConfig } from "swr";
import ProjectSelector from "../../../../components/layout/ProjectSelector";

const server = setupServer(
  http.get("http://localhost:8081/api/v1/projects", () => HttpResponse.json([]))
);

beforeAll(() => {
  server.listen();
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }));
  localStorage.setItem("agentboard_token", `header.${payload}.sig`);
  sessionStorage.removeItem("agentboard:activeProjectId");
});
afterEach(() => server.resetHandlers());
afterAll(() => {
  server.close();
  localStorage.removeItem("agentboard_token");
  sessionStorage.removeItem("agentboard:activeProjectId");
});

function renderSelector() {
  return render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <ProjectSelector />
    </SWRConfig>
  );
}

describe("ProjectSelector", () => {
  it("shows empty label when no projects", async () => {
    renderSelector();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /nenhum projeto cadastrado/i })).toBeInTheDocument()
    );
  });

  it("shows empty message in dropdown when no projects", async () => {
    renderSelector();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /nenhum projeto cadastrado/i })).toBeInTheDocument()
    );
    await userEvent.click(screen.getByRole("button", { name: /nenhum projeto cadastrado/i }));
    expect(screen.getAllByText("Nenhum projeto cadastrado").length).toBeGreaterThanOrEqual(1);
  });
});
