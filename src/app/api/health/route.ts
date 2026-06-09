import { NextResponse } from "next/server";
import { checkOllamaHealth } from "@/lib/ollama";
import { getKnowledgeBaseFileStats } from "@/lib/rag/store";
import { config } from "@/lib/config";

export async function GET() {
  const ollama = await checkOllamaHealth();
  const knowledgeBase = getKnowledgeBaseFileStats();

  return NextResponse.json({
    ollama,
    models: {
      chat: config.ollama.chatModel,
      embed: config.ollama.embedModel,
    },
    knowledgeBase,
  });
}
