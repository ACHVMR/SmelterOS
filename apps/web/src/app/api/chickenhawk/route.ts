import { NextRequest, NextResponse } from "next/server";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";

const MODEL_MAP: Record<string, string> = {
  "chickenhawk": "google/gemini-2.0-flash-exp:free",
  "gemini-2.0-flash": "google/gemini-2.0-flash-exp:free",
  "claude-3.5-sonnet": "anthropic/claude-3.5-sonnet",
  "gpt-4o": "openai/gpt-4o",
  "deepseek-r1": "deepseek/deepseek-r1",
};

const CHICKEN_HAWK_SYSTEM = `You are Chicken Hawk, an agentic AI assistant powered by SmelterOS.

You have access to 19 Intelligent-Internet modules:
- ii-agent: Full-stack web development with planning/reflection
- ii-researcher: Deep web research with BAML functions
- codex: Lightweight Rust-based code generation
- agent-zero: Docker-sandboxed autonomous execution
- CommonGround: Multi-agent team collaboration
- Common_Chronicle: Timeline/context structuring
- gemini-cli: Direct Gemini terminal access
- litellm: 100+ LLM API gateway
- PPTist: AI-powered presentation builder
- CoT-Lab: Chain-of-Thought cognitive alignment
- ii-thought: Reinforcement learning datasets
- ii_verl: Volcano Engine RL training
- And more...

When given a task:
1. Identify which modules are relevant
2. Plan the execution steps
3. Execute and report progress
4. Provide actionable results

Be helpful, precise, and proactive. Show your reasoning when solving complex problems.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, model = "chickenhawk" } = body;

    if (!OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "OpenRouter API key not configured. Set OPENROUTER_API_KEY in .env.local" },
        { status: 500 }
      );
    }

    const openRouterModel = MODEL_MAP[model] || MODEL_MAP["chickenhawk"];

    // Prepare messages with system prompt
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
        "X-Title": "SmelterOS Chicken Hawk",
      },
      body: JSON.stringify({
        model: openRouterModel,
        messages: fullMessages,
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.error?.message || "OpenRouter API error" },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "No response";

    return NextResponse.json({
      response: content,
      model: openRouterModel,
      usage: data.usage,
    });
  } catch (error) {
    console.error("Chicken Hawk API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
