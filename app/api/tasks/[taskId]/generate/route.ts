import { NextResponse } from "next/server";

import { generateTaskContents } from "@/lib/content-generation";
import { prisma } from "@/lib/prisma";
import { getOrCreateSettings } from "@/lib/settings-service";
import { attachExecutionMetadata } from "@/lib/task-execution";
import { serializeTask } from "@/lib/task-serializers";
import type { TaskInput } from "@/types/task";

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

  if (existing.status !== "generating") {
    return NextResponse.json(serializeTask(existing));
  }

  try {
    const settings = await getOrCreateSettings();
    const input = existing.input as TaskInput;
    const generatedContents = await generateTaskContents(input, settings, taskId, async (execution, contents) => {
      await prisma.task.update({
        where: { id: taskId },
        data: {
          status:
            execution.status === "failed"
              ? "failed"
              : execution.status === "completed"
                ? "generated"
                : "generating",
          contents: attachExecutionMetadata(contents, execution),
        },
      });
    });

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        contents: attachExecutionMetadata(generatedContents.contents, generatedContents.execution),
        status: generatedContents.execution.status === "failed" ? "failed" : "generated",
      },
    });

    if (generatedContents.execution.status === "failed") {
      const failedSubTask = generatedContents.execution.subTasks.find((subTask) => subTask.status === "failed");
      return NextResponse.json(
        {
          message: failedSubTask?.error || "内容生成失败",
          task: serializeTask(task),
        },
        { status: 502 },
      );
    }

    return NextResponse.json(serializeTask(task));
  } catch (error) {
    const message = error instanceof Error ? error.message : "内容生成失败";

    const fallbackTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: "failed",
      },
    });

    return NextResponse.json(
      {
        message,
        task: serializeTask(fallbackTask),
      },
      { status: 502 },
    );
  }
}
