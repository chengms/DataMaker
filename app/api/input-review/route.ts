import { NextResponse } from "next/server";

import { reviewTaskInput, inputReviewRequestSchema } from "@/lib/input-review";
import { getOrCreateSettings } from "@/lib/settings-service";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const input = inputReviewRequestSchema.parse(payload);
    const settings = await getOrCreateSettings();
    const result = await reviewTaskInput(input, settings);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI 输入检查失败";
    return NextResponse.json({ message }, { status: 400 });
  }
}
