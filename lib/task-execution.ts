import { PLATFORM_LABELS } from "@/lib/platforms";
import type { PlatformType, TaskContents } from "@/types/content";
import type { SubTask, TaskExecution, TaskInput } from "@/types/task";

type PersistedTaskContents = TaskContents & {
  __meta?: {
    execution?: TaskExecution;
  };
};

type RunSubTask = (subTask: SubTask) => Promise<{
  platform: PlatformType;
  content: TaskContents[PlatformType];
  result: string;
}>;

type ProgressCallback = (execution: TaskExecution, contents: TaskContents) => Promise<void> | void;

function cloneExecution(execution: TaskExecution): TaskExecution {
  return {
    ...execution,
    subTasks: execution.subTasks.map((subTask) => ({ ...subTask })),
  };
}

function deriveExecutionStatus(execution: TaskExecution): TaskExecution["status"] {
  if (execution.subTasks.some((subTask) => subTask.status === "failed")) {
    return "failed";
  }

  if (execution.subTasks.every((subTask) => subTask.status === "completed")) {
    return "completed";
  }

  if (execution.subTasks.some((subTask) => subTask.status === "running")) {
    return "running";
  }

  return "pending";
}

function updateSubTask(
  execution: TaskExecution,
  subTaskId: string,
  updater: (subTask: SubTask) => SubTask,
) {
  const nextExecution = cloneExecution(execution);
  nextExecution.subTasks = nextExecution.subTasks.map((subTask) =>
    subTask.id === subTaskId ? updater(subTask) : subTask,
  );
  nextExecution.status = deriveExecutionStatus(nextExecution);
  return nextExecution;
}

export function createTaskExecution(input: TaskInput): TaskExecution {
  return {
    id: crypto.randomUUID(),
    originalGoal: input.topic,
    strategy: "abort_on_failure",
    status: "pending",
    subTasks: input.selectedPlatforms.map((platform, index) => ({
      id: `${platform}-${index + 1}`,
      title: `生成${PLATFORM_LABELS[platform]}内容`,
      goal: `完成 ${PLATFORM_LABELS[platform]} 平台版本生成`,
      platform,
      status: "pending",
    })),
  };
}

export function hasRemainingSubTasks(task: TaskExecution) {
  return task.subTasks.some((subTask) => subTask.status === "pending");
}

export function getNextRunnableSubTask(task: TaskExecution) {
  return task.subTasks.find((subTask) => subTask.status === "pending");
}

export function markRunning(execution: TaskExecution, subTaskId: string) {
  const nextExecution = updateSubTask(execution, subTaskId, (subTask) => ({
    ...subTask,
    status: "running",
    error: undefined,
  }));
  console.info("[task-execution] sub task running", {
    subTaskId,
    completedCount: nextExecution.subTasks.filter((subTask) => subTask.status === "completed").length,
    total: nextExecution.subTasks.length,
  });
  return nextExecution;
}

export function markCompleted(execution: TaskExecution, subTaskId: string, result: string) {
  const nextExecution = updateSubTask(execution, subTaskId, (subTask) => ({
    ...subTask,
    status: "completed",
    result,
    error: undefined,
  }));
  console.info("[task-execution] sub task completed", {
    subTaskId,
    result,
  });
  return nextExecution;
}

export function markFailed(execution: TaskExecution, subTaskId: string, error: string) {
  const nextExecution = updateSubTask(execution, subTaskId, (subTask) => ({
    ...subTask,
    status: "failed",
    error,
  }));
  console.error("[task-execution] sub task failed", {
    subTaskId,
    error,
  });
  return nextExecution;
}

export function finalizeTaskStatus(execution: TaskExecution) {
  const nextExecution = cloneExecution(execution);
  nextExecution.status = deriveExecutionStatus(nextExecution);
  console.info("[task-execution] task finalized", {
    status: nextExecution.status,
    subTaskCount: nextExecution.subTasks.length,
  });
  return nextExecution;
}

export async function executeTaskGenerationPlan(
  input: TaskInput,
  runSubTask: RunSubTask,
  onProgress?: ProgressCallback,
) {
  let execution = createTaskExecution(input);
  let contents: TaskContents = {};

  execution = {
    ...execution,
    status: "running",
  };

  console.info("[task-execution] initialized", {
    subTaskCount: execution.subTasks.length,
    strategy: execution.strategy,
    goal: execution.originalGoal,
  });
  await onProgress?.(execution, contents);

  while (hasRemainingSubTasks(execution)) {
    const next = getNextRunnableSubTask(execution);
    if (!next) {
      break;
    }

    execution = markRunning(execution, next.id);
    await onProgress?.(execution, contents);

    try {
      const result = await runSubTask(next);
      contents = {
        ...contents,
        [result.platform]: result.content,
      };
      execution = markCompleted(execution, next.id, result.result);
      await onProgress?.(execution, contents);
    } catch (error) {
      const message = error instanceof Error ? error.message : "子任务执行失败";
      execution = markFailed(execution, next.id, message);
      execution = finalizeTaskStatus(execution);
      await onProgress?.(execution, contents);
      break;
    }
  }

  execution = finalizeTaskStatus(execution);
  await onProgress?.(execution, contents);

  return {
    contents,
    execution,
  };
}

export function attachExecutionMetadata(contents: TaskContents, execution: TaskExecution): PersistedTaskContents {
  return {
    ...contents,
    __meta: {
      execution,
    },
  };
}

export function readTaskExecutionFromContents(contents: unknown) {
  const value = contents as PersistedTaskContents | null | undefined;
  return value?.__meta?.execution;
}

export function stripTaskContentMetadata(contents: unknown): TaskContents {
  const value = (contents ?? {}) as PersistedTaskContents;
  const { __meta: _meta, ...rest } = value;
  return rest as TaskContents;
}
