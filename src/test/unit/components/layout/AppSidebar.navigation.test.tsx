import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, it } from "vitest";
import AppSidebar from "../../../../components/layout/AppSidebar";

function renderWithRouter(initialPath: string) {
  const router = createMemoryRouter(
    [{ path: "*", element: <AppSidebar /> }],
    { initialEntries: [initialPath] }
  );
  return render(<RouterProvider router={router} />);
}

describe("AppSidebar navigation", () => {
  it("highlights the active route item", () => {
    renderWithRouter("/board");
    const link = screen.getByTitle("Board").closest("a");
    expect(link?.className).toMatch(/text-accent/);
  });

  it("does not highlight inactive items", () => {
    renderWithRouter("/board");
    const inactiveLink = screen.getByTitle("Início").closest("a");
    expect(inactiveLink?.className).not.toMatch(/text-accent.*font-medium/);
  });

  it("each nav item is a link pointing to its route", () => {
    renderWithRouter("/inicio");
    expect(screen.getByTitle("Início").closest("a")).toHaveAttribute("href", "/inicio");
    expect(screen.getByTitle("Board").closest("a")).toHaveAttribute("href", "/board");
    expect(screen.getByTitle("Itens").closest("a")).toHaveAttribute("href", "/itens");
    expect(screen.getByTitle("Projetos").closest("a")).toHaveAttribute("href", "/projetos");
  });

  it("shows all nav labels when sidebar is expanded", async () => {
    renderWithRouter("/inicio");
    await userEvent.click(screen.getByRole("button", { name: /expandir menu/i }));
    expect(screen.getByText("Início")).toBeInTheDocument();
    expect(screen.getByText("Board")).toBeInTheDocument();
    expect(screen.getByText("Itens")).toBeInTheDocument();
    expect(screen.getByText("Projetos")).toBeInTheDocument();
  });
});
