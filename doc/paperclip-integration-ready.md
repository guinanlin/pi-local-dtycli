# Pi-Local-DTYCLI 已就绪 — 请 Paperclip 发起对接

**文档类型**：集成就绪通知 / 对接邀请  
**日期**：2026-03-19  
**致**：Paperclip 团队  
**来自**：pi-local-dtycli（pi-mono-dty）项目维护方  

**依据标准**（贵方文档）：
- `doc/plans/2026-03-18-pi-local-dtycli-integration-recommendation.md` — 集成建议与改造要求（含改造清单）
- `doc/plans/2026-03-19-pi-local-model-required-requirement.md` — **adapterConfig.model 为必填**

---

## 1. 说明

我方已依据贵方 **《Pi Local DTYCLI 接入 Paperclip — 集成建议与改造要求》**（2026-03-18）完成 CLI 改造，并知悉 **《Pi Local 对接方必读：model 为必填项》**（2026-03-19）。当前满足 pi_local 适配器契约及 model 必填要求。现通知贵方：**东西已准备好，请发起对接**。

---

## 2. 自检清单（对照贵方改造清单）

以下按贵方 `2026-03-18-pi-local-dtycli-integration-recommendation.md` 第 4 节「改造清单」逐项自检：

| 项 | 要求 | 状态 |
|----|------|------|
| **list-models** | 执行 `{command} --list-models` 时，仅向 stdout 输出模型列表（每行 `provider\tmodel` 或 `provider/model`），不启动 Agent，退出码 0 | ✅ 已实现 |
| **RPC 模式** | 存在 `--mode rpc` 时，从 **stdin** 读取一行 JSON，解析 `message` 作为用户提示；不使用 argv 位置参数作为提示 | ✅ 已实现 |
| **append-system-prompt** | 支持 `--append-system-prompt <string>`，并与默认 system prompt 合并后传给 LLM | ✅ 已实现 |
| **provider/model** | 支持 `--provider`、`--model`（及可选 `--thinking`），用于选择模型；与 `--list-models` 输出一致 | ✅ 已实现 |
| **工作目录** | 相对路径基于进程 cwd 解析；RPC 模式下从 cwd 加载 `.env.local` | ✅ 已实现 |
| **环境变量** | 未硬编码 Paperclip API URL/Key；若将来调用 Paperclip API，将仅使用 `PAPERCLIP_*` 环境变量 | ✅ 已满足 |
| **单次 Run 退出** | RPC 模式下完成单次推理后进程退出；不常驻 | ✅ 已实现 |
| **文档** | README 中已说明「作为 Paperclip pi_local 使用」及 command、**必填 model**、cwd、自测示例 | ✅ 已更新 |

---

## 3. model 必填（贵方 2026-03-19 要求）

我方已知悉并遵循贵方 **adapterConfig.model 为必填** 的强制要求：

- 在 Paperclip 中为该 Pi (local) Agent 发起 Run 前，**必须先**在 Configuration 的 Adapter 区块中**选择并保存** Model（格式须为 provider/model，且出自本 CLI 的 `--list-models` 输出）。
- 未配置或未保存 model 时，贵方将报错并中止 Run：`Pi requires adapterConfig.model in provider/model format.(adapter_failed)`，且不会调用我方 CLI。
- 我方已在 README 与本文档中明确写出「adapterConfig.model（必填）」；若有多人运维，我方将把「Pi (local) Agent 必须配置并保存 Model」纳入操作说明。

当前 `--list-models` 输出（供贵方解析为 Model 下拉选项）：
- `groq\tllama-3.3-70b-versatile`（贵方前端可展示为 `groq/llama-3.3-70b-versatile`）

---

## 4. 配置与自测参考

### 4.1 贵方侧配置建议

- **adapterConfig.command**（必填）：可执行命令，需指向我方项目构建产物。例如：
  - `node /path/to/pi-local-dtycli/dist/cli.mjs`
  - 需先在我方项目根目录执行 `npm run build:cli` 生成 `dist/cli.mjs`。
- **adapterConfig.model**（必填，贵方 2026-03-19 强制）：须为 **provider/model** 格式，且必须出自 `{command} --list-models` 的解析结果。当前支持：
  - `groq/llama-3.3-70b-versatile`（在 Configuration 中选择并**保存**后再发起 Run）。
- **adapterConfig.cwd**（可选）：工作目录。RPC 模式下我方会基于 cwd 加载 `.env.local`（需含 `GROQ_API_KEY`），请配置为我方项目或约定 workspace 根路径。

### 4.2 自测命令（贵方可本地验证）

```bash
# 模型发现
node /path/to/pi-local-dtycli/dist/cli.mjs --list-models
# 预期：stdout 输出一行 groq\tllama-3.3-70b-versatile，退出码 0

# RPC 单次 Run
echo '{"type":"prompt","message":"杭州天气怎么样"}' | node /path/to/pi-local-dtycli/dist/cli.mjs --mode rpc
# 预期：stdout 为天气回复文本，退出码 0
```

### 4.3 当前能力说明

- **工具**：当前仅实现 **get_weather**（天气查询）。若贵方需要「至少支持 bash」等能力，可通过 `--append-system-prompt` 注入 Instructions，或后续由我方扩展工具集。
- **模型**：当前仅支持 Groq `llama-3.3-70b-versatile`；后续可扩展更多 provider/model 并同步更新 `--list-models` 输出。

---

## 5. 对接邀请

我方改造与自检已完成，请贵方：

1. 在 Paperclip 中配置 Adapter 类型为「Pi (local)」的 Agent：填写 `adapterConfig.command` 指向我方 `dist/cli.mjs`，并**在 Model 下拉框中选择并保存** `adapterConfig.model`（如 `groq/llama-3.3-70b-versatile`），再保存 Agent。
2. 使用 **Adapter Test** 自检（确认含 Configured model 或无「model required」类报错）。
3. 发起 **Run 验证**（执行一次任务，查看 stdout/stderr 采集与 Run 状态）。
4. 若有契约细节、环境变量或调用方式需要调整，请反馈我方，便于后续对齐。

谢谢。

---

## 6. 参考

- 我方 README「作为 Paperclip pi_local 使用」：`pi-local-dtycli/README.md`
- 贵方集成建议与改造清单：`paperclip/doc/plans/2026-03-18-pi-local-dtycli-integration-recommendation.md`
- 贵方 model 必填要求：`paperclip/doc/plans/2026-03-19-pi-local-model-required-requirement.md`
