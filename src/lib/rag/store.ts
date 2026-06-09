import fs from "fs";
import path from "path";
import { embed } from "../ollama";
import { config } from "../config";
import { chunkText, type DocumentChunk } from "./chunker";

export type ScoredChunk = DocumentChunk & {
  score: number;
};

type StoredChunk = DocumentChunk & { embedding: number[] };

let store: StoredChunk[] | null = null;
let ingestPromise: Promise<void> | null = null;
let ingestError: Error | null = null;

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

function loadChunksFromDisk(): DocumentChunk[] {
  const kbDir = path.join(process.cwd(), "knowledge-base");
  if (!fs.existsSync(kbDir)) return [];

  const files = fs
    .readdirSync(kbDir)
    .filter((f) => f.endsWith(".md") || f.endsWith(".txt"));

  const allChunks: DocumentChunk[] = [];
  for (const file of files) {
    const docId = file.replace(/\.[^.]+$/, "");
    const docTitle = docId.replace(/-/g, " ");
    const text = fs.readFileSync(path.join(kbDir, file), "utf-8");
    allChunks.push(...chunkText(docId, docTitle, text));
  }
  return allChunks;
}

async function ingestKnowledgeBase(): Promise<void> {
  const allChunks = loadChunksFromDisk();
  if (allChunks.length === 0) {
    store = [];
    return;
  }

  const embeddings = await embed(allChunks.map((c) => c.content));
  store = allChunks.map((chunk, i) => ({
    ...chunk,
    embedding: embeddings[i],
  }));
  ingestError = null;
}

export async function ensureStoreReady(): Promise<void> {
  if (store) return;
  if (ingestError) throw ingestError;

  if (!ingestPromise) {
    ingestPromise = ingestKnowledgeBase().catch((err) => {
      ingestError = err instanceof Error ? err : new Error(String(err));
      ingestPromise = null;
      throw ingestError;
    });
  }
  await ingestPromise;
}

export async function searchChunks(query: string): Promise<ScoredChunk[]> {
  await ensureStoreReady();
  if (!store || store.length === 0) return [];

  const [queryEmbedding] = await embed([query]);
  const scored = store
    .map((chunk) => ({
      ...chunk,
      score: cosineSimilarity(queryEmbedding, chunk.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, config.rag.topK);

  return scored.map(({ embedding: _, ...rest }) => rest);
}

/** File-based stats — does not require Ollama. */
export function getKnowledgeBaseFileStats(): {
  chunkCount: number;
  docCount: number;
} {
  const chunks = loadChunksFromDisk();
  const docIds = new Set(chunks.map((c) => c.docId));
  return { chunkCount: chunks.length, docCount: docIds.size };
}

export async function getStoreStats(): Promise<{
  chunkCount: number;
  docCount: number;
  indexed: boolean;
}> {
  const fileStats = getKnowledgeBaseFileStats();
  if (store) {
    const docIds = new Set(store.map((c) => c.docId));
    return {
      chunkCount: store.length,
      docCount: docIds.size,
      indexed: true,
    };
  }
  return { ...fileStats, indexed: false };
}
