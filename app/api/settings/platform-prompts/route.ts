import { NextResponse } from "next/server";

import { platformPromptConfigSchema } from "@/lib/schemas";
import { getOrCreateSettings, saveSettings } from "@/lib/settings-service";
import { normalizeEditablePrompt } from "@/lib/platform-prompt-settings";

export async function GET() {
  const settings = await getOrCreateSettings();
  return NextResponse.json(settings.platformPrompts);
}

export async function PUT(request: Request) {
  const payload = await request.json();
  const partialSchema = platformPromptConfigSchema.partial();
  const prompts = partialSchema.parse(payload);
  const settings = await getOrCreateSettings();

  const nextPlatformPrompts = {
    ...settings.platformPrompts,
    ...Object.fromEntries(
      Object.entries(prompts).map(([key, value]) => [key, normalizeEditablePrompt(value)]),
    ),
  };

  const updated = await saveSettings({
    ...settings,
    platformPrompts: nextPlatformPrompts,
  });

  return NextResponse.json(updated.platformPrompts);
}
