from fastapi import APIRouter, HTTPException
from app.core.models import GraphRAGQueryRequest, GraphRAGResponse
from app.rag.hybrid_retriever import hybrid_retrieve
from app.rag.generator import generate_grounded_response

router = APIRouter()

@router.post("/query", response_model=GraphRAGResponse)
async def query_graphrag(request: GraphRAGQueryRequest):
    """
    Execute Grounded Hybrid GraphRAG Query.
    Combines dense vector retrieval, Neo4j multi-edge traversal,
    and cross-encoder reranking with deterministic citation grounding.
    """
    try:
        reranked_context, cited_nodes, retrieval_latency_ms = hybrid_retrieve(
            query=request.query,
            max_hops=request.max_hops,
            top_k=request.top_k,
            filter_by_goal=request.filter_by_goal
        )
        
        response = generate_grounded_response(
            query=request.query,
            context_passages=reranked_context,
            cited_nodes=cited_nodes,
            retrieval_latency_ms=retrieval_latency_ms
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"GraphRAG query error: {str(e)}")
