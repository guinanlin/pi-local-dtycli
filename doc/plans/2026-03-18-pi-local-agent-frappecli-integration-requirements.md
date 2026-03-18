# Pi Local Agent 接入规格与需求 —— 以 Frappe CLI 为核心能力

- 文档版本：1.0
- 日期：2026-03-18
- 目标读者：高级工程师、实施工程师、平台运维
- 关联产品文档：`Pi Local DTY CLI — 产品定义规格说明书 (v1.1)`

---

## 1. 目标与范围

本文档定义 Pi Local DTY CLI 的技术接入标准，聚焦两类能力：

1. **Paperclip `pi_local` 适配契约**
2. **Frappe CLI（frappecli）在 Agent 中的“可用 + 会用 + 可维护”**

非目标：

- 不在本产品内实现会话存储、历史消息管理（由 Paperclip 负责）
- 不在仓库中提供任何生产密钥或站点私密配置

---

## 2. Pi Local CLI 契约（必须满足）

运行环境需提供可执行命令（默认 `pi`），并满足以下最低契约：

### 2.1 模型发现

- 命令：`pi --list-models`
- 要求：返回至少一个可选 provider/model
- 用途：供 Paperclip 配置 `adapterConfig.model`

### 2.2 单次 RPC 执行模式

- 进程按次调用（一次 Run 对应一次进程调用）
- 输入：通过 `stdin` 接收本次 JSON 提示（无需会话历史）
- 输出：stdout/stderr 可被平台采集
- 退出码：0 表示成功，非 0 表示失败

### 2.3 参数能力

最小支持（按平台需求）：

- `--provider <provider>`
- `--model <model>`
- `--append-system-prompt <text>`
- `--tools <toolset>`
- `--session <id>`（可选增强）

说明：如果 CLI 参数命名与上游略有差异，可通过 `extraArgs` 映射，但必须保证 Paperclip 配置后可稳定运行。

### 2.4 环境变量透传

进程应可读取以下平台注入变量（示例）：

- `PAPERCLIP_API_URL`
- `PAPERCLIP_API_KEY`
- `PAPERCLIP_AGENT_ID`
- `PAPERCLIP_RUN_ID`

要求：不在代码里写死 URL/Key，优先使用环境变量。

---

## 3. Frappe CLI 能力要求（必须满足）

### 3.1 可用性

- `frappecli` 已安装且在 PATH 中可执行
- 至少可执行：`frappecli --help`
- Agent 运行用户可访问 frappecli 配置

### 3.2 配置可达

支持以下至少一种配置来源：

1. `~/.config/frappecli/config.yaml`
2. 环境变量（由实施侧注入）

要求：

- 配置中不得明文提交到仓库
- 配置缺失时输出可诊断错误信息

### 3.3 任务解析与命令选择

当任务属于 Frappe/ERPNext 操作时，Agent 应优先选择 frappecli 子命令，如：

- `site doctypes`
- `doc list`
- `doc get`
- `report run`
- `rpc`

并以结构化文本返回关键结果（如总数、前 N 条、错误原因）。

### 3.4 Skill 集成（推荐且应落地）

建议将 Frappe CLI 用法以 SKILL.md 管理并注入 Agent：

- 仓库版：`skills/frappecli/SKILL.md`
- 运行时安装路径：`~/.pi/agent/skills/frappecli/SKILL.md`

Skill 应包含：

- 适用场景
- 常用命令模板
- 参数与安全约束
- 错误处理与回退策略

---

## 4. Paperclip 侧配置要求

### 4.1 Adapter 类型

- `adapterType = "pi_local"`

### 4.2 adapterConfig 最小字段

- `model`（来自 `pi --list-models`）

### 4.3 adapterConfig 推荐字段

- `cwd`
- `instructionsFilePath`
- `bootstrapPromptTemplate`
- `thinking`
- `command`
- `extraArgs`
- `env`

配置示例见：`examples/paperclip/pi-local-agent.adapter-config.json`

---

## 5. 最小化实现清单（可直接验收）

1. `pi` 命令可执行，`pi --list-models` 成功
2. `frappecli` 命令可执行，且配置可达
3. Paperclip 中创建 Pi (local) Agent，Adapter Test 通过
4. 执行一条 Frappe 任务，日志可见 `frappecli` 调用与合理输出
5. Skill 已部署并可在不写长提示情况下完成常见任务

---

## 6. 验收命令建议

本仓库提供如下脚本：

- `bash scripts/verify_pi_local_agent.sh`
- `bash scripts/install_frappecli_skill.sh`
- `bash scripts/run_frappe_task_smoke.sh --doctype User --limit 5`

若脚本全部通过，并且 Paperclip 侧 Adapter Test + Run 均成功，可判定技术验收通过。

---

## 7. 风险与排障要点

1. **模型不一致**：Paperclip `model` 与 `pi --list-models` 不匹配
2. **PATH 问题**：Paperclip 进程环境中找不到 `pi` 或 `frappecli`
3. **配置不可读**：`~/.config/frappecli/config.yaml` 权限或路径错误
4. **凭证错误**：API key/secret 失效导致 `doc list`/`report run` 失败
5. **网络限制**：目标 Frappe 站点不可达

建议优先查看 Run 的 stderr 和退出码，并在本地复现同命令。
