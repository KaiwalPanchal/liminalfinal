import pytest
from app.core.models import (
    CitedEntity, GraphRAGQueryRequest, GraphRAGResponse,
    NoteIngestRequest, ExtractedGraphData, ExtractedEntity,
    ExtractedAction, ExtractedGoal, ExtractedRelation
)

def test_cited_entity_validation():
    entity = CitedEntity(
        node_id="node_neo4j",
        entity_name="Neo4j",
        entity_type="Tool",
        hop_level=1
    )
    assert entity.node_id == "node_neo4j"
    assert entity.entity_name == "Neo4j"
    assert entity.hop_level == 1

def test_graphrag_query_request():
    req = GraphRAGQueryRequest(query="Which database was selected?", max_hops=2, top_k=5)
    assert req.query == "Which database was selected?"
    assert req.max_hops == 2
    assert req.top_k == 5

def test_graphrag_response_status_constraint():
    resp = GraphRAGResponse(
        answer="Neo4j was selected.",
        status="GROUNDED",
        confidence_score=0.95,
        cited_nodes=[],
        cited_passages=[],
        retrieval_latency_ms=12.4,
        generation_latency_ms=45.2
    )
    assert resp.status == "GROUNDED"
    assert resp.confidence_score == 0.95

    with pytest.raises(Exception):
        # Invalid status must fail Pydantic validation
        GraphRAGResponse(
            answer="Invalid",
            status="UNVERIFIED",  # Not in Literal["GROUNDED", "REFUSED_INSUFFICIENT_CONTEXT"]
            confidence_score=0.5,
            retrieval_latency_ms=10.0,
            generation_latency_ms=10.0
        )

def test_extracted_graph_data():
    data = ExtractedGraphData(
        entities=[ExtractedEntity(name="Liminal", type="Project")],
        actions=[ExtractedAction(verb="Build", description="Build GraphRAG")],
        goals=[ExtractedGoal(objective="Grounded retrieval", motive="Eliminate hallucinations")],
        relations=[ExtractedRelation(source="Liminal", target="Build GraphRAG", relation_type="PERFORMS")],
        thematic_motifs=["Knowledge graph retrieval"]
    )
    assert len(data.entities) == 1
    assert data.entities[0].name == "Liminal"
    assert len(data.relations) == 1
