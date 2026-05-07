import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const DARK_MODE_KEY = "agentboard_dark_mode";

function setupMatchMedia(prefersDark: boolean) {
  const listeners: ((e: { matches: boolean }) => void)[] = [];
  const mql = {
    matches: prefersDark,
    addEventListener: vi.fn((_event: string, cb: (e: { matches: boolean }) => void) => {
      listeners.push(cb);
    }),
    removeEventListener: vi.fn((_event: string, cb: (e: { matches: boolean }) => void) => {
      const idx = listeners.indexOf(cb);
      if (idx !== -1) listeners.splice(idx, 1);
    }),
    dispatchChange: (nextMatches: boolean) => {
      listeners.forEach((cb) => cb({ matches: nextMatches }));
    },
  };
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockReturnValue(mql),
  });
  return mql;
}

describe("useDarkMode", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "";
  });

  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  async function importHook() {
    const mod = await import("../../../hooks/useDarkMode");
    return mod.useDarkMode;
  }

  it("initialises isDark=true when localStorage is 'true'", async () => {
    localStorage.setItem(DARK_MODE_KEY, "true");
    document.documentElement.classList.add("dark");
    setupMatchMedia(false);
    const useDarkMode = await importHook();
    const { result } = renderHook(() => useDarkMode());
    expect(result.current.isDark).toBe(true);
  });

  it("initialises isDark=false when localStorage is 'false'", async () => {
    localStorage.setItem(DARK_MODE_KEY, "false");
    document.documentElement.classList.remove("dark");
    setupMatchMedia(true);
    const useDarkMode = await importHook();
    const { result } = renderHook(() => useDarkMode());
    expect(result.current.isDark).toBe(false);
  });

  it("initialises isDark=true when localStorage is absent and OS prefers dark", async () => {
    localStorage.removeItem(DARK_MODE_KEY);
    document.documentElement.classList.add("dark");
    setupMatchMedia(true);
    const useDarkMode = await importHook();
    const { result } = renderHook(() => useDarkMode());
    expect(result.current.isDark).toBe(true);
  });

  it("initialises isDark=false when localStorage is absent and OS prefers light", async () => {
    localStorage.removeItem(DARK_MODE_KEY);
    document.documentElement.classList.remove("dark");
    setupMatchMedia(false);
    const useDarkMode = await importHook();
    const { result } = renderHook(() => useDarkMode());
    expect(result.current.isDark).toBe(false);
  });

  it("toggle switches isDark from false to true and persists to localStorage", async () => {
    localStorage.setItem(DARK_MODE_KEY, "false");
    document.documentElement.classList.remove("dark");
    setupMatchMedia(false);
    const useDarkMode = await importHook();
    const { result } = renderHook(() => useDarkMode());
    act(() => result.current.toggle());
    expect(result.current.isDark).toBe(true);
    expect(localStorage.getItem(DARK_MODE_KEY)).toBe("true");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("toggle switches isDark from true to false and persists to localStorage", async () => {
    localStorage.setItem(DARK_MODE_KEY, "true");
    document.documentElement.classList.add("dark");
    setupMatchMedia(false);
    const useDarkMode = await importHook();
    const { result } = renderHook(() => useDarkMode());
    act(() => result.current.toggle());
    expect(result.current.isDark).toBe(false);
    expect(localStorage.getItem(DARK_MODE_KEY)).toBe("false");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("OS theme change updates app when no preference is stored", async () => {
    localStorage.removeItem(DARK_MODE_KEY);
    document.documentElement.classList.remove("dark");
    const mql = setupMatchMedia(false);
    const useDarkMode = await importHook();
    const { result } = renderHook(() => useDarkMode());
    expect(result.current.isDark).toBe(false);
    act(() => mql.dispatchChange(true));
    expect(result.current.isDark).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("OS theme change is ignored when user has explicit preference stored", async () => {
    localStorage.setItem(DARK_MODE_KEY, "false");
    document.documentElement.classList.remove("dark");
    const mql = setupMatchMedia(false);
    const useDarkMode = await importHook();
    const { result } = renderHook(() => useDarkMode());
    act(() => mql.dispatchChange(true));
    expect(result.current.isDark).toBe(false);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("sets color-scheme on <html> to dark when toggling on", async () => {
    localStorage.setItem(DARK_MODE_KEY, "false");
    document.documentElement.classList.remove("dark");
    setupMatchMedia(false);
    const useDarkMode = await importHook();
    const { result } = renderHook(() => useDarkMode());
    act(() => result.current.toggle());
    expect(document.documentElement.style.colorScheme).toBe("dark");
  });

  it("sets color-scheme on <html> to light when toggling off", async () => {
    localStorage.setItem(DARK_MODE_KEY, "true");
    document.documentElement.classList.add("dark");
    setupMatchMedia(false);
    const useDarkMode = await importHook();
    const { result } = renderHook(() => useDarkMode());
    act(() => result.current.toggle());
    expect(document.documentElement.style.colorScheme).toBe("light");
  });
});
