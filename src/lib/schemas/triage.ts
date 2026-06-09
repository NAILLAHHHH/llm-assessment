import { z } from "zod";

export const TRIAGE_CATEGORIES = [
  "billing",
  "technical",
  "account",
  "product",
  "general",
] as const;

export const TRIAGE_PRIORITIES = [
  "critical",
  "high",
  "medium",
  "low",
] as const;

export const TRIAGE_SENTIMENTS = ["positive", "neutral", "negative"] as const;

export const TriageResultSchema = z.object({
  category: z.enum(TRIAGE_CATEGORIES),
  priority: z.enum(TRIAGE_PRIORITIES),
  customerName: z.string().nullable(),
  customerEmail: z.string().email().nullable().or(z.literal(null)),
  issueSummary: z.string().min(1),
  sentiment: z.enum(TRIAGE_SENTIMENTS),
  tags: z.array(z.string()).default([]),
  suggestedReply: z.string().min(1),
  confidence: z.number().min(0).max(1),
});

export type TriageResult = z.infer<typeof TriageResultSchema>;

export const TriageTicketSchema = TriageResultSchema.extend({
  id: z.string().uuid(),
  rawText: z.string(),
  createdAt: z.string().datetime(),
  parseStatus: z.enum(["valid", "repaired", "fallback"]),
  parseWarnings: z.array(z.string()).default([]),
});

export type TriageTicket = z.infer<typeof TriageTicketSchema>;

export function triageJsonSchemaDescription(): string {
  return `{
  "category": one of ${TRIAGE_CATEGORIES.join(" | ")},
  "priority": one of ${TRIAGE_PRIORITIES.join(" | ")},
  "customerName": string or null,
  "customerEmail": valid email or null,
  "issueSummary": string (1-2 sentences),
  "sentiment": one of ${TRIAGE_SENTIMENTS.join(" | ")},
  "tags": string array (2-5 short labels),
  "suggestedReply": string (professional draft reply),
  "confidence": number 0-1
}`;
}
