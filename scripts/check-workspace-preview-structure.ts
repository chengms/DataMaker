import { strict as assert } from "node:assert";
import { existsSync, readFileSync } from "node:fs";

assert.equal(
  existsSync("components/workspace/WorkspacePreviewPanel.tsx"),
  true,
  "Workspace preview panel component is required.",
);

assert.equal(
  existsSync("components/workspace/WorkspacePreviewDialog.tsx"),
  true,
  "Workspace preview dialog component is required.",
);

const shellSource = readFileSync("components/workspace/WorkspaceShell.tsx", "utf8");

assert.equal(
  shellSource.includes("WorkspacePreviewPanel"),
  true,
  "WorkspaceShell should render an embedded preview panel.",
);

assert.equal(
  shellSource.includes("WorkspacePreviewDialog"),
  true,
  "WorkspaceShell should mount the expanded preview dialog.",
);

console.log("Workspace preview structure is in place.");
