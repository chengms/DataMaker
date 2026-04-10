import { NextResponse } from "next/server";

import { appSettingsSchema } from "@/lib/schemas";
import { getOrCreateSettings, saveSettings } from "@/lib/settings-service";

export async function GET() {
  const settings = await getOrCreateSettings();
  return NextResponse.json(settings);
}

export async function PUT(request: Request) {
  const payload = await request.json();
  const settings = appSettingsSchema.parse(payload);
  const updated = await saveSettings(settings);
  return NextResponse.json(updated);
}
