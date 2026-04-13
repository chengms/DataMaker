import Link from "next/link";

import { CreateTaskForm } from "@/components/create-task/CreateTaskForm";
import { Button } from "@/components/ui/button";
import { PLATFORM_OPTIONS } from "@/lib/platforms";
import { getOrCreateSettings } from "@/lib/settings-service";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const settings = await getOrCreateSettings();
  const enabledPlatforms = PLATFORM_OPTIONS.filter((platform) => settings[platform.value].enabled).map(
    (platform) => platform.value,
  );

  return (
    <main className="min-h-screen px-4 py-6 lg:px-6 lg:py-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="flex items-center justify-between rounded-[28px] border bg-white/75 px-5 py-4 shadow-panel">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Multi-Platform Content Studio V1</p>
            <h1 className="mt-1 text-xl font-semibold">Content Studio</h1>
            <p className="mt-1 text-sm text-muted-foreground">创作入口页：负责填写需求、选择平台并发起内容任务。</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/settings">设置</Link>
          </Button>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <CreateTaskForm enabledPlatforms={enabledPlatforms} />

          <div className="space-y-4 rounded-[28px] border bg-white/70 p-5 shadow-panel">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Workflow</p>
              <h2 className="mt-2 text-lg font-semibold">从创作入口到工作台</h2>
            </div>
            <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
              <li>当前页只负责输入创作需求、选择平台并创建任务。</li>
              <li>提交后进入内容创作工作台，继续生成、修改、预览与发布前检查。</li>
              <li>各平台继续使用独立 schema 和独立预览模板，避免混用单一 content 字段。</li>
              <li>工作台支持保存、复制、导出和模拟发布，并为后续参考文章接入预留位置。</li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
