import type { PlatformType, TaskContents } from "@/types/content";
import type { TaskInput } from "@/types/task";

export type ReviewField =
  | "topic"
  | "audience"
  | "tone"
  | "contentGoal"
  | "lengthHint"
  | "materialNotes"
  | "selectedPlatforms"
  | "twitterMode"
  | "general";

export type ReviewSeverity = "error" | "warning" | "tip";

export type InputReviewIssue = {
  severity: ReviewSeverity;
  field: ReviewField;
  title: string;
  message: string;
  suggestion?: string;
};

export type InputReviewResult = {
  status: "pass" | "needs_attention";
  summary: string;
  issues: InputReviewIssue[];
};

export type AiPolishPayload = {
  platform: PlatformType;
  input: TaskInput;
  contents: TaskContents;
};
