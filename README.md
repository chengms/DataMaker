# Multi-Platform Content Studio V1

一个面向内容团队的多平台内容工作台：单次输入，多平台并行产出，再按平台继续编辑、导出和模拟发布。

## 技术栈

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Zustand
- React Hook Form
- Zod
- Prisma
- SQLite

## 路由

- `/` 创作台
- `/workspace/[taskId]` 结果工作台
- `/settings` 平台 Prompt 设置

## 本地启动

```bash
npm install
XDG_CACHE_HOME=/tmp/.cache npx prisma generate
XDG_CACHE_HOME=/tmp/.cache npx prisma db push
XDG_CACHE_HOME=/tmp/.cache npm run prisma:seed
npm run dev
```

Windows / 常规本地环境如果 Prisma 缓存目录可写，可以省略 `XDG_CACHE_HOME=/tmp/.cache`。

## 已实现能力

- 统一输入创建任务
- 多平台内容生成
- 公众号 / 小红书 / Twitter / 视频脚本独立编辑器
- 历史任务侧边栏
- 任务保存与模拟发布
- 平台级 Prompt 设置持久化并参与生成
- 当前平台复制与导出 TXT / JSON

## 当前边界

- V1 的“发布”仍然是模拟发布，不会调用真实平台 API。
- 小红书图片区当前以图片占位和文案管理为主，尚未接入正式图片存储方案。

## 数据模型

- `Task`
  - `input` 使用 JSON 保存任务输入
  - `contents` 使用 JSON 保存多平台结果
- `AppSettings`
  - `settings` 使用 JSON 保存平台级 Prompt 配置
