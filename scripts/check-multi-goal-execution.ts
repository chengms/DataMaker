import { strict as assert } from "node:assert";
import { existsSync, readFileSync } from "node:fs";

assert.equal(
  existsSync("lib/task-execution.ts"),
  true,
  "Task execution module is required.",
);

const taskTypes = readFileSync("types/task.ts", "utf8");
const executionSource = existsSync("lib/task-execution.ts")
  ? readFileSync("lib/task-execution.ts", "utf8")
  : "";
const generationSource = readFileSync("lib/content-generation.ts", "utf8");

assert.equal(
  taskTypes.includes("SubTaskStatus"),
  true,
  "Task types should define SubTaskStatus.",
);

assert.equal(
  taskTypes.includes("TaskExecution"),
  true,
  "Task types should define TaskExecution.",
);

assert.equal(
  executionSource.includes("while (hasRemainingSubTasks"),
  true,
  "Task execution should iterate until all remaining sub tasks are resolved.",
);

assert.equal(
  generationSource.includes("executeTaskGenerationPlan"),
  true,
  "Content generation should use the task execution plan runner.",
);

console.log("Multi-goal task execution structure is in place.");
