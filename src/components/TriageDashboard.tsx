"use client";

import { useCallback, useEffect, useState } from "react";
import type { TriageTicket } from "@/lib/schemas/triage";
import {
  TRIAGE_CATEGORIES,
  TRIAGE_PRIORITIES,
} from "@/lib/schemas/triage";

const priorityColors: Record<string, string> = {
  critical: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200",
  low: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

const statusColors: Record<string, string> = {
  valid: "text-emerald-600",
  repaired: "text-amber-600",
  fallback: "text-red-600",
};

export function TriageDashboard() {
  const [tickets, setTickets] = useState<TriageTicket[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");
  const [search, setSearch] = useState("");

  const loadTickets = useCallback(async () => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (priority) params.set("priority", priority);
    if (search) params.set("search", search);
    const res = await fetch(`/api/triage?${params}`);
    const data = (await res.json()) as { tickets: TriageTicket[] };
    setTickets(data.tickets);
  }, [category, priority, search]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setText("");
      await loadTickets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to triage");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-lg font-semibold">Submit inbound message</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder="Paste a support ticket, email, or customer feedback..."
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading || !text.trim()}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {loading ? "Triaging…" : "Triage message"}
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <h2 className="text-lg font-semibold">Dashboard</h2>
          <div className="ml-auto flex flex-wrap gap-2">
            <input
              type="search"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            >
              <option value="">All categories</option>
              {TRIAGE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            >
              <option value="">All priorities</option>
              {TRIAGE_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        {tickets.length === 0 ? (
          <p className="text-sm text-zinc-500">No tickets yet. Submit a message above.</p>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <article
                key={ticket.id}
                className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium capitalize dark:bg-zinc-800">
                    {ticket.category}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${priorityColors[ticket.priority]}`}
                  >
                    {ticket.priority}
                  </span>
                  <span
                    className={`text-xs font-medium capitalize ${statusColors[ticket.parseStatus]}`}
                  >
                    {ticket.parseStatus}
                  </span>
                  <span className="ml-auto text-xs text-zinc-500">
                    {new Date(ticket.createdAt).toLocaleString()}
                  </span>
                </div>

                <p className="mb-2 text-sm font-medium">{ticket.issueSummary}</p>
                <p className="mb-3 text-xs text-zinc-500 line-clamp-2">{ticket.rawText}</p>

                <div className="mb-3 flex flex-wrap gap-1">
                  {ticket.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="rounded-lg bg-zinc-50 p-3 text-sm dark:bg-zinc-950">
                  <p className="mb-1 text-xs font-medium text-zinc-500">Suggested reply</p>
                  <p>{ticket.suggestedReply}</p>
                </div>

                {ticket.parseWarnings.length > 0 && (
                  <p className="mt-2 text-xs text-amber-600">
                    Parse warnings: {ticket.parseWarnings.join(" · ")}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
