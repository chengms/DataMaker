"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="zh-CN">
      <body className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="max-w-md rounded-3xl border bg-card p-8 text-center shadow-panel">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Error</p>
          <h1 className="mt-3 text-2xl font-semibold">页面加载失败</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            当前页面出现运行异常。你可以直接重试，或者返回创作台继续操作。
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button onClick={reset}>重试</Button>
            <Button variant="outline" asChild>
              <a href="/">返回首页</a>
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
