import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // In production, this URL comes from env
    // For local dev with Docker stack, we use port 8090
    const ORACLE_URL = process.env.ORACLE_GATEWAY_URL || "http://localhost:8090";
    
    // Stub auth token for now
    const authToken = "dev-token"; 

    const response = await fetch(`${ORACLE_URL}/orchestrate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...body,
        auth_token: authToken,
        user_id: "dev-user", // Todo: Get from session
      }),
    });

    if (!response.ok) {
      throw new Error(`Oracle Gateway error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[API] Orchestration failed:", error);
    return NextResponse.json(
      { error: "Failed to communicate with Oracle Gateway" },
      { status: 500 }
    );
  }
}
