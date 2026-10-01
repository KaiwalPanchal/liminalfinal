"""
FastMCP Server for Liminal Knowledge Graph.
Exposes tools to AI developer agents (Claude Desktop, Cursor, Windsurf)
via the Model Context Protocol (MCP).
"""

from typing import Dict, Any, List
try:
    from fastmcp import FastMCP
except ImportError:
    # Minimal fallback mock for environments before fastmcp is installed
    class FastMCP:
        def __init__(self, name: str):
            self.name = name
            self.tools = {}
        def tool(self):
            def decorator(fn):
                self.tools[fn.__name__] = fn
                return fn
            return decorator
        def run(self, transport="stdio"):
            print(f"Starting MCP server {self.name} on {transport}...")

from app.rag.hybrid_retriever import hybrid_retrieve
from app.graph.neo4j_client import neo4j_client

mcp = FastMCP("Liminal-Knowledge-Graph")

@mcp.tool()
def search_knowledge_graph(query: str, top_k: int = 5) -> Dict[str, Any]:
    """
    Search Liminal's fused vector and knowledge graph database for notes and relationships.
    Returns reranked passages and verified cited node entities.
    """
    reranked, cited_nodes, latency_ms = hybrid_retrieve(query, top_k=top_k)
    return {
        "query": query,
        "results": [r.get("text") for r in reranked],
        "cited_nodes": [n.model_dump() for n in cited_nodes],
        "retrieval_latency_ms": latency_ms
    }

@mcp.tool()
def get_entity_connections(entity_name: str) -> Dict[str, Any]:
    """
    Retrieve all direct multi-hop relationships and Action-Goal Triads for a specific entity in the graph.
    """
    return neo4j_client.get_entity_connections(entity_name)

@mcp.tool()
def query_by_goal_motive(goal_intent: str) -> Dict[str, Any]:
    """
    Teleological Reverse Retrieval: Find actions, tools, and notes that targeted or accomplished a specific motive.
    """
    triples = neo4j_client.traverse_subgraph([goal_intent], max_hops=2)
    return {
        "goal_intent": goal_intent,
        "matching_actions": triples
    }

@mcp.tool()
def ingest_knowledge(
    content: str,
    title: str = "Agent Finding",
    source_type: str = "agent_insight",
    author: str = "AI Assistant",
    tags: List[str] = None
) -> Dict[str, Any]:
    """
    Ingest arbitrary new text, code findings, architecture decisions, or research directly into Liminal's Knowledge Graph.
    Extracts entities, actions, teleological motives, and links them into Neo4j and vector search.
    Supports Obsidian-style Markdown with [[wikilinks]] and YAML frontmatter.
    """
    from app.api.ingest import ingest_any_document
    from app.core.models import DocumentType

    try:
        doc_type = DocumentType(source_type.lower())
    except Exception:
        doc_type = DocumentType.AGENT_INSIGHT

    result = ingest_any_document(
        content=content,
        title=title,
        source_type=doc_type,
        author=author,
        tags=tags or []
    )
    return result

if __name__ == "__main__":
    mcp.run(transport="stdio")

