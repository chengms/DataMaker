import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { getServerEnvValue } from "@/lib/server-env";

type MiniMaxSubjectReference = {
  type: "character";
  image_file: string;
};

type MiniMaxImageGenerationPayload = {
  model: "image-01";
  prompt: string;
  aspect_ratio: string;
  response_format: "base64";
  subject_reference?: MiniMaxSubjectReference[];
  prompt_optimizer?: boolean;
  aigc_watermark?: boolean;
  n?: number;
};

type MiniMaxImageGenerationResponse = {
  id?: string;
  data?: {
    image_base64?: string[] | string;
    images_base64?: string[] | string;
    image_urls?: string[];
  };
  base_resp?: {
    status_code?: number;
    status_msg?: string;
  };
  error?: {
    message?: string;
  };
  message?: string;
};

function ensureMiniMaxApiKey() {
  const apiKey = getServerEnvValue("MINIMAX_API_KEY");
  if (!apiKey) {
    throw new Error("未配置 MINIMAX_API_KEY，无法生成图片");
  }
  return apiKey;
}

function extractBase64Image(data: MiniMaxImageGenerationResponse["data"]) {
  const candidates = [
    data?.image_base64,
    data?.images_base64,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate) {
      return candidate;
    }
    if (Array.isArray(candidate) && candidate[0]) {
      return candidate[0];
    }
  }

  return null;
}

function detectFileExtension(buffer: Buffer) {
  if (buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return "png";
  }

  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpg";
  }

  if (buffer.length >= 4 && buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
    return "webp";
  }

  return "png";
}

async function saveGeneratedImage(taskId: string, imageId: string, imageBase64: string) {
  const buffer = Buffer.from(imageBase64, "base64");
  const extension = detectFileExtension(buffer);
  const relativeDir = path.join("generated-images", taskId);
  const outputDir = path.join(process.cwd(), "public", relativeDir);
  await mkdir(outputDir, { recursive: true });

  const filename = `${imageId}.${extension}`;
  const outputPath = path.join(outputDir, filename);
  await writeFile(outputPath, buffer);

  return {
    filePath: outputPath,
    publicUrl: `/${relativeDir}/${filename}`.replace(/\\/g, "/"),
  };
}

export async function generateMiniMaxImage({
  taskId,
  imageId,
  prompt,
  aspectRatio,
  referenceImages,
}: {
  taskId: string;
  imageId: string;
  prompt: string;
  aspectRatio: string;
  referenceImages?: string[];
}) {
  const apiKey = ensureMiniMaxApiKey();
  const payload: MiniMaxImageGenerationPayload = {
    model: "image-01",
    prompt,
    aspect_ratio: aspectRatio,
    response_format: "base64",
    n: 1,
  };

  if (referenceImages && referenceImages.length > 0) {
    payload.subject_reference = referenceImages.map((image) => ({
      type: "character",
      image_file: image,
    }));
  }

  const response = await fetch("https://api.minimaxi.com/v1/image_generation", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as MiniMaxImageGenerationResponse | null;
  if (!response.ok) {
    throw new Error(data?.error?.message || data?.message || "MiniMax 图片生成请求失败");
  }

  if (data?.base_resp?.status_code && data.base_resp.status_code !== 0) {
    throw new Error(data.base_resp.status_msg || "MiniMax 图片生成失败");
  }

  const imageBase64 = extractBase64Image(data?.data);
  if (!imageBase64) {
    throw new Error("MiniMax 未返回 base64 图片数据");
  }

  const saved = await saveGeneratedImage(taskId, imageId, imageBase64);

  return {
    provider: "minimax" as const,
    providerAssetId: data?.id || imageId,
    url: saved.publicUrl,
  };
}
