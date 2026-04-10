import { getServerEnvValue } from "@/lib/server-env";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type OpenAiCompatibleConfig = {
  apiKey?: string;
  baseUrl: string;
  model: string;
  temperature?: number;
};

type ChatCompletionsResponse = {
  code?: number;
  message?: string;
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

function trimBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, "");
}

function resolveModelName(config: OpenAiCompatibleConfig) {
  const normalizedBaseUrl = trimBaseUrl(config.baseUrl);

  if (
    normalizedBaseUrl.includes("api.siliconflow.cn") &&
    (config.model === "zai-org/GLM-5" || config.model === "zai-org/GLM-5.1")
  ) {
    return `Pro/${config.model}`;
  }

  return config.model;
}

function getMessageText(
  content: string | Array<{ type?: string; text?: string }> | undefined,
) {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => (item?.type === "text" || item?.text ? item.text : ""))
      .filter(Boolean)
      .join("\n");
  }

  return "";
}

export async function createOpenAiCompatibleCompletion(
  config: OpenAiCompatibleConfig,
  messages: ChatMessage[],
) {
  const apiKey = config.apiKey || getServerEnvValue("LLM_API_KEY");

  if (!apiKey) {
    throw new Error("当前未配置 API Key，请先到设置页或环境变量中配置");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 180_000);

  try {
    const response = await fetch(`${trimBaseUrl(config.baseUrl)}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: resolveModelName(config),
        temperature: config.temperature ?? 0.7,
        messages,
      }),
      signal: controller.signal,
    });

    const data = (await response.json().catch(() => null)) as ChatCompletionsResponse | null;

    if (!response.ok) {
      throw new Error(data?.error?.message || data?.message || "模型服务调用失败");
    }

    const content = getMessageText(data?.choices?.[0]?.message?.content);
    if (!content) {
      throw new Error("模型未返回有效内容");
    }

    return content;
  } finally {
    clearTimeout(timeout);
  }
}
