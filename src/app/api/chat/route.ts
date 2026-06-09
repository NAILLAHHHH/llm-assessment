import { NextRequest, NextResponse } from "next/server";
import { OllamaConnectionError } from "@/lib/ollama";
import { answerWithRag } from "@/lib/rag/chat";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { question?: string };
    if (!body.question?.trim()) {
      return NextResponse.json(
        { error: "question is required" },
        { status: 400 },
      );
    }

    const response = await answerWithRag(body.question.trim());
    return NextResponse.json(response);
  } catch (err) {
    const status = err instanceof OllamaConnectionError ? 503 : 500;
    const message = err instanceof Error ? err.message : "Chat failed";
    return NextResponse.json({ error: message }, { status });
  }
}
