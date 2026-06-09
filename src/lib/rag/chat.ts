import { chat } from "../ollama";
import { config } from "../config";
import { searchChunks, type ScoredChunk } from "./store";

export type Citation = {
  index: number;
  docTitle: string;
  docId: string;
  excerpt: string;
  score: number;
};

export type RagResponse = {
  answer: string;
  citations: Citation[];
  grounded: boolean;
  notInKnowledgeBase: boolean;
  relevanceScore: number;
};

function buildContext(chunks: ScoredChunk[]): string {
  return chunks
    .map(
      (c, i) =>
        `[${i + 1}] (${c.docTitle}, relevance ${c.score.toFixed(2)})\n${c.content}`,
    )
    .join("\n\n");
}

export async function answerWithRag(question: string): Promise<RagResponse> {
  const chunks = await searchChunks(question);
  const topScore = chunks[0]?.score ?? 0;
  const notInKnowledgeBase = topScore < config.rag.relevanceThreshold;

  if (notInKnowledgeBase || chunks.length === 0) {
    return {
      answer:
        "I don't have enough information in the knowledge base to answer that question. The available documents don't cover this topic. Please contact support or check if the question relates to our documented policies.",
      citations: [],
      grounded: false,
      notInKnowledgeBase: true,
      relevanceScore: topScore,
    };
  }

  const citations: Citation[] = chunks.map((c, i) => ({
    index: i + 1,
    docTitle: c.docTitle,
    docId: c.docId,
    excerpt: c.content.slice(0, 200) + (c.content.length > 200 ? "…" : ""),
    score: c.score,
  }));

  const system = `You are a grounded knowledge assistant. Answer ONLY using the provided context.
Rules:
- Cite sources using [1], [2], etc. matching the context labels
- If the context does not contain the answer, say "The knowledge base does not contain this information."
- Do not invent facts, prices, dates, or policies not in the context
- Be concise and helpful`;

  const user = `Context:\n${buildContext(chunks)}\n\nQuestion: ${question}`;

  const answer = await chat(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    { temperature: 0.1 },
  );

  const citesContext = /\[\d+\]/.test(answer);
  const deniesKnowledge =
    /does not contain|don't have|do not have|not in the knowledge base/i.test(
      answer,
    );
  const grounded = citesContext && !deniesKnowledge;

  return {
    answer,
    citations: grounded ? citations : citations.slice(0, 1),
    grounded,
    notInKnowledgeBase: deniesKnowledge,
    relevanceScore: topScore,
  };
}
