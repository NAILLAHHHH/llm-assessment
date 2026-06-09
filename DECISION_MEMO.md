# Decision Memo — LLM Assessment

## Model Choice

**Chat: Qwen2.5 3B** (`qwen2.5:3b`) via Ollama  
**Embeddings: Nomic Embed Text** (`nomic-embed-text`) via Ollama

**Why:** Both run on CPU-only hardware with ~4–6 GB RAM. Qwen2.5 3B scores well on instruction-following and JSON output for its size. Nomic Embed Text is lightweight, open, and designed for retrieval — no commercial embedding API needed.

**Alternatives considered:** Llama 3.2 3B (comparable, slightly weaker JSON adherence in testing literature); Phi-3 mini (smaller but less reliable structured output).

---

## Quantization & Serving

- **Serving:** Ollama local HTTP API (`localhost:11434`) — simplest zero-cost path, handles model loading, quantization, and memory management.
- **Quantization:** Ollama serves Q4_K_M by default for 3B models — good latency/quality trade-off on consumer hardware.
- **No vLLM/GPU:** vLLM needs a GPU for practical use; this assessment targets free/local resources.

**Latency expectation:** 5–15 s per triage call, 3–8 s per RAG answer on Apple Silicon / modern CPU. Acceptable for a demo; production would add streaming UI and request queuing.

---

## Retrieval Strategy

1. **Ingestion:** Markdown files in `knowledge-base/` chunked at 500 chars with 80-char overlap.
2. **Embeddings:** Ollama `nomic-embed-text` at ingest time (lazy, on first RAG request).
3. **Retrieval:** Cosine similarity, top-3 chunks.
4. **Generation:** Retrieved chunks injected as numbered context; model instructed to cite `[1]`, `[2]`, etc.

**Why not a vector DB:** Four small docs (~2 KB total) — an in-memory store is sufficient, zero infra cost, and keeps the demo portable.

---

## Hallucination & Invalid Output Handling

### Triage (structured generation)

| Layer | Approach |
|-------|----------|
| Prompt | JSON-only system prompt with explicit schema |
| Format | Ollama `format: "json"` mode |
| Validation | Zod schema (category, priority, email, etc.) |
| Repair | Up to 2 re-prompts with validation errors |
| Fallback | Safe default ticket (`parseStatus: "fallback"`) if all attempts fail |

Malformed output never crashes the API — users see a degraded but usable result with warnings.

### RAG (grounded answers)

| Signal | Threshold / rule |
|--------|------------------|
| Retrieval gate | Top chunk cosine similarity < **0.45** → "not in knowledge base" (no LLM call for generation beyond a template response) |
| Prompt constraint | "Answer ONLY from context" + citation requirement |
| Post-check | Flag `notInKnowledgeBase` if model text denies knowledge; show `grounded` badge when citations present |

**Ambiguous point — "not in KB":** I define it as **retrieval failure first** (no chunk above 0.45 similarity), plus **model self-denial** as a secondary signal. A question can retrieve weakly related chunks but still be answered only if the model cites them; otherwise it's flagged.

---

## Ambiguous Point — Triage Schema

I chose a **support-ticket-oriented schema**:

- **Categories:** `billing`, `technical`, `account`, `product`, `general`
- **Priorities:** `critical` (security/outage/data loss), `high`, `medium`, `low`
- **Extracted fields:** `customerName`, `customerEmail`, `issueSummary`, `sentiment`, `tags`, `suggestedReply`, `confidence`

**Reasoning:** Mirrors real support queues. Five categories cover 90% of SaaS tickets without over-granularity. Priority rubric is explicit in the prompt to reduce "everything is critical" inflation. `confidence` lets the dashboard surface low-trust parses for human review.

---

## Latency vs. Hardware Trade-offs

| Choice | Trade-off |
|--------|-----------|
| 3B model vs 7B+ | Faster, runs on free tier; less nuanced replies |
| Local Ollama vs cloud GPU | Zero cost; single-user throughput only |
| SQLite vs Postgres | Simpler setup; sufficient for demo scale (Postgres would be next step for multi-tenant) |
| Sync API vs streaming | Simpler code; worse perceived latency |

---

## Assumptions

1. Evaluator has Ollama installed and can pull ~2 GB of models once.
2. English-only inbound text and knowledge base.
3. Single-tenant demo — no auth, rate limiting, or multi-user concurrency.
4. Knowledge base is static; no upload UI (files in repo are the source of truth).
5. Screen recording will be recorded locally with Ollama running.
