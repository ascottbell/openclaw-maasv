/**
 * memory_search tool — 3-signal retrieval (vector + BM25 + knowledge graph).
 *
 * Unlike flat vector search, maasv fuses dense similarity, keyword matching,
 * and graph connectivity via Reciprocal Rank Fusion, then applies
 * importance-weighted scoring with temporal decay and diversity selection.
 */

import { Type } from "@sinclair/typebox";
import type { MaasvClient } from "../client.js";

export function createMemorySearch(client: MaasvClient) {
  return {
    name: "memory_search",
    description:
      "Search long-term memory using 3-signal retrieval (semantic similarity, keyword matching, and knowledge graph connectivity). Returns ranked memories with relevance scores.",
    parameters: Type.Object({
      query: Type.String({ description: "Natural language search query" }),
      limit: Type.Optional(
        Type.Number({
          description: "Max results to return",
          minimum: 1,
          maximum: 50,
          default: 5,
        }),
      ),
      category: Type.Optional(
        Type.String({
          description:
            "Filter by category (e.g. family, preference, project, decision, identity)",
        }),
      ),
      subject: Type.Optional(
        Type.String({
          description: "Filter by subject (who/what the memory is about)",
        }),
      ),
    }),
    async execute(_id: string, params: { query: string; limit?: number; category?: string; subject?: string }) {
      const { results, count } = await client.searchMemories({
        query: params.query,
        limit: params.limit ?? 5,
        category: params.category,
        subject: params.subject,
      });

      if (count === 0) {
        return { content: [{ type: "text" as const, text: "No memories found." }] };
      }

      const formatted = results
        .map((m, i) => {
          const subject = m.subject ? `[${m.subject}] ` : "";
          const score = m._imp_score ? ` (score: ${m._imp_score.toFixed(3)})` : "";
          return `${i + 1}. ${subject}${m.content}${score}\n   id: ${m.id} | category: ${m.category} | confidence: ${m.confidence}`;
        })
        .join("\n\n");

      return {
        content: [{ type: "text" as const, text: `Found ${count} memories:\n\n${formatted}` }],
      };
    },
  };
}
