import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";

const source = readFileSync("components/create-task/CreateTaskForm.tsx", "utf8");

assert.equal(
  source.includes("selectedPlatforms.length === 0 ||"),
  false,
  "Submit button should not be disabled solely because no platform is selected.",
);

assert.equal(
  source.includes("请选择至少一个平台后再生成内容任务"),
  true,
  "CreateTaskForm should show a visible prompt when no platform is selected.",
);

console.log("Platform selection feedback is visible and submit remains available for validation.");
