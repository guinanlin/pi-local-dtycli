import { Agent } from "@mariozechner/pi-agent-core";
import { getModel } from "@mariozechner/pi-ai";
import type { AgentEvent, AgentMessage } from "@mariozechner/pi-agent-core";
import type { Message } from "@mariozechner/pi-ai";
import { weatherTool } from "./skills/weather";

const SYSTEM_PROMPT = `你是一个智能天气助手。你的主要任务是帮助用户查询城市天气信息。

你拥有以下能力：
- 使用 get_weather 工具查询城市的当前天气

使用规则：
1. 当用户询问某个城市的天气时，使用 get_weather 工具获取天气数据
2. 将获取到的天气数据用自然、友好的语言回复用户
3. 如果用户的问题与天气无关，友好地告知你只能帮助查询天气
4. 始终使用中文回复`;

function defaultConvertToLlm(messages: AgentMessage[]): Message[] {
  return messages.filter(
    (m): m is Message =>
      "role" in m &&
      (m.role === "user" || m.role === "assistant" || m.role === "toolResult")
  );
}

export interface ChatResponse {
  text: string;
  events: AgentEvent[];
}

export async function chat(
  userMessage: string,
  onEvent?: (event: AgentEvent) => void
): Promise<ChatResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }

  const model = getModel("openai", "gpt-4.1-mini");

  const agent = new Agent({
    initialState: {
      systemPrompt: SYSTEM_PROMPT,
      model,
      thinkingLevel: "off",
      tools: [weatherTool],
      messages: [],
    },
    convertToLlm: defaultConvertToLlm,
    getApiKey: () => apiKey,
  });

  const events: AgentEvent[] = [];

  const unsubscribe = agent.subscribe((event) => {
    events.push(event);
    onEvent?.(event);
  });

  try {
    await agent.prompt(userMessage);
    await agent.waitForIdle();
  } finally {
    unsubscribe();
  }

  const assistantMessages = agent.state.messages.filter(
    (m): m is Message & { role: "assistant" } => "role" in m && m.role === "assistant"
  );

  let text = "";
  if (assistantMessages.length > 0) {
    const lastMsg = assistantMessages[assistantMessages.length - 1];
    text = lastMsg.content
      .filter((c): c is { type: "text"; text: string } => c.type === "text")
      .map((c) => c.text)
      .join("");
  }

  return { text, events };
}

export function getAgentInfo() {
  return {
    name: "pi-mono-dty",
    description: "基于 pi-mono 的极简天气查询 Agent",
    model: "gpt-4.1-mini",
    provider: "openai",
    systemPrompt: SYSTEM_PROMPT,
    skills: [
      {
        name: weatherTool.name,
        label: weatherTool.label,
        description: weatherTool.description,
        parameters: {
          type: "object",
          properties: {
            city: { type: "string", description: "城市名称" },
          },
          required: ["city"],
        },
      },
    ],
  };
}
