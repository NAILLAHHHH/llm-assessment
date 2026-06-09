"use client";

import { useState } from "react";
import type { Citation } from "@/lib/rag/chat";

type Message = {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  notInKnowledgeBase?: boolean;
  grounded?: boolean;
};

const SAMPLE_QUESTIONS = [
  "What is the refund policy?",
  "How do I reset my password?",
  "What are the API rate limits?",
  "Do you support SSO on the free plan?",
];

export function ChatAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendQuestion(question: string) {
    if (!question.trim() || loading) return;
    setError(null);
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setInput("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Chat failed");

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer,
          citations: data.citations,
          notInKnowledgeBase: data.notInKnowledgeBase,
          grounded: data.grounded,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chat failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="space-y-3 text-sm text-zinc-500">
            <p>Ask a question grounded in the knowledge base.</p>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => sendQuestion(q)}
                  className="rounded-full border border-zinc-200 px-3 py-1 text-xs hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === "user"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "bg-zinc-100 dark:bg-zinc-800"
              }`}
            >
              {msg.role === "assistant" && msg.notInKnowledgeBase && (
                <p className="mb-2 text-xs font-medium text-amber-600">
                  Not in knowledge base
                </p>
              )}
              {msg.role === "assistant" && msg.grounded && (
                <p className="mb-2 text-xs font-medium text-emerald-600">
                  Grounded answer
                </p>
              )}
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-3 space-y-2 border-t border-zinc-200 pt-3 dark:border-zinc-700">
                  <p className="text-xs font-medium text-zinc-500">Sources</p>
                  {msg.citations.map((c) => (
                    <div key={c.index} className="text-xs text-zinc-600 dark:text-zinc-400">
                      <span className="font-medium">
                        [{c.index}] {c.docTitle}
                      </span>{" "}
                      (score {c.score.toFixed(2)})
                      <p className="mt-0.5 italic">{c.excerpt}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <p className="text-sm text-zinc-500">Thinking…</p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendQuestion(input);
        }}
        className="flex gap-2 border-t border-zinc-200 p-4 dark:border-zinc-800"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question…"
          className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          Send
        </button>
      </form>
    </div>
  );
}
