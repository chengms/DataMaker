import { strict as assert } from "node:assert";

import { executeTaskGenerationPlan } from "@/lib/task-execution";
import type { TaskContents } from "@/types/content";
import type { TaskInput } from "@/types/task";

const sampleInput: TaskInput = {
  topic: "AI 内容工作流",
  selectedPlatforms: ["wechat", "xiaohongshu", "twitter"],
  twitterMode: "single",
};

async function runSuccessCase() {
  const transitions: string[] = [];
  const result = await executeTaskGenerationPlan(
    sampleInput,
    async (subTask) => {
      if (!subTask.platform) {
        throw new Error("missing platform");
      }

      return {
        platform: subTask.platform,
        content: { title: subTask.title } as TaskContents[typeof subTask.platform],
        result: `${subTask.title} done`,
      };
    },
    async (execution) => {
      transitions.push(execution.status);
    },
  );

  assert.equal(result.execution.status, "completed", "All successful sub tasks should complete the task.");
  assert.equal(
    result.execution.subTasks.every((subTask) => subTask.status === "completed"),
    true,
    "All sub tasks should be marked completed in the success case.",
  );
  assert.equal(transitions.includes("running"), true, "Execution should enter the running state.");
}

async function runFailureCase() {
  const result = await executeTaskGenerationPlan(sampleInput, async (subTask) => {
    if (subTask.platform === "xiaohongshu") {
      throw new Error("xiaohongshu failed");
    }

    if (!subTask.platform) {
      throw new Error("missing platform");
    }

    return {
      platform: subTask.platform,
      content: { title: subTask.title } as TaskContents[typeof subTask.platform],
      result: `${subTask.title} done`,
    };
  });

  assert.equal(result.execution.status, "failed", "A failed sub task should fail the overall task.");
  assert.equal(
    result.execution.subTasks.find((subTask) => subTask.platform === "xiaohongshu")?.status,
    "failed",
    "The failing sub task should be marked failed.",
  );
  assert.equal(
    result.execution.subTasks.find((subTask) => subTask.platform === "twitter")?.status,
    "pending",
    "Abort-on-failure strategy should leave later sub tasks pending.",
  );
}

async function main() {
  await runSuccessCase();
  await runFailureCase();

  console.log("Task execution runtime behavior is correct.");
}

void main();
