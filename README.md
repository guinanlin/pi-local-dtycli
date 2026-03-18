# pi-mono-dty

基于 [pi-mono](https://github.com/badlogic/pi-mono) 的极简 Agent 应用，通过 Next.js 提供对话界面，自动调用天气 API（Skill）并返回结果。

## 核心功能

用户输入一句话 → pi-mono Agent → 调用 Weather Skill → 返回天气结果

## 技术栈

- **前端**: Next.js + React + Tailwind CSS
- **Agent 运行时**: pi-mono (`@mariozechner/pi-agent-core` + `@mariozechner/pi-ai`)
- **LLM**: OpenAI GPT-4.1-mini
- **天气数据**: [Open-Meteo API](https://open-meteo.com/)

## 快速开始

1. 安装依赖：

```bash
npm install
```

2. 配置环境变量：

```bash
cp .env.local.example .env.local
# 编辑 .env.local，填入 OPENAI_API_KEY
```

3. 启动开发服务器：

```bash
npm run dev
```

4. 访问 http://localhost:3000

## 项目结构

```
/app
  /page.tsx                # 对话页面
  /admin/page.tsx          # Agent 管理面板
  /api/chat/route.ts       # 聊天接口
  /api/agent/route.ts      # Agent 信息接口

/lib
  agent.ts                 # pi-mono Agent 封装
  skills/weather.ts        # Weather Skill 实现
```

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
