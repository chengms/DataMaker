import { notFound } from "next/navigation";

import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { prisma } from "@/lib/prisma";
import { serializeTask } from "@/lib/task-serializers";

export const dynamic = "force-dynamic";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;
  const [task, tasks] = await Promise.all([
    prisma.task.findUnique({
      where: { id: taskId },
    }),
    prisma.task.findMany({
      orderBy: {
        updatedAt: "desc",
      },
    }),
  ]);

  if (!task) {
    notFound();
  }

  return (
    <WorkspaceShell
      taskId={taskId}
      initialTask={serializeTask(task)}
      initialHistoryTasks={tasks.map(serializeTask)}
    />
  );
}
