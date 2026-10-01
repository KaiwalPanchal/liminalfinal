# Liminal System Architecture

This document provides a comprehensive technical overview of the **Liminal Grounded Hybrid GraphRAG** architecture, detailing component interactions, retrieval mechanics, graph data modeling, and grounding guardrails.

---

## 1. High-Level Architecture Diagram

```mermaid
flowchart TD
    subgraph Client Layer
        WEB["Next.js 14 Web Client<br/>(Yoopta Editor + 2D Force Graph)"]
        IDE["AI Agents / Developer Tools<br/>(Claude Desktop, Cursor, Windsurf)"]
    end

    subgraph API & Integration Layer
        API["FastAPI Gateway (Port 8000)<br/>- /api/query (Streaming / Grounded)<br/>- /api/ingest (Entity & Action Extraction)<br/>- /health (Readiness & Liveness)"]
        MCP["FastMCP 2.0 Server<br/>(backend/mcp/server.py via stdio)"]
    end

    subgraph Core Engine: Hybrid GraphRAG Pipeline
        DRIFT["DRIFT Search Coordinator<br/>(Dynamic Reasoning & Flexible Traversal)"]
        
        subgraph Candidate Retrieval
            VEC["Dense Vector Store<br/>(MiniLM Embeddings / Qdrant)"]
            GRAPH["Neo4j 5.x Graph Store<br/>(Multi-Hop Cypher Path Traversal)"]
            BM25["Full-Text Lexical Index<br/>(Exact Entity Keyword Search)"]
        end
        
        RERANK["Cross-Encoder Reranker<br/>(ms-marco-MiniLM-L-6-v2)"]
    end

    subgraph Verification & Synthesis Gate
        CRAG["Corrective Grounding Gate (CRAG)<br/>- Citation Validity Check<br/>- Confidence Threshold (>= 0.85)<br/>- Deterministic Refusal Filter"]
        LLM["Grounded Synthesis Engine<br/>(Pydantic v2 Structured Output)"]
        REFUSAL["Deterministic Refusal Handler<br/>('REFUSED_INSUFFICIENT_CONTEXT')"]
    end

    WEB -->|HTTP REST| API
    IDE -->|JSON-RPC / stdio| MCP
    API --> DRIFT
    MCP --> DRIFT

    DRIFT --> VEC
    DRIFT --> GRAPH
    DRIFT --> BM25

    VEC --> RERANK
    GRAPH --> RERANK
    BM25 --> RERANK

    RERANK --> CRAG
    CRAG -->|Sufficient Context| LLM
    CRAG -->|Missing / Unanswerable| REFUSAL

    LLM --> API
    REFUSAL --> API
    LLM --> MCP
    REFUSAL --> MCP
```

---

## 2. Component Breakdown

### 2.1 Client Layer
*   **Next.js 14 Frontend:** React-based single-page application using App Router, Tailwind CSS, and shadcn/ui components.
*   **Yoopta Editor:** Block-based rich text note editor allowing headings, code blocks, lists, and callouts.
*   **2D Force Graph Visualizer:** Built on `react-force-graph` to visually render nodes, relationships, and cluster topologies in real time.
*   **FastMCP Agent Interface:** Implements the Model Context Protocol (MCP) to allow developer agents (such as Claude Desktop or Cursor) to call Liminal graph tools directly.

### 2.2 API & Gateway Layer (`backend/app/`)
*   **FastAPI Framework:** High-performance asynchronous Python API gateway.
*   **Pydantic v2 Models:** Enforces strict serialization, validation, and type contracts across all incoming requests and outgoing responses.
*   **Lifespan Management:** Initializes and monitors database connections on application startup and ensures graceful cleanup on shutdown.

### 2.3 Knowledge Graph Store (Neo4j 5.x)
*   **Multi-Edge Graph Network:** Supports multiple concurrent, typed relationships between entities (e.g., `(A)-[:USES_FOR]->(B)` alongside `(A)-[:COLLABORATES_WITH]->(B)`).
*   **Action-Goal Triads:** Native storage of operational actions, outcomes, and motivations (`PERFORMS`, `TARGETS_GOAL`, `MOTIVATED_BY`).
*   **Constraints & Full-Text Indexes:** Unique node identity constraints on entity names and chunk IDs; full-text search indexes on node labels for fast lexical lookups.

### 2.4 Hybrid Retrieval & DRIFT Search (`backend/app/rag/`)
Liminal implements **DRIFT Search** (Dynamic Reasoning and Inference with Flexible Traversal), which balances thematic breadth and local depth:
1.  **Primer Stage (Thematic Matching):** Examines Level 2 `:ThematicMotif` nodes and community clusters to determine the broad conceptual domain of the query.
2.  **Follow-Up Stage (Action-Goal Traversal):** Extracts anchor entities from the query and performs a 1–2 hop Cypher traversal:
    ```cypher
    MATCH (e) WHERE toLower(e.name) IN $names
    OPTIONAL MATCH path = (e)-[r*1..2]-(neighbor)
    UNWIND relationships(path) AS rel
    RETURN startNode(rel).name AS source,
           labels(startNode(rel))[0] AS source_type,
           type(rel) AS relation,
           endNode(rel).name AS target,
           labels(endNode(rel))[0] AS target_type,
           rel.details AS details
    LIMIT 50
    ```
3.  **Dense Vector Search:** Simultaneously matches query embeddings against text chunks in the vector index.
4.  **Cross-Encoder Reranking:** Concatenates graph facts and vector passages into a candidate pool, re-scoring them using a neural cross-encoder (`cross-encoder/ms-marco-MiniLM-L-6-v2`).

### 2.5 Corrective Grounding & Refusal Gate (`backend/app/rag/generator.py`)
To prevent hallucinations, Liminal implements a **Corrective RAG (CRAG)** verification gate prior to answer generation:
*   **Factual Alignment Verification:** Checks whether key entity tokens from the query exist in the reranked context.
*   **Adversarial & Out-of-Domain Filter:** If the query requests facts not present in the graph (e.g., external budgets, private credentials, unrelated trivia), the gate short-circuits.
*   **Deterministic Refusal:** If confidence $< 0.85$ or factual support is missing, the system returns:
    ```json
    {
      "answer": "REFUSED_INSUFFICIENT_CONTEXT: The knowledge graph does not contain verified relationships or passages for this query.",
      "status": "REFUSED_INSUFFICIENT_CONTEXT",
      "confidence_score": 0.1,
      "cited_nodes": []
    }
    ```
*   **Strict Citation Contract:** When grounded, every factual statement in the answer must cite corresponding verified node IDs (`cited_nodes`).

---

## 3. Data Flow & Sequence Diagrams

### 3.1 Note Ingestion Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as User (Yoopta Editor)
    participant API as FastAPI (/api/ingest)
    participant EXT as Instructor / NLP Extractor
    participant NEO as Neo4j Graph Database
    participant VEC as Vector Index

    User->>API: POST /api/ingest {text, title, note_id}
    API->>API: Parse Yoopta blocks to normalized text
    API->>EXT: Extract Entities, Actions, Goals & Motifs
    EXT-->>API: ExtractedGraphData (Pydantic schema)
    
    par Store Graph Structure
        API->>NEO: Merge :Entity, :Action, :Goal nodes
        API->>NEO: Create multi-edges & :ThematicMotif abstractions
        API->>NEO: Link nodes to :NoteChunk with [:EVIDENCED_BY]
    and Store Dense Vector
        API->>VEC: Embed note text & index chunk
    end
    
    API-->>User: NoteIngestResponse {status: "SUCCESS", nodes_created, edges_created}
```

### 3.2 Query & Synthesis Flow

```mermaid
sequenceDiagram
    autonumber
    actor Client as Web Frontend / Claude Desktop (MCP)
    participant API as FastAPI (/api/query)
    participant RET as DRIFT Hybrid Retriever
    participant RR as Cross-Encoder Reranker
    participant GATE as CRAG Grounding Gate
    participant LLM as Synthesis Engine

    Client->>API: POST /api/query {query, max_hops=2, top_k=5}
    API->>RET: hybrid_retrieve(query)
    
    par Multi-Modal Candidate Retrieval
        RET->>RET: Extract anchor entities & motifs
        RET->>RET: Cypher 2-hop traversal on Neo4j
        RET->>RET: Dense vector similarity search
    end

    RET->>RR: Score candidate facts & text chunks
    RR-->>RET: Top-k reranked context items
    RET-->>API: (reranked_context, candidate_nodes, latency_ms)

    API->>GATE: Evaluate context sufficiency
    alt Context is Sufficient & Grounded
        GATE->>LLM: Synthesize answer with cited node IDs
        LLM-->>API: GraphRAGResponse (status="GROUNDED", cited_nodes=[...])
    else Context Lacks Evidence or Query Out-of-Domain
        GATE-->>API: GraphRAGResponse (status="REFUSED_INSUFFICIENT_CONTEXT")
    end

    API-->>Client: JSON Response with Citations & Latencies
```

---

## 4. Multi-Scale Abstraction Hierarchy

Liminal structures stored knowledge across three distinct tiers:

```mermaid
flowchart TD
    subgraph Tier 2: Thematic Abstraction Layer
        T2["Generalized Motifs & Patterns<br/>(e.g., 'Decoupled Asynchronous Ingestion for Fault Tolerance')"]
    end

    subgraph Tier 1: Grounded Action-Goal Networks
        T1_E1["Entity: FastAPI Backend"]
        T1_A1["Action: Migrated from Firestore to Neo4j"]
        T1_G1["Goal: Sub-100ms Query Latency"]
        T1_E2["Entity: Neo4j"]
        
        T1_E1 -->|PERFORMS| T1_A1
        T1_A1 -->|TARGETS_GOAL| T1_G1
        T1_A1 -->|LEVERAGES| T1_E2
    end

    subgraph Tier 0: Provenance & Raw Chunks
        T0_C1["Raw Note Chunk #1 (Timestamp, Author, Offsets)"]
        T0_C2["Raw Note Chunk #2 (Yoopta Block IDs)"]
    end

    T2 -.->|ABSTRACTS| T1_A1
    T2 -.->|GENERALIZES| T1_G1
    T1_A1 -.->|EVIDENCED_BY| T0_C1
    T1_G1 -.->|EVIDENCED_BY| T0_C2
```

1.  **Tier 0 (Provenance):** Raw, immutable text chunks preserving exact wording, character offsets, timestamps, and authorship.
2.  **Tier 1 (Grounded Triads):** Concrete entities, operational action verbs, and explicit goals directly extracted from notes.
3.  **Tier 2 (Thematic Motifs):** High-level architectural or conceptual patterns stripped of situational variables, enabling cross-project discovery.

---

## 5. Security & Deployment Architecture

*   **Docker Containerization:** All components (Neo4j 5.x, FastAPI Backend, Next.js Frontend) are containerized and orchestrated via `docker-compose.yml`.
*   **Zero Hardcoded Secrets:** Configuration is managed strictly via environment variables (`.env` with `.env.example` template).
*   **Network Isolation:** Neo4j and internal microservice communication runs on an internal Docker network, exposing only ports 3000 (Frontend), 8000 (Backend API), and 7474/7687 (Neo4j Browser/Bolt) as required.
