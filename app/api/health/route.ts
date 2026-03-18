import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    env: {
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      nodeVersion: process.version,
    },
  });
}
