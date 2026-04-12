import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getOrCreateSettings } from "@/lib/settings-service";
import { polishPlatformContent } from "@/lib/content-polish";
import { platformTypeSchema } from "@/lib/schemas";
import { serializeTask } from "@/lib/task-serializers";
import type { Task } from "@/types/task";
import { z } from "zod";

type RouteContext = {
  params: Promise<{ taskId: string }>;
};

const aiPolishSchema = z.object({
  platform: platformTypeSchema,
  contents: z.record(z.string(), z.unknown()),
  input: z.object({
    topic: z.string(),
    audience: z.string().optional(),
    tone: z.string().optional(),
    contentGoal: z.string().optional(),
    lengthHint: z.string().optional(),
    materialNotes: z.string().optional(),
    selectedPlatforms: z.array(platformTypeSchema),
    twitterMode: z.enum(["single", "thread"]).optional(),
  }),
});

export async function POST(request: Request, context: RouteContext) {
  const { taskId } = await context.params;
  const task = await prisma.task.findUnique({
    where: { id: taskId },
  });

  if (!task) {
    return NextResponse.json({ message: "Task not found" }, { status: 404 });
  }

  try {
    const payload = await request.json();
    const parsed = aiPolishSchema.parse(payload);
    const settings = await getOrCreateSettings();

    const polished = await polishPlatformContent(
      parsed.platform,
      parsed.input,
      parsed.contents as Task["contents"],
      settings,
    );

    return NextResponse.json({
      platform: parsed.platform,
      content: polished,
      task: serializeTask(task),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "降 AI 风格优化失败";
    return NextResponse.json({ message }, { status: 400 });
  }
}
