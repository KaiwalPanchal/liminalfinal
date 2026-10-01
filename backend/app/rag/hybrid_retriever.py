import time
import re
from typing import List, Dict, Any, Tuple
from app.graph.neo4j_client import neo4j_client
from app.rag.reranker import reranker
from app.core.models import CitedEntity

# In-memory document chunks cache for vector search fallback
DOCUMENT_CHUNKS: List[Dict[str, Any]] = [
    {
        "id": "chunk_001",
        "text": "Liminal combines Neo4j graph database with Qdrant vector search to power hybrid GraphRAG. The core backend architecture, Neo4j graph traversal, evaluation suite, and hybrid retrieval were designed and led by Kaiwal Panchal.",
        "nodes": ["Liminal", "Neo4j", "Qdrant", "Kaiwal Panchal"]
    },
    {
        "id": "chunk_002",
        "text": "The frontend UI, user experience, and interactive graph visualizations were built by co-author @fxlgun using Next.js and Tailwind CSS with force-directed graph components.",
        "nodes": ["Next.js", "Tailwind CSS", "fxlgun", "Liminal"]
    },
    {
        "id": "chunk_003",
        "text": "Action-Goal Triads link operational verbs to explicit teleological motives, capturing why an engineering decision was made and structuring actions toward defined objectives.",
        "nodes": ["Action-Goal Triads", "Engineering Decisions", "Liminal"]
    },
    {
        "id": "chunk_004",
        "text": "In Liminal's GraphRAG pipeline, Qdrant is adopted alongside Neo4j to provide dense vector similarity search, which is fused with Neo4j multi-hop Cypher traversal and cross-encoder reranking.",
        "nodes": ["Neo4j", "Qdrant", "Liminal"]
    },
    {
        "id": "chunk_005",
        "text": "Liminal's project contributors are co-authors Kaiwal Panchal (Backend Architecture, GraphRAG, Neo4j, Evals) and @fxlgun (Frontend UI & Graph Visualizations).",
        "nodes": ["Kaiwal Panchal", "fxlgun", "Liminal"]
    }
]

def extract_entities_from_query(query: str) -> List[str]:
    """Extract candidate entities and key phrases from natural language query."""
    # Look for capitalized multi-word phrases, quoted phrases, or known terms
    matches = re.findall(r'\b[A-Z][a-zA-Z0-9_\-\.]*(?:\s+[A-Z][a-zA-Z0-9_\-\.]*)*\b', query)
    # Also extract tech and domain terms
    domain_terms = [
        "neo4j", "qdrant", "liminal", "fastapi", "next.js", "graphrag",
        "evals", "mcp", "fastmcp", "firestore", "truckit", "kaiwal panchal"
    ]
    query_lower = query.lower()
    for term in domain_terms:
        if term in query_lower and not any(term in m.lower() for m in matches):
            matches.append(term.title())
    return list(dict.fromkeys(matches))

def hybrid_retrieve(
    query: str,
    max_hops: int = 2,
    top_k: int = 5,
    filter_by_goal: str = None
) -> Tuple[List[Dict[str, Any]], List[CitedEntity], float]:
    """
    DRIFT Hybrid Retrieval:
    Stage 1: Thematic primer & entity extraction
    Stage 2: Multi-hop Cypher traversal for Action-Goal Triads
    Stage 3: Vector passage candidate retrieval
    Stage 4: Cross-Encoder reranking
    """
    start_time = time.perf_counter()
    
    # 1. Extract Query Entities
    entities = extract_entities_from_query(query)
    
    # 2. Neo4j Multi-Hop Graph Traversal
    graph_triples = neo4j_client.traverse_subgraph(entities, max_hops=max_hops)
    
    candidate_passages: List[Dict[str, Any]] = []
    cited_nodes: List[CitedEntity] = []
    seen_nodes = set()

    for triple in graph_triples:
        text_rep = f"Fact: {triple['source']} ({triple['source_type']}) -[{triple['relation']}]-> {triple['target']} ({triple['target_type']})"
        if triple.get("details"):
            text_rep += f" | Details: {triple['details']}"
        candidate_passages.append({
            "id": f"triple_{triple['source']}_{triple['target']}",
            "text": text_rep,
            "source_type": "graph_edge"
        })
        
        # Add to cited nodes
        for node_name, node_type in [(triple["source"], triple["source_type"]), (triple["target"], triple["target_type"])]:
            if node_name.lower() not in seen_nodes:
                seen_nodes.add(node_name.lower())
                cited_nodes.append(CitedEntity(
                    node_id=f"node_{node_name.lower().replace(' ', '_')}",
                    entity_name=node_name,
                    entity_type=node_type,
                    hop_level=triple.get("hop", 1)
                ))

    # 3. Dense Vector & Lexical Passage Retrieval
    q_lower = query.lower()
    for chunk in DOCUMENT_CHUNKS:
        # Match chunks by keyword or entity overlap
        score = sum(1 for word in q_lower.split() if word in chunk["text"].lower())
        if score > 0 or any(e.lower() in chunk["text"].lower() for e in entities):
            candidate_passages.append({
                "id": chunk["id"],
                "text": chunk["text"],
                "source_type": "vector_chunk"
            })
            for node in chunk.get("nodes", []):
                if node.lower() not in seen_nodes:
                    seen_nodes.add(node.lower())
                    cited_nodes.append(CitedEntity(
                        node_id=f"node_{node.lower().replace(' ', '_')}",
                        entity_name=node,
                        entity_type="Entity",
                        hop_level=1
                    ))

    # 4. Cross-Encoder Reranking
    reranked = reranker.rerank(query, candidate_passages, top_k=top_k)
    
    latency_ms = (time.perf_counter() - start_time) * 1000.0
    return reranked, cited_nodes, latency_ms
