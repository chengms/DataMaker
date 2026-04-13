import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";

const homeSource = readFileSync("app/page.tsx", "utf8");
const workspaceShellSource = readFileSync("components/workspace/WorkspaceShell.tsx", "utf8");
const previewSource = readFileSync("components/workspace/WorkspacePreviewContent.tsx", "utf8");

assert.equal(
  homeSource.includes("创作入口"),
  true,
  "Home page should clearly frame Content Studio as the creation entry.",
);

assert.equal(
  workspaceShellSource.includes("内容创作工作台"),
  true,
  "Workspace should be labeled as the content creation workbench.",
);

assert.equal(
  workspaceShellSource.includes("任务摘要"),
  true,
  "Workspace should surface a compact task summary section.",
);

assert.equal(
  workspaceShellSource.includes("告诉我如何修改内容"),
  true,
  "Workspace should provide a multi-round modification prompt entry.",
);

assert.equal(
  previewSource.includes("原文"),
  true,
  "Preview area should support switching between source text and rendered preview.",
);

console.log("Workbench flow structure is in place.");
