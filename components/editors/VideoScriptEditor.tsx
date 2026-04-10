"use client";

import type { VideoScriptContent } from "@/types/content";

import { SectionCard } from "@/components/common/SectionCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function VideoScriptEditor({
  content,
  onChange,
}: {
  content: VideoScriptContent;
  onChange: (content: VideoScriptContent) => void;
}) {
  return (
    <div className="space-y-5">
      <SectionCard title="基础信息">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>标题</Label>
            <Input value={content.title} onChange={(event) => onChange({ ...content, title: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>时长</Label>
            <Input
              value={content.duration}
              onChange={(event) => onChange({ ...content, duration: event.target.value })}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="脚本结构">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Hook</Label>
            <Textarea value={content.hook} onChange={(event) => onChange({ ...content, hook: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Body</Label>
            <Textarea
              className="min-h-40"
              value={content.body}
              onChange={(event) => onChange({ ...content, body: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Transition</Label>
            <Textarea
              value={content.transition}
              onChange={(event) => onChange({ ...content, transition: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Ending CTA</Label>
            <Textarea
              value={content.endingCta}
              onChange={(event) => onChange({ ...content, endingCta: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Voiceover Notes</Label>
            <Textarea
              value={content.voiceoverNotes}
              onChange={(event) => onChange({ ...content, voiceoverNotes: event.target.value })}
            />
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
