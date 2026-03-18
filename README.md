# pi-mono-dty

基于 [pi-mono](https://github.com/badlogic/pi-mono) 的极简 Agent 应用，通过 Next.js 提供对话界面，自动调用天气 API（Skill）并返回结果。

## 核心功能

用户输入一句话 → pi-mono Agent → 调用 Weather Skill → 返回天气结果

## 技术栈

- **前端**: Next.js 16 + React 19 + Tailwind CSS 4
- **Agent 运行时**: pi-mono (`@mariozechner/pi-agent-core` + `@mariozechner/pi-ai`)
- **LLM**: Groq Llama 3.3 70B Versatile
- **天气数据**: [Open-Meteo API](https://open-meteo.com/)

## 环境要求

- **Node.js** >= 18.0.0
- **npm** >= 8
- **Groq API Key** (必须，从 https://console.groq.com/keys 获取)

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.local.example .env.local
# 编辑 .env.local，填入你的 GROQ_API_KEY

# 3. 启动开发服务器
npm run dev

# 4. 访问 http://localhost:3136
```

## 命令说明

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（Turbopack，http://0.0.0.0:3136） |
| `npm run dev:safe` | 启动开发服务器（无 Turbopack，兼容性更好） |
| `npm run build` | 构建 Next 生产版本 |
| `npm run start` | 启动生产服务器 |
| `npm run cli -- "你的问题"` | **CLI**：终端调用天气 Agent（自动读取 `.env.local` 的 `GROQ_API_KEY`，首次会先执行 build:cli） |
| `npm run build:cli` | 构建 CLI 单文件到 `dist/cli.mjs` |
| `npm run lint` | 运行 ESLint |

### CLI 使用示例

```bash
# 确保已配置 .env.local 中的 GROQ_API_KEY
npm run cli -- "杭州天气怎么样"
npm run cli -- "北京明天天气"

# 已构建过可直接运行（需在项目根目录）
node dist/cli.mjs "杭州天气怎么样"
```

## 作为 Paperclip pi_local 使用

本 CLI 符合 [Paperclip](https://github.com/paperclipai/paperclip) 的 **pi_local 适配器契约**，可作为「Pi (local)」Agent 的命令使用：Paperclip 启动进程并传入 `--mode rpc` 等参数、通过 stdin 写入一行 JSON 提示，本进程执行单次 Agent 推理后将结果写入 stdout 并退出。对接标准见 Paperclip 文档：集成建议与改造清单、**model 必填要求**。

### 在 Paperclip 中配置

- **adapterConfig.command**（必填）：可执行命令，需指向构建产物。例如：
  - `node /path/to/pi-local-dtycli/dist/cli.mjs`
  - 或使用绝对路径，确保 Paperclip 所在环境能访问该路径。
- **adapterConfig.model**（必填，Paperclip 强制）：须为 **provider/model** 格式，且须出自本 CLI 的 `--list-models` 输出；**必须在 Configuration 中选择并保存**后再发起 Run，否则 Run 会报错并中止（`Pi requires adapterConfig.model in provider/model format`）。当前支持：
  - `groq/llama-3.3-70b-versatile`
- **adapterConfig.cwd**（可选）：工作目录；本 CLI 在 RPC 模式下会基于 **当前工作目录** 加载 `.env.local` 及解析相对路径，可在此配置项目或 workspace 根目录。
- **Instructions**：由 Paperclip 侧配置 `instructionsFilePath` 等，通过 `--append-system-prompt` 注入；本 CLI 会将其与默认 system prompt 合并后传给 LLM。

当前 CLI 仅支持 **get_weather** 工具；若需 bash 等能力，可依赖 `--append-system-prompt` 注入用法说明，或后续扩展工具集。

### 自测命令

```bash
# 模型列表（退出码 0）
node dist/cli.mjs --list-models

# RPC 单次 Run：stdin 一行 JSON，stdout 为最终回复
echo '{"type":"prompt","message":"杭州天气怎么样"}' | node dist/cli.mjs --mode rpc
# 预期：stdout 输出天气回复，退出码 0
```

## 故障排查

### "Could not connect" / 无法访问

1. **检查端口占用**：
```bash
# 查看 3136 端口是否被占用
fuser 3136/tcp
# 杀掉占用进程
fuser -k 3136/tcp
```

2. **尝试安全模式启动**（禁用 Turbopack）：
```bash
npm run dev:safe
```

3. **检查健康端点**：
```bash
curl http://localhost:3136/api/health
```

4. **清除缓存重启**：
```bash
rm -rf .next node_modules/.cache
npm run dev
```

### API Key 未配置

页面顶部会显示黄色警告，按提示在 `.env.local` 中配置即可：

```
GROQ_API_KEY=gsk_your-key-here
```

### 依赖安装失败

若出现 peer dependency 冲突，可使用：

```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

## 项目结构

```
/app
  page.tsx                 # 对话页面
  admin/page.tsx           # Agent 管理面板
  api/chat/route.ts        # 聊天接口（SSE 流式）
  api/agent/route.ts       # Agent 信息接口
  api/health/route.ts      # 健康检查端点

/lib
  agent.ts                 # pi-mono Agent 封装（Web + CLI 共用）
  skills/weather.ts       # Weather Skill 实现

/scripts
  cli.ts                   # CLI 入口（经 build:cli 打包为 dist/cli.mjs）

dist/                      # CLI 构建产物（已加入 .gitignore）
```

## API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/chat` | POST | 发送消息，SSE 流式返回 |
| `/api/agent` | GET | 获取 Agent 配置信息 |
| `/api/health` | GET | 健康检查 |

## 支持的城市

北京、上海、杭州、广州、深圳、成都、武汉、南京、西安、重庆、天津、苏州、长沙、郑州、东京、纽约、伦敦、巴黎、新加坡、首尔

## 使用示例

输入：`杭州天气怎么样？`

输出：
```
杭州当前天气：晴天
温度：20°C（体感 19°C）
湿度：65%
风速：3 km/h
```
