import { v4 as uuidv4 } from "uuid";
import { chat } from "./ollama";
import { config } from "./config";
import {
  TriageResultSchema,
  triageJsonSchemaDescription,
  type TriageResult,
  type TriageTicket,
} from "./schemas/triage";

function extractJson(text: string): string | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced?.[1]) return fenced[1].trim();

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end > start) {
    return text.slice(start, end + 1);
  }
  return null;
}

function normalizePayload(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const obj = { ...(raw as Record<string, unknown>) };

  if (typeof obj.customerEmail === "string" && obj.customerEmail.trim() === "") {
    obj.customerEmail = null;
  }
  if (typeof obj.customerName === "string" && obj.customerName.trim() === "") {
    obj.customerName = null;
  }
  if (!Array.isArray(obj.tags)) {
    obj.tags = [];
  }
  if (typeof obj.confidence === "string") {
    obj.confidence = parseFloat(obj.confidence);
  }

  return obj;
}

function buildFallback(rawText: string, warnings: string[]): TriageResult {
  return {
    category: "general",
    priority: "medium",
    customerName: null,
    customerEmail: null,
    issueSummary: rawText.slice(0, 200),
    sentiment: "neutral",
    tags: ["unparsed"],
    suggestedReply:
      "Thank you for reaching out. We have received your message and a team member will follow up shortly.",
    confidence: 0.1,
  };
}

async function requestTriageJson(
  rawText: string,
  repairHint?: string,
): Promise<string> {
  const system = `You are a support intake triage assistant. Analyze inbound customer messages and return ONLY valid JSON matching this schema:
${triageJsonSchemaDescription()}

Rules:
- category "billing" for payments, refunds, invoices
- category "technical" for bugs, errors, outages
- category "account" for login, access, profile
- category "product" for features, how-to, feedback
- priority "critical" only for security breaches, data loss, or total service outage affecting many users
- Extract customer name/email only if explicitly present
- suggestedReply should be empathetic, actionable, and ready to send`;

  const user = repairHint
    ? `Fix this JSON to match the schema. Previous errors: ${repairHint}\n\nOriginal message:\n${rawText}`
    : `Triage this inbound message:\n\n${rawText}`;

  return chat(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    { format: "json", temperature: 0.1 },
  );
}

export async function triageInboundText(rawText: string): Promise<TriageTicket> {
  const warnings: string[] = [];
  let parseStatus: TriageTicket["parseStatus"] = "valid";
  let result: TriageResult | null = null;

  for (let attempt = 0; attempt <= config.triage.maxRepairAttempts; attempt++) {
    const response = await requestTriageJson(
      rawText,
      attempt > 0 ? warnings.join("; ") : undefined,
    );

    const jsonStr = extractJson(response);
    if (!jsonStr) {
      warnings.push(`Attempt ${attempt + 1}: no JSON object found`);
      continue;
    }

    try {
      const parsed = normalizePayload(JSON.parse(jsonStr));
      const validated = TriageResultSchema.safeParse(parsed);
      if (validated.success) {
        result = validated.data;
        parseStatus = attempt === 0 ? "valid" : "repaired";
        break;
      }
      warnings.push(
        `Attempt ${attempt + 1}: ${validated.error.issues.map((i) => i.message).join(", ")}`,
      );
    } catch {
      warnings.push(`Attempt ${attempt + 1}: invalid JSON`);
    }
  }

  if (!result) {
    result = buildFallback(rawText, warnings);
    parseStatus = "fallback";
  }

  return {
    id: uuidv4(),
    rawText,
    createdAt: new Date().toISOString(),
    parseStatus,
    parseWarnings: warnings,
    ...result,
  };
}
