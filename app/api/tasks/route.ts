import { NextResponse } from "next/server";

import { buildTaskTitle } from "@/lib/mockGenerators";
import { fetchTopicArticlesFromDataAgent } from "@/lib/data-agent";
import { prisma } from "@/lib/prisma";
import { taskInputSchema } from "@/lib/schemas";
import { getOrCreateSettings } from "@/lib/settings-service";
import { attachExecutionMetadata, createTaskExecution } from "@/lib/task-execution";
import { serializeTask } from "@/lib/task-serializers";

export async function GET() {
  const tasks = await prisma.task.findMany({
    orderBy: {
      updatedAt: "desc",
    },
  });

  return NextResponse.json(tasks.map(serializeTask));
}

export async function POST(request: Request) {
  const payload = await request.json();
  const input = taskInputSchema.parse(payload);
  const settings = await getOrCreateSettings();
  const enabledPlatforms = input.selectedPlatforms.filter((platform) => settings[platform].enabled);

  if (enabledPlatforms.length === 0) {
    return NextResponse.json(
      { message: "当前没有可用平台，请先到设置页启用至少一个平台" },
      { status: 400 },
    );
  }

  if (enabledPlatforms.length !== input.selectedPlatforms.length) {
    return NextResponse.json(
      { message: "提交中包含已禁用平台，请刷新首页后重试" },
      { status: 400 },
    );
  }

  // 如果指定了 topicId 且 DataAgent 已启用，自动获取文章素材
  let sourceArticles = input.sourceArticles ?? [];
  if (input.topicId && settings.dataAgent.enabled) {
    try {
      sourceArticles = await fetchTopicArticlesFromDataAgent(
        settings.dataAgent.baseUrl,
        input.topicId,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "获取选题素材失败";
      return NextResponse.json(
        { message: `获取选题素材时出错：${message}。任务将使用空素材创建。` },
        { status: 200 }, // 不阻塞创建，只警告
      );
    }
  }

  const normalizedInput = {
    ...input,
    selectedPlatforms: enabledPlatforms,
    sourceArticles,
  };

  const created = await prisma.task.create({
    data: {
      title: buildTaskTitle(normalizedInput),
      status: "generating",
      selectedPlatforms: enabledPlatforms,
      input: normalizedInput,
      contents: attachExecutionMetadata({}, createTaskExecution(normalizedInput, settings)),
    },
  });

  return NextResponse.json(serializeTask(created), { status: 201 });
}
