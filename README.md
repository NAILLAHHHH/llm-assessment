# LLM Assessment — Self-Hosted Triage & RAG

Full-stack demo powered by **local Ollama models** (no OpenAI, Anthropic, Gemini, or other commercial APIs).

| Use Case | Route | Description |
|----------|-------|-------------|
| Smart Intake Triage | `/triage` | Classify inbound text → structured JSON + suggested reply + filterable dashboard |
| Grounded Knowledge Assistant | `/assistant` | RAG chat with citations; explicit "not in KB" responses |

**Stack:** Next.js 16 · TypeScript · Tailwind · SQLite · Ollama (Qwen2.5 3B + Nomic Embed Text)

See [DECISION_MEMO.md](./DECISION_MEMO.md) for architecture decisions and trade-offs.

---

## Prerequisites

- **Node.js** 20+
- **Ollama** — [https://ollama.com/download](https://ollama.com/download)
- ~4 GB free disk for models
- macOS, Linux, or Windows with WSL

---

## Quick Start

### 1. Install & pull models

```bash
# Install Ollama from https://ollama.com/download, then:
chmod +x scripts/setup-ollama.sh
./scripts/setup-ollama.sh
```

This pulls:
- `qwen2.5:3b` — chat / structured generation
- `nomic-embed-text` — embeddings for RAG

Verify Ollama is running:

```bash
ollama list
curl http://localhost:11434/api/tags
```

### 2. Install app dependencies

```bash
npm install
cp .env.example .env   # optional — defaults work for local Ollama
```

### 3. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## End-to-End Demo

### Use Case 1 — Smart Intake Triage

1. Go to **Intake Triage** (`/triage`)
2. Paste sample inbound text, e.g.:

   ```
   Hi, I'm Sarah (sarah@acme.com). We've been charged twice for our Pro plan
   this month and I can't access the billing portal. This is urgent — our
   finance team needs this fixed today.
   ```

3. Click **Triage message** — the model returns structured JSON (category, priority, fields, suggested reply)
4. Filter the dashboard by category, priority, or search text
5. Check `parseStatus`: `valid`, `repaired` (after Zod retry), or `fallback` (graceful degradation)

**API:**

```bash
curl -X POST http://localhost:3000/api/triage \
  -H "Content-Type: application/json" \
  -d '{"text":"My login is broken, error 500 since yesterday"}'
```

### Use Case 2 — Grounded Knowledge Assistant

1. Go to **Knowledge Assistant** (`/assistant`)
2. Ask questions covered by `knowledge-base/`:
   - "What is the refund policy?"
   - "How do I reset my password?"
   - "What are the API rate limits?"
3. Answers include numbered citations with source excerpts
4. Ask something **not** in the KB (e.g. "What is your phone support number?") — the app responds that the information is not available

**API:**

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question":"What is the refund policy for annual plans?"}'
```

### Health check

```bash
curl http://localhost:3000/api/health
```

---

## Project Structure

```
├── knowledge-base/          # RAG source documents (markdown)
├── src/
│   ├── app/
│   │   ├── api/             # REST endpoints
│   │   ├── triage/          # Triage dashboard UI
│   │   └── assistant/       # RAG chat UI
│   └── lib/
│       ├── ollama.ts        # Ollama client
│       ├── triage.ts        # Structured generation + repair
│       ├── db.ts            # SQLite persistence
│       └── rag/             # Chunking, embeddings, retrieval
├── scripts/setup-ollama.sh
├── DECISION_MEMO.md
└── README.md
```

---

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama API URL |
| `OLLAMA_CHAT_MODEL` | `qwen2.5:3b` | Chat model |
| `OLLAMA_EMBED_MODEL` | `nomic-embed-text` | Embedding model |

---

## Production Build

```bash
npm run build
npm start
```

---

## Screen Recording Checklist

For the 5-minute Loom submission:

1. Show `ollama list` with both models
2. Demo triage: submit ticket → show structured result + filters
3. Demo RAG: in-KB question with citations → out-of-KB question
4. Walk through key decisions in `DECISION_MEMO.md` (model choice, retrieval threshold, malformed JSON handling)

---

## License

MIT — built for technical assessment purposes.
