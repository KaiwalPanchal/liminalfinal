from enum import Enum
from typing import List, Literal, Optional, Any, Union, Dict
from pydantic import BaseModel, Field

class CitedEntity(BaseModel):
    node_id: str = Field(..., description="Unique graph node ID in Neo4j")
    entity_name: str = Field(..., description="Canonical entity name")
    entity_type: str = Field(..., description="Node label: Entity, Action, Goal, or ThematicMotif")
    hop_level: int = Field(default=1, description="Graph expansion distance from query anchor")

class ActionGoalTriad(BaseModel):
    entity: str = Field(..., description="Acting entity (noun)")
    action: str = Field(..., description="Action or verb undertaken")
    goal: str = Field(..., description="Teleological target or objective")
    motive: Optional[str] = Field(None, description="The 'Why' or underlying motive behind the action")
    status: str = Field(default="active", description="Status: planned, active, completed, or deprecated")

class GraphRAGQueryRequest(BaseModel):
    query: str = Field(..., min_length=2, description="User question or research query")
    max_hops: int = Field(default=2, ge=1, le=3, description="Graph expansion radius")
    top_k: int = Field(default=5, ge=1, le=20, description="Reranked context budget")
    filter_by_goal: Optional[str] = Field(None, description="Optional teleological filter")

class GraphRAGResponse(BaseModel):
    answer: str = Field(..., description="Synthesized grounded answer or refusal explanation")
    status: Literal["GROUNDED", "REFUSED_INSUFFICIENT_CONTEXT"] = Field(
        ..., description="Verification status of grounding"
    )
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Confidence in grounding completeness")
    cited_nodes: List[CitedEntity] = Field(default_factory=list, description="Explicit nodes cited in response")
    cited_passages: List[str] = Field(default_factory=list, description="Raw text chunks supporting the answer")
    retrieval_latency_ms: float = Field(..., description="Time taken for hybrid retrieval & rerank in ms")
    generation_latency_ms: float = Field(..., description="Time taken for LLM synthesis in ms")

class NoteIngestRequest(BaseModel):
    text: Union[str, dict, list, Any] = Field(..., description="Note body: raw text, Markdown, or Yoopta JSON")
    title: Optional[str] = Field(default="Untitled Note", description="Title of the note")
    note_id: Optional[str] = Field(default=None, description="Optional caller-supplied unique note ID")
    tags: Optional[List[str]] = Field(default_factory=list, description="Categorical tags")

class ExtractedEntity(BaseModel):
    name: str = Field(..., description="Canonical name of noun/entity")
    type: str = Field(..., description="Type: Tool, Person, Concept, System, Metric, Project")
    description: Optional[str] = Field(None, description="Brief description")

class ExtractedAction(BaseModel):
    verb: str = Field(..., description="Primary action verb")
    description: str = Field(..., description="Detailed description of action performed")
    status: str = Field(default="completed", description="planned, active, completed, or deprecated")

class ExtractedGoal(BaseModel):
    objective: str = Field(..., description="Measurable target or outcome")
    motive: str = Field(..., description="Why was this action chosen? Rationale")

class ExtractedRelation(BaseModel):
    source: str = Field(..., description="Source entity or action name")
    target: str = Field(..., description="Target entity, action, or goal name")
    relation_type: str = Field(
        ..., description="USES_FOR, COLLABORATES_WITH, SUBSTITUTES, BLOCKED_BY, PERFORMS, TARGETS_GOAL, MOTIVATED_BY"
    )
    details: Optional[str] = Field(None, description="Additional context for this relationship edge")

class ExtractedGraphData(BaseModel):
    entities: List[ExtractedEntity] = Field(default_factory=list)
    actions: List[ExtractedAction] = Field(default_factory=list)
    goals: List[ExtractedGoal] = Field(default_factory=list)
    relations: List[ExtractedRelation] = Field(default_factory=list)
    thematic_motifs: List[str] = Field(default_factory=list)

class NoteIngestResponse(BaseModel):
    note_id: str
    status: str
    nodes_created: int
    edges_created: int
    thematic_motifs: List[str]
    processing_latency_ms: float

class DocumentType(str, Enum):
    NOTE = "note"
    OBSIDIAN = "obsidian"
    CODE_ARCHITECTURE = "code_architecture"
    POSTMORTEM = "postmortem"
    RESEARCH = "research"
    AGENT_INSIGHT = "agent_insight"

class DocumentIngestRequest(BaseModel):
    content: Union[str, dict, list, Any] = Field(..., description="Document content: markdown, text, code, or structured JSON")
    title: Optional[str] = Field(default="Untitled Document", description="Title or file name")
    source_type: DocumentType = Field(default=DocumentType.NOTE, description="Source type format")
    source_url: Optional[str] = Field(default=None, description="Optional URI, filepath, or web URL")
    author: Optional[str] = Field(default=None, description="Author or generating agent name")
    tags: Optional[List[str]] = Field(default_factory=list, description="Categorical tags")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Arbitrary metadata key-values")

class DocumentIngestResponse(BaseModel):
    document_id: str
    title: str
    source_type: str
    status: str
    nodes_created: int
    edges_created: int
    wikilinks_detected: List[str] = Field(default_factory=list)
    thematic_motifs: List[str] = Field(default_factory=list)
    processing_latency_ms: float

