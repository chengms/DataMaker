# Multi-Platform Content Studio Execution Plan

日期：2026-04-11

## 目标

在不大幅重构现有 V1 架构的前提下，优先补齐主链路闭环，让产品从“可演示”提升到“可稳定迭代”。

## 执行原则

- 先修复产品承诺与实际行为不一致的问题。
- 先保证保存、发布、生成这三条主链路可信。
- 先增加低成本高收益的自动化保护，再继续扩展功能。
- 尽量沿用现有模式，不在本轮引入过度设计。

## 交付顺序总览

### 第 1 周

- 补齐多平台真实生成设计与实现骨架
- 修复发布前强制保存
- 对齐设置页与 README 的能力说明

### 第 2 周

- 引入测试框架并补主链路测试
- 补错误信息细化
- 评估并实现按平台重生成

### 第 3 周

- 完成小红书图片管理闭环
- 增加整任务导出
- 补剩余文档和体验细节

## 第 1 周计划

### 任务 1. 统一平台生成器结构

目标：

- 把“公众号特判 + 其他 mock”的结构改成“每个平台有自己的生成器”。

涉及文件：

- [lib/content-generation.ts](/mnt/e/Code/DataAgent-Maker/DataMaker/lib/content-generation.ts:1)
- [lib/wechat-generator.ts](/mnt/e/Code/DataAgent-Maker/DataMaker/lib/wechat-generator.ts:1)
- [lib/mockGenerators.ts](/mnt/e/Code/DataAgent-Maker/DataMaker/lib/mockGenerators.ts:1)
- [types/content.ts](/mnt/e/Code/DataAgent-Maker/DataMaker/types/content.ts:1)

执行建议：

- 保留 mock 生成器作为 fallback 或开发模式辅助。
- 新增 `xiaohongshu`、`twitter`、`video_script` 的真实生成模块。
- 每个平台都通过统一入口收 `TaskInput + AppSettings`，返回对应内容结构。

完成标准：

- `generateTaskContents` 不再只对公众号做真实覆盖。
- 各平台生成职责清晰，后续可单独维护。

### 任务 2. 为三个平台补 Prompt 组装逻辑

目标：

- 让小红书、Twitter、视频脚本都真实使用平台设置项。

涉及文件：

- `lib/xiaohongshu-generator.ts`
- `lib/twitter-generator.ts`
- `lib/video-script-generator.ts`
- [lib/default-settings.ts](/mnt/e/Code/DataAgent-Maker/DataMaker/lib/default-settings.ts:13)
- [types/settings.ts](/mnt/e/Code/DataAgent-Maker/DataMaker/types/settings.ts:1)

执行建议：

- 参考公众号生成器的结构。
- 每个平台都读取自己的 `systemPrompt`、`defaultTone`、`defaultLength`、`extraRules`。
- 输出严格匹配现有前端编辑器的数据结构，避免额外改编辑器。

完成标准：

- 三个平台生成结果不再是固定模板文本。
- 平台设置改动能影响新创建任务内容。

### 任务 3. 发布前先保存

目标：

- 保证用户发布的是当前工作台里最后一次有效编辑内容。

涉及文件：

- [components/workspace/WorkspaceShell.tsx](/mnt/e/Code/DataAgent-Maker/DataMaker/components/workspace/WorkspaceShell.tsx:98)
- [components/workspace/WorkspaceShell.tsx](/mnt/e/Code/DataAgent-Maker/DataMaker/components/workspace/WorkspaceShell.tsx:208)

执行建议：

- 提取一个“确保已保存”的内部流程。
- `handleMockPublish` 中先调用保存流程，再继续请求发布接口。
- 保存失败时停止发布并提示。

完成标准：

- 编辑后立即点击发布，不会丢失最新内容。

### 任务 4. 更新说明文案

目标：

- 让产品描述、设置说明、README 与当前能力一致。

涉及文件：

- [components/settings/ProviderSettingsForm.tsx](/mnt/e/Code/DataAgent-Maker/DataMaker/components/settings/ProviderSettingsForm.tsx:97)
- [components/settings/PlatformPromptForm.tsx](/mnt/e/Code/DataAgent-Maker/DataMaker/components/settings/PlatformPromptForm.tsx:43)
- [README.md](/mnt/e/Code/DataAgent-Maker/DataMaker/README.md:35)

执行建议：

- 如果多平台真实生成本周完成，就把历史说明改成“所有平台均可使用模型生成”。
- 如果只完成部分平台，就明确写出已接入平台和未接入平台，不留模糊描述。

完成标准：

- 界面与文档不再互相矛盾。

## 第 2 周计划

### 任务 5. 引入测试框架

目标：

- 建立基本自动化测试能力。

涉及文件：

- [package.json](/mnt/e/Code/DataAgent-Maker/DataMaker/package.json:1)
- 新增 `tests/` 或项目约定的测试目录

执行建议：

- 优先选择对 Next.js + TypeScript 成本较低的测试方案。
- 首轮以 API 和纯函数层测试为主，不急着先做复杂 UI 测试。

完成标准：

- 有可运行的 `test` 命令。
- CI 或本地都能稳定执行。

### 任务 6. 补 API 主链路测试

目标：

- 保护任务和设置主链路。

涉及文件：

- [app/api/tasks/route.ts](/mnt/e/Code/DataAgent-Maker/DataMaker/app/api/tasks/route.ts:1)
- [app/api/tasks/[taskId]/route.ts](/mnt/e/Code/DataAgent-Maker/DataMaker/app/api/tasks/[taskId]/route.ts:1)
- [app/api/tasks/[taskId]/mock-publish/route.ts](/mnt/e/Code/DataAgent-Maker/DataMaker/app/api/tasks/[taskId]/mock-publish/route.ts:1)
- [app/api/settings/route.ts](/mnt/e/Code/DataAgent-Maker/DataMaker/app/api/settings/route.ts:1)

建议覆盖：

- 创建任务成功
- 未启用平台时创建失败
- PATCH 保存内容成功
- 模拟发布成功
- 设置保存与读取一致

完成标准：

- 核心 API 有 smoke 级测试覆盖。

### 任务 7. 错误信息分层

目标：

- 提升生成失败的可理解性和可排查性。

涉及文件：

- [lib/openai-compatible.ts](/mnt/e/Code/DataAgent-Maker/DataMaker/lib/openai-compatible.ts:1)
- [app/api/tasks/route.ts](/mnt/e/Code/DataAgent-Maker/DataMaker/app/api/tasks/route.ts:29)

执行建议：

- 区分配置错误、网络错误、服务错误、内容解析错误。
- 面向用户的提示简洁明确。
- 面向开发的日志保留足够上下文。

完成标准：

- 常见失败原因可以快速定位。

### 任务 8. 设计并实现按平台重生成

目标：

- 在工作台内支持平台级刷新内容。

涉及文件：

- [components/workspace/WorkspaceActions.tsx](/mnt/e/Code/DataAgent-Maker/DataMaker/components/workspace/WorkspaceActions.tsx:1)
- [components/workspace/WorkspaceShell.tsx](/mnt/e/Code/DataAgent-Maker/DataMaker/components/workspace/WorkspaceShell.tsx:267)
- [app/api/tasks/[taskId]/route.ts](/mnt/e/Code/DataAgent-Maker/DataMaker/app/api/tasks/[taskId]/route.ts:23)

执行建议：

- 优先只支持“重生成当前平台”。
- 若当前平台有未保存修改，先确认是否覆盖。
- 保持其他平台内容不变。

完成标准：

- 用户无需回首页就能重新拿当前平台内容。

## 第 3 周计划

### 任务 9. 小红书图片管理闭环

目标：

- 把图片区从展示占位提升为可操作模块。

涉及文件：

- [components/editors/XiaohongshuEditor.tsx](/mnt/e/Code/DataAgent-Maker/DataMaker/components/editors/XiaohongshuEditor.tsx:13)
- [types/content.ts](/mnt/e/Code/DataAgent-Maker/DataMaker/types/content.ts:12)

执行建议：

- 第一版只做本地选择、预览、替换、删除。
- 暂不引入云存储，避免扩大范围。

完成标准：

- 用户可以维护一组真实图片，而不只是看到占位块。

### 任务 10. 整任务导出

目标：

- 支持把一个任务的一整组多平台内容一次性交付出去。

涉及文件：

- [lib/export.ts](/mnt/e/Code/DataAgent-Maker/DataMaker/lib/export.ts:1)
- [components/workspace/WorkspaceShell.tsx](/mnt/e/Code/DataAgent-Maker/DataMaker/components/workspace/WorkspaceShell.tsx:187)

执行建议：

- 第一版优先做整任务 JSON 导出。
- 如果实现成本低，再加 zip 或多文本文件导出。

完成标准：

- 一个任务可一次性导出全部平台内容。

### 任务 11. 文档收尾

目标：

- 确保项目说明适合继续开发和对外展示。

涉及文件：

- [README.md](/mnt/e/Code/DataAgent-Maker/DataMaker/README.md:1)
- [docs/plans/2026-04-11-product-backlog.md](/mnt/e/Code/DataAgent-Maker/DataMaker/docs/plans/2026-04-11-product-backlog.md:1)

执行建议：

- README 增加当前能力范围、限制、后续方向。
- 把 backlog 与实际完成项持续同步。

完成标准：

- 新接手成员可以仅凭文档快速理解项目现状和后续优先级。

## 风险与注意事项

- 如果三个平台真实生成同时落地，最容易出问题的是输出 JSON 结构不稳定，需要提前设计解析和校验策略。
- 如果测试框架引入过重，可能拖慢本轮节奏，应优先选择轻量方案。
- 小红书图片功能如果过早接入真实上传存储，会显著扩大实现范围，不建议本轮推进。

## 推荐的实际开工顺序

1. 重构生成入口，补平台生成器骨架
2. 补三个平台的真实生成实现
3. 修复发布前保存
4. 更新说明文案
5. 引入测试框架
6. 补 API 主链路测试
7. 细化错误信息
8. 增加按平台重生成
9. 完成小红书图片闭环
10. 增加整任务导出

## 完成标志

本轮计划完成后，应达到以下状态：

- 多平台真实生成能力可用
- 设置页配置与生成行为一致
- 编辑、保存、发布链路无明显状态错位
- 项目具备基础自动化回归能力
- 后续增强功能可以在已有结构上稳定扩展
