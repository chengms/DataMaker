import { NextResponse } from "next/server";

import { getOrCreateSettings } from "@/lib/settings-service";
import { prisma } from "@/lib/prisma";
import { appSettingsSchema } from "@/lib/schemas";

export async function GET() {
  const settings = await getOrCreateSettings();
  return NextResponse.json(settings);
}

export async function PUT(request: Request) {
  const payload = await request.json();
  const settings = appSettingsSchema.parse(payload);

  const updated = await prisma.appSettings.upsert({
    where: { id: "default" },
    update: { settings },
    create: {
      id: "default",
      settings,
    },
  });

  return NextResponse.json(updated.settings);
}
