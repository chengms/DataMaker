"use client";

import { Plus, Trash2 } from "lucide-react";

import type { TwitterContent } from "@/types/content";

import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function TwitterEditor({
  content,
  onChange,
}: {
  content: TwitterContent;
  onChange: (content: TwitterContent) => void;
}) {
  return (
    <div className="space-y-5">
      <SectionCard title="Twitter 模式">
        <Tabs
          value={content.mode}
          onValueChange={(mode) => {
            if (mode === "single") {
              onChange({ mode: "single", text: "" });
              return;
            }

            onChange({
              mode: "thread",
              tweets: [
                { id: crypto.randomUUID(), text: "" },
                { id: crypto.randomUUID(), text: "" },
                { id: crypto.randomUUID(), text: "" },
              ],
            });
          }}
        >
          <TabsList>
            <TabsTrigger value="single">Single</TabsTrigger>
            <TabsTrigger value="thread">Thread</TabsTrigger>
          </TabsList>
        </Tabs>
      </SectionCard>

      {content.mode === "single" ? (
        <SectionCard title="Single Tweet">
          <div className="space-y-2">
            <Label>文本</Label>
            <Textarea
              className="min-h-40"
              value={content.text}
              onChange={(event) => onChange({ ...content, text: event.target.value })}
            />
            <p className="text-right text-xs text-muted-foreground">{content.text.length} / 280</p>
          </div>
        </SectionCard>
      ) : (
        <SectionCard title="Thread Tweets">
          <div className="space-y-4">
            {content.tweets.map((tweet, index) => (
              <div key={tweet.id} className="rounded-2xl border bg-card/80 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium">Tweet {index + 1}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      onChange({
                        ...content,
                        tweets: content.tweets.filter((item) => item.id !== tweet.id),
                      })
                    }
                    disabled={content.tweets.length <= 1}
                  >
                    <Trash2 className="size-4" />
                    删除
                  </Button>
                </div>
                <Textarea
                  value={tweet.text}
                  onChange={(event) =>
                    onChange({
                      ...content,
                      tweets: content.tweets.map((item) =>
                        item.id === tweet.id ? { ...item, text: event.target.value } : item,
                      ),
                    })
                  }
                />
                <p className="mt-2 text-right text-xs text-muted-foreground">{tweet.text.length} / 280</p>
              </div>
            ))}

            <Button
              variant="outline"
              onClick={() =>
                onChange({
                  ...content,
                  tweets: [...content.tweets, { id: crypto.randomUUID(), text: "" }],
                })
              }
            >
              <Plus className="size-4" />
              新增 Tweet
            </Button>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
