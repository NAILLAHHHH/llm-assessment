import { NextRequest, NextResponse } from "next/server";
import { listTickets, saveTicket } from "@/lib/db";
import { OllamaConnectionError } from "@/lib/ollama";
import { triageInboundText } from "@/lib/triage";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tickets = listTickets({
    category: searchParams.get("category") ?? undefined,
    priority: searchParams.get("priority") ?? undefined,
    search: searchParams.get("search") ?? undefined,
  });
  return NextResponse.json({ tickets });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { text?: string };
    if (!body.text?.trim()) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    const ticket = await triageInboundText(body.text.trim());
    saveTicket(ticket);
    return NextResponse.json({ ticket }, { status: 201 });
  } catch (err) {
    const status = err instanceof OllamaConnectionError ? 503 : 500;
    const message = err instanceof Error ? err.message : "Triage failed";
    return NextResponse.json({ error: message }, { status });
  }
}
