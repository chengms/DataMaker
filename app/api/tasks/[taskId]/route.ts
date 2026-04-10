import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { patchTaskSchema } from "@/lib/schemas";
import { serializeTask } from "@/lib/task-serializers";

type RouteContext = {
  params: Promise<{ taskId: string }>;
};

export async function GET(_: Request, context: RouteContext) {
  const { taskId } = await context.params;
  const task = await prisma.task.findUnique({
    where: { id: taskId },
  });

  if (!task) {
    return NextResponse.json({ message: "Task not found" }, { status: 404 });
  }

  return NextResponse.json(serializeTask(task));
}

export async function PATCH(request: Request, context: RouteContext) {
  const { taskId } = await context.params;
  const payload = await request.json();
  const parsed = patchTaskSchema.parse(payload);

  const existing = await prisma.task.findUnique({
    where: { id: taskId },
  });

  if (!existing) {
    return NextResponse.json({ message: "Task not found" }, { status: 404 });
  }

  const nextContents =
    parsed.contents !== undefined
      ? {
          ...(existing.contents as Record<string, unknown>),
          ...(parsed.contents as Record<string, unknown>),
        }
      : existing.contents;

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      status: parsed.status ?? existing.status,
      contents: nextContents,
    },
  });

  return NextResponse.json(serializeTask(task));
}
