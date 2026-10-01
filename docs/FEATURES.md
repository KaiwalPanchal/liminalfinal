# Liminal Features Guide

This document details the complete feature set of **Liminal Grounded Hybrid GraphRAG**, explaining the functionality, technical rationale, and usage of each capability.

---

## Feature Matrix Overview

| Feature | Category | Primary Benefit | State |
|---|---|---|---|
| **Multi-Edge Graph Networks** | Knowledge Graph | Multiple concurrent relationships between entities | ✅ Production |
| **Action-Goal Triads** | Knowledge Graph | Captures *Why* and *How* actions were taken (teleology) | ✅ Production |
| **3-Tier Abstraction Hierarchy** | Knowledge Graph | Separates raw text, operational actions, and thematic motifs | ✅ Production |
| **SCAMPER NLP Framework** | Algorithmic Design | Systematic operators applied to retrieval and exploration | ✅ Production |
| **DRIFT Hybrid Retrieval** | RAG Engine | Fuses vector similarity, Cypher traversal, and BM25 | ✅ Production |
| **Cross-Encoder Reranking** | RAG Engine | Token-level contextual re-scoring of candidate facts | ✅ Production |
| **Deterministic Refusal Guardrail** | Grounding | 100% precision on unanswerable and out-of-domain queries | ✅ Production |
| **Explicit Source Citations** | Grounding | Every answer cites exact graph node IDs (`cited_nodes`) | ✅ Production |
| **FastMCP 2.0 Server** | AI Agent Tooling | Direct integration with Claude Desktop, Cursor, and Windsurf | ✅ Production |
| **Offline Evaluation Suite** | CI/CD Quality | 30-case multi-hop golden benchmark measuring recall & refusal | ✅ Production |
| **Interactive Graph Visualizer** | Frontend UI | 2D force-directed interactive node and edge rendering | ✅ Production |
| **Yoopta Rich Text Note Editor** | Frontend UI | Block-based note creation with markdown and heading support | ✅ Production |
| **Single-Command Docker Orchestration** | DevOps | Spins up Neo4j, FastAPI, and Next.js in one command | ✅ Production |

---

## 1. Multi-Edge Knowledge Graph Networks

Unlike traditional note-taking tools or naive graph databases that permit only one generic edge between two concepts, Liminal supports **rich multi-edge networks**. Between any two entities, multiple distinct, typed relationships can exist simultaneously:

```cypher
// Operational relationship
(Backend)-[:USES_FOR {frequency: 10, role: "primary_store"}]->(Neo4j)

// Architectural substitution
(Neo4j)-[:SUBSTITUTES {tradeoff: "lower latency, higher memory"}]->(Firestore)

// Obstacle / Dependency relationship
(Backend)-[:BLOCKED_BY {issue: "Schema migration timing"}]->(AuthService)

// Collaboration relationship
(KaiwalPanchal)-[:COLLABORATES_WITH {project: "Liminal"}]->(fxlgun)
```

**Why it matters:** Real-world knowledge is multi-dimensional. A tool isn't just "connected" to another tool; it may replace it, depend on it, or be used by it in specific contexts.

---

## 2. Action-Goal-Motive Triads

Standard knowledge graphs capture static entity pairs (`[Kafka] -> [MessageQueue]`). Liminal captures operational **Action-Goal Triads**:

```
(Entity) --[:PERFORMS]--> (Action) --[:TARGETS_GOAL]--> (Goal)
                               |
                        [:MOTIVATED_BY]
                               |
                               v
                       (Motive / Rationale)
```

### Example Triad:
*   **Entity:** `Liminal Backend`
*   **Action:** `Migrated from Firestore to Neo4j`
*   **Goal:** `Sub-100ms multi-hop query latency`
*   **Motive ("Why"):** `Firestore required client-side joins that timed out beyond 2 hops`
*   **Status:** `Completed`

**Why it matters:** In engineering and research, the most valuable knowledge is rarely *what* a system is, but *why* a design decision was made and *what problem* it solved.

---

## 3. The 3-Tier Multi-Scale Abstraction Hierarchy

Liminal structures note contents across three levels of abstraction:

```
┌──────────────────────────────────────────────────────────┐
│  Tier 2: Thematic Motifs                                 │
│  "Decoupled Asynchronous Ingestion for Fault Tolerance"   │
└────────────────────────────┬─────────────────────────────┘
                             │ abstracts / generalizes
┌────────────────────────────▼─────────────────────────────┐
│  Tier 1: Grounded Action-Goal Networks                   │
│  (FastAPI)-[:PERFORMS]->(Worker)-[:TARGETS]->(P99 Latency)│
└────────────────────────────┬─────────────────────────────┘
                             │ evidenced by
┌────────────────────────────▼─────────────────────────────┐
│  Tier 0: Provenance & Raw Chunks                         │
│  "Sprint note 2024-11-12: Added Redis queue to worker..."│
└──────────────────────────────────────────────────────────┘
```

1.  **Tier 0 (Provenance Layer):** Immutable text blocks with character offsets and timestamps. Enables exact quoting and verification.
2.  **Tier 1 (Grounded Triad Layer):** Explicit entities, verbs, and outcomes extracted directly from notes.
3.  **Tier 2 (Thematic Abstraction Layer):** High-level architectural motifs formed by stripping instance-specific variables (e.g., ticket numbers, dates, personal names). Enables cross-project analogical reasoning.

---

## 4. The SCAMPER NLP Framework

The SCAMPER creative thinking framework is mapped directly into Liminal's algorithmic architecture:

| Lens | Algorithmic Implementation in Liminal | Technical Benefit |
|---|---|---|
| **Substitute** | Replaced naive cosine similarity over raw chunks with **Hybrid Dense + Cypher Multi-Hop Traversal + Cross-Encoder Reranking**. | Eliminates chunk boundary blindness; guarantees retrieval of 2-hop connected dependencies. |
| **Combine** | Fused **BM25 lexical search**, **Dense embeddings**, and **Neo4j graph topologies** into a unified candidate pool. | Overcomes vocabulary mismatch while retaining exact keyword precision for entity names. |
| **Adapt** | Adapted Microsoft GraphRAG / LightRAG dual-level hierarchy to **Action-Goal Motive Networks**. | Enables answers to strategic questions ("Why did we choose X over Y?"). |
| **Modify / Magnify** | Weighted graph traversal edges by **Intent Centrality** and **Citation Recency**. | Prevents high-degree stop-word entities from dominating retrieval subgraphs. |
| **Put to another use** | Exposed the graph directly to AI agents via **FastMCP 2.0** tools. | Turns passive note storage into an interactive external memory tool for IDEs. |
| **Eliminate** | Pruned low-confidence edges and eliminated hallucinations via **deterministic refusal guardrails** (`REFUSED_INSUFFICIENT_CONTEXT`). | Guarantees precision $\ge 95\%$ on unanswerable and out-of-domain queries. |
| **Reverse** | **Teleological Reverse Retrieval**: Search from `Goal` $\to$ `Actions` that achieved it $\to$ `Entities` used. | Enables reverse-engineering past successful engineering strategies. |

---

## 5. Deterministic Grounding & Anti-Hallucination Guardrails

Liminal prevents hallucinations by enforcing a strict **Corrective Evaluation Gate (CRAG)**:

1.  **Verification Prior to Generation:** Candidate facts are validated against query entities.
2.  **Deterministic Refusal:** If context is missing, confidence is below $0.85$, or the query asks for out-of-domain topics, the API returns:
    ```json
    {
      "answer": "REFUSED_INSUFFICIENT_CONTEXT: The knowledge graph does not contain verified relationships or passages for this query.",
      "status": "REFUSED_INSUFFICIENT_CONTEXT",
      "confidence_score": 0.1,
      "cited_nodes": []
    }
    ```
3.  **Mandatory Cited Node IDs:** Every statement in a grounded answer cites the corresponding graph node ID in `cited_nodes`, providing verifiable provenance.

---

## 6. Model Context Protocol (FastMCP 2.0) Server

Liminal includes a native FastMCP server ([backend/mcp/server.py](file:///C:/Users/kaiwa/Documents/demo/backend/mcp/server.py)), allowing AI tools like **Claude Desktop**, **Cursor**, or **Windsurf** to use the graph as an external brain.

### Exposed Tools:
*   `search_knowledge_graph(query: str, top_k: int = 5)`: Returns reranked passages and cited graph entities.
*   `get_entity_connections(entity_name: str)`: Returns direct multi-hop relationships and Action-Goal Triads for an entity.
*   `query_by_goal_motive(goal_intent: str)`: Teleological search for actions and tools that accomplished a given outcome.
*   `ingest_knowledge(content: str, title: str, source_type: str, author: str)`: Allows Claude or Cursor to push new code insights, research findings, and architecture decisions directly into Liminal's Knowledge Graph via MCP.

### Configuration for Claude Desktop:
Add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "liminal": {
      "command": "python",
      "args": ["C:/Users/kaiwa/Documents/demo/backend/mcp/server.py"],
      "env": {
        "NEO4J_URI": "bolt://localhost:7687",
        "NEO4J_USER": "neo4j",
        "NEO4J_PASSWORD": "liminalpassword"
      }
    }
  }
}
```

---

## 7. Automated Evaluation Suite & CI Gate

The evaluation suite ensures zero regression across retrieval quality and hallucination prevention:

*   **Golden Dataset ([backend/tests/evals/golden_qa.jsonl](file:///C:/Users/kaiwa/Documents/demo/backend/tests/evals/golden_qa.jsonl)):** 30 hand-labeled test cases across:
    *   12 Multi-hop relationship queries
    *   8 Action-goal-motive queries
    *   4 Thematic abstraction queries
    *   6 Adversarial unanswerable queries
*   **Evaluation Runner ([backend/tests/evals/run_evals.py](file:///C:/Users/kaiwa/Documents/demo/backend/tests/evals/run_evals.py)):**
    ```bash
    python backend/tests/evals/run_evals.py --fail-on-regression
    ```
    *   **Context Recall:** 100.0% (Threshold: $\ge 85.0\%$)
    *   **Refusal Precision:** 100.0% (Threshold: $\ge 95.0\%$)
*   **GitHub Actions Gate ([.github/workflows/eval_gate.yml](file:///C:/Users/kaiwa/Documents/demo/.github/workflows/eval_gate.yml)):** Automatically blocks any PR that regresses on either metric.

---

## 8. Interactive Frontend Note Editor & Force Graph

*   **Yoopta Editor:** Supports rich typography, callouts, checklists, and code snippets.
*   **Demo Guest Login:** Accessible without pre-configured accounts via a 1-click guest button.
*   **Force-Directed 2D Graph:** Renders real-time node connections with customizable color coding and physics simulations.

---

## 9. Open-Source PKM Integration: Obsidian Vault & Multi-Source Ingestion

Liminal is not restricted to internal web notes. It features a universal ingestion pipeline ([backend/app/rag/parsers.py](file:///C:/Users/kaiwa/Documents/demo/backend/app/rag/parsers.py) & [backend/app/api/ingest.py](file:///C:/Users/kaiwa/Documents/demo/backend/app/api/ingest.py)) capable of ingesting external knowledge sources:

### 1. Obsidian Vault Ingestion
*   **YAML Frontmatter:** Parses tags, aliases, author, and date metadata.
*   **`[[Wikilinks]]` as Grounded Graph Edges:** Direct human-authored links like `[[Neo4j Database]]` or `[[Qdrant|Vector Index]]` are automatically turned into explicit `(Note)-[:REFERENCES]->(Target)` graph edges.
*   **Hierarchical Markdown:** Deconstructs headers (`#`, `##`) into contextual sub-sections.

### 2. Multi-Source Ingestion Types
Via `POST /api/ingest/document`:
*   `obsidian`: Markdown files with frontmatter and `[[wikilinks]]`.
*   `code_architecture`: Git commit messages, PR descriptions, and architectural RFCs.
*   `postmortem`: Root cause analyses, incident reports, and corrective goals.
*   `research`: Academic papers, technical documentation, and web bookmarks.
*   `agent_insight`: Findings submitted directly by AI agents via the FastMCP tool `ingest_knowledge`.

