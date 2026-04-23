import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:8081" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("agentboard_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export type Stage =
  | "BACKLOG"
  | "SPECIFY"
  | "PLAN"
  | "IN_PROGRESS"
  | "REVIEW"
  | "DONE";

export interface FeatureCardSummary {
  id: string;
  title: string;
  description: string | null;
  reExecutionPending: boolean;
  taskCount: number;
  completedTaskCount: number;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ColumnData {
  id: string;
  name: string;
  stage: Stage;
  displayOrder: number;
  featureCards: FeatureCardSummary[];
}

export interface BoardData {
  id: string;
  name: string;
  tenantId: string;
  columns: ColumnData[];
}

export interface FeatureCardDetail extends FeatureCardSummary {
  columnId: string;
  tenantId: string;
  tasks: TaskData[];
  artifacts: ArtifactData[];
  commandExecutions: CommandExecutionData[];
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

export interface CreateFeaturePayload {
  title: string;
  description?: string;
}

export interface UpdateFeaturePayload {
  title?: string;
  description?: string;
  reExecutionPending?: boolean;
}

export interface MoveFeaturePayload {
  targetColumnId: string;
  displayOrder: number;
}

/** Fetches the tenant's board with all columns and feature cards. */
export async function getBoard(): Promise<BoardData> {
  const { data } = await api.get<BoardData>("/api/boards/current");
  return data;
}

/** Creates a new feature card in the Backlog column. */
export async function createFeature(
  payload: CreateFeaturePayload
): Promise<FeatureCardDetail> {
  const { data } = await api.post<FeatureCardDetail>("/api/features", payload);
  return data;
}

/** Returns the full detail of a single feature card. */
export async function getFeature(id: string): Promise<FeatureCardDetail> {
  const { data } = await api.get<FeatureCardDetail>(`/api/features/${id}`);
  return data;
}

/** Partially updates an existing feature card. */
export async function updateFeature(
  id: string,
  patch: UpdateFeaturePayload
): Promise<FeatureCardDetail> {
  const { data } = await api.patch<FeatureCardDetail>(
    `/api/features/${id}`,
    patch
  );
  return data;
}

/** Moves a feature card to a different column at the given position. */
export async function moveFeature(
  id: string,
  payload: MoveFeaturePayload
): Promise<FeatureCardDetail> {
  const { data } = await api.patch<FeatureCardDetail>(
    `/api/features/${id}/move`,
    payload
  );
  return data;
}

/** Deletes a feature card. */
export async function deleteFeature(id: string): Promise<void> {
  await api.delete(`/api/features/${id}`);
}
