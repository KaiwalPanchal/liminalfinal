# Liminal API & Schema Reference

This document provides complete documentation for the REST API endpoints, Pydantic v2 schemas, FastMCP tools, and Neo4j Cypher schemas used in Liminal.

---

## Base URLs
*   **Local Development:** `http://localhost:8000`
*   **Docker Container:** `http://backend:8000`
*   **Interactive Swagger Docs:** `http://localhost:8000/docs`
*   **Interactive ReDoc:** `http://localhost:8000/redoc`

---

## 1. REST Endpoints

### 1.1 `POST /api/query`
Executes a Grounded Hybrid GraphRAG query combining dense vector search, Neo4j multi-edge traversal, cross-encoder reranking, and citation validation.

#### Request Headers
```http
Content-Type: application/json
```

#### Request Body Schema (`GraphRAGQueryRequest`)
| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `query` | `string` | **Yes** | — | Natural language question or research prompt (min length: 2) |
| `max_hops` | `integer` | No | `2` | Graph expansion radius (1 to 3) |
| `top_k` | `integer` | No | `5` | Context passage budget after reranking (1 to 20) |
| `filter_by_goal` | `string` | No | `null` | Optional teleological filter restricting subgraphs |

#### Example Request:
```json
{
  "query": "Which project used both Neo4j and Qdrant, and who led it?",
  "max_hops": 2,
  "top_k": 5
}
```

#### Response Schema (`GraphRAGResponse`)
| Field | Type | Description |
|---|---|---|
| `answer` | `string` | Grounded synthesized answer or explicit refusal explanation |
| `status` | `string` | `"GROUNDED"` or `"REFUSED_INSUFFICIENT_CONTEXT"` |
| `confidence_score` | `float` | Grounding confidence metric ($0.0 \le s \le 1.0$) |
| `cited_nodes` | `array[CitedEntity]` | Graph nodes cited as verified provenance for the answer |
| `cited_passages` | `array[string]` | Text chunk excerpts supporting the answer |
| `retrieval_latency_ms` | `float` | Hybrid retrieval and reranker execution time (ms) |
| `generation_latency_ms` | `float` | LLM synthesis / verification latency (ms) |

#### Example Response (Grounded):
```json
{
  "answer": "Based on verified graph facts: Liminal combines Neo4j graph database with Qdrant vector search to power hybrid GraphRAG. The core backend architecture was designed and led by Kaiwal Panchal.",
  "status": "GROUNDED",
  "confidence_score": 0.95,
  "cited_nodes": [
    {
      "node_id": "node_liminal",
      "entity_name": "Liminal",
      "entity_type": "Entity",
      "hop_level": 1
    },
    {
      "node_id": "node_neo4j",
      "entity_name": "Neo4j",
      "entity_type": "Tool",
      "hop_level": 1
    },
    {
      "node_id": "node_qdrant",
      "entity_name": "Qdrant",
      "entity_type": "Tool",
      "hop_level": 1
    },
    {
      "node_id": "node_kaiwal_panchal",
      "entity_name": "Kaiwal Panchal",
      "entity_type": "Person",
      "hop_level": 1
    }
  ],
  "cited_passages": [
    "Liminal combines Neo4j graph database with Qdrant vector search to power hybrid GraphRAG. The core backend architecture was designed and led by Kaiwal Panchal."
  ],
  "retrieval_latency_ms": 14.8,
  "generation_latency_ms": 3.2
}
```

#### Example Response (Deterministic Refusal):
```json
{
  "answer": "REFUSED_INSUFFICIENT_CONTEXT: The knowledge graph does not contain verified relationships or passages for this query.",
  "status": "REFUSED_INSUFFICIENT_CONTEXT",
  "confidence_score": 0.1,
  "cited_nodes": [],
  "cited_passages": [],
  "retrieval_latency_ms": 8.1,
  "generation_latency_ms": 1.1
}
```

---

### 1.2 `POST /api/ingest`
Ingests note content (plain text, markdown, or Yoopta JSON), extracts entities, actions, goals, and thematic motifs, and persists nodes and edges to Neo4j.

#### Request Body Schema (`NoteIngestRequest`)
| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `text` | `string \| object \| array` | **Yes** | — | Raw note text, Markdown, or Yoopta Editor block structure |
| `title` | `string` | No | `"Untitled Note"` | Title of the note |
| `note_id` | `string` | No | `UUIDv4` | Caller-supplied note identifier |
| `tags` | `array[string]` | No | `[]` | Categorical tags |

#### Example Request:
```json
{
  "title": "Database Architecture Decision",
  "text": "Migrated from Firestore to Neo4j to achieve sub-100ms multi-hop traversal and support dynamic graph visualization.",
  "tags": ["architecture", "database", "neo4j"]
}
```

#### Response Schema (`NoteIngestResponse`)
```json
{
  "note_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "status": "SUCCESS",
  "nodes_created": 3,
  "edges_created": 2,
  "thematic_motifs": [
    "Database migration from document to graph model to eliminate N+1 join latency"
  ],
  "processing_latency_ms": 42.5
}
```

---

### 1.3 `POST /api/ingest/document`
Universal multi-source ingestion endpoint for external files, Obsidian Markdown vaults with `[[wikilinks]]`, code architecture reviews, postmortems, and research articles.

#### Request Body Schema (`DocumentIngestRequest`)
| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `content` | `string \| object` | **Yes** | — | Document body: Obsidian markdown, code log, or text |
| `title` | `string` | No | `"Untitled Document"` | Title or filename |
| `source_type` | `string` | No | `"note"` | `"obsidian"`, `"code_architecture"`, `"postmortem"`, `"research"`, `"agent_insight"` |
| `source_url` | `string` | No | `null` | File path, GitHub URL, or source link |
| `author` | `string` | No | `null` | Author or agent identifier |
| `tags` | `array[string]` | No | `[]` | Categorical tags |

#### Example Request:
```json
{
  "title": "Microservices Decoupling RFC",
  "source_type": "obsidian",
  "content": "---\ntags: [architecture, backend]\n---\n# RFC\nConnecting [[FastAPI Gateway]] to [[Redis Queue]] in order to eliminate write blocking."
}
```

#### Response:
```json
{
  "document_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "title": "Microservices Decoupling RFC",
  "source_type": "obsidian",
  "status": "SUCCESS",
  "nodes_created": 4,
  "edges_created": 3,
  "wikilinks_detected": ["FastAPI Gateway", "Redis Queue"],
  "thematic_motifs": ["Modular architecture decoupling and optimization"],
  "processing_latency_ms": 19.4
}
```

---

### 1.4 `GET /health`
System liveness and readiness probe, monitoring Neo4j connectivity.

#### Response:
```json
{
  "status": "healthy",
  "neo4j_connected": true,
  "service": "Liminal Grounded Hybrid GraphRAG"
}
```

---

## 2. FastMCP 2.0 Tool Specifications

Located in `backend/mcp/server.py`. Exposes the following tools over stdio/JSON-RPC:

### 2.1 `search_knowledge_graph`
*   **Parameters:**
    *   `query` (string, required): Search query.
    *   `top_k` (integer, default: 5): Max passages to return.
*   **Returns:**
    ```json
    {
      "query": "...",
      "results": ["passage 1", "passage 2"],
      "cited_nodes": [{"node_id": "node_1", "entity_name": "...", "entity_type": "..."}],
      "retrieval_latency_ms": 12.3
    }
    ```

### 2.2 `get_entity_connections`
*   **Parameters:**
    *   `entity_name` (string, required): Canonical name of entity.
*   **Returns:**
    ```json
    {
      "entity": "Neo4j",
      "connections_count": 4,
      "connections": [
        {
          "source": "Liminal Backend",
          "source_type": "Entity",
          "relation": "USES_FOR",
          "target": "Neo4j",
          "target_type": "Tool",
          "details": "Knowledge graph queries"
        }
      ]
    }
    ```

### 2.3 `query_by_goal_motive`
*   **Parameters:**
    *   `goal_intent` (string, required): Desired outcome or teleological target.
*   **Returns:**
    ```json
    {
      "goal_intent": "sub-100ms multi-hop traversal",
      "matching_actions": [
        {
          "source": "Migrated from Firestore",
          "relation": "TARGETS_GOAL",
          "target": "Sub-100ms traversal"
        }
      ]
    }
    ```

### 2.4 `ingest_knowledge`
Allows AI agents (Claude Desktop, Cursor) to push new knowledge, code patterns, postmortems, or Obsidian notes directly into Liminal's graph via MCP.
*   **Parameters:**
    *   `content` (string, required): Document text, markdown, or code log.
    *   `title` (string, optional): Title or filename (default: `"Agent Finding"`).
    *   `source_type` (string, optional): `"obsidian"`, `"code_architecture"`, `"postmortem"`, or `"agent_insight"` (default: `"agent_insight"`).
    *   `author` (string, optional): Author or agent name (default: `"AI Assistant"`).
    *   `tags` (list[string], optional): Categorical tags.
*   **Returns:**
    ```json
    {
      "document_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "title": "Agent Finding",
      "status": "SUCCESS",
      "nodes_created": 4,
      "edges_created": 3,
      "wikilinks_detected": ["Neo4j", "Qdrant"],
      "thematic_motifs": ["Modular architecture decoupling and optimization"],
      "processing_latency_ms": 18.2
    }
    ```

---

## 3. Neo4j Cypher Schema & Constraints

### 3.1 Node Labels
*   `:Entity`: Actors, systems, tools, concepts, persons.
*   `:Action`: Specific actions or operational events executed.
*   `:Goal`: Teleological targets, objectives, and motives.
*   `:ThematicMotif`: Higher-level generalized patterns.
*   `:NoteChunk`: Raw text provenance chunks.

### 3.2 Constraints & Indexes
```cypher
// Ensure Unique Entity Identity
CREATE CONSTRAINT entity_name_unique IF NOT EXISTS
FOR (e:Entity) REQUIRE e.name IS UNIQUE;

// Ensure Unique NoteChunk Identity
CREATE CONSTRAINT note_chunk_id_unique IF NOT EXISTS
FOR (c:NoteChunk) REQUIRE c.id IS UNIQUE;

// Ensure Unique Thematic Motif Identity
CREATE CONSTRAINT thematic_motif_id_unique IF NOT EXISTS
FOR (m:ThematicMotif) REQUIRE m.id IS UNIQUE;

// Full-Text Search Index for Entities
CREATE FULLTEXT INDEX entity_fulltext_idx IF NOT EXISTS
FOR (e:Entity) ON EACH [e.name, e.description, e.type];

// Full-Text Search Index for Chunks
CREATE FULLTEXT INDEX chunk_fulltext_idx IF NOT EXISTS
FOR (c:NoteChunk) ON EACH [c.text];
```
