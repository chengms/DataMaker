"use client";

import { Copy, Download, Rocket, Save } from "lucide-react";

import { Button } from "@/components/ui/button";

type WorkspaceActionsProps = {
  onSave: () => void | Promise<void>;
  onCopy: () => void;
  onExportTxt: () => void;
  onExportJson: () => void;
  onMockPublish: () => void | Promise<void>;
  isSaving?: boolean;
  isPublishing?: boolean;
};

export function WorkspaceActions({
  onSave,
  onCopy,
  onExportTxt,
  onExportJson,
  onMockPublish,
  isSaving,
  isPublishing,
}: WorkspaceActionsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <Button onClick={() => void onSave()} disabled={isSaving}>
        <Save className="size-4" />
        保存
      </Button>
      <Button variant="outline" onClick={onCopy}>
        <Copy className="size-4" />
        复制
      </Button>
      <Button variant="outline" onClick={onExportTxt}>
        <Download className="size-4" />
        导出 TXT
      </Button>
      <Button variant="outline" onClick={onExportJson}>
        <Download className="size-4" />
        导出 JSON
      </Button>
      <Button variant="secondary" onClick={() => void onMockPublish()} disabled={isPublishing}>
        <Rocket className="size-4" />
        模拟发布
      </Button>
    </div>
  );
}
