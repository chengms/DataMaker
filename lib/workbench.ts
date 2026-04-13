import { getPlatformExportData } from "@/lib/export";
import { PLATFORM_LABELS, TASK_STATUS_LABELS } from "@/lib/platforms";
import type { PlatformType } from "@/types/content";
import type { Task, TaskContext, TaskInput, TaskReferenceArticle } from "@/types/task";

export function mapTaskInputToContext(input: TaskInput): TaskContext {
  return {
    topic: input.topic,
    audience: input.audience,
    tone: input.tone,
    goal: input.contentGoal,
    lengthHint: input.lengthHint,
    extraMaterials: input.materialNotes,
    aiPrecheckEnabled: input.aiPrecheckEnabled,
    aiAutoFixEnabled: input.aiAutoFixEnabled,
    selectedPlatforms: input.selectedPlatforms,
  };
}

export function getTaskSummaryItems(task: Task) {
  const context = mapTaskInputToContext(task.input);

  return [
    { label: "主题", value: context.topic },
    { label: "平台", value: context.selectedPlatforms.map((platform) => PLATFORM_LABELS[platform]).join(" / ") },
    { label: "受众", value: context.audience || "未指定" },
    { label: "语气", value: context.tone || "未指定" },
    { label: "长度", value: context.lengthHint || "未指定" },
    { label: "目标", value: context.goal || "未指定" },
  ];
}

export function getTaskSummaryMeta(task: Task) {
  const context = mapTaskInputToContext(task.input);

  return [
    context.aiPrecheckEnabled ? "AI 预检查已开启" : "AI 预检查未开启",
    context.aiAutoFixEnabled ? "自动修正策略已开启" : "自动修正策略待接入",
    `${task.selectedPlatforms.length} 个平台版本`,
  ];
}

export function buildWorkbenchTimeline(task: Task) {
  const items = [
    {
      id: "created",
      label: "任务创建",
      detail: `已接收主题“${task.input.topic}”并写入任务上下文。`,
    },
  ];

  if (task.status === "generating") {
    items.push({
      id: "generating",
      label: TASK_STATUS_LABELS.generating,
      detail: "工作台正在生成各平台内容，生成完成后会同步到右侧预览。",
    });
  }

  if (task.status === "generated" || task.status === "edited" || task.status === "published_mock") {
    items.push({
      id: "generated",
      label: TASK_STATUS_LABELS.generated,
      detail: `已生成 ${task.selectedPlatforms.length} 个平台版本，可继续精修与切换预览。`,
    });
  }

  if (task.status === "edited" || task.status === "published_mock") {
    items.push({
      id: "edited",
      label: TASK_STATUS_LABELS.edited,
      detail: "当前任务已有人工或 AI 协作修改记录。",
    });
  }

  if (task.status === "published_mock") {
    items.push({
      id: "published",
      label: TASK_STATUS_LABELS.published_mock,
      detail: "已完成发布前检查流程，可继续导出或复用当前版本。",
    });
  }

  return items;
}

export function getPlatformSourceText(task: Task, platform: PlatformType) {
  return getPlatformExportData(platform, task.contents).txt;
}

export function getReferenceArticlePlaceholders(task: Task): TaskReferenceArticle[] {
  const blocks = task.input.materialNotes
    ? task.input.materialNotes
        .split(/\n+/)
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  return [
    {
      id: "reference-placeholder",
      title: blocks.length > 0 ? "当前补充素材摘要" : "等待接入爬取参考文章",
      structure:
        blocks.length > 0
          ? ["主题背景", "重点素材", "预期结构参考"]
          : ["标题", "结构", "内容块"],
      blocks:
        blocks.length > 0
          ? blocks.slice(0, 3)
          : ["后续可展示参考文章标题", "后续可展示结构分段", "后续可展示正文块与排版节奏"],
      source: blocks.length > 0 ? "来自当前任务补充素材" : "预留给数据爬取平台",
    },
  ];
}
