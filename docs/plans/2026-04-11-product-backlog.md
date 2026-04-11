# Multi-Platform Content Studio Backlog

日期：2026-04-11

## 目标

把当前 V1 从“可演示版本”推进到“可持续迭代的可用版本”。

当前判断：

- 主流程已经可用：创建任务、进入工作台、编辑、保存、导出、模拟发布都已具备基础能力。
- 主要缺口不在页面数量，而在功能闭环、设置与行为一致性、以及测试保障。
- 当前优先级应该先补主链路可信度，再补增强能力。

## 当前状态摘要

- 公众号会走真实模型生成。
- 小红书、Twitter、视频脚本仍然依赖 mock 内容。
- 设置页支持配置所有平台的 Prompt，但大部分平台设置尚未接入真实生成。
- 小红书图片仍是占位交互，没有真实上传和管理能力。
- 模拟发布没有与“未保存编辑”做完整衔接。
- 项目缺少自动化测试脚本和测试文件。

## P0 必做

### 1. 多平台真实生成落地

优先级：P0

问题：

- 当前生成逻辑先统一生成 mock，再仅对公众号内容进行真实替换。
- 这会导致产品承诺与实际表现不一致，尤其是设置页中小红书、Twitter、视频脚本的 Prompt 配置看起来可编辑，但不参与真实生成。

相关文件：

- [lib/content-generation.ts](/mnt/e/Code/DataAgent-Maker/DataMaker/lib/content-generation.ts:7)
- [lib/mockGenerators.ts](/mnt/e/Code/DataAgent-Maker/DataMaker/lib/mockGenerators.ts:97)
- [lib/wechat-generator.ts](/mnt/e/Code/DataAgent-Maker/DataMaker/lib/wechat-generator.ts:72)
- [components/settings/PlatformPromptForm.tsx](/mnt/e/Code/DataAgent-Maker/DataMaker/components/settings/PlatformPromptForm.tsx:21)

建议结果：

- 为小红书、Twitter、视频脚本补齐真实生成器。
- 每个平台都使用自己的 `systemPrompt`、`defaultTone`、`defaultLength`、`extraRules`。
- 生成失败时按平台返回清晰错误，不影响其他平台后续可扩展方案。

验收标准：

- 选中任一平台时，都能获得非 mock 的平台定制内容。
- 平台设置页修改 Prompt 后，重新创建任务能反映变化。
- 代码中不再出现“只有公众号走真实生成，其他平台走 mock”的产品级不一致。

### 2. 发布前强制保存

优先级：P0

问题：

- 当前工作台自动保存依赖延时触发。
- 用户在编辑后立即点击“模拟发布”，可能发布的是旧内容，或状态与最新编辑不同步。

相关文件：

- [components/workspace/WorkspaceShell.tsx](/mnt/e/Code/DataAgent-Maker/DataMaker/components/workspace/WorkspaceShell.tsx:98)
- [components/workspace/WorkspaceShell.tsx](/mnt/e/Code/DataAgent-Maker/DataMaker/components/workspace/WorkspaceShell.tsx:208)
- [app/api/tasks/[taskId]/mock-publish/route.ts](/mnt/e/Code/DataAgent-Maker/DataMaker/app/api/tasks/[taskId]/mock-publish/route.ts:9)

建议结果：

- 在执行模拟发布前主动触发一次保存。
- 若保存失败，则中断发布并提示用户。
- 若当前没有未保存修改，则直接继续发布。

验收标准：

- 编辑后立即发布，最终任务内容与最后一次编辑保持一致。
- 保存失败时不会继续进入发布状态。
- 发布成功后的任务状态和持久化内容一致。

### 3. 设置页行为与真实能力对齐

优先级：P0

问题：

- 设置页已经暴露了完整的平台 Prompt 能力，但真实生成尚未对齐。
- 这种不一致会直接影响用户信任和后续排查效率。

相关文件：

- [components/settings/PlatformPromptForm.tsx](/mnt/e/Code/DataAgent-Maker/DataMaker/components/settings/PlatformPromptForm.tsx:21)
- [components/settings/ProviderSettingsForm.tsx](/mnt/e/Code/DataAgent-Maker/DataMaker/components/settings/ProviderSettingsForm.tsx:19)
- [README.md](/mnt/e/Code/DataAgent-Maker/DataMaker/README.md:35)

建议结果：

- 在多平台真实生成未补齐前，明确标注能力边界。
- 若真实生成补齐，则同步移除“其他平台暂时仍使用 mock 内容”的说明。
- README 也同步更新，避免文档与界面互相矛盾。

验收标准：

- 用户从首页、设置页、README 看到的能力描述一致。
- 不再出现“UI 支持但实际不生效”的配置说明。

### 4. 主链路自动化测试

优先级：P0

问题：

- 当前仓库未看到测试文件，也没有测试脚本。
- 主链路包括任务创建、任务保存、设置持久化、工作台加载，任何改动都容易带来回归。

相关文件：

- [package.json](/mnt/e/Code/DataAgent-Maker/DataMaker/package.json:5)
- [app/api/tasks/route.ts](/mnt/e/Code/DataAgent-Maker/DataMaker/app/api/tasks/route.ts:1)
- [app/api/tasks/[taskId]/route.ts](/mnt/e/Code/DataAgent-Maker/DataMaker/app/api/tasks/[taskId]/route.ts:1)
- [app/api/settings/route.ts](/mnt/e/Code/DataAgent-Maker/DataMaker/app/api/settings/route.ts:1)

建议结果：

- 引入最小必要的测试框架。
- 优先覆盖 API 层核心流程。
- 至少建立 smoke 级别的回归保护。

验收标准：

- 存在 `test` 脚本并可本地运行。
- 任务创建、任务保存、设置保存三个核心接口有自动化覆盖。
- 后续功能改动时可以用测试验证主链路未破坏。

## P1 建议尽快

### 5. 小红书图片管理闭环

优先级：P1

问题：

- 当前只有“上传入口占位”，缺少真实图片交互。
- 这会让小红书编辑器停留在文案编辑器层面，不足以支撑平台特性。

相关文件：

- [components/editors/XiaohongshuEditor.tsx](/mnt/e/Code/DataAgent-Maker/DataMaker/components/editors/XiaohongshuEditor.tsx:13)
- [types/content.ts](/mnt/e/Code/DataAgent-Maker/DataMaker/types/content.ts:12)

建议结果：

- 支持本地图片选择与预览。
- 支持替换、删除、最多 9 张管理。
- 后续如需要再追加排序与持久化方案。

验收标准：

- 用户可以添加图片并看到本地预览。
- 删除和替换操作可用。
- 导出或保存时图片元数据结构保持稳定。

### 6. 按平台重新生成

优先级：P1

问题：

- 现在要重新拿新内容，最直接方式还是重新建任务。
- 这会让工作台的编辑体验割裂，也降低 Prompt 调整后的验证效率。

相关文件：

- [components/workspace/WorkspaceActions.tsx](/mnt/e/Code/DataAgent-Maker/DataMaker/components/workspace/WorkspaceActions.tsx:1)
- [components/workspace/WorkspaceShell.tsx](/mnt/e/Code/DataAgent-Maker/DataMaker/components/workspace/WorkspaceShell.tsx:267)
- [app/api/tasks/[taskId]/route.ts](/mnt/e/Code/DataAgent-Maker/DataMaker/app/api/tasks/[taskId]/route.ts:23)

建议结果：

- 在工作台增加“重生成当前平台”。
- 保留任务上下文，按当前平台重新输出内容。
- 明确是否覆盖现有编辑内容，必要时加入确认提示。

验收标准：

- 用户无需离开工作台即可重生成当前平台内容。
- 重生成行为对其他平台内容无副作用。

### 7. 错误信息细化与可诊断性提升

优先级：P1

问题：

- 当前错误信息仍偏统一提示，不利于快速定位配置问题或模型响应问题。

相关文件：

- [lib/openai-compatible.ts](/mnt/e/Code/DataAgent-Maker/DataMaker/lib/openai-compatible.ts:51)
- [lib/wechat-generator.ts](/mnt/e/Code/DataAgent-Maker/DataMaker/lib/wechat-generator.ts:24)
- [app/api/tasks/route.ts](/mnt/e/Code/DataAgent-Maker/DataMaker/app/api/tasks/route.ts:46)

建议结果：

- 区分 API Key 缺失、超时、HTTP 错误、模型返回空内容、JSON 解析失败。
- 前端提示保留用户可理解的信息，日志保留技术细节。

验收标准：

- 常见失败类型可以被区分。
- 用户提示可操作，开发排查也有足够上下文。

### 8. 整任务导出

优先级：P1

问题：

- 当前只能导出当前平台，不适合一次性交付完整任务成果。

相关文件：

- [lib/export.ts](/mnt/e/Code/DataAgent-Maker/DataMaker/lib/export.ts:3)
- [components/workspace/WorkspaceShell.tsx](/mnt/e/Code/DataAgent-Maker/DataMaker/components/workspace/WorkspaceShell.tsx:196)

建议结果：

- 增加“导出整任务 JSON”。
- 如成本合适，可进一步支持 zip 或多文件导出。

验收标准：

- 一个任务中的所有平台内容可一次性导出。

## P2 可延后

### 9. 真实发布能力抽象

优先级：P2

说明：

- 当前 V1 只模拟发布是合理的。
- 但可以提前抽象发布接口，避免后续真实接平台时重写工作台交互。

### 10. 平台内容约束增强

优先级：P2

说明：

- Twitter 字数提醒可以更严格。
- 视频脚本可以增加文本量与时长的一致性提示。
- 公众号可以增加 section 数量边界校验。

### 11. 文档边界补强

优先级：P2

说明：

- README 需要更明确区分真实生成、mock 生成和占位功能。
- 这样更适合后续开源展示或团队协作交接。

## 推荐实施顺序

第一阶段：

- P0.1 多平台真实生成落地
- P0.2 发布前强制保存
- P0.3 设置页行为与真实能力对齐
- P0.4 主链路自动化测试

第二阶段：

- P1.5 小红书图片管理闭环
- P1.6 按平台重新生成
- P1.7 错误信息细化
- P1.8 整任务导出

第三阶段：

- P2 项目长期演进项

## 成功定义

当以下条件同时满足时，可以认为当前版本从“演示可用”提升到“实际可迭代可用”：

- 所有已启用平台都具备真实生成能力，且平台设置对生成结果真实生效。
- 工作台编辑、保存、发布之间没有明显状态断层。
- 主链路有基础自动化测试兜底。
- README、设置页、界面文案对能力边界描述一致。
