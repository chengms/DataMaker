import { z } from "zod";

export const platformTypeSchema = z.enum([
  "wechat",
  "xiaohongshu",
  "twitter",
  "video_script",
]);

export const twitterModeSchema = z.enum(["single", "thread"]);

export const taskInputSchema = z
  .object({
    topic: z.string().trim().min(1, "请输入创作主题"),
    audience: z.string().trim().optional(),
    tone: z.string().trim().optional(),
    contentGoal: z.string().trim().optional(),
    lengthHint: z.string().trim().optional(),
    materialNotes: z.string().trim().optional(),
    aiPrecheckEnabled: z.boolean().optional(),
    aiAutoFixEnabled: z.boolean().optional(),
    selectedPlatforms: z.array(platformTypeSchema).min(1, "至少选择一个平台"),
    twitterMode: twitterModeSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.selectedPlatforms.includes("twitter") && !value.twitterMode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "选择 Twitter 时需要指定模式",
        path: ["twitterMode"],
      });
    }
  });

export const patchTaskSchema = z.object({
  status: z
    .enum(["draft", "generating", "generated", "edited", "published_mock"])
    .optional(),
  contents: z.record(z.string(), z.unknown()).optional(),
});

export const platformPromptSettingsSchema = z.object({
  enabled: z.boolean(),
  systemPrompt: z.string(),
  defaultTone: z.string().optional(),
  defaultLength: z.string().optional(),
  extraRules: z.string().optional(),
});

export const providerSettingsSchema = z.object({
  provider: z.string().trim().min(1, "请输入 provider 名称"),
  apiKey: z.string().trim().optional(),
  baseUrl: z.string().trim().url("请输入合法的 Base URL"),
  model: z.string().trim().min(1, "请输入模型名称"),
  temperature: z.coerce.number().min(0).max(2).optional(),
});

export const appSettingsSchema = z.object({
  provider: providerSettingsSchema,
  wechat: platformPromptSettingsSchema,
  xiaohongshu: platformPromptSettingsSchema,
  twitter: platformPromptSettingsSchema,
  video_script: platformPromptSettingsSchema,
});
