import { NextResponse } from "next/server";

import { buildTaskTitle } from "@/lib/mockGenerators";
import { prisma } from "@/lib/prisma";
import { taskInputSchema } from "@/lib/schemas";
import { getOrCreateSettings } from "@/lib/settings-service";
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

  const normalizedInput = {
    ...input,
    selectedPlatforms: enabledPlatforms,
  };

  const created = await prisma.task.create({
    data: {
      title: buildTaskTitle(normalizedInput),
      status: "generating",
      selectedPlatforms: enabledPlatforms,
      input: normalizedInput,
      contents: {},
    },
  });

  return NextResponse.json(serializeTask(created), { status: 201 });
}
