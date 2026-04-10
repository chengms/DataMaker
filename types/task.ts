import type { PlatformType, TaskContents, TwitterMode } from "@/types/content";

export type TaskStatus =
  | "draft"
  | "generating"
  | "generated"
  | "edited"
  | "published_mock";

export type TaskInput = {
  topic: string;
  audience?: string;
  tone?: string;
  contentGoal?: string;
  lengthHint?: string;
  materialNotes?: string;
  selectedPlatforms: PlatformType[];
  twitterMode?: TwitterMode;
};

export type Task = {
  id: string;
  title: string;
  input: TaskInput;
  status: TaskStatus;
  selectedPlatforms: PlatformType[];
  contents: TaskContents;
  createdAt: string;
  updatedAt: string;
};
