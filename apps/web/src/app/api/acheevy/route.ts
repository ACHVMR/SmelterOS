import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";

const ACHEEVY_URL = process.env.ACHEEVY_BACKEND_URL || "http://localhost:8091";

export async function POST(req: NextRequest) {
    const authError = requireApiAuth(req);
    if (authError) return authError;

    try {
        const body = await req.json();
        const response = await fetch(`${ACHEEVY_URL}/v1/chat/completions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "acheevy-main",
                messages: body.messages,
                stream: false,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json(
                { error: "Service unavailable" },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: "Connection failed" },
            { status: 500 }
        );
    }
}
