export const config = {
  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
    chatModel: process.env.OLLAMA_CHAT_MODEL ?? "qwen2.5:3b",
    embedModel: process.env.OLLAMA_EMBED_MODEL ?? "nomic-embed-text",
  },
  rag: {
    relevanceThreshold: 0.45,
    topK: 3,
    chunkSize: 500,
    chunkOverlap: 80,
  },
  triage: {
    maxRepairAttempts: 2,
  },
} as const;
