import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TenantPicker from "../TenantPicker";

describe("TenantPicker", () => {
  const memberships = [
    {
      tenantId: "t1",
      tenantName: "Alpha",
      role: "ADMIN" as const,
      joinedAt: "2026-01-01T00:00:00Z",
    },
    {
      tenantId: "t2",
      tenantName: "Beta",
      role: "USER" as const,
      joinedAt: "2026-01-02T00:00:00Z",
    },
  ];

  it("renders workspaces and calls onSelect", () => {
    const onSelect = vi.fn();
    render(
      <TenantPicker memberships={memberships} selectedId="t1" onSelect={onSelect} />
    );
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Beta"));
    expect(onSelect).toHaveBeenCalledWith("t2");
  });
});
