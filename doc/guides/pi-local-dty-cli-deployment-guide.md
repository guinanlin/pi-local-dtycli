# Pi Local DTY CLI 部署与配置指南

- 文档版本：1.0
- 面向对象：实施工程师
- 目标：在空白环境完成 D1-D4 的部署与验收

---

## 1. 环境要求

## 1.1 操作系统

- Linux / macOS（推荐 Linux）

## 1.2 基础依赖

- `bash`
- `python3` 与 `pip`
- 可联网访问模型服务与目标 Frappe 站点

## 1.3 运行时要求

- `pi` 命令可执行
- `frappecli` 命令可执行

说明：Pi 可来自 Pi Mono 或官方分发，安装方式依组织标准执行；本仓库不强绑具体发行方式。

---

## 2. 安装与准备

## 2.1 验证 Pi 与 frappecli

```bash
bash scripts/verify_pi_local_agent.sh
```

该脚本会检查：

- `pi` 是否在 PATH
- `pi --list-models` 是否成功
- `frappecli` 是否可执行
- 是否检测到 frappecli 配置（文件或环境变量）

## 2.2 安装 Frappe CLI Skill

```bash
bash scripts/install_frappecli_skill.sh
```

默认安装到：

- `~/.pi/agent/skills/frappecli/SKILL.md`

---

## 3. Paperclip 侧配置

## 3.1 创建 Agent

1. 打开 Paperclip Agent 配置页
2. 新建 Agent，`adapterType` 选择 **Pi (local)**
3. 参考 `examples/paperclip/pi-local-agent.adapter-config.json` 填写配置

## 3.2 关键字段建议

- `model`：必须来自 `pi --list-models`
- `instructionsFilePath`：指向仓库 `instructions/pi-local-dty-cli.instructions.md`
- `cwd`：Agent 运行目录
- `env`：通过平台注入敏感配置，不写死在代码

## 3.3 Adapter Test

保存配置并执行 Adapter Test，需通过后再进入任务验收。

---

## 4. Frappe CLI 配置（运行机）

任选一种方式：

1. 用户配置文件：`~/.config/frappecli/config.yaml`
2. 环境变量（按组织规范注入）

最低要求：

- 至少一个可访问站点
- 有效的 API key/secret（或等价认证）

---

## 5. 验收步骤（最低通过条件）

1. Adapter Test 通过
2. Heartbeat Run 成功并有 stdout/stderr
3. 分配任务：例如“列出 User doctype 前 5 条”
4. Run 日志中出现 `frappecli` 调用与合理输出

可用本地冒烟脚本先自检：

```bash
bash scripts/run_frappe_task_smoke.sh --doctype User --limit 5
```

---

## 6. 常见问题与排查

## 6.1 `pi --list-models` 失败

- 检查 provider 配置（如 OpenRouter 或 DashScope 兼容端点）
- 检查网络与 API key 环境变量

## 6.2 Agent 找不到 `frappecli`

- 检查 PATH 是否对 Paperclip 进程可见
- 使用 `command -v frappecli` 在同一用户下验证

## 6.3 `frappecli` 认证失败

- 检查配置文件权限与内容
- 确认 key/secret 未过期

## 6.4 任务执行但没调用 frappecli

- 检查 `instructionsFilePath` 是否生效
- 检查 Skill 是否安装到 `~/.pi/agent/skills/frappecli/SKILL.md`

---

## 7. 安全建议

- 仅通过环境变量或本机私有配置注入凭证
- 避免在日志中输出完整密钥
- 在 CI 或共享环境中使用最小权限凭证

---

## 8. 变更与回归建议

- 升级 Pi 或 frappecli 后，重新执行：
  - `bash scripts/verify_pi_local_agent.sh`
  - 一次 Paperclip Adapter Test
  - 一条 Frappe 任务回归（doctype 或 report）
