import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { serializeTask } from "@/lib/task-serializers";

type RouteContext = {
  params: Promise<{ taskId: string }>;
};

export async function POST(_: Request, context: RouteContext) {
  const { taskId } = await context.params;
  const existing = await prisma.task.findUnique({
    where: { id: taskId },
  });

  if (!existing) {
    return NextResponse.json({ message: "Task not found" }, { status: 404 });
  }

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      status: "published_mock",
    },
  });

  return NextResponse.json(serializeTask(task));
}
