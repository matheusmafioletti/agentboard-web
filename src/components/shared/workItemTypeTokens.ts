import type { WorkItem } from "../../services/boardApi";

export type WorkItemTypeKey = WorkItem["type"];

export const WORK_ITEM_TYPE_CHROMA: Record<WorkItemTypeKey, string> = {
  FEATURE: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  USER_STORY: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  TASK: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
};

export const WORK_ITEM_TYPE_BORDER: Record<WorkItemTypeKey, string> = {
  FEATURE: "border-purple-500 dark:border-purple-400",
  USER_STORY: "border-green-500 dark:border-green-400",
  TASK: "border-amber-500 dark:border-amber-400",
};

export const WORK_ITEM_TYPE_LABEL: Record<WorkItemTypeKey, string> = {
  FEATURE: "Feature",
  USER_STORY: "User Story",
  TASK: "Task",
};
