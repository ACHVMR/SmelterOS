import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const authError = requireApiAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const ORACLE_URL = process.env.ORACLE_GATEWAY_URL || "http://localhost:8090";
    const authToken = process.env.ORACLE_AUTH_TOKEN;

    if (!authToken) {
      return NextResponse.json({ error: "Service not configured" }, { status: 503 });
    }

    const response = await fetch(`${ORACLE_URL}/orchestrate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...body,
        auth_token: authToken,
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Orchestration failed" }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 500 });
  }
}
