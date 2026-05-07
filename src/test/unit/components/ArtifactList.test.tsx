import { render, screen, fireEvent } from "@testing-library/react";
import { afterEach, beforeEach, describe, it, expect } from "vitest";
import ArtifactList from "../../../components/card-modal/ArtifactList";
import type { ArtifactData } from "../../../services/boardApi";

const artifacts: ArtifactData[] = [
  {
    id: "art-1",
    command: "specify",
    content: "# Feature Spec\n\nThis is the specification content.",
    agentIdentifier: "cursor-agent",
    createdAt: "2026-01-01T10:00:00Z",
  },
  {
    id: "art-2",
    command: "plan",
    content: "## Implementation Plan\n\nStep 1: Set up database.",
    agentIdentifier: null,
    createdAt: "2026-01-01T11:00:00Z",
  },
];

describe("ArtifactList — dark mode", () => {
  beforeEach(() => {
    document.documentElement.classList.add("dark");
  });

  afterEach(() => {
    document.documentElement.classList.remove("dark");
  });

  it("row has dark border token class", () => {
    render(<ArtifactList artifacts={[artifacts[0]!]} />);
    const row = screen.getByTestId("artifact-row");
    expect(row.className).toContain("dark:border-white/[0.08]");
  });

  it("row has dark hover background token class", () => {
    render(<ArtifactList artifacts={[artifacts[0]!]} />);
    const row = screen.getByTestId("artifact-row");
    expect(row.className).toContain("dark:hover:bg-white/[0.04]");
  });

  it("command badge has dark accent token classes", () => {
    render(<ArtifactList artifacts={[artifacts[0]!]} />);
    const badge = screen.getByText("specify");
    expect(badge.className).toContain("dark:bg-accent/[0.15]");
    expect(badge.className).toContain("dark:text-accent");
  });
});

describe("ArtifactList", () => {
  it("renders command names for each artifact", () => {
    render(<ArtifactList artifacts={artifacts} />);
    expect(screen.getByText("specify")).toBeTruthy();
    expect(screen.getByText("plan")).toBeTruthy();
  });

  it("renders agent identifier when present", () => {
    render(<ArtifactList artifacts={[artifacts[0]!]} />);
    expect(screen.getByText("cursor-agent")).toBeTruthy();
  });

  it("shows artifact content when row is clicked", () => {
    render(<ArtifactList artifacts={[artifacts[0]!]} />);
    const row = screen.getByText("specify").closest("[data-testid='artifact-row']")!;
    fireEvent.click(row);
    expect(screen.getByText(/Feature Spec/)).toBeTruthy();
  });

  it("collapses content when clicked again", () => {
    render(<ArtifactList artifacts={[artifacts[0]!]} />);
    const row = screen.getByText("specify").closest("[data-testid='artifact-row']")!;
    fireEvent.click(row);
    expect(screen.getByText(/Feature Spec/)).toBeTruthy();
    fireEvent.click(row);
    expect(screen.queryByText(/Feature Spec/)).toBeNull();
  });

  it("renders empty state when no artifacts", () => {
    render(<ArtifactList artifacts={[]} />);
    expect(screen.getByText(/no artifacts/i)).toBeTruthy();
  });

  it("shows creation timestamp for each artifact", () => {
    render(<ArtifactList artifacts={[artifacts[0]!]} />);
    expect(screen.getByText(/2026/)).toBeTruthy();
  });
});
