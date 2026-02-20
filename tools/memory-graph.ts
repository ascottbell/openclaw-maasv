/**
 * memory_graph tool — query and build the knowledge graph.
 *
 * Exposes entity search, entity profiles (with relationships),
 * and relationship creation. No other OpenClaw memory plugin has this.
 */

import { Type } from "@sinclair/typebox";
import type { MaasvClient } from "../client.js";

export function createMemoryGraph(client: MaasvClient) {
  return {
    name: "memory_graph",
    description:
      "Query the knowledge graph — search entities (people, places, projects, technologies), view entity profiles with all relationships, or create new relationships. The knowledge graph connects facts into a structured web of entities and relationships with temporal versioning.",
    parameters: Type.Object({
      action: Type.Union(
        [
          Type.Literal("search"),
          Type.Literal("profile"),
          Type.Literal("add_relationship"),
        ],
        {
          description:
            "Action: 'search' entities by name, 'profile' to get full entity details, 'add_relationship' to connect entities",
        },
      ),
      query: Type.Optional(
        Type.String({ description: "Search query (for 'search' action)" }),
      ),
      entity_id: Type.Optional(
        Type.String({ description: "Entity ID (for 'profile' action)" }),
      ),
      entity_type: Type.Optional(
        Type.String({
          description: "Entity type filter: person, place, project, org, event, technology",
        }),
      ),
      subject_id: Type.Optional(
        Type.String({ description: "Subject entity ID (for 'add_relationship')" }),
      ),
      predicate: Type.Optional(
        Type.String({
          description:
            "Relationship predicate (e.g. works_on, lives_in, married_to, uses_tech)",
        }),
      ),
      object_id: Type.Optional(
        Type.String({ description: "Object entity ID (for 'add_relationship')" }),
      ),
      object_value: Type.Optional(
        Type.String({
          description: "Object value string if not linking to an entity (for 'add_relationship')",
        }),
      ),
    }),
    async execute(
      _id: string,
      params: {
        action: "search" | "profile" | "add_relationship";
        query?: string;
        entity_id?: string;
        entity_type?: string;
        subject_id?: string;
        predicate?: string;
        object_id?: string;
        object_value?: string;
      },
    ) {
      switch (params.action) {
        case "search": {
          if (!params.query) {
            return { content: [{ type: "text" as const, text: "Error: 'query' required for search action" }] };
          }
          const { results, count } = await client.searchEntities(
            params.query,
            params.entity_type,
          );
          if (count === 0) {
            return { content: [{ type: "text" as const, text: "No entities found." }] };
          }
          const formatted = results
            .map(
              (e) =>
                `- ${e.name} (${e.entity_type}) — id: ${e.id}`,
            )
            .join("\n");
          return {
            content: [
              { type: "text" as const, text: `Found ${count} entities:\n${formatted}` },
            ],
          };
        }

        case "profile": {
          if (!params.entity_id) {
            return {
              content: [{ type: "text" as const, text: "Error: 'entity_id' required for profile action" }],
            };
          }
          const profile = await client.getEntityProfile(params.entity_id);
          const lines = [`# ${profile.entity.name} (${profile.entity.entity_type})`];
          for (const [pred, rels] of Object.entries(profile.relationships)) {
            for (const rel of rels) {
              const target = rel.object_name ?? rel.object_value ?? rel.object_id;
              lines.push(`- ${pred}: ${target}`);
            }
          }
          return {
            content: [{ type: "text" as const, text: lines.join("\n") }],
          };
        }

        case "add_relationship": {
          if (!params.subject_id || !params.predicate) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: "Error: 'subject_id' and 'predicate' required for add_relationship",
                },
              ],
            };
          }
          if (!params.object_id && !params.object_value) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: "Error: either 'object_id' or 'object_value' required",
                },
              ],
            };
          }
          const result = await client.addRelationship({
            subject_id: params.subject_id,
            predicate: params.predicate,
            object_id: params.object_id,
            object_value: params.object_value,
          });
          return {
            content: [
              {
                type: "text" as const,
                text: `Created relationship: ${result.relationship_id}`,
              },
            ],
          };
        }
      }
    },
  };
}
