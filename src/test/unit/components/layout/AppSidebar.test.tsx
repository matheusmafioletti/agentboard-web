import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import AppSidebar from "../../../../components/layout/AppSidebar";

function renderSidebar() {
  return render(
    <MemoryRouter initialEntries={["/inicio"]}>
      <AppSidebar />
    </MemoryRouter>
  );
}

describe("AppSidebar", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("renders in compact mode by default", () => {
    renderSidebar();
    expect(screen.queryByText("Board")).not.toBeInTheDocument();
  });

  it("renders expanded after clicking the toggle button", async () => {
    renderSidebar();
    const toggle = screen.getByRole("button", { name: /expandir menu/i });
    await userEvent.click(toggle);
    expect(screen.getByText("Board")).toBeInTheDocument();
  });

  it("hides labels again when toggled a second time", async () => {
    renderSidebar();
    const toggle = screen.getByRole("button", { name: /expandir menu/i });
    await userEvent.click(toggle);
    await userEvent.click(toggle);
    expect(screen.queryByText("Board")).not.toBeInTheDocument();
  });

  it("renders all nav items", () => {
    renderSidebar();
    expect(screen.getByTitle("Início")).toBeInTheDocument();
    expect(screen.getByTitle("Board")).toBeInTheDocument();
    expect(screen.getByTitle("Itens")).toBeInTheDocument();
    expect(screen.getByTitle("Projetos")).toBeInTheDocument();
  });
});
