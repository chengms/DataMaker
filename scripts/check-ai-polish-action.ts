import { strict as assert } from "node:assert";
import { existsSync, readFileSync } from "node:fs";

const actions = readFileSync("components/workspace/WorkspaceActions.tsx", "utf8");
const shell = readFileSync("components/workspace/WorkspaceShell.tsx", "utf8");

assert.equal(
  actions.includes("降AI风格"),
  true,
  "WorkspaceActions should expose a de-AI-style action.",
);

assert.equal(
  shell.includes("handleAiPolish"),
  true,
  "WorkspaceShell should wire the AI style polishing action.",
);

assert.equal(
  existsSync("app/api/tasks/[taskId]/ai-polish/route.ts"),
  true,
  "AI polish API route is required.",
);

console.log("AI polish action is present.");
