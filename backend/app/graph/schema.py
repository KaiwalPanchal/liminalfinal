"""
Graph Schema definitions for Liminal Multi-Edge Grounded GraphRAG.
Defines labels, edge types, properties, and Cypher initialization statements.
"""

from enum import Enum
from typing import List

class NodeLabel(str, Enum):
    ENTITY = "Entity"
    ACTION = "Action"
    GOAL = "Goal"
    THEMATIC_MOTIF = "ThematicMotif"
    NOTE_CHUNK = "NoteChunk"

class RelationType(str, Enum):
    # Action - Goal - Motive Triads
    PERFORMS = "PERFORMS"
    TARGETS_GOAL = "TARGETS_GOAL"
    MOTIVATED_BY = "MOTIVATED_BY"
    LEVERAGES = "LEVERAGES"
    
    # Multi-Edge Entity Relationships
    USES_FOR = "USES_FOR"
    COLLABORATES_WITH = "COLLABORATES_WITH"
    SUBSTITUTES = "SUBSTITUTES"
    BLOCKED_BY = "BLOCKED_BY"
    
    # Abstraction & Provenance
    ABSTRACTS = "ABSTRACTS"
    GENERALIZES = "GENERALIZES"
    EVIDENCED_BY = "EVIDENCED_BY"
    SUPERSEDED_BY = "SUPERSEDED_BY"

# Cypher statements to ensure constraints and indexes
INIT_SCHEMA_STATEMENTS: List[str] = [
    # Constraints for unique identity
    """
    CREATE CONSTRAINT entity_name_unique IF NOT EXISTS
    FOR (e:Entity) REQUIRE e.name IS UNIQUE
    """,
    """
    CREATE CONSTRAINT note_chunk_id_unique IF NOT EXISTS
    FOR (c:NoteChunk) REQUIRE c.id IS UNIQUE
    """,
    """
    CREATE CONSTRAINT thematic_motif_id_unique IF NOT EXISTS
    FOR (m:ThematicMotif) REQUIRE m.id IS UNIQUE
    """,
    # Full-text search index for BM25 keyword matching
    """
    CREATE FULLTEXT INDEX entity_fulltext_idx IF NOT EXISTS
    FOR (e:Entity) ON EACH [e.name, e.description, e.type]
    """,
    """
    CREATE FULLTEXT INDEX chunk_fulltext_idx IF NOT EXISTS
    FOR (c:NoteChunk) ON EACH [c.text]
    """
]
