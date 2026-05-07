import { render, screen, fireEvent } from "@testing-library/react";
import { afterEach, beforeEach, describe, it, expect } from "vitest";
import ExecutionHistory from "../../../components/card-modal/ExecutionHistory";
import type { CommandExecutionData } from "../../../services/boardApi";

const executions: CommandExecutionData[] = [
  {
    id: "exec-1",
    command: "specify",
    status: "SUCCESS",
    agentIdentifier: "cursor-agent",
    errorMessage: null,
    startedAt: "2026-01-01T10:00:00Z",
    finishedAt: "2026-01-01T10:00:05Z",
    durationMs: 5000,
  },
  {
    id: "exec-2",
    command: "plan",
    status: "ERROR",
    agentIdentifier: null,
    errorMessage: "Connection timeout",
    startedAt: "2026-01-01T11:00:00Z",
    finishedAt: "2026-01-01T11:00:01Z",
    durationMs: 1000,
  },
  {
    id: "exec-3",
    command: "tasks",
    status: "RUNNING",
    agentIdentifier: "cursor-agent",
    errorMessage: null,
    startedAt: "2026-01-01T12:00:00Z",
    finishedAt: null,
    durationMs: null,
  },
];

describe("ExecutionHistory — dark mode", () => {
  beforeEach(() => {
    document.documentElement.classList.add("dark");
  });

  afterEach(() => {
    document.documentElement.classList.remove("dark");
  });

  it("row has dark border token class", () => {
    render(<ExecutionHistory executions={[executions[0]!]} />);
    const row = screen.getByTestId("exec-row");
    expect(row.className).toContain("dark:border-white/[0.08]");
  });

  it("SUCCESS badge has dark green token classes", () => {
    render(<ExecutionHistory executions={[executions[0]!]} />);
    const badge = screen.getByText("SUCCESS");
    expect(badge.className).toContain("dark:bg-green-900/30");
    expect(badge.className).toContain("dark:text-green-400");
  });

  it("ERROR badge has dark red token classes", () => {
    render(<ExecutionHistory executions={[executions[1]!]} />);
    const badge = screen.getByText("ERROR");
    expect(badge.className).toContain("dark:bg-red-900/30");
    expect(badge.className).toContain("dark:text-red-400");
  });

  it("RUNNING badge has dark yellow token classes", () => {
    render(<ExecutionHistory executions={[executions[2]!]} />);
    const badge = screen.getByText("RUNNING");
    expect(badge.className).toContain("dark:bg-yellow-900/30");
    expect(badge.className).toContain("dark:text-yellow-400");
  });
});

describe("ExecutionHistory", () => {
  it("renders command names for each execution", () => {
    render(<ExecutionHistory executions={executions} />);
    expect(screen.getByText("specify")).toBeTruthy();
    expect(screen.getByText("plan")).toBeTruthy();
    expect(screen.getByText("tasks")).toBeTruthy();
  });

  it("shows SUCCESS status badge", () => {
    render(<ExecutionHistory executions={[executions[0]!]} />);
    expect(screen.getByText("SUCCESS")).toBeTruthy();
  });

  it("shows ERROR status badge", () => {
    render(<ExecutionHistory executions={[executions[1]!]} />);
    expect(screen.getByText("ERROR")).toBeTruthy();
  });

  it("shows RUNNING status badge", () => {
    render(<ExecutionHistory executions={[executions[2]!]} />);
    expect(screen.getByText("RUNNING")).toBeTruthy();
  });

  it("shows duration in milliseconds when available", () => {
    render(<ExecutionHistory executions={[executions[0]!]} />);
    expect(screen.getByText(/5000\s*ms/)).toBeTruthy();
  });

  it("renders empty state message when no executions", () => {
    render(<ExecutionHistory executions={[]} />);
    expect(screen.getByText(/no execution history/i)).toBeTruthy();
  });

  it("expands error message on row click for ERROR execution", () => {
    render(<ExecutionHistory executions={[executions[1]!]} />);
    const row = screen.getByText("plan").closest("[data-testid='exec-row']")!;
    fireEvent.click(row);
    expect(screen.getByText("Connection timeout")).toBeTruthy();
  });
});
