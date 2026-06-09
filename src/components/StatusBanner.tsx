"use client";

import { useEffect, useState } from "react";

type Health = {
  ollama: { ok: boolean; models: string[]; error?: string };
  models: { chat: string; embed: string };
  knowledgeBase: { chunkCount: number; docCount: number };
};

export function StatusBanner() {
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  if (!health) return null;

  const ok = health.ollama.ok;
  const notRunning = health.ollama.error?.includes("not running");

  return (
    <div
      className={`rounded-lg border px-4 py-3 text-sm ${
        ok
          ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
          : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
      }`}
    >
      {ok ? (
        <p>
          Ollama connected · Chat: <strong>{health.models.chat}</strong> · Embed:{" "}
          <strong>{health.models.embed}</strong> · KB: {health.knowledgeBase.docCount}{" "}
          docs ({health.knowledgeBase.chunkCount} chunks)
        </p>
      ) : notRunning ? (
        <div className="space-y-1">
          <p>
            <strong>Ollama is not running.</strong> Open the Ollama app from
            Applications, then pull the models:
          </p>
          <p className="font-mono text-xs">
            ollama pull {health.models.chat} && ollama pull {health.models.embed}
          </p>
          <p className="text-xs opacity-80">
            Or run: <code className="rounded bg-black/5 px-1">npm run setup:ollama</code>
          </p>
        </div>
      ) : (
        <p>
          Ollama not ready: {health.ollama.error ?? "unknown error"}. Run{" "}
          <code className="rounded bg-black/5 px-1 dark:bg-white/10">
            ollama pull {health.models.chat}
          </code>{" "}
          and{" "}
          <code className="rounded bg-black/5 px-1 dark:bg-white/10">
            ollama pull {health.models.embed}
          </code>
        </p>
      )}
    </div>
  );
}
