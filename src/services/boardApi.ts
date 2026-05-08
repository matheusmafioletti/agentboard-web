import useSWR from "swr";

const BASE_URL =
  (import.meta as { env?: { VITE_BOARD_SERVICE_URL?: string } }).env
    ?.VITE_BOARD_SERVICE_URL ?? "http://localhost:8081";

function getToken(): string {
  return localStorage.getItem("agentboard_token") ?? "";
}

function isTokenExpired(token: string): boolean {
  if (!token) return true;
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    ) as { exp?: number };
    // NOTE: compare with a 10-second buffer so we don't send a request that will expire mid-flight
    return (
      typeof decoded.exp === "number" && decoded.exp < Date.now() / 1000 + 10
    );
  } catch {
    return true;
  }
}

function dispatchAuthExpired() {
  window.dispatchEvent(new CustomEvent("auth:expired"));
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  if (isTokenExpired(token)) {
    dispatchAuthExpired();
    throw Object.assign(new Error("Session expired"), {
      status: 401,
      code: "TOKEN_EXPIRED",
    });
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });

  if (res.status === 401 || res.status === 403) {
    dispatchAuthExpired();
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as {
      error?: string;
      message?: string;
    };
    throw Object.assign(new Error(body.message ?? res.statusText), {
      status: res.status,
      code: body.error,
    });
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------

export interface Project {
  id: string;
  tenantId: string;
  name: string;
  constitutionContent: string | null;
  apiKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkItemParentPreview {
  id: string;
  type: string;
  title: string;
  displayKey: string;
}

export interface TenantUser {
  id: string;
  email: string;
}

export interface WorkItem {
  id: string;
  projectId: string;
  tenantId: string;
  type: "FEATURE" | "USER_STORY" | "TASK";
  title: string;
  description: string | null;
  status: string;
  parentId: string | null;
  priority: number;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  displayKey: string;
  parentPreview?: WorkItemParentPreview | null;
  assigneeId: string | null;
}

export interface WorkItemDetail extends WorkItem {
  children: WorkItem[];
  artifacts: Array<{
    id: string;
    command: string;
    content: string;
    createdAt: string;
  }>;
  commandExecutions: Array<{
    id: string;
    command: string;
    agentId: string | null;
    status: string;
    startedAt: string;
    finishedAt: string | null;
  }>;
}

export interface FeatureItem {
  id: string;
  projectId: string;
  tenantId: string;
  title: string;
  description: string | null;
  stage: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskItem {
  id: string;
  userStoryId: string;
  title: string;
  completed: boolean;
  blocked: boolean;
  blockReason: string | null;
  createdAt: string;
}

export interface UserStoryItem {
  id: string;
  featureId: string;
  projectId: string;
  tenantId: string;
  title: string;
  description: string | null;
  priority: number;
  stage: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  tasks?: TaskItem[];
}

export interface TaskData {
  id: string;
  title: string;
  description: string | null;
  priority: "P1" | "P2" | "P3";
  completed: boolean;
  blocked: boolean;
  blockedReason: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface ArtifactData {
  id: string;
  command: string;
  content: string;
  agentIdentifier: string | null;
  createdAt: string;
}

export interface CommandExecutionData {
  id: string;
  command: string;
  status: "RUNNING" | "SUCCESS" | "ERROR";
  agentIdentifier: string | null;
  errorMessage: string | null;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
}

export interface FeatureDetail extends FeatureItem {
  reExecutionPending?: boolean;
  tasks?: TaskData[];
  artifacts?: ArtifactData[];
  commandExecutions?: CommandExecutionData[];
}

// ---------------------------------------------------------------------------
// Payload types
// ---------------------------------------------------------------------------

export interface ProjectPayload {
  name: string;
  constitutionContent?: string;
}

export interface UpdateProjectPayload {
  name?: string;
  constitutionContent?: string;
}

export interface MoveStagePayload {
  stage: string;
}

export interface CreateFeaturePayload {
  title: string;
  description?: string;
}

export interface UpdateFeaturePayload {
  title?: string;
  description?: string;
  reExecutionPending?: boolean;
}

export interface CreateUserStoriesPayload {
  userStories: Array<{
    title: string;
    description?: string;
    priority: number;
    tasks?: Array<{ title: string }>;
  }>;
}

// ---------------------------------------------------------------------------
// API methods
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// WorkItem payload types
// ---------------------------------------------------------------------------

export interface CreateWorkItemPayload {
  type: "FEATURE" | "USER_STORY" | "TASK";
  title: string;
  description?: string;
  parentId?: string;
  priority?: number;
  assigneeId?: string | null;
}

export interface BatchCreateWorkItemPayload {
  type: "FEATURE" | "USER_STORY" | "TASK";
  parentId: string;
  items: Array<{ title: string; description?: string; priority?: number }>;
}

export interface BatchCreateWorkItemResponse {
  workItems: WorkItem[];
  parentStatus: string | null;
}

export const boardApi = {
  listProjects: () => apiFetch<Project[]>("/api/v1/projects"),

  createProject: (payload: ProjectPayload) =>
    apiFetch<Project>("/api/v1/projects", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getProject: (id: string) => apiFetch<Project>(`/api/v1/projects/${id}`),

  updateProject: (id: string, payload: UpdateProjectPayload) =>
    apiFetch<Project>(`/api/v1/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  listFeatures: (projectId: string, stage?: string) => {
    const params = new URLSearchParams({ projectId });
    if (stage) params.set("stage", stage);
    return apiFetch<FeatureItem[]>(`/api/v1/features?${params.toString()}`);
  },

  getFeature: (featureId: string) =>
    apiFetch<FeatureDetail>(`/api/v1/features/${featureId}`),

  createFeature: (projectId: string, payload: CreateFeaturePayload) =>
    apiFetch<FeatureItem>(`/api/v1/features?projectId=${projectId}`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateFeature: (featureId: string, patch: UpdateFeaturePayload) =>
    apiFetch<FeatureDetail>(`/api/v1/features/${featureId}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),

  moveFeature: (featureId: string, payload: MoveStagePayload) =>
    apiFetch<FeatureItem>(`/api/v1/features/${featureId}/stage`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  listUserStories: (featureId: string) =>
    apiFetch<UserStoryItem[]>(`/api/v1/features/${featureId}/user-stories`),

  createUserStory: (
    featureId: string,
    payload: { title: string; description?: string; priority?: number }
  ) =>
    apiFetch<UserStoryItem[]>(`/api/v1/features/${featureId}/user-stories`, {
      method: "POST",
      body: JSON.stringify({
        userStories: [
          {
            title: payload.title,
            description: payload.description ?? "",
            priority: payload.priority ?? 5,
          },
        ],
      }),
    }),

  moveUserStory: (userStoryId: string, payload: MoveStagePayload) =>
    apiFetch<UserStoryItem>(`/api/v1/user-stories/${userStoryId}/stage`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  completeTask: (userStoryId: string, taskId: string) =>
    apiFetch<{ task: unknown; allTasksCompleted: boolean; userStoryStage: string }>(
      `/api/v1/user-stories/${userStoryId}/tasks/${taskId}/complete`,
      { method: "PATCH" }
    ),

  failTask: (userStoryId: string, taskId: string, reason: string) =>
    apiFetch<unknown>(`/api/v1/user-stories/${userStoryId}/tasks/${taskId}/fail`, {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    }),

  listWorkItems: (params: {
    projectId: string;
    type?: string;
    parentId?: string;
    status?: string;
    includeParent?: boolean;
    assigneeId?: string | null;
  }) => {
    const query = new URLSearchParams({ projectId: params.projectId });
    if (params.type) query.set("type", params.type);
    if (params.parentId) query.set("parentId", params.parentId);
    if (params.status) query.set("status", params.status);
    if (params.includeParent === true) query.set("includeParent", "true");
    if (params.assigneeId) query.set("assigneeId", params.assigneeId);
    return apiFetch<WorkItem[]>(`/api/v1/work-items?${query.toString()}`);
  },

  getWorkItem: (id: string) =>
    apiFetch<WorkItemDetail>(`/api/v1/work-items/${id}`),

  createWorkItem: (projectId: string, payload: CreateWorkItemPayload) =>
    apiFetch<WorkItem>(`/api/v1/work-items?projectId=${projectId}`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  batchCreateWorkItems: (
    projectId: string,
    payload: BatchCreateWorkItemPayload
  ) =>
    apiFetch<BatchCreateWorkItemResponse>(
      `/api/v1/work-items/batch?projectId=${projectId}`,
      { method: "POST", body: JSON.stringify(payload) }
    ),

  moveWorkItemStatus: (id: string, status: string) =>
    apiFetch<WorkItem>(`/api/v1/work-items/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  patchWorkItem: (id: string, payload: {
    title?: string;
    description?: string;
    assignee?: { id?: string; clear?: boolean } | null;
  }) =>
    apiFetch<WorkItem>(`/api/v1/work-items/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  listUsers: () => apiFetch<TenantUser[]>("/api/v1/users"),

  addArtifactToWorkItem: (
    id: string,
    payload: { command: string; content: string }
  ) =>
    apiFetch<unknown>(`/api/v1/work-items/${id}/artifacts`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

// ---------------------------------------------------------------------------
// SWR hooks for dashboard metrics
// ---------------------------------------------------------------------------

const BOARD_POLL = { refreshInterval: 3000 };

/**
 * Fetches all work items across every project in the tenant and returns them
 * together with the full project list for dashboard aggregation.
 */
export function useAllWorkItems(): { projects: Project[]; allItems: WorkItem[]; isLoading: boolean } {
  const { data: projects = [] } = useSWR<Project[]>("projects", boardApi.listProjects);

  const projectIds = projects.map((p) => p.id);
  const cacheKey = projectIds.length > 0 ? `all-work-items-${projectIds.join(",")}` : null;

  const { data: allItems = [], isLoading } = useSWR<WorkItem[]>(
    cacheKey,
    async () => {
      const batches = await Promise.all(
        projectIds.map((id) => boardApi.listWorkItems({ projectId: id }))
      );
      return batches.flat();
    },
    BOARD_POLL
  );

  return { projects, allItems, isLoading };
}
