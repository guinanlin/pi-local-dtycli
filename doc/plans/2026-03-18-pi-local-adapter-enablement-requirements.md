# Pi (local) 适配器启用要求（Paperclip 侧）

- 文档版本：1.0
- 日期：2026-03-18
- 适用对象：Paperclip 平台管理员、实施工程师

---

## 1. 目的

确保 Paperclip 平台上 `pi_local` 适配器可被稳定启用，并支持 Pi Local DTY CLI 的生产化接入与运维。

---

## 2. 启用前置条件

### 2.1 平台能力

- Paperclip 实例支持创建 Agent
- Agent 配置页可选择 Adapter 类型：`Pi (local)`
- 平台可发起 Adapter Test、Heartbeat、任务 Run，并保存 stdout/stderr

### 2.2 运行机能力

- 存在可执行 `pi` 命令
- `pi --list-models` 可返回至少一个模型
- 可执行 `frappecli`
- Agent 运行用户具备读取配置与执行脚本权限

---

## 3. 配置契约

### 3.1 必填字段

- `adapterType`: `pi_local`
- `adapterConfig.model`: `<provider>/<model>`

### 3.2 推荐字段

- `adapterConfig.command`（默认 `pi`）
- `adapterConfig.cwd`
- `adapterConfig.instructionsFilePath`
- `adapterConfig.bootstrapPromptTemplate`
- `adapterConfig.extraArgs`
- `adapterConfig.env`
- `adapterConfig.thinking`

### 3.3 环境变量注入

平台应允许向进程注入变量（如 `PAPERCLIP_*`），禁止硬编码敏感信息。

---

## 4. 启用流程（建议）

1. 在运行机执行：
   - `bash scripts/verify_pi_local_agent.sh`
2. 将 Skill 安装到运行用户目录：
   - `bash scripts/install_frappecli_skill.sh`
3. 在 Paperclip 创建 Agent：
   - 选择 `Pi (local)`
   - 填写 `adapterConfig.model`
   - 配置 `instructionsFilePath` 指向 `instructions/pi-local-dty-cli.instructions.md`
4. 运行 Adapter Test
5. 触发一次 Heartbeat Run（或分配任务）

---

## 5. 通过标准

满足以下全部条件：

1. Adapter Test 通过
2. 至少一次 Run 成功，且可查看 stdout/stderr
3. Run 中可见 `frappecli` 调用（针对 Frappe 任务）
4. 不依赖手写超长提示即可完成常见任务（依赖 Skill）

---

## 6. 安全基线

- 禁止将 `PAPERCLIP_API_KEY`、Frappe key/secret 提交到仓库
- 使用环境变量或用户级配置文件注入凭证
- 日志中避免打印完整密钥，必要时仅显示后 4 位用于定位

---

## 7. 运维建议

- 维护统一的 `instructions` 与 `SKILL.md` 版本
- 在升级 Pi 或 frappecli 后重跑 `verify_pi_local_agent.sh`
- 对关键 Run 建立模板任务（doctype 列表、报表执行、RPC）做回归
