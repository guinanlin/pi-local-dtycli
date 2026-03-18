import { NextRequest, NextResponse } from "next/server";
import { chat } from "@/lib/agent";
import type { AgentEvent } from "@mariozechner/pi-agent-core";

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

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const result = await chat(message, (event: AgentEvent) => {
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
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "请求格式错误" },
      { status: 400 }
    );
  }
}
