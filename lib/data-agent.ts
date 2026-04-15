import type { SourceArticle } from "@/types/task";

const FETCH_TIMEOUT_MS = 30_000;

type DataAgentTopicArticlesResponse = {
  topic: {
    id: string;
    title: string;
    description: string;
    keywords: string[];
    status: string;
  };
  total: number;
  articles: Array<{
    id: string;
    title: string;
    creator: string;
    platform: string;
    publishTime: string;
    heat: number;
    engagementScore: number;
    summary: string;
    plainTextContent: string;
    matchedKeywords: string[];
  }>;
  message?: string;
};

export async function fetchTopicArticlesFromDataAgent(
  dataAgentUrl: string,
  topicId: string,
): Promise<SourceArticle[]> {
  const url = `${dataAgentUrl.replace(/\/$/, "")}/api/output/topics/${encodeURIComponent(topicId)}/articles`;

  const response = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "无法读取响应");
    throw new Error(`从 DataAgent 获取选题文章失败 (${response.status}): ${text}`);
  }

  const data = (await response.json()) as DataAgentTopicArticlesResponse;

  if (data.articles.length === 0) {
    return [];
  }

  return data.articles.map((article) => ({
    id: article.id,
    title: article.title,
    creator: article.creator,
    platform: article.platform,
    publishTime: article.publishTime,
    summary: article.summary,
    plainTextContent: article.plainTextContent,
    heat: article.heat,
    engagementScore: article.engagementScore,
    matchedKeywords: article.matchedKeywords,
  }));
}
