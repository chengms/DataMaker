import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { generateMockContents, buildTaskTitle } from "@/lib/mockGenerators";
import { taskInputSchema } from "@/lib/schemas";
import { serializeTask } from "@/lib/task-serializers";

export async function GET() {
  const tasks = await prisma.task.findMany({
    orderBy: {
      updatedAt: "desc",
    },
  });

  return NextResponse.json(tasks.map(serializeTask));
}

export async function POST(request: Request) {
  const payload = await request.json();
  const input = taskInputSchema.parse(payload);

  const created = await prisma.task.create({
    data: {
      title: buildTaskTitle(input),
      status: "generating",
      selectedPlatforms: input.selectedPlatforms,
      input,
      contents: {},
    },
  });

  const generatedContents = generateMockContents(input);

  const task = await prisma.task.update({
    where: { id: created.id },
    data: {
      contents: generatedContents,
      status: "generated",
    },
  });

  return NextResponse.json(serializeTask(task), { status: 201 });
}
