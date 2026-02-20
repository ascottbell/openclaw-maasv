/**
 * HTTP client for maasv-server.
 *
 * Sends raw text — maasv-server owns embeddings.
 * All state lives in SQLite via maasv.
 */

import type {
  PluginConfig,
  Memory,
  ScoredMemory,
  StoreRequest,
  SearchRequest,
  ContextRequest,
  Entity,
  EntityProfile,
  Relationship,
  WisdomEntry,
  ExtractionResult,
  HealthResponse,
  StatsResponse,
} from "./types.js";

export class MaasvClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(config: Pick<PluginConfig, "serverUrl" | "apiKey">) {
    this.baseUrl = config.serverUrl.replace(/\/+$/, "");
    this.headers = { "Content-Type": "application/json" };
    if (config.apiKey) {
      this.headers["X-Maasv-Key"] = config.apiKey;
    }
  }

  // --- Internals ---

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    const init: RequestInit = {
      method,
      headers: this.headers,
      signal: controller.signal,
    };
    if (body !== undefined) {
      init.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, init);

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(
          `maasv-server ${method} ${path} failed: ${response.status} ${text}`,
        );
      }

      return response.json() as Promise<T>;
    } finally {
      clearTimeout(timeout);
    }
  }

  // --- Memory ---

  async storeMemory(req: StoreRequest): Promise<{ memory_id: string }> {
    return this.request("POST", "/v1/memory/store", req);
  }

  async searchMemories(
    req: SearchRequest,
  ): Promise<{ results: ScoredMemory[]; count: number }> {
    return this.request("POST", "/v1/memory/search", req);
  }

  async getContext(req: ContextRequest): Promise<{ context: string }> {
    return this.request("POST", "/v1/memory/context", req);
  }

  async getMemory(memoryId: string): Promise<Memory> {
    return this.request("GET", `/v1/memory/${memoryId}`);
  }

  async deleteMemory(
    memoryId: string,
  ): Promise<{ deleted: boolean; memory_id: string }> {
    return this.request("DELETE", `/v1/memory/${memoryId}`);
  }

  async supersedeMemory(
    oldId: string,
    newContent: string,
  ): Promise<{ memory_id: string }> {
    return this.request("POST", "/v1/memory/supersede", {
      old_id: oldId,
      new_content: newContent,
    });
  }

  // --- Extraction ---

  async extract(
    text: string,
    topic?: string,
  ): Promise<ExtractionResult> {
    return this.request("POST", "/v1/extract", { text, topic: topic ?? "" });
  }

  // --- Graph ---

  async findOrCreateEntity(
    name: string,
    entityType: string,
    metadata?: Record<string, unknown>,
  ): Promise<Entity> {
    return this.request("POST", "/v1/graph/entities", {
      name,
      entity_type: entityType,
      metadata,
    });
  }

  async searchEntities(
    query: string,
    entityType?: string,
    limit?: number,
  ): Promise<{ results: Entity[]; count: number }> {
    return this.request("POST", "/v1/graph/entities/search", {
      query,
      entity_type: entityType,
      limit: limit ?? 10,
    });
  }

  async getEntityProfile(entityId: string): Promise<EntityProfile> {
    return this.request("GET", `/v1/graph/entities/${entityId}`);
  }

  async addRelationship(req: {
    subject_id: string;
    predicate: string;
    object_id?: string;
    object_value?: string;
    confidence?: number;
    source?: string;
  }): Promise<{ relationship_id: string }> {
    return this.request("POST", "/v1/graph/relationships", req);
  }

  // --- Wisdom ---

  async logReasoning(req: {
    action_type: string;
    reasoning: string;
    action_data?: Record<string, unknown>;
    trigger?: string;
    context?: string;
    tags?: string[];
  }): Promise<{ wisdom_id: string }> {
    return this.request("POST", "/v1/wisdom/log", req);
  }

  async recordOutcome(
    wisdomId: string,
    outcome: string,
    details?: string,
  ): Promise<{ updated: boolean }> {
    return this.request("POST", `/v1/wisdom/${wisdomId}/outcome`, {
      outcome,
      details,
    });
  }

  async addFeedback(
    wisdomId: string,
    score: number,
    notes?: string,
  ): Promise<{ updated: boolean }> {
    return this.request("POST", `/v1/wisdom/${wisdomId}/feedback`, {
      score,
      notes,
    });
  }

  async searchWisdom(
    query: string,
    limit?: number,
  ): Promise<{ results: WisdomEntry[]; count: number }> {
    return this.request("POST", "/v1/wisdom/search", {
      query,
      limit: limit ?? 10,
    });
  }

  // --- Health ---

  async health(): Promise<HealthResponse> {
    return this.request("GET", "/v1/health");
  }

  async stats(): Promise<StatsResponse> {
    return this.request("GET", "/v1/stats");
  }
}
