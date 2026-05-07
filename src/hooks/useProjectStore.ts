import { useState, useCallback } from "react";
import useSWR from "swr";
import { boardApi, type Project } from "../services/boardApi";

export type { Project };

const SESSION_KEY = "agentboard:activeProjectId";

/**
 * Provides project list and the active project selection backed by sessionStorage.
 *
 * <p>The active projectId persists across page reloads within the same browser session
 * so that a full refresh returns the user to the same project context.
 */
export function useProjectStore() {
  const { data: projects = [], mutate } = useSWR<Project[]>(
    "projects",
    () => boardApi.listProjects()
  );

  const [activeProjectId, setActiveProjectIdState] = useState<string | null>(() => {
    return sessionStorage.getItem(SESSION_KEY);
  });

  const setActiveProject = useCallback((id: string) => {
    sessionStorage.setItem(SESSION_KEY, id);
    setActiveProjectIdState(id);
  }, []);

  const effectiveProjectId =
    activeProjectId ?? (projects.length > 0 ? projects[0].id : null);
  const activeProject =
    projects.find((p) => p.id === effectiveProjectId) ?? null;

  return { projects, activeProject, setActiveProject, mutate };
}
