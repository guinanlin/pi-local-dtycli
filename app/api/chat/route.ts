import { NextRequest, NextResponse } from "next/server";
import { chat } from "@/lib/agent";
import type { AgentEvent } from "@mariozechner/pi-agent-core";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "请提供有效的消息" },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error: "未配置 OPENAI_API_KEY。请在 .env.local 文件中设置。",
          hint: "cp .env.local.example .env.local && 编辑填入你的 API Key",
        },
        { status: 503 }
      );
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const result = await chat(message, (event: AgentEvent) => {
            try {
              const data = JSON.stringify({
                type: "event",
                event: {
                  type: event.type,
                  ...(event.type === "tool_execution_start"
                    ? { toolName: event.toolName, args: event.args }
                    : {}),
                  ...(event.type === "tool_execution_end"
                    ? { toolName: event.toolName, result: event.result }
                    : {}),
                },
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            } catch {
              // swallow serialization errors in event callback
            }
          });

          const finalData = JSON.stringify({
            type: "result",
            text: result.text,
          });
          controller.enqueue(encoder.encode(`data: ${finalData}\n\n`));
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : "未知错误";
          const errorData = JSON.stringify({
            type: "error",
            error: errorMsg,
          });
          try {
            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
            controller.close();
          } catch {
            // stream already closed
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "请求格式错误" },
      { status: 400 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    method: "POST",
    usage: 'POST /api/chat with JSON body: { "message": "北京天气怎么样？" }',
  });
}
