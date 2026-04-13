import { strict as assert } from "node:assert";

import { getDefaultSettings, normalizeSettings } from "@/lib/settings-service";
import { buildFinalSystemPrompt } from "@/lib/platform-prompt-settings";

const normalizedSettings = normalizeSettings({});
const defaultSettings = getDefaultSettings();

assert.equal(
  normalizedSettings.platformPrompts.wechat,
  "",
  "Normalized editable platform prompt should default to an empty string.",
);

assert.equal(
  typeof defaultSettings.platformPrompts.wechat,
  "string",
  "Default settings should expose a default prompt for WeChat.",
);

const defaultPromptResult = buildFinalSystemPrompt("wechat", normalizedSettings, "runtime-rule");

assert.equal(
  defaultPromptResult.source,
  "default",
  "Empty editable prompt should fall back to the default prompt source.",
);
assert.equal(
  defaultPromptResult.finalSystemPrompt.includes(defaultPromptResult.baseSystemPrompt),
  true,
  "Final system prompt should keep the base system prompt.",
);
assert.equal(
  defaultPromptResult.finalSystemPrompt.includes(defaultPromptResult.defaultPlatformPrompt),
  true,
  "Final system prompt should include the default platform prompt when no custom prompt is set.",
);
assert.equal(
  defaultPromptResult.finalSystemPrompt.includes("runtime-rule"),
  true,
  "Final system prompt should append runtime constraints.",
);

const customPromptSettings = normalizeSettings({
  platformPrompts: {
    wechat: "使用更强的公众号主编口吻。",
  },
});
const customPromptResult = buildFinalSystemPrompt("wechat", customPromptSettings);

assert.equal(
  customPromptResult.source,
  "user_custom",
  "Custom platform prompt should be preferred over the default prompt.",
);
assert.equal(
  customPromptResult.finalSystemPrompt.includes("使用更强的公众号主编口吻。"),
  true,
  "Custom prompt should be appended into the final system prompt.",
);

console.log("Platform prompt runtime behavior is correct.");
