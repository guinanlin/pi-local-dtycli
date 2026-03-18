# Pi Local DTY CLI

Pi Local DTY CLI 是一个用于将 **Pi Local Agent** 接入 **Paperclip**，并让 Agent 能够稳定、可维护地使用 **Frappe CLI（frappecli）** 的交付仓库。

本仓库提供：

- Pi (local) 适配器接入与配置规范（可验收）
- Frappe CLI Skill（SKILL.md）与注入方式
- 部署、验收、排障文档
- 本地环境检查与冒烟脚本

---

## 目录结构

```text
.
├── doc
│   ├── guides
│   │   └── pi-local-dty-cli-deployment-guide.md
│   └── plans
│       ├── 2026-03-18-pi-local-adapter-enablement-requirements.md
│       └── 2026-03-18-pi-local-agent-frappecli-integration-requirements.md
├── .env.example
├── examples
│   └── paperclip
│       └── pi-local-agent.adapter-config.json
├── instructions
│   └── pi-local-dty-cli.instructions.md
├── scripts
│   ├── install_frappecli_skill.sh
│   ├── run_frappe_task_smoke.sh
│   └── verify_pi_local_agent.sh
└── skills
    └── frappecli
        └── SKILL.md
```

---

## 快速开始（实施工程师）

1. 阅读部署指南：  
   `doc/guides/pi-local-dty-cli-deployment-guide.md`
2. 安装并检查运行时（示例）：  
   `bash scripts/verify_pi_local_agent.sh`
3. 安装 Frappe CLI Skill：  
   `bash scripts/install_frappecli_skill.sh`
4. 在 Paperclip 配置 Agent（参考示例）：  
   `examples/paperclip/pi-local-agent.adapter-config.json`
5. 执行 Frappe CLI 冒烟：  
   `bash scripts/run_frappe_task_smoke.sh --doctype User --limit 5`

---

## 文档索引

- 产品/实现规范：
  - `doc/plans/2026-03-18-pi-local-agent-frappecli-integration-requirements.md`
  - `doc/plans/2026-03-18-pi-local-adapter-enablement-requirements.md`
- 部署与验收指南：
  - `doc/guides/pi-local-dty-cli-deployment-guide.md`
- Agent 指令与 Skill：
  - `instructions/pi-local-dty-cli.instructions.md`
  - `skills/frappecli/SKILL.md`

---

## 安全与最佳实践

- 禁止在仓库中硬编码密钥（Paperclip API Key、Frappe 凭证）
- 凭证通过环境变量或官方配置文件注入
- 所有变更应版本化（Skill、instructions、adapterConfig 示例、验收脚本）
