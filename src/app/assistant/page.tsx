import { StatusBanner } from "@/components/StatusBanner";
import { ChatAssistant } from "@/components/ChatAssistant";

export default function AssistantPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 space-y-2">
        <h1 className="text-2xl font-bold">Grounded Knowledge Assistant</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          RAG-powered Q&amp;A with citations. Questions outside the knowledge base
          are flagged explicitly.
        </p>
        <StatusBanner />
      </div>
      <ChatAssistant />
    </div>
  );
}
