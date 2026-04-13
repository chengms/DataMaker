import { strict as assert } from "node:assert";
import { existsSync, readFileSync } from "node:fs";

assert.equal(
  existsSync("app/api/settings/platform-prompts/route.ts"),
  true,
  "Platform prompt settings API route is required.",
);

const settingsTypes = readFileSync("types/settings.ts", "utf8");
const settingsSchema = readFileSync("lib/schemas.ts", "utf8");
const settingsPageShell = readFileSync("components/settings/SettingsPageShell.tsx", "utf8");

assert.equal(
  settingsTypes.includes("platformPrompts"),
  true,
  "AppSettings should expose a top-level platformPrompts config.",
);

assert.equal(
  settingsSchema.includes("platformPromptConfigSchema"),
  true,
  "A dedicated platform prompt config schema is required.",
);

assert.equal(
  settingsPageShell.includes("Platform Prompt Settings"),
  true,
  "Settings page should render a dedicated Platform Prompt Settings module.",
);

console.log("Platform prompt settings structure is in place.");
