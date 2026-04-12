"use client";

import { Copy, Download, Eye, Save, Sparkles } from "lucide-react";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import type { SaveState } from "@/stores/workspace-store";

type WorkspaceActionsProps = {
  onSave: () => void | Promise<void>;
  onCopy: () => void;
  onExportTxt: () => void;
  onExportJson: () => void;
  onOpenPreview: () => void;
  onAiPolish: () => void | Promise<void>;
  onMockPublish: () => void | Promise<void>;
  isSaving?: boolean;
  isPolishing?: boolean;
  isPublishing?: boolean;
  saveState?: SaveState;
  isEditing?: boolean;
};

export function WorkspaceActions({
  onSave,
  onCopy,
  onExportTxt,
  onExportJson,
  onOpenPreview,
  onAiPolish,
  onMockPublish,
  isSaving,
  isPolishing,
  isPublishing,
  saveState,
  isEditing,
}: WorkspaceActionsProps) {
  const saveHint =
    saveState === "saving"
      ? "自动保存中..."
      : isEditing
        ? "有未保存修改"
        : saveState === "saved"
          ? "已自动保存"
          : "当前内容已同步";

  return (
    <div className="flex flex-col items-start gap-2 lg:items-end">
      <p className="text-sm text-muted-foreground">{saveHint}</p>
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={onOpenPreview}>
          <Eye className="size-4" />
          预览
        </Button>
        <Button variant="outline" onClick={() => void onAiPolish()} disabled={isPolishing}>
          <Sparkles className="size-4" />
          {isPolishing ? "优化中..." : "降AI风格"}
        </Button>
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
        <ConfirmDialog
          title="确认模拟发布"
          description="V1 不接真实平台 API。这个动作只会把当前任务状态更新为“已模拟发布”。"
          triggerLabel={isPublishing ? "发布中..." : "模拟发布"}
          confirmText={isPublishing ? "发布中..." : "确认发布"}
          onConfirm={onMockPublish}
        />
      </div>
    </div>
  );
}
