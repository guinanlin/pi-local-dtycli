# Frappe CLI Skill

## Skill Name

frappecli-for-pi-local-agent

## Purpose

在 Frappe/ERPNext 相关任务中，优先使用 `frappecli` 完成数据查询、报表执行、RPC 调用，避免手写 HTTP 请求。

## When To Use

当任务包含以下意图时应优先使用 `frappecli`：

- 列出或查询 doctype 文档
- 获取单条文档详情
- 执行报表
- 调用后端 RPC 方法
- 查看站点支持的 doctypes

## Preconditions

执行前先检查：

1. `frappecli` 在 PATH：`command -v frappecli`
2. 配置可用：`~/.config/frappecli/config.yaml` 或环境变量已注入
3. 目标站点连通且认证有效

## Core Command Patterns

1. 列出 doctypes：

```bash
frappecli site doctypes
```

2. 列出某 doctype 前 N 条：

```bash
frappecli doc list --doctype "<DOCTYPE>" --limit <N>
```

3. 获取单条文档：

```bash
frappecli doc get --doctype "<DOCTYPE>" --name "<DOC_NAME>"
```

4. 执行报表：

```bash
frappecli report run --report "<REPORT_NAME>" --filters '<JSON_FILTERS>'
```

5. 调用 RPC：

```bash
frappecli rpc --method "<METHOD_PATH>" --args '<JSON_ARGS>'
```

## Output Guidelines

- 输出先给结论（成功/失败）
- 成功时给关键结果摘要（条数、关键字段、前几条样本）
- 失败时给可执行的排障建议（认证、站点、参数、网络）

## Safety Rules

- 不输出或回显完整密钥
- 不在仓库中写死凭证
- 默认执行只读查询；写操作前应明确用户意图

## Error Handling

1. 如果 `frappecli` 不存在：提示安装并终止任务
2. 如果认证失败：提示检查 key/secret 与站点 URL
3. 如果命令参数错误：给出可执行的正确命令模板
4. 如果站点超时：建议重试并检查网络

## Task Templates

1. “列出 User doctype 前 5 条”

```bash
frappecli doc list --doctype "User" --limit 5
```

2. “运行 Sales Register 报表，过滤本月”

```bash
frappecli report run --report "Sales Register" --filters '{"from_date":"2026-03-01","to_date":"2026-03-31"}'
```
