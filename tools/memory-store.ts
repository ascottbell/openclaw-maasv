/**
 * memory_store tool — store a memory with automatic dedup.
 *
 * maasv checks for near-duplicate memories (vector distance < 0.05)
 * before storing. If a duplicate exists, returns the existing ID.
 */

import { Type } from "@sinclair/typebox";
import type { MaasvClient } from "../client.js";

export function createMemoryStore(client: MaasvClient) {
  return {
    name: "memory_store",
    description:
      "Store important information in long-term memory. Categories: identity, family, preference, project, decision, context, health, financial. Automatically deduplicates near-identical memories.",
    parameters: Type.Object({
      content: Type.String({
        description: "The fact or information to remember",
      }),
      category: Type.String({
        description:
          "Memory category: identity, family, preference, project, decision, context, health, financial",
      }),
      subject: Type.Optional(
        Type.String({
          description: "Who or what this memory is about (e.g. a person's name, project name)",
        }),
      ),
      confidence: Type.Optional(
        Type.Number({
          description: "How confident this fact is (0.0-1.0)",
          minimum: 0,
          maximum: 1,
          default: 1.0,
        }),
      ),
    }),
    async execute(
      _id: string,
      params: { content: string; category: string; subject?: string; confidence?: number },
    ) {
      const result = await client.storeMemory({
        content: params.content,
        category: params.category,
        subject: params.subject,
        confidence: params.confidence ?? 1.0,
        source: "openclaw",
      });

      return {
        content: [
          {
            type: "text" as const,
            text: `Stored memory: ${result.memory_id}`,
          },
        ],
      };
    },
  };
}
