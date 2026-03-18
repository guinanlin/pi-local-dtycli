import { Agent } from "@mariozechner/pi-agent-core";
import { getModel } from "@mariozechner/pi-ai";
import type { KnownProvider } from "@mariozechner/pi-ai";
import type { AgentEvent, AgentMessage } from "@mariozechner/pi-agent-core";
import type { ThinkingLevel } from "@mariozechner/pi-agent-core";
import type { Message } from "@mariozechner/pi-ai";
import { weatherTool } from "./skills/weather";

const MODEL_PROVIDER = "groq" as const;
const MODEL_ID = "llama-3.3-70b-versatile" as const;
const API_KEY_ENV = "GROQ_API_KEY";

/** 当前支持的模型列表，每项为 "provider\tmodel"；与 --list-models 输出一致 */
const SUPPORTED_MODELS: readonly [KnownProvider, string][] = [
  ["groq", "llama-3.3-70b-versatile"],
];

/** 返回 --list-models 应输出的行（每行 provider\tmodel） */
export function listModels(): string[] {
  return SUPPORTED_MODELS.map(([p, m]) => `${p}\t${m}`);
}

/** 校验 (provider, model) 是否在支持列表中 */
export function isSupportedModel(provider: string, model: string): boolean {
  return SUPPORTED_MODELS.some(
    ([p, m]) => p === provider && m === model
  );
}

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

export interface ChatOptions {
  appendSystemPrompt?: string;
  provider?: string;
  model?: string;
  thinkingLevel?: ThinkingLevel;
  onEvent?: (event: AgentEvent) => void;
}

export async function chat(
  userMessage: string,
  optionsOrOnEvent?: ChatOptions | ((event: AgentEvent) => void)
): Promise<ChatResponse> {
  const options: ChatOptions =
    typeof optionsOrOnEvent === "function"
      ? { onEvent: optionsOrOnEvent }
      : optionsOrOnEvent ?? {};
  const onEvent = options.onEvent;

  const apiKey = process.env[API_KEY_ENV];
  if (!apiKey) {
    throw new Error(`${API_KEY_ENV} environment variable is not set`);
  }

  const provider = options.provider ?? MODEL_PROVIDER;
  const modelId = options.model ?? MODEL_ID;
  if (options.provider != null || options.model != null) {
    if (!isSupportedModel(provider, modelId)) {
      throw new Error(
        `不支持的模型: ${provider}/${modelId}，请使用 --list-models 查看支持列表`
      );
    }
  }

  const model = getModel(
    provider as KnownProvider,
    modelId as Parameters<typeof getModel>[1]
  );
  const systemPrompt =
    SYSTEM_PROMPT + (options.appendSystemPrompt ? "\n\n" + options.appendSystemPrompt : "");
  const thinkingLevel = options.thinkingLevel ?? "off";

  const agent = new Agent({
    initialState: {
      systemPrompt,
      model,
      thinkingLevel,
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
  } catch (err) {
    unsubscribe();
    const errMsg = err instanceof Error ? err.message : String(err);
    if (errMsg.includes("401") || errMsg.includes("Unauthorized")) {
      throw new Error("Groq API Key 无效或已过期，请检查配置", { cause: err });
    }
    if (errMsg.includes("429") || errMsg.includes("rate limit")) {
      throw new Error("API 请求频率超限，请稍后重试", { cause: err });
    }
    throw new Error(`Agent 处理失败: ${errMsg}`, { cause: err });
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

  if (!text) {
    const errorMsg = agent.state.error;
    if (errorMsg) {
      throw new Error(`Agent 返回错误: ${errorMsg}`);
    }
    text = "抱歉，我没有生成有效的回复，请重试。";
  }

  return { text, events };
}

export function getAgentInfo() {
  return {
    name: "pi-mono-dty",
    description: "基于 pi-mono 的极简天气查询 Agent",
    model: MODEL_ID,
    provider: MODEL_PROVIDER,
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
