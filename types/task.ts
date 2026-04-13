import type { PlatformType, TaskContents, TwitterMode } from "@/types/content";

export type SubTaskStatus = "pending" | "running" | "completed" | "failed";

export type SubTask = {
  id: string;
  title: string;
  goal: string;
  platform?: PlatformType;
  status: SubTaskStatus;
  result?: string;
  error?: string;
};

export type TaskExecution = {
  id: string;
  originalGoal: string;
  strategy: "abort_on_failure";
  status: SubTaskStatus;
  subTasks: SubTask[];
};

export type TaskStatus =
  | "draft"
  | "generating"
  | "generated"
  | "edited"
  | "failed"
  | "published_mock";

export type TaskInput = {
  topic: string;
  audience?: string;
  tone?: string;
  contentGoal?: string;
  lengthHint?: string;
  materialNotes?: string;
  aiPrecheckEnabled?: boolean;
  aiAutoFixEnabled?: boolean;
  selectedPlatforms: PlatformType[];
  twitterMode?: TwitterMode;
};

export type TaskContext = {
  topic: string;
  audience?: string;
  tone?: string;
  goal?: string;
  lengthHint?: string;
  extraMaterials?: string;
  aiPrecheckEnabled?: boolean;
  aiAutoFixEnabled?: boolean;
  selectedPlatforms: Array<"wechat" | "xiaohongshu" | "twitter" | "video_script">;
};

export type TaskReferenceArticle = {
  id: string;
  title: string;
  structure?: string[];
  blocks?: string[];
  source?: string;
};

export type Task = {
  id: string;
  title: string;
  input: TaskInput;
  status: TaskStatus;
  selectedPlatforms: PlatformType[];
  contents: TaskContents;
  execution?: TaskExecution;
  createdAt: string;
  updatedAt: string;
};
