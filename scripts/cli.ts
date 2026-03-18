#!/usr/bin/env node
/**
 * pi-mono-dty CLI：在终端中调用天气 Agent
 * 用法：npm run cli -- "杭州天气怎么样"
 *  或：npx tsx scripts/cli.ts "杭州天气怎么样"
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chat } from "../lib/agent";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, "..");

function loadEnvLocal() {
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

function main() {
  loadEnvLocal();

  const input = process.argv.slice(2).join(" ").trim();
  if (!input) {
    console.error("用法: npm run cli -- \"你的问题\"");
    console.error("示例: npm run cli -- \"杭州天气怎么样\"");
    process.exit(1);
  }

  console.log("问:", input);
  console.log("---");

  chat(input, (event) => {
    if (event.type === "toolCall" && event.toolName === "get_weather") {
      console.log("[调用 get_weather]", event.parameters);
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
