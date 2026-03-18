import { NextResponse } from "next/server";
import { getAgentInfo } from "@/lib/agent";
import { getSupportedCities } from "@/lib/skills/weather";

export async function GET() {
  const info = getAgentInfo();
  const cities = getSupportedCities();

  return NextResponse.json({
    ...info,
    supportedCities: cities,
    status: process.env.GROQ_API_KEY ? "ready" : "missing_api_key",
  });
}
