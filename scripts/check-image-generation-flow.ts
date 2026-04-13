import { strict as assert } from "node:assert";
import { existsSync, readFileSync } from "node:fs";

assert.equal(
  existsSync("lib/image-generation/minimax.ts"),
  true,
  "MiniMax image generation service module is required.",
);

const settingsTypes = readFileSync("types/settings.ts", "utf8");
const contentTypes = readFileSync("types/content.ts", "utf8");
const imageSettingsForm = readFileSync("components/settings/ImageGenerationSettingsForm.tsx", "utf8");
const previewSource = readFileSync("components/workspace/WorkspacePreviewContent.tsx", "utf8");

assert.equal(
  settingsTypes.includes("ImageGenerationSettings"),
  true,
  "ImageGenerationSettings should be added to app settings.",
);

assert.equal(
  contentTypes.includes('type: "image"'),
  true,
  "Article content types should support image blocks.",
);

assert.equal(
  imageSettingsForm.includes("图片风格预设") && imageSettingsForm.includes("MiniMax"),
  true,
  "Settings page should include image style preset controls.",
);

assert.equal(
  previewSource.includes("图片生成中") || previewSource.includes("图片用途"),
  true,
  "Preview should render image blocks with generation states.",
);

console.log("Image generation flow structure is in place.");
