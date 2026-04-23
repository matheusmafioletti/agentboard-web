import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import FeatureCard from "../../../components/board/FeatureCard";
import type { FeatureCardSummary } from "../../../api/board";

function makeCard(overrides: Partial<FeatureCardSummary> = {}): FeatureCardSummary {
  return {
    id: "card-1",
    title: "Test Feature",
    description: null,
    reExecutionPending: false,
    taskCount: 0,
    completedTaskCount: 0,
    displayOrder: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("FeatureCard", () => {
  it("renders the card title", () => {
    render(<FeatureCard card={makeCard()} onClick={vi.fn()} />);
    expect(screen.getByText("Test Feature")).toBeTruthy();
  });

  it("calls onClick with the card when clicked", () => {
    const card = makeCard();
    const onClick = vi.fn();
    render(<FeatureCard card={card} onClick={onClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledWith(card);
  });

  it("shows re-execution badge when reExecutionPending is true", () => {
    render(<FeatureCard card={makeCard({ reExecutionPending: true })} onClick={vi.fn()} />);
    expect(screen.getByText("↻")).toBeTruthy();
  });

  it("hides re-execution badge when reExecutionPending is false", () => {
    render(<FeatureCard card={makeCard({ reExecutionPending: false })} onClick={vi.fn()} />);
    expect(screen.queryByText("↻")).toBeNull();
  });

  it("shows task progress bar when taskCount > 0", () => {
    render(
      <FeatureCard
        card={makeCard({ taskCount: 5, completedTaskCount: 3 })}
        onClick={vi.fn()}
      />
    );
    expect(screen.getByText("3/5 tasks")).toBeTruthy();
  });

  it("hides task progress when taskCount is zero", () => {
    render(<FeatureCard card={makeCard({ taskCount: 0 })} onClick={vi.fn()} />);
    expect(screen.queryByText(/tasks/)).toBeNull();
  });
});
