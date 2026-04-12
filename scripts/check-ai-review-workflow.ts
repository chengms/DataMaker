import { strict as assert } from "node:assert";
import { existsSync, readFileSync } from "node:fs";

const createTaskForm = readFileSync("components/create-task/CreateTaskForm.tsx", "utf8");

assert.equal(
  createTaskForm.includes("AI检查输入"),
  true,
  "CreateTaskForm should expose an AI input review action.",
);

assert.equal(
  createTaskForm.includes("生成前自动检查"),
  true,
  "CreateTaskForm should allow automatic input review before generation.",
);

assert.equal(
  existsSync("app/api/input-review/route.ts"),
  true,
  "Input review API route is required.",
);

console.log("AI input review workflow is present.");
