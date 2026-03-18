#!/usr/bin/env node
/**
 * pi-mono-dty CLI：在终端中调用天气 Agent
 * 支持 Paperclip pi_local 契约：--list-models、--mode rpc、stdin JSON
 *
 * 用法：
 *   npm run cli -- "杭州天气怎么样"
 *   node dist/cli.mjs --list-models
 *   echo '{"type":"prompt","message":"杭州天气"}' | node dist/cli.mjs --mode rpc
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline";
import { chat, listModels, isSupportedModel } from "../lib/agent";
import type { ThinkingLevel } from "@mariozechner/pi-agent-core";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadEnvLocal(projectRoot: string) {
  const path = resolve(projectRoot, ".env.local");
  if (!existsSync(path)) return;
  const content = readFileSync(path, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (key && !process.env[key]) process.env[key] = value;
  }
}

interface ParsedArgs {
  listModels: boolean;
  modeRpc: boolean;
  appendSystemPrompt: string | undefined;
  provider: string | undefined;
  model: string | undefined;
  thinking: ThinkingLevel | undefined;
  positional: string[];
}

function parseArgs(argv: string[]): ParsedArgs {
  const result: ParsedArgs = {
    listModels: false,
    modeRpc: false,
    appendSystemPrompt: undefined,
    provider: undefined,
    model: undefined,
    thinking: undefined,
    positional: [],
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--list-models") {
      result.listModels = true;
    } else if (arg === "--mode" && argv[i + 1] === "rpc") {
      result.modeRpc = true;
      i++;
    } else if (arg === "--append-system-prompt") {
      result.appendSystemPrompt = argv[i + 1] ?? "";
      i++;
    } else if (arg === "--provider") {
      result.provider = argv[i + 1];
      i++;
    } else if (arg === "--model") {
      const value = argv[i + 1];
      if (value?.includes("/")) {
        const [p, m] = value.split("/", 2);
        if (p && m) {
          result.provider = p.trim();
          result.model = m.trim();
        } else {
          result.model = value;
        }
      } else {
        result.model = value;
      }
      i++;
    } else if (arg === "--thinking") {
      const v = argv[i + 1];
      const allowed: ThinkingLevel[] = ["off", "minimal", "low", "medium", "high", "xhigh"];
      result.thinking = v && allowed.includes(v as ThinkingLevel) ? (v as ThinkingLevel) : "off";
      i++;
    } else if (arg === "--tools" || arg === "--session") {
      if (argv[i + 1]) i++;
    } else if (!arg.startsWith("--")) {
      result.positional.push(arg);
    }
  }
  return result;
}

function readStdinLine(): Promise<string> {
  return new Promise((resolvePromise, rejectPromise) => {
    const rl = createInterface({ input: process.stdin, terminal: false });
    let line = "";
    rl.on("line", (l) => {
      line = l;
      rl.close();
    });
    rl.on("close", () => resolvePromise(line));
    rl.on("error", rejectPromise);
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.listModels) {
    const projectRoot = process.cwd();
    loadEnvLocal(projectRoot);
    for (const line of listModels()) {
      process.stdout.write(line + "\n");
    }
    process.exit(0);
  }

  if (args.modeRpc) {
    const projectRoot = process.cwd();
    loadEnvLocal(projectRoot);

    let raw: string;
    try {
      raw = await readStdinLine();
    } catch (err) {
      process.stderr.write("读取 stdin 失败: " + (err instanceof Error ? err.message : String(err)) + "\n");
      process.exit(1);
    }

    let payload: { type?: string; message?: string };
    try {
      payload = JSON.parse(raw || "{}") as { type?: string; message?: string };
    } catch {
      process.stderr.write("stdin 不是合法 JSON\n");
      process.exit(1);
    }

    const message = payload?.message;
    if (typeof message !== "string" || !message.trim()) {
      process.stderr.write("缺少或无效的 message 字段\n");
      process.exit(1);
    }

    if (args.provider != null && args.model != null && !isSupportedModel(args.provider, args.model)) {
      process.stderr.write(`不支持的模型: ${args.provider}/${args.model}，请使用 --list-models 查看\n`);
      process.exit(1);
    }

    try {
      const { text } = await chat(message.trim(), {
        appendSystemPrompt: args.appendSystemPrompt,
        provider: args.provider,
        model: args.model,
        thinkingLevel: args.thinking,
        onEvent: (event) => {
          if (event.type === "tool_execution_start" && event.toolName === "get_weather") {
            process.stderr.write("[get_weather] " + JSON.stringify(event.args) + "\n");
          }
        },
      });
      process.stdout.write(text + "\n");
      process.exit(0);
    } catch (err) {
      process.stderr.write("错误: " + (err instanceof Error ? err.message : String(err)) + "\n");
      process.exit(1);
    }
  }

  // 原有交互模式：位置参数为提示
  const projectRoot = resolve(__dirname, "..");
  loadEnvLocal(projectRoot);

  const input = args.positional.join(" ").trim();
  if (!input) {
    process.stderr.write("用法: npm run cli -- \"你的问题\"\n");
    process.stderr.write("示例: npm run cli -- \"杭州天气怎么样\"\n");
    process.stderr.write("RPC:  echo '{\"type\":\"prompt\",\"message\":\"...\"}' | node dist/cli.mjs --mode rpc\n");
    process.exit(1);
  }

  console.log("问:", input);
  console.log("---");

  chat(input, (event) => {
    if (event.type === "tool_execution_start" && event.toolName === "get_weather") {
      console.log("[调用 get_weather]", event.args);
    }
  })
    .then(({ text }) => {
      console.log("答:", text);
    })
    .catch((err) => {
      console.error("错误:", err instanceof Error ? err.message : err);
      process.exit(1);
    });
}

main();
