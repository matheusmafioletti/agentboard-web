import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useSidebarState } from "../../../hooks/useSidebarState";

describe("useSidebarState", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it("starts collapsed when sessionStorage is empty", () => {
    const { result } = renderHook(() => useSidebarState());
    expect(result.current.expanded).toBe(false);
  });

  it("toggle() switches to expanded", () => {
    const { result } = renderHook(() => useSidebarState());
    act(() => result.current.toggle());
    expect(result.current.expanded).toBe(true);
  });

  it("second toggle() switches back to collapsed", () => {
    const { result } = renderHook(() => useSidebarState());
    act(() => result.current.toggle());
    act(() => result.current.toggle());
    expect(result.current.expanded).toBe(false);
  });

  it("writes 'sidebar_expanded' key to sessionStorage on each toggle", () => {
    const { result } = renderHook(() => useSidebarState());
    act(() => result.current.toggle());
    expect(sessionStorage.getItem("sidebar_expanded")).toBe("true");
    act(() => result.current.toggle());
    expect(sessionStorage.getItem("sidebar_expanded")).toBe("false");
  });

  it("reads initial value from sessionStorage", () => {
    sessionStorage.setItem("sidebar_expanded", "true");
    const { result } = renderHook(() => useSidebarState());
    expect(result.current.expanded).toBe(true);
  });
});
