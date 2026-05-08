import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import WorkItemTypeBadge from "../WorkItemTypeBadge";

describe("WorkItemTypeBadge", () => {
  it("applies distinct chroma tokens per type", () => {
    const types = ["FEATURE", "USER_STORY", "TASK"] as const;
    const classes = types.map((type) => {
      const { container } = render(<WorkItemTypeBadge type={type} />);
      const el = container.firstElementChild;
      return el?.className ?? "";
    });
    expect(classes[0]).toContain("purple");
    expect(classes[1]).toContain("green");
    expect(classes[2]).toContain("amber");
    expect(classes[0]).not.toEqual(classes[1]);
    expect(classes[1]).not.toEqual(classes[2]);
  });

  it("renders outline stroke icons for each type", () => {
    for (const type of ["FEATURE", "USER_STORY", "TASK"] as const) {
      const { container } = render(<WorkItemTypeBadge type={type} />);
      const strokes = container.querySelectorAll('svg path[stroke="currentColor"]');
      expect(strokes.length).toBeGreaterThan(0);
    }
  });
});
