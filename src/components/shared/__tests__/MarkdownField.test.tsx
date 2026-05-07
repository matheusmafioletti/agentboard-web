import React, { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import MarkdownField from "../MarkdownField";

function ControlledSplit() {
  const [v, setV] = useState("");
  return <MarkdownField variant="split" value={v} onChange={setV} />;
}

function ControlledSplitWithInitial() {
  const [v, setV] = useState("before");
  return <MarkdownField variant="split" value={v} onChange={setV} />;
}

describe("MarkdownField", () => {
  it("renders headings and list items from Markdown in preview-only mode", () => {
    const md = `# Ola\n\n- a\n- b`;
    render(<MarkdownField variant="preview-only" value={md} />);

    expect(screen.getByRole("heading", { level: 1, name: "Ola" })).toBeInTheDocument();
    const bullets = screen.getAllByRole("listitem");
    expect(bullets).toHaveLength(2);
    expect(bullets[0]).toHaveTextContent("a");
    expect(bullets[1]).toHaveTextContent("b");
  });

  it("sanitizes script-like HTML so no script tags appear in DOM", () => {
    const md = `Text\n\n<script>alert("x")</script>\n\nMore`;
    const { container } = render(<MarkdownField variant="preview-only" value={md} />);
    expect(container.querySelectorAll("script")).toHaveLength(0);
    expect(screen.getByText("More")).toBeInTheDocument();
  });

  it("split mode updates preview when user types in the source editor", async () => {
    const user = userEvent.setup();
    render(<ControlledSplit />);

    const box = screen.getByRole("textbox");
    await user.type(box, "# Live");
    const preview = screen.getByTestId("markdown-preview-pane");
    expect(within(preview).getByRole("heading", { level: 1, name: "Live" })).toBeInTheDocument();
  });

  it("preview-only never renders a textarea", () => {
    render(<MarkdownField variant="preview-only" value="# Hi" />);
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("fullscreen toggle preserves textarea content when entering and leaving", async () => {
    const user = userEvent.setup();
    render(<ControlledSplitWithInitial />);

    await user.click(screen.getByTestId("markdown-fullscreen-enter"));
    expect(screen.getByTestId("markdown-fullscreen-layer")).toBeInTheDocument();
    const fsBox = screen.getByRole("textbox");
    await user.clear(fsBox);
    await user.type(fsBox, "after");

    await user.click(screen.getByRole("button", { name: /close full screen/i }));
    expect(screen.queryByTestId("markdown-fullscreen-layer")).toBeNull();
    expect(screen.getByRole("textbox")).toHaveValue("after");
  });
});
