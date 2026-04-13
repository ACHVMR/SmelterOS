import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";

const MODEL_MAP: Record<string, string> = {
  "chickenhawk": "google/gemini-2.0-flash-exp:free",
  "gemini-2.0-flash": "google/gemini-2.0-flash-exp:free",
};

const CHICKEN_HAWK_SYSTEM = `You are Chicken Hawk, an agentic AI assistant powered by SmelterOS.
When given a task:
1. Identify which modules are relevant
2. Plan the execution steps
3. Execute and report progress
4. Provide actionable results
Be helpful, precise, and proactive.`;

export async function POST(req: NextRequest) {
  const authError = requireApiAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { messages, model = "chickenhawk" } = body;

    if (!OPENROUTER_API_KEY) {
      return NextResponse.json({ error: "Service not configured" }, { status: 503 });
    }

    const openRouterModel = MODEL_MAP[model] || MODEL_MAP["chickenhawk"];
    const fullMessages = [
      { role: "system", content: CHICKEN_HAWK_SYSTEM },
      ...messages.filter((m: { role: string }) => m.role !== "system"),
    ];

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://smelteros.com",
        "X-Title": "SmelterOS",
      },
      body: JSON.stringify({
        model: openRouterModel,
        messages: fullMessages,
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Service error" }, { status: response.status });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "No response";

    // Never expose model names or usage internals
    return NextResponse.json({ response: content });
  } catch (error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
