import { StatusBanner } from "@/components/StatusBanner";
import { TriageDashboard } from "@/components/TriageDashboard";

export default function TriagePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 space-y-2">
        <h1 className="text-2xl font-bold">Smart Intake Triage</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Submit unstructured inbound text. The model returns validated JSON with
          category, priority, extracted fields, and a suggested reply.
        </p>
        <StatusBanner />
      </div>
      <TriageDashboard />
    </div>
  );
}
