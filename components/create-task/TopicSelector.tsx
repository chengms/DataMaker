"use client";

import { useEffect, useState } from "react";
import { ExternalLink, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type TopicItem = {
  id: string;
  title: string;
  description: string;
  articleCount: number;
  status: string;
};

type DataAgentTopicListResponse = {
  items: Array<{
    id: string;
    title: string;
    description: string;
    articleCount: number;
    status: string;
  }>;
  pagination: { total: number };
};

export function TopicSelector({
  value,
  dataAgentEnabled,
  dataAgentUrl,
  onChange,
}: {
  value: string;
  dataAgentEnabled: boolean;
  dataAgentUrl: string;
  onChange: (topicId: string) => void;
}) {
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (!dataAgentEnabled || !dataAgentUrl) return;

    async function fetchTopics() {
      setLoading(true);
      try {
        const baseUrl = dataAgentUrl.replace(/\/$/, "");
        const url = `${baseUrl}/api/output/topics?limit=50&status=ready,collecting`;
        const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
        if (!response.ok) return;
        const data = (await response.json()) as DataAgentTopicListResponse;
        setTopics(data.items ?? []);
      } catch {
        // 静默失败，不影响主流程
      } finally {
        setLoading(false);
      }
    }

    fetchTopics();
  }, [dataAgentEnabled, dataAgentUrl]);

  const filtered = topics.filter(
    (t) =>
      !search ||
      t.title.includes(search) ||
      t.description.includes(search),
  );

  const selectedTopic = topics.find((t) => t.id === value);

  if (!dataAgentEnabled) {
    return (
      <div className="space-y-2">
        <Label>关联选题（可选）</Label>
        <p className="text-sm text-muted-foreground">
          请先在设置页启用 DataAgent 数据源，才能关联选题。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>关联选题（可选）</Label>
        {selectedTopic && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => {
              onChange("");
              setSearch("");
            }}
          >
            清除选题
          </Button>
        )}
      </div>

      {selectedTopic ? (
        <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
          <div className="flex-1">
            <p className="font-medium text-primary">{selectedTopic.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {selectedTopic.description || "无描述"} · {selectedTopic.articleCount} 篇素材
            </p>
          </div>
          <ExternalLink className="size-4 text-muted-foreground" />
        </div>
      ) : (
        <div className="relative">
          <Input
            placeholder="搜索选题..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
          />

          {showDropdown && (
            <div className="absolute left-0 top-full z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-2xl border bg-white shadow-lg">
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
                </div>
              ) : filtered.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  {search ? "没有匹配的选题" : "暂无选题，请在 DataAgent 中创建"}
                </p>
              ) : (
                filtered.map((topic) => (
                  <button
                    key={topic.id}
                    type="button"
                    className="w-full px-4 py-3 text-left hover:bg-muted"
                    onClick={() => {
                      onChange(topic.id);
                      setSearch("");
                      setShowDropdown(false);
                    }}
                  >
                    <p className="font-medium">{topic.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {topic.description || "无描述"} · {topic.articleCount} 篇素材
                    </p>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        关联选题后，系统将自动获取该选题下的真实文章素材，用于辅助内容生成。
      </p>
    </div>
  );
}
