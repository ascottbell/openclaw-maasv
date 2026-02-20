/**
 * memory_forget tool — permanently delete a memory by ID.
 */

import { Type } from "@sinclair/typebox";
import type { MaasvClient } from "../client.js";

export function createMemoryForget(client: MaasvClient) {
  return {
    name: "memory_forget",
    description: "Permanently delete a memory by its ID.",
    parameters: Type.Object({
      id: Type.String({ description: "Memory ID to delete (e.g. mem_abc123def456)" }),
    }),
    async execute(_id: string, params: { id: string }) {
      try {
        await client.deleteMemory(params.id);
        return {
          content: [{ type: "text" as const, text: `Deleted memory: ${params.id}` }],
        };
      } catch (err) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Failed to delete memory ${params.id}: ${(err as Error).message}`,
            },
          ],
        };
      }
    },
  };
}
