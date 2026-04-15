import { z } from "zod";

import { createOpenAiCompatibleCompletion } from "@/lib/openai-compatible";
import { buildFinalSystemPrompt } from "@/lib/platform-prompt-settings";
import type { XiaohongshuContent } from "@/types/content";
import type { AppSettings } from "@/types/settings";
import type { TaskInput } from "@/types/task";

const xiaohongshuContentSchema = z.object({
  images: z
    .array(
      z.object({
        id: z.string().min(1),
        placeholder: z.string().optional(),
        caption: z.string().optional(),
      }),
    )
    .min(1)
    .max(9),
  title: z.string().min(1),
  body: z.string().min(1),
  hashtags: z.array(z.string().min(1)).min(1).max(6),
});

function extractJsonObject(text: string) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("模型返回中未找到合法 JSON");
  }

  return cleaned.slice(start, end + 1);
}

function buildXiaohongshuPrompt(input: TaskInput, settings: AppSettings) {
  const sections: string[] = [
    "请根据下面的创作需求，输出一篇适合小红书发布的图文内容。",
    "必须严格返回 JSON，不要返回 Markdown，不要解释，不要补充说明。",
    "JSON 结构必须是：",
    JSON.stringify(
      {
        images: [{ id: "string", placeholder: "string", caption: "string" }],
        title: "string",
        body: "string",
        hashtags: ["string"],
      },
      null,
      2,
    ),
    "创作需求：",
    `- 主题：${input.topic}`,
    `- 受众：${input.audience || "未指定"}`,
    `- 语气：${input.tone || settings.xiaohongshu.defaultTone || "未指定"}`,
    `- 内容目标：${input.contentGoal || "未指定"}`,
    `- 长度提示：${input.lengthHint || settings.xiaohongshu.defaultLength || "未指定"}`,
    `- 素材备注：${input.materialNotes || "未指定"}`,
    `- 平台附加规则：${settings.xiaohongshu.extraRules || "无"}`,
  ];

  // 如果有真实文章素材，附加到 prompt 中
  if (input.sourceArticles && input.sourceArticles.length > 0) {
    const articleList = input.sourceArticles
      .slice(0, 5)
      .map(
        (article, index) =>
          `[素材 ${index + 1}] ${article.title}\n作者：${article.creator}\n摘要：${article.summary}\n正文片段：${article.plainTextContent.slice(0, 1000)}`,
      )
      .join("\n\n");
    sections.push(
      "\n参考素材（来自 DataAgent 内容池，请基于这些真实内容进行创作）：",
      articleList,
      "\n注意：可参考这些素材中的亮点、案例和数据，但要用自己的语言重新表达，符合小红书的分享风格。",
    );
  }

  sections.push(
    "- images 返回 3 张图片建议，每张图片给出唯一 id、占位说明和图片 caption。",
    "- body 写成适合小红书阅读的自然分段，不要只写提纲。",
    "- hashtags 返回 3 到 6 个，不要带 # 前缀。",
  );

  return sections.join("\n");
}

export async function generateXiaohongshuContent(
  input: TaskInput,
  settings: AppSettings,
): Promise<XiaohongshuContent> {
  const { finalSystemPrompt } = buildFinalSystemPrompt(
    "xiaohongshu",
    settings,
    "运行时约束：必须输出小红书图文 JSON，包含图片建议、标题、正文和 hashtags。",
  );
  const content = await createOpenAiCompatibleCompletion(settings.provider, [
    {
      role: "system",
      content: finalSystemPrompt,
    },
    {
      role: "user",
      content: buildXiaohongshuPrompt(input, settings),
    },
  ]);

  const parsed = JSON.parse(extractJsonObject(content)) as unknown;
  return xiaohongshuContentSchema.parse(parsed);
}
