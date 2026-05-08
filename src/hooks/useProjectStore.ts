import { useCallback, useSyncExternalStore } from "react";
import useSWR from "swr";
import { boardApi, type Project } from "../services/boardApi";

export type { Project };

const SESSION_KEY = "agentboard:activeProjectId";

// Module-level singleton: shared across every component that calls useProjectStore().
// Using plain useState would give each caller its own independent state, so project
// switching in ProjectSelector would not propagate to BoardPage or ItemsListView.
let activeProjectId: string | null = sessionStorage.getItem(SESSION_KEY);
const listeners = new Set<() => void>();

function subscribeProjectId(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getProjectId(): string | null {
  return activeProjectId;
}

function setProjectId(id: string): void {
  sessionStorage.setItem(SESSION_KEY, id);
  activeProjectId = id;
  for (const l of listeners) l();
}

/**
 * Provides project list and the active project selection backed by sessionStorage.
 *
 * <p>The active projectId is stored in a module-level singleton so that all components
 * calling this hook share the same value and re-render together when it changes.
 */
export function useProjectStore() {
  const storedId = useSyncExternalStore(subscribeProjectId, getProjectId);

  const { data: projects = [], mutate } = useSWR<Project[]>(
    "projects",
    () => boardApi.listProjects()
  );

  const setActiveProject = useCallback((id: string) => {
    setProjectId(id);
  }, []);

  const effectiveProjectId =
    storedId ?? (projects.length > 0 ? projects[0].id : null);
  const activeProject =
    projects.find((p) => p.id === effectiveProjectId) ?? null;

  return { projects, activeProject, setActiveProject, mutate };
}
