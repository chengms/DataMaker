import { PrismaClient } from "@prisma/client";

import { getDefaultAppSettings } from "@/lib/default-settings";

const prisma = new PrismaClient();

async function main() {
  const settings = getDefaultAppSettings();

  await prisma.appSettings.upsert({
    where: { id: "default" },
    update: { settings },
    create: {
      id: "default",
      settings,
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
