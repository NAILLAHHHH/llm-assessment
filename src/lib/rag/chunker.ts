import { config } from "../config";

export type DocumentChunk = {
  id: string;
  docId: string;
  docTitle: string;
  content: string;
  chunkIndex: number;
};

export function chunkText(
  docId: string,
  docTitle: string,
  text: string,
): DocumentChunk[] {
  const { chunkSize, chunkOverlap } = config.rag;
  const chunks: DocumentChunk[] = [];
  let start = 0;
  let index = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const content = text.slice(start, end).trim();
    if (content.length > 0) {
      chunks.push({
        id: `${docId}-chunk-${index}`,
        docId,
        docTitle,
        content,
        chunkIndex: index,
      });
      index += 1;
    }
    if (end >= text.length) break;
    start = end - chunkOverlap;
  }

  return chunks;
}
