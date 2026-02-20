/**
 * memory_wisdom tool — experiential learning.
 *
 * Log reasoning before actions, record outcomes, attach feedback.
 * Over time, maasv learns which approaches work and which don't.
 * No other OpenClaw memory plugin has this.
 */

import { Type } from "@sinclair/typebox";
import type { MaasvClient } from "../client.js";

export function createMemoryWisdom(client: MaasvClient) {
  return {
    name: "memory_wisdom",
    description:
      "Experiential learning — log reasoning before taking actions, record outcomes, and search past wisdom. Over time, builds a pattern of what works and what doesn't.",
    parameters: Type.Object({
      action: Type.Union(
        [
          Type.Literal("log"),
          Type.Literal("outcome"),
          Type.Literal("feedback"),
          Type.Literal("search"),
        ],
        {
          description:
            "Action: 'log' reasoning, 'outcome' to record result, 'feedback' to rate, 'search' past wisdom",
        },
      ),
      // For 'log'
      action_type: Type.Optional(
        Type.String({
          description: "Type of action being taken (for 'log')",
        }),
      ),
      reasoning: Type.Optional(
        Type.String({
          description: "Why this action is being taken (for 'log')",
        }),
      ),
      trigger: Type.Optional(
        Type.String({ description: "What triggered this action (for 'log')" }),
      ),
      context: Type.Optional(
        Type.String({ description: "Additional context (for 'log')" }),
      ),
      // For 'outcome'
      wisdom_id: Type.Optional(
        Type.String({
          description: "Wisdom entry ID (for 'outcome' and 'feedback')",
        }),
      ),
      outcome: Type.Optional(
        Type.String({
          description: "Outcome: success, failed, partial (for 'outcome')",
        }),
      ),
      details: Type.Optional(
        Type.String({ description: "Outcome details (for 'outcome')" }),
      ),
      // For 'feedback'
      score: Type.Optional(
        Type.Number({
          description: "Feedback score 1-5 (for 'feedback')",
          minimum: 1,
          maximum: 5,
        }),
      ),
      notes: Type.Optional(
        Type.String({ description: "Feedback notes (for 'feedback')" }),
      ),
      // For 'search'
      query: Type.Optional(
        Type.String({ description: "Search query (for 'search')" }),
      ),
    }),
    async execute(
      _id: string,
      params: {
        action: "log" | "outcome" | "feedback" | "search";
        action_type?: string;
        reasoning?: string;
        trigger?: string;
        context?: string;
        wisdom_id?: string;
        outcome?: string;
        details?: string;
        score?: number;
        notes?: string;
        query?: string;
      },
    ) {
      switch (params.action) {
        case "log": {
          if (!params.action_type || !params.reasoning) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: "Error: 'action_type' and 'reasoning' required for log action",
                },
              ],
            };
          }
          const result = await client.logReasoning({
            action_type: params.action_type,
            reasoning: params.reasoning,
            trigger: params.trigger,
            context: params.context,
          });
          return {
            content: [
              {
                type: "text" as const,
                text: `Logged reasoning: ${result.wisdom_id}`,
              },
            ],
          };
        }

        case "outcome": {
          if (!params.wisdom_id || !params.outcome) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: "Error: 'wisdom_id' and 'outcome' required",
                },
              ],
            };
          }
          await client.recordOutcome(
            params.wisdom_id,
            params.outcome,
            params.details,
          );
          return {
            content: [
              { type: "text" as const, text: `Recorded outcome for ${params.wisdom_id}: ${params.outcome}` },
            ],
          };
        }

        case "feedback": {
          if (!params.wisdom_id || params.score === undefined) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: "Error: 'wisdom_id' and 'score' required",
                },
              ],
            };
          }
          await client.addFeedback(params.wisdom_id, params.score, params.notes);
          return {
            content: [
              {
                type: "text" as const,
                text: `Added feedback for ${params.wisdom_id}: ${params.score}/5`,
              },
            ],
          };
        }

        case "search": {
          if (!params.query) {
            return {
              content: [
                { type: "text" as const, text: "Error: 'query' required for search action" },
              ],
            };
          }
          const { results, count } = await client.searchWisdom(params.query);
          if (count === 0) {
            return {
              content: [{ type: "text" as const, text: "No wisdom entries found." }],
            };
          }
          const formatted = results
            .map((w) => {
              const scoreStr =
                w.feedback_score !== null ? ` (${w.feedback_score}/5)` : "";
              return `- [${w.outcome}${scoreStr}] ${w.action_type}: ${w.reasoning.slice(0, 200)}`;
            })
            .join("\n");
          return {
            content: [
              {
                type: "text" as const,
                text: `Found ${count} wisdom entries:\n${formatted}`,
              },
            ],
          };
        }
      }
    },
  };
}
