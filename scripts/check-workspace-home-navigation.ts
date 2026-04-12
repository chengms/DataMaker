import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";

const source = readFileSync("components/workspace/WorkspaceHeader.tsx", "utf8");

assert.equal(
  source.includes('href="/"'),
  true,
  "Workspace header should provide a link back to the home page.",
);

assert.equal(
  source.includes("返回主界面") || source.includes("新建任务"),
  true,
  "Workspace header should expose a clear return/create-task action.",
);

console.log("Workspace home navigation is present.");
