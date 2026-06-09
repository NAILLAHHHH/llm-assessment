import { config } from "./config";

type OllamaChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type OllamaChatResponse = {
  message: { content: string };
};

type OllamaEmbedResponse = {
  embeddings: number[][];
};

export class OllamaConnectionError extends Error {
  constructor(message?: string) {
    super(
      message ??
        "Cannot connect to Ollama. Start the Ollama app (or run `ollama serve`) and pull the required models.",
    );
    this.name = "OllamaConnectionError";
  }
}

function isConnectionError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const cause = (err as Error & { cause?: { code?: string } }).cause;
  return (
    err.message.includes("fetch failed") ||
    cause?.code === "ECONNREFUSED" ||
    err.message.includes("ECONNREFUSED")
  );
}

async function ollamaFetch<T>(path: string, body: unknown): Promise<T> {
  try {
    const res = await fetch(`${config.ollama.baseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Ollama ${path} failed (${res.status}): ${text}`);
    }

    return res.json() as Promise<T>;
  } catch (err) {
    if (isConnectionError(err)) {
      throw new OllamaConnectionError();
    }
    throw err;
  }
}

export async function chat(
  messages: OllamaChatMessage[],
  options?: { temperature?: number; format?: "json" },
): Promise<string> {
  const data = await ollamaFetch<OllamaChatResponse>("/api/chat", {
    model: config.ollama.chatModel,
    messages,
    stream: false,
    options: {
      temperature: options?.temperature ?? 0.2,
      num_predict: 1024,
    },
    ...(options?.format === "json" ? { format: "json" } : {}),
  });

  return data.message.content;
}

export async function embed(texts: string[]): Promise<number[][]> {
  const data = await ollamaFetch<OllamaEmbedResponse>("/api/embed", {
    model: config.ollama.embedModel,
    input: texts,
  });

  return data.embeddings;
}

export async function checkOllamaHealth(): Promise<{
  ok: boolean;
  models: string[];
  error?: string;
}> {
  try {
    const res = await fetch(`${config.ollama.baseUrl}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) {
      return { ok: false, models: [], error: `HTTP ${res.status}` };
    }
    const data = (await res.json()) as { models: { name: string }[] };
    const models = data.models.map((m) => m.name);
    const hasChat = models.some((m) =>
      m.startsWith(config.ollama.chatModel.split(":")[0]),
    );
    const hasEmbed = models.some((m) =>
      m.startsWith(config.ollama.embedModel.split(":")[0]),
    );
    return {
      ok: hasChat && hasEmbed,
      models,
      error: !hasChat
        ? `Missing chat model. Run: ollama pull ${config.ollama.chatModel}`
        : !hasEmbed
          ? `Missing embed model. Run: ollama pull ${config.ollama.embedModel}`
          : undefined,
    };
  } catch (err) {
    const isRefused =
      err instanceof Error &&
      (err.message.includes("fetch failed") ||
        err.name === "TimeoutError" ||
        (err as Error & { cause?: { code?: string } }).cause?.code ===
          "ECONNREFUSED");

    return {
      ok: false,
      models: [],
      error: isRefused
        ? "Ollama is not running. Open the Ollama app or run `ollama serve`."
        : err instanceof Error
          ? err.message
          : "Ollama unreachable",
    };
  }
}
