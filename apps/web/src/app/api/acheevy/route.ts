import { NextRequest, NextResponse } from "next/server";

const ACHEEVY_URL = process.env.ACHEEVY_BACKEND_URL || "http://localhost:8091";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        
        // Forward to ii-agent (OpenAI Compatible Endpoint)
        const response = await fetch(`${ACHEEVY_URL}/v1/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "acheevy-main", // Placeholder model name, backend handles routing
                messages: body.messages,
                stream: false // Todo: Add streaming support later
            }),
        });

        if (!response.ok) {
            // Include details for debugging
            const errorText = await response.text();
            console.error(`ACHEEVY Backend Error (${response.status}):`, errorText);
            return NextResponse.json(
                { error: `Backend Error: ${response.status}`, details: errorText }, 
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error("ACHEEVY Proxy Error:", error);
        return NextResponse.json(
            { error: "Connection Failed: Could not reach ii-agent backend." }, 
            { status: 500 }
        );
    }
}
