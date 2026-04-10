"use client";

import { ImagePlus } from "lucide-react";

import type { XiaohongshuContent } from "@/types/content";

import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function XiaohongshuEditor({
  content,
  onChange,
}: {
  content: XiaohongshuContent;
  onChange: (content: XiaohongshuContent) => void;
}) {
  return (
    <div className="space-y-5">
      <SectionCard title="图片区" description="V1 只做占位和上传入口展示，最多 9 张。">
        <div className="grid gap-3 md:grid-cols-3">
          {content.images.map((image, index) => (
            <div key={image.id} className="rounded-2xl border bg-card/80 p-4">
              <div className="flex aspect-square items-center justify-center rounded-2xl border border-dashed bg-muted text-center text-sm text-muted-foreground">
                {image.placeholder || image.url || `图片占位 ${index + 1}`}
              </div>
              <Input
                className="mt-3"
                value={image.caption || ""}
                placeholder="图片说明"
                onChange={(event) => {
                  const images = [...content.images];
                  images[index] = { ...image, caption: event.target.value };
                  onChange({ ...content, images });
                }}
              />
            </div>
          ))}
          {content.images.length < 9 ? (
            <button
              type="button"
              className="flex aspect-square flex-col items-center justify-center rounded-2xl border border-dashed bg-card/50 text-sm text-muted-foreground transition hover:border-primary/40"
            >
              <ImagePlus className="mb-2 size-5" />
              上传入口占位
            </button>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard title="文案区">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>标题</Label>
            <Input value={content.title} onChange={(event) => onChange({ ...content, title: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>正文</Label>
            <Textarea
              value={content.body}
              className="min-h-48"
              onChange={(event) => onChange({ ...content, body: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Hashtags</Label>
            <Input
              value={content.hashtags.join(", ")}
              placeholder="内容创作, 多平台运营"
              onChange={(event) =>
                onChange({
                  ...content,
                  hashtags: event.target.value
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean),
                })
              }
            />
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
