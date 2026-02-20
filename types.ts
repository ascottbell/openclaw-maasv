/**
 * Shared types for the openclaw-maasv plugin.
 */

export interface PluginConfig {
  serverUrl: string;
  apiKey?: string;
  autoRecall: boolean;
  autoCapture: boolean;
  maxRecallResults: number;
  maxRecallTokens: number;
  enableGraph: boolean;
  enableWisdom: boolean;
}

// --- Memory types ---

export interface Memory {
  id: string;
  content: string;
  category: string;
  subject: string | null;
  source: string;
  confidence: number;
  importance: number | null;
  access_count: number;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown> | null;
}

export interface ScoredMemory extends Memory {
  distance?: number;
  _imp_score?: number;
}

export interface StoreRequest {
  content: string;
  category: string;
  subject?: string;
  source?: string;
  confidence?: number;
  metadata?: Record<string, unknown>;
}

export interface SearchRequest {
  query: string;
  limit?: number;
  category?: string;
  subject?: string;
}

export interface ContextRequest {
  query?: string;
  core_limit?: number;
  relevant_limit?: number;
  use_semantic?: boolean;
}

// --- Graph types ---

export interface Entity {
  id: string;
  name: string;
  entity_type: string;
  canonical_name: string;
  metadata: Record<string, unknown> | null;
  access_count: number;
}

export interface Relationship {
  id: string;
  subject_id: string;
  predicate: string;
  object_id: string | null;
  object_value: string | null;
  valid_from: string;
  valid_to: string | null;
  confidence: number;
  subject_name?: string;
  object_name?: string;
}

export interface EntityProfile {
  entity: Entity;
  relationships: Record<string, Relationship[]>;
  related_entities: Entity[];
}

// --- Wisdom types ---

export interface WisdomEntry {
  id: string;
  action_type: string;
  reasoning: string;
  outcome: string;
  outcome_details: string | null;
  feedback_score: number | null;
  feedback_notes: string | null;
  timestamp: string;
  tags: string[] | null;
}

// --- Extraction types ---

export interface ExtractionResult {
  extraction: {
    status: string;
    entities?: Array<{ name: string; type: string }>;
    relationships?: Array<{ subject: string; predicate: string; object: string }>;
  };
  storage: Record<string, unknown>;
}

// --- Health types ---

export interface HealthResponse {
  status: "healthy" | "unhealthy";
}

export interface StatsResponse {
  memories: {
    total_active: number;
    total_superseded: number;
    by_category: Record<string, number>;
  };
  entities: {
    total: number;
    by_type: Record<string, number>;
  };
  relationships: {
    total_active: number;
  };
  retrieval_latency_ms: number | null;
  wisdom: Record<string, unknown> | null;
}
