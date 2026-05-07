import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import InicioPage from "../../../pages/InicioPage";

function renderPage() {
  return render(
    <MemoryRouter>
      <InicioPage />
    </MemoryRouter>
  );
}

describe("InicioPage", () => {
  it("renders without crashing", () => {
    renderPage();
  });

  it("shows the page heading", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: "Início" })).toBeInTheDocument();
  });
});
