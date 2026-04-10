import type { AppSettings as PrismaAppSettings, Task as PrismaTask } from "@prisma/client";

import type { Task } from "@/types/task";
import type { AppSettings } from "@/types/settings";

export function serializeTask(record: PrismaTask): Task {
  return {
    id: record.id,
    title: record.title,
    status: record.status as Task["status"],
    selectedPlatforms: record.selectedPlatforms as Task["selectedPlatforms"],
    input: record.input as Task["input"],
    contents: record.contents as Task["contents"],
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export function serializeSettings(record: PrismaAppSettings): AppSettings {
  return record.settings as AppSettings;
}
