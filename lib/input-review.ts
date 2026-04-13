import { z } from "zod";

import { extractJsonObject } from "@/lib/ai-json";
import { createOpenAiCompatibleCompletion } from "@/lib/openai-compatible";
import type { InputReviewResult } from "@/types/review";
import type { AppSettings } from "@/types/settings";
import type { TaskInput } from "@/types/task";

export const inputReviewRequestSchema = z.object({
  topic: z.string().trim(),
  audience: z.string().trim().optional(),
  tone: z.string().trim().optional(),
  contentGoal: z.string().trim().optional(),
  lengthHint: z.string().trim().optional(),
  materialNotes: z.string().trim().optional(),
  aiPrecheckEnabled: z.boolean().optional(),
  aiAutoFixEnabled: z.boolean().optional(),
  selectedPlatforms: z.array(
    z.enum(["wechat", "xiaohongshu", "twitter", "video_script"]),
  ),
  twitterMode: z.enum(["single", "thread"]).optional(),
});

const inputReviewResultSchema = z.object({
  status: z.enum(["pass", "needs_attention"]),
  summary: z.string().min(1),
  issues: z.array(
    z.object({
      severity: z.enum(["error", "warning", "tip"]),
      field: z.enum([
        "topic",
        "audience",
        "tone",
        "contentGoal",
        "lengthHint",
        "materialNotes",
        "selectedPlatforms",
        "twitterMode",
        "general",
      ]),
      title: z.string().min(1),
      message: z.string().min(1),
      suggestion: z.string().optional(),
    }),
  ),
});

function buildInputReviewPrompt(input: TaskInput) {
  return [
    "你是一个内容策划审核助手，负责在内容生成前检查用户输入是否会导致生成质量下降。",
    "请检查以下问题：信息是否缺失、是否矛盾、是否过于空泛、是否缺乏平台约束、是否难以执行。",
    "必须严格返回 JSON，不要返回 Markdown，不要解释，不要补充说明。",
    "JSON 结构必须是：",
    JSON.stringify(
      {
        status: "pass",
        summary: "string",
        issues: [
          {
            severity: "warning",
            field: "topic",
            title: "string",
            message: "string",
            suggestion: "string",
          },
        ],
      },
      null,
      2,
    ),
    "规则：",
    "- 如果输入已经足够清晰，status 返回 pass，issues 可以为空或只给 1-2 条 tip。",
    "- 如果存在明显问题，status 返回 needs_attention。",
    "- suggestion 要具体、可执行，直接告诉用户该补什么。",
    "- 如果选了 twitter 但没有说明 thread/single 重点，也可以提示。",
    "- 不要编造不存在的业务背景。",
    "当前输入：",
    JSON.stringify(input, null, 2),
  ].join("\n");
}

export async function reviewTaskInput(
  input: TaskInput,
  settings: AppSettings,
): Promise<InputReviewResult> {
  const content = await createOpenAiCompatibleCompletion(settings.provider, [
    {
      role: "system",
      content:
        "你是一位严谨但克制的内容策划审核专家，专门识别会降低生成质量的输入问题，并给出短而具体的修改建议。",
    },
    {
      role: "user",
      content: buildInputReviewPrompt(input),
    },
  ]);

  const parsed = JSON.parse(extractJsonObject(content)) as unknown;
  return inputReviewResultSchema.parse(parsed);
}
