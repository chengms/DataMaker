import { PrismaClient } from "@prisma/client";

import { DEFAULT_APP_SETTINGS } from "@/lib/default-settings";

const prisma = new PrismaClient();

async function main() {
  await prisma.appSettings.upsert({
    where: { id: "default" },
    update: { settings: DEFAULT_APP_SETTINGS },
    create: {
      id: "default",
      settings: DEFAULT_APP_SETTINGS,
    },
  });
}

main()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
