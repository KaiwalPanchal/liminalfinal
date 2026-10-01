import time
import uuid
import re
from typing import Any, Dict, List
from fastapi import APIRouter, HTTPException
from app.core.models import (
    NoteIngestRequest, NoteIngestResponse,
    DocumentType, DocumentIngestRequest, DocumentIngestResponse,
    ExtractedGraphData, ExtractedEntity, ExtractedAction,
    ExtractedGoal, ExtractedRelation
)
from app.graph.neo4j_client import neo4j_client
from app.core.config import settings

router = APIRouter()

def parse_yoopta_or_text(raw_input: Any) -> str:
    """Extract plain text string from raw text or Yoopta editor JSON structure."""
    if isinstance(raw_input, str):
        return raw_input
    
    extracted_chunks = []
    if isinstance(raw_input, dict):
        for block_id, block_data in raw_input.items():
            if isinstance(block_data, dict):
                values = block_data.get("value", [])
                if isinstance(values, list):
                    for val in values:
                        children = val.get("children", [])
                        for child in children:
                            if isinstance(child, dict) and "text" in child:
                                extracted_chunks.append(child["text"])
    elif isinstance(raw_input, list):
        for item in raw_input:
            if isinstance(item, str):
                extracted_chunks.append(item)
            elif isinstance(item, dict) and "text" in item:
                extracted_chunks.append(item["text"])

    return " ".join(extracted_chunks) if extracted_chunks else str(raw_input)

def extract_graph_elements(text: str) -> ExtractedGraphData:
    """Extract entities, actions, goals, and thematic motifs."""
    # Attempt extraction via Instructor if valid OpenAI key exists
    if settings.OPENAI_API_KEY and len(settings.OPENAI_API_KEY) > 15 and not settings.OPENAI_API_KEY.startswith("your_"):
        try:
            import instructor
            from openai import OpenAI
            client = instructor.from_openai(OpenAI(api_key=settings.OPENAI_API_KEY, timeout=5.0))
            extracted: ExtractedGraphData = client.chat.completions.create(
                model=settings.LLM_MODEL,
                response_model=ExtractedGraphData,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "Extract all entities (nouns), actions (verbs executed), goals (objectives and motives), "
                            "and multi-edge relationships from the given note. Extract high-level thematic motifs by "
                            "removing specific details."
                        )
                    },
                    {"role": "user", "content": text}
                ]
            )
            return extracted
        except Exception:
            pass

    # Heuristic Rule-Based Extractor Fallback
    entities: List[ExtractedEntity] = []
    actions: List[ExtractedAction] = []
    goals: List[ExtractedGoal] = []
    relations: List[ExtractedRelation] = []
    motifs: List[str] = []

    # Extract capitalized proper nouns
    proper_nouns = re.findall(r'\b[A-Z][a-zA-Z0-9_\-\.]*(?:\s+[A-Z][a-zA-Z0-9_\-\.]*)*\b', text)
    for noun in set(proper_nouns[:6]):
        entities.append(ExtractedEntity(
            name=noun,
            type="Concept" if len(noun.split()) > 1 else "Entity",
            description=f"Identified entity in text: {noun}"
        ))

    # Identify action verbs
    action_matches = re.findall(r'\b(implemented|built|migrated|designed|optimized|refactored|deployed)\b\s+([^,\.\n]+)', text, re.IGNORECASE)
    for verb, target in action_matches[:4]:
        actions.append(ExtractedAction(
            verb=verb.capitalize(),
            description=f"{verb} {target.strip()}",
            status="completed"
        ))

    # Identify goal clauses
    goal_matches = re.findall(r'\b(to|in order to|so that|aiming to)\s+([^,\.\n]+)', text, re.IGNORECASE)
    for indicator, objective in goal_matches[:3]:
        goals.append(ExtractedGoal(
            objective=objective.strip(),
            motive=f"Initiated {indicator} {objective.strip()}"
        ))

    # Link relations
    if entities and actions:
        relations.append(ExtractedRelation(
            source=entities[0].name,
            target=actions[0].description,
            relation_type="PERFORMS",
            details="Direct implementation action"
        ))
    if actions and goals:
        relations.append(ExtractedRelation(
            source=actions[0].description,
            target=goals[0].objective,
            relation_type="TARGETS_GOAL",
            details="Teleological motive linkage"
        ))

    motifs.append("Modular architecture decoupling and optimization")

    return ExtractedGraphData(
        entities=entities,
        actions=actions,
        goals=goals,
        relations=relations,
        thematic_motifs=motifs
    )

def ingest_any_document(
    content: Any,
    title: str = "Untitled Document",
    source_type: DocumentType = DocumentType.NOTE,
    author: str = None,
    tags: List[str] = None,
    metadata: Dict[str, Any] = None
) -> Dict[str, Any]:
    """Core multi-source ingestion pipeline used by REST endpoints and FastMCP tools."""
    from app.rag.parsers import universal_document_parser
    start_time = time.perf_counter()
    doc_id = str(uuid.uuid4())
    
    clean_text, explicit_relations, wikilinks = universal_document_parser(content, source_type, title=title)
    if not clean_text.strip():
        raise ValueError("Document content cannot be empty.")

    # Run intent-aware extraction
    extracted = extract_graph_elements(clean_text)

    # Ensure document title itself is an entity in the graph
    extracted.entities.append(ExtractedEntity(
        name=title,
        type="Document",
        description=f"Source: {source_type.value} | Author: {author or 'User'}"
    ))

    # Merge explicit relations (like Obsidian [[wikilinks]])
    extracted.relations.extend(explicit_relations)

    # Insert into Neo4j
    counts = neo4j_client.insert_extracted_data(extracted, note_id=doc_id, raw_text=clean_text)

    latency_ms = (time.perf_counter() - start_time) * 1000.0
    return {
        "document_id": doc_id,
        "title": title,
        "source_type": source_type.value,
        "status": "SUCCESS",
        "nodes_created": counts.get("nodes_created", 0),
        "edges_created": counts.get("edges_created", 0),
        "wikilinks_detected": wikilinks,
        "thematic_motifs": extracted.thematic_motifs,
        "processing_latency_ms": latency_ms
    }

@router.post("/ingest", response_model=NoteIngestResponse)
async def ingest_note(request: NoteIngestRequest):
    """Legacy / standard note ingestion endpoint."""
    res = ingest_any_document(
        content=request.text,
        title=request.title or "Untitled Note",
        source_type=DocumentType.NOTE,
        tags=request.tags
    )
    return NoteIngestResponse(
        note_id=request.note_id or res["document_id"],
        status=res["status"],
        nodes_created=res["nodes_created"],
        edges_created=res["edges_created"],
        thematic_motifs=res["thematic_motifs"],
        processing_latency_ms=res["processing_latency_ms"]
    )

@router.post("/ingest/document", response_model=DocumentIngestResponse)
async def ingest_document(request: DocumentIngestRequest):
    """
    Multi-Source Ingestion Pipeline.
    Supports Obsidian Markdown (YAML frontmatter + [[wikilinks]]),
    Code Architecture logs, Postmortems, Research papers, and Agent Insights.
    """
    try:
        res = ingest_any_document(
            content=request.content,
            title=request.title,
            source_type=request.source_type,
            author=request.author,
            tags=request.tags,
            metadata=request.metadata
        )
        return DocumentIngestResponse(**res)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")

