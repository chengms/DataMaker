import { prisma } from "@/lib/prisma";
import { DEFAULT_APP_SETTINGS } from "@/lib/default-settings";
import { serializeSettings } from "@/lib/task-serializers";
import type { AppSettings } from "@/types/settings";

export async function getOrCreateSettings(): Promise<AppSettings> {
  const settings = await prisma.appSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      settings: DEFAULT_APP_SETTINGS,
    },
  });

  return serializeSettings(settings);
}
