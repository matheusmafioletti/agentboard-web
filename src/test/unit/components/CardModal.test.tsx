import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CardModal from "../../../components/card-modal/CardModal";
import type { FeatureCardSummary, FeatureCardDetail } from "../../../api/board";
import * as boardApi from "../../../api/board";

vi.mock("../../../api/board", () => ({
  getFeature: vi.fn(),
}));

function makeCard(overrides: Partial<FeatureCardSummary> = {}): FeatureCardSummary {
  return {
    id: "card-1",
    title: "Test Feature",
    description: "Initial desc",
    reExecutionPending: false,
    taskCount: 0,
    completedTaskCount: 0,
    displayOrder: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("CardModal", () => {
  beforeEach(() => {
    const card = makeCard();
    const detail: FeatureCardDetail = {
      ...card,
      columnId: "col-1",
      tenantId: "tenant-1",
      tasks: [],
      artifacts: [],
      commandExecutions: [],
    };
    vi.mocked(boardApi.getFeature).mockResolvedValue(detail);
  });

  it("renders the card title", () => {
    render(
      <CardModal
        card={makeCard()}
        onClose={vi.fn()}
        onSave={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText("Test Feature")).toBeTruthy();
  });

  it("calls onClose when the × button is clicked", () => {
    const onClose = vi.fn();
    render(
      <CardModal
        card={makeCard()}
        onClose={onClose}
        onSave={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    fireEvent.click(screen.getByLabelText("Close"));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when Escape is pressed", () => {
    const onClose = vi.fn();
    render(
      <CardModal
        card={makeCard()}
        onClose={onClose}
        onSave={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onSave with updated title and description", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <CardModal
        card={makeCard()}
        onClose={vi.fn()}
        onSave={onSave}
        onDelete={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText("Test Feature"));
    const input = screen.getByDisplayValue("Test Feature");
    fireEvent.change(input, { target: { value: "Updated Title" } });

    fireEvent.click(screen.getByText("Save"));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith("card-1", "Updated Title", "Initial desc"));
  });

  it("shows delete confirmation before calling onDelete", async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(
      <CardModal
        card={makeCard()}
        onClose={onClose}
        onSave={vi.fn()}
        onDelete={onDelete}
      />
    );

    fireEvent.click(screen.getByText("Delete card"));
    expect(screen.getByText("Sure?")).toBeTruthy();

    fireEvent.click(screen.getByText("Yes, delete"));
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith("card-1", "card-1"));
  });
});
