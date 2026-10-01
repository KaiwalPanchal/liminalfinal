# Liminal: Enterprise GraphRAG Overhaul Handoff

**Target Repository:** `https://github.com/KaiwalPanchal/liminalfinal`  
**Local Clone Destination:** `C:\Users\kaiwa\Documents\GitHub\liminalfinal`  
**Objective:** Transform `liminalfinal` from a frontend-only prototype into a production-grade **Grounded Hybrid GraphRAG** showcase that satisfies the #1 technical filter in 2026 Applied AI Engineer and Forward Deployed Engineer (FDE) hiring loops (Grounded RAG API, deterministic citations, offline evals, and FastMCP).

---

## 1. Summary of Required Changes

| Area | Current State | Target State | Hiring Signal Closed |
|---|---|---|---|
| **Backend Architecture** | Missing (repo is frontend-only) | Full Python FastAPI backend inside `backend/` | Production SWE & API Design |
| **Retrieval Engine** | None | **Hybrid GraphRAG** (Dense Vectors + BM25 + Neo4j Cypher Traversal + Cross-Encoder Reranker) | Tier 1 RAG Beyond Naive |
| **Grounding & Guardrails** | None | Pydantic v2 schema enforcing source node citations and deterministic `"REFUSED_INSUFFICIENT_CONTEXT"` fallback | Hallucination Prevention |
| **Evaluation Suite** | None | 30-item multi-hop golden dataset (`tests/evals/`) + automated precision/recall eval script | #1 2026 Hiring Filter (Evals) |
| **CI/CD Quality Gate** | None | GitHub Actions workflow blocking PRs on eval regression | Production Reliability |
| **MCP Integration** | None | FastMCP server exposing graph tools to Claude Desktop & Cursor | Tier 2 MCP Differentiator |
| **Repo Hygiene & Security** | Leaked email in log, hardcoded password, dead IP | Clean git history, parameterized `.env`, proper attribution | Security & Production Hygiene |

---

## 2. Directory Structure After Overhaul

```
liminalfinal/
├── .github/
│   └── workflows/
│       ├── test.yml                   # Fast pytest unit tests
│       └── eval_gate.yml              # Offline RAG eval regression gate
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── ingest.py              # Note ingestion & entity extraction
│   │   │   └── query.py               # Streaming Hybrid GraphRAG endpoint
│   │   ├── core/
│   │   │   ├── config.py              # Pydantic Settings (.env)
│   │   │   └── models.py              # Pydantic v2 I/O schemas with citations
│   │   ├── graph/
│   │   │   ├── neo4j_client.py        # Cypher queries & connection pool
│   │   │   └── schema.py              # Node/Edge relationship types
│   │   ├── rag/
│   │   │   ├── hybrid_retriever.py    # Dense vector + BM25 + Graph traversal
│   │   │   └── reranker.py            # Cross-encoder re-scoring (Cohere / BGE)
│   │   │   └── generator.py           # LLM answer synthesis with refusal logic
│   │   └── main.py                    # FastAPI entrypoint
│   ├── mcp/
│   │   ├── __init__.py
│   │   └── server.py                  # FastMCP server for Claude Desktop / Cursor
│   ├── tests/
│   │   ├── unit/                      # Pytest unit tests
│   │   └── evals/
│   │       ├── golden_qa.jsonl        # 30 hand-labeled multi-hop test cases
│   │       └── run_evals.py           # Evaluates Context Recall & Faithfulness
│   ├── pyproject.toml                 # Backend dependencies
│   └── Dockerfile                     # Python 3.11 slim container
├── src/                               # Existing Next.js frontend
├── docker-compose.yml                 # Runs Neo4j + Vector DB + Backend + Frontend
├── .env.example                       # Documented environment variables
└── README.md                          # Architecture diagram, benchmarks, attribution
```

---

## 3. Step-by-Step Implementation Guide

### Phase 1: Clone & Fix Security / Hygiene Vulnerabilities

1. Clone the repository into `C:\Users\kaiwa\Documents\GitHub\liminalfinal`:
   ```bash
   cd "C:\Users\kaiwa\Documents\GitHub"
   git clone https://github.com/KaiwalPanchal/liminalfinal.git
   cd liminalfinal
   ```

2. **Remove Leaked Log:**
   Untrack `firebase-debug.log` (exposes co-author's email) and add to `.gitignore`:
   ```bash
   git rm --cached firebase-debug.log
   echo "*.log" >> .gitignore
   ```

3. **Parameterize Dead Cloud VM IP:**
   In `src/lib/api.ts`, replace the hardcoded IP (`http://34.29.242.183:8020`) with an environment variable:
   ```typescript
   export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
   ```

4. **Fix Login Page Hardcoded Password:**
   In `src/app/login/page.tsx`, remove the hardcoded password check and replace with standard Firebase auth or a "Demo Guest Login" button.

5. **Update README Attribution:**
   Update the top of `README.md` to establish clear, authentic roles:
   > *"Co-built by [@KaiwalPanchal](https://github.com/KaiwalPanchal) (Backend Architecture, GraphRAG, Neo4j, Evals) and [@fxlgun](https://github.com/fxlgun) (Frontend UI & Graph Visualizations)."*

---

### Phase 2: Python Backend & Hybrid GraphRAG

Create `backend/` and initialize Python dependencies in `backend/pyproject.toml`:
```toml
[project]
name = "liminal-backend"
version = "0.1.0"
requires-python = ">=3.10"
dependencies = [
    "fastapi>=0.100.0",
    "uvicorn>=0.22.0",
    "pydantic>=2.0.0",
    "pydantic-settings>=2.0.0",
    "neo4j>=5.14.0",
    "qdrant-client>=1.7.0",
    "sentence-transformers>=2.2.0",
    "fastmcp>=0.1.0",
    "cohere>=4.0.0",
    "litellm>=1.20.0"
]
```

#### Core Data Contract (`backend/app/core/models.py`)
Enforce structured outputs where every statement is cited, and missing information is explicitly refused:
```python
from typing import List, Literal, Optional
from pydantic import BaseModel, Field

class CitedEntity(BaseModel):
    node_id: str
    entity_name: str
    entity_type: str

class GraphRAGQueryRequest(BaseModel):
    query: str
    max_hops: int = 2
    top_k: int = 5

class GraphRAGResponse(BaseModel):
    answer: str
    status: Literal["GROUNDED", "REFUSED_INSUFFICIENT_CONTEXT"]
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    cited_nodes: List[CitedEntity] = []
    cited_passages: List[str] = []
    retrieval_latency_ms: float
    generation_latency_ms: float
```

#### Hybrid Retrieval Logic (`backend/app/rag/hybrid_retriever.py`)
1. **Dense Vector Search:** Embed query with `sentence-transformers/all-MiniLM-L6-v2` $\to$ retrieve top 15 text chunks from vector store.
2. **Graph Traversal:** Extract key entities from query $\to$ execute Neo4j Cypher query to pull 1–2 hop connected subgraphs:
   ```cypher
   MATCH (e:Entity) WHERE toLower(e.name) IN $entity_names
   OPTIONAL MATCH (e)-[r:RELATED_TO]-(neighbor:Entity)
   RETURN e.name, e.type, type(r), neighbor.name, neighbor.type LIMIT 25
   ```
3. **Cross-Encoder Reranking:** Concatenate vector chunks and graph triples $\to$ re-score using Cohere Rerank or local cross-encoder $\to$ return top 4 context items to the LLM.

#### Generator with Refusal Prompt (`backend/app/rag/generator.py`)
System prompt rule:
> *"You are Liminal's GraphRAG synthesis engine. Answer the user's question using ONLY the provided verified graph facts and text passages. Every factual statement must cite its corresponding node ID. If the context does not contain sufficient facts to answer the question with 100% confidence, set status='REFUSED_INSUFFICIENT_CONTEXT' and explain what specific entity or relationship is missing."*

---

### Phase 3: Model Context Protocol (FastMCP) Server

Create `backend/mcp/server.py`:
```python
from fastmcp import FastMCP
from app.rag.hybrid_retriever import hybrid_retrieve
from app.graph.neo4j_client import get_subgraph

mcp = FastMCP("Liminal-Knowledge-Graph")

@mcp.tool()
def search_knowledge_graph(query: str, top_k: int = 5) -> dict:
    """Search Liminal's fused vector and knowledge graph database for notes and relationships."""
    results = hybrid_retrieve(query, top_k=top_k)
    return {"results": results}

@mcp.tool()
def get_entity_connections(entity_name: str) -> dict:
    """Retrieve all direct multi-hop relationships for a specific entity in the graph."""
    subgraph = get_subgraph(entity_name)
    return {"entity": entity_name, "connections": subgraph}

if __name__ == "__main__":
    mcp.run(transport="stdio")
```

---

### Phase 4: Evaluation Suite & CI Gate (`backend/tests/evals/`)

1. **Golden Multi-Hop Dataset (`backend/tests/evals/golden_qa.jsonl`):**
   Create 30 realistic test cases across messy notes, including adversarial queries:
   ```json
   {"id": "qa_001", "query": "Which project used both Neo4j and Qdrant, and who led it?", "expected_nodes": ["Liminal", "Kaiwal Panchal", "Neo4j", "Qdrant"], "expected_status": "GROUNDED", "slice": "multi_hop"}
   {"id": "qa_002", "query": "What was the Q4 marketing budget for TruckIt?", "expected_nodes": [], "expected_status": "REFUSED_INSUFFICIENT_CONTEXT", "slice": "unanswerable_refusal"}
   ```

2. **Evaluation Script (`backend/tests/evals/run_evals.py`):**
   Computes:
   - **Context Recall:** Percentage of `expected_nodes` successfully retrieved in top-k.
   - **Refusal Precision:** Did the system properly refuse unanswerable queries instead of hallucinating?
   - Exits with `code 1` if Context Recall $< 85\%$ or Refusal Precision $< 95\%$.

3. **GitHub Actions Workflow (`.github/workflows/eval_gate.yml`):**
   ```yaml
   name: GraphRAG Evaluation Gate
   on: [push, pull_request]
   jobs:
     eval:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-python@v5
           with:
             python-version: '3.11'
         - name: Install Dependencies
           run: |
             cd backend && pip install -e . pytest
         - name: Run Evals
           run: |
             cd backend && python tests/evals/run_evals.py --fail-on-regression
   ```

---

### Phase 5: Docker Compose (`docker-compose.yml`)

Add top-level `docker-compose.yml` so anyone reviewing your repo can launch the whole stack with one command:
```yaml
version: '3.8'
services:
  neo4j:
    image: neo4j:5.14-community
    environment:
      - NEO4J_AUTH=neo4j/liminalpassword
    ports:
      - "7474:7474"
      - "7687:7687"

  backend:
    build: ./backend
    environment:
      - NEO4J_URI=bolt://neo4j:7687
      - NEO4J_PASSWORD=liminalpassword
    ports:
      - "8000:8000"
    depends_on:
      - neo4j

  frontend:
    build: .
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
    ports:
      - "3000:3000"
    depends_on:
      - backend
```

---

## 4. Verification Checklist Before Marking Done

- [ ] `liminalfinal` cloned locally to `C:\Users\kaiwa\Documents\GitHub\liminalfinal`.
- [ ] `firebase-debug.log` untracked and removed from git cache.
- [ ] `src/lib/api.ts` parameterized via `NEXT_PUBLIC_API_URL`.
- [ ] Python `backend/` implemented with FastAPI, Neo4j, and Hybrid RAG.
- [ ] Pydantic v2 schemas enforcing source node citations and refusal fallback.
- [ ] FastMCP server functional for Claude Desktop integration.
- [ ] `golden_qa.jsonl` and `run_evals.py` passing locally.
- [ ] GitHub Actions CI workflow (`eval_gate.yml`) committed and passing green.
- [ ] Updated README featuring the new architecture diagram and benchmark table.
