"use client";

import type { WechatContent } from "@/types/content";

import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function WechatEditor({
  content,
  onChange,
}: {
  content: WechatContent;
  onChange: (content: WechatContent) => void;
}) {
  return (
    <div className="space-y-5">
      <SectionCard title="基础信息" description="公众号内容支持标题、摘要、section 结构和 CTA。">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>标题</Label>
            <Input value={content.title} onChange={(event) => onChange({ ...content, title: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>摘要 / 引言</Label>
            <Textarea
              value={content.summary}
              onChange={(event) => onChange({ ...content, summary: event.target.value })}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="正文 Sections">
        <div className="space-y-4">
          {content.sections.map((section, index) => (
            <div key={index} className="rounded-2xl border bg-card/80 p-4">
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Section 标题</Label>
                  <Input
                    value={section.heading || ""}
                    onChange={(event) => {
                      const sections = [...content.sections];
                      sections[index] = { ...section, heading: event.target.value };
                      onChange({ ...content, sections });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>正文</Label>
                  <Textarea
                    value={section.body}
                    onChange={(event) => {
                      const sections = [...content.sections];
                      sections[index] = { ...section, body: event.target.value };
                      onChange({ ...content, sections });
                    }}
                    className="min-h-36"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>引用</Label>
                    <Textarea
                      value={section.quote || ""}
                      onChange={(event) => {
                        const sections = [...content.sections];
                        sections[index] = { ...section, quote: event.target.value };
                        onChange({ ...content, sections });
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>配图占位</Label>
                    <Textarea
                      value={section.imagePlaceholder || ""}
                      onChange={(event) => {
                        const sections = [...content.sections];
                        sections[index] = { ...section, imagePlaceholder: event.target.value };
                        onChange({ ...content, sections });
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}

          <Button
            variant="outline"
            onClick={() =>
              onChange({
                ...content,
                sections: [...content.sections, { heading: "", body: "", quote: "", imagePlaceholder: "" }],
              })
            }
          >
            新增 Section
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="CTA">
        <div className="space-y-2">
          <Label>结尾行动引导</Label>
          <Textarea value={content.cta} onChange={(event) => onChange({ ...content, cta: event.target.value })} />
        </div>
      </SectionCard>
    </div>
  );
}
