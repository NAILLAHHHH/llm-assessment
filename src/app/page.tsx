import Link from "next/link";
import { StatusBanner } from "@/components/StatusBanner";

export default function Home() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8 space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">
          Self-Hosted LLM Assessment
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Two use cases powered by a single local Ollama model — no commercial
          APIs.
        </p>
        <StatusBanner />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Link
          href="/triage"
          className="group rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
        >
          <h2 className="mb-2 text-xl font-semibold group-hover:underline">
            Smart Intake Triage
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Classify inbound support messages, extract structured fields, draft
            replies, and browse a filterable dashboard. Malformed model output is
            validated and repaired with Zod.
          </p>
        </Link>

        <Link
          href="/assistant"
          className="group rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
        >
          <h2 className="mb-2 text-xl font-semibold group-hover:underline">
            Grounded Knowledge Assistant
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Ask questions against a small document knowledge base. Answers include
            citations and clearly state when information is not available.
          </p>
        </Link>
      </div>
    </div>
  );
}
