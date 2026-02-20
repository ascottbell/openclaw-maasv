# openclaw-maasv

OpenClaw memory plugin powered by [maasv](https://github.com/ascottbell/maasv) — a cognition layer for AI agents.

Gives OpenClaw agents structured long-term memory backed by SQLite: 3-signal retrieval, a knowledge graph with temporal versioning, and experiential learning. All state lives locally in SQLite. LLM and embedding calls go to your configured provider (cloud by default, local supported).

## Prerequisites

A running maasv server instance:
```bash
pip install "maasv[server,anthropic,voyage]"
maasv-server
```
See [maasv](https://github.com/ascottbell/maasv) for full setup details.

## Setup

1. Install the plugin:
```bash
openclaw plugins install @maasv/openclaw-memory
```

2. Activate the memory slot:
```json5
// ~/.openclaw/openclaw.json
{
  plugins: {
    slots: { memory: "memory-maasv" },
    entries: {
      "memory-maasv": {
        enabled: true,
        config: {
          serverUrl: "http://127.0.0.1:18790",
          autoRecall: true,
          autoCapture: true,
          enableGraph: true
        }
      }
    }
  }
}
```

## Tools

### Core (always available)
- **`memory_search`** — Retrieval using semantic similarity, keyword matching, and graph connectivity
- **`memory_store`** — Store memories with automatic deduplication
- **`memory_forget`** — Delete a memory by ID

### Knowledge Graph (enableGraph: true)
- **`memory_graph`** — Search entities, view entity profiles with relationships, create relationships

### Wisdom (enableWisdom: true)
- **`memory_wisdom`** — Log reasoning, record outcomes, attach feedback, search past wisdom

## Auto-Recall & Auto-Capture

When enabled, the plugin automatically:
- **Recalls** relevant memories before each agent turn (configurable via `maxRecallResults` and `maxRecallTokens`)
- **Captures** entities and facts from conversations after each session

Both can be toggled independently in the config.

## CLI

```bash
openclaw maasv health           # Check connection
openclaw maasv stats            # Detailed statistics
openclaw maasv search "query"   # Search memories
```

## Architecture

```
[openclaw-maasv]          <- This plugin (TypeScript, npm)
     |  HTTP calls
     v
[maasv-server]            <- Python HTTP service (FastAPI)
     |  Python import
     v
[maasv]                   <- Cognition library (pip)
     |
     v
[SQLite + sqlite-vec]     <- All state lives here
```

The plugin sends raw text. maasv-server owns embeddings.
