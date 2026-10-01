import logging
from typing import List, Dict, Any, Optional

try:
    from neo4j import GraphDatabase, Driver
except ImportError:
    GraphDatabase = None
    Driver = Any

from app.core.config import settings
from app.core.models import ExtractedGraphData, CitedEntity
from app.graph.schema import INIT_SCHEMA_STATEMENTS

logger = logging.getLogger(__name__)

class Neo4jClient:
    def __init__(self):
        self._driver: Optional[Driver] = None
        self._mock_nodes: Dict[str, Dict[str, Any]] = {}
        self._mock_edges: List[Dict[str, Any]] = []
        self._is_connected: bool = False

    def connect(self) -> bool:
        """Attempt connection to Neo4j database."""
        if not GraphDatabase:
            logger.info("Neo4j driver not installed. Running in memory-buffered fallback mode.")
            self._is_connected = False
            return False
        try:
            self._driver = GraphDatabase.driver(
                settings.NEO4J_URI,
                auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD),
                max_connection_lifetime=3600
            )
            # Verify connectivity
            self._driver.verify_connectivity()
            self._is_connected = True
            logger.info("Successfully connected to Neo4j at %s", settings.NEO4J_URI)
            self.init_schema()
            return True
        except Exception as e:
            logger.warning(
                "Could not connect to Neo4j (%s). Running in memory-buffered fallback mode.",
                str(e)
            )
            self._is_connected = False
            return False

    def close(self):
        if self._driver:
            self._driver.close()

    def init_schema(self):
        """Execute constraints and indexes."""
        if not self._is_connected or not self._driver:
            return
        with self._driver.session() as session:
            for statement in INIT_SCHEMA_STATEMENTS:
                try:
                    session.run(statement.strip())
                except Exception as e:
                    logger.debug("Schema init statement warning: %s", e)

    def is_healthy(self) -> bool:
        if not self._is_connected or not self._driver:
            return False
        try:
            self._driver.verify_connectivity()
            return True
        except Exception:
            return False

    def insert_extracted_data(
        self,
        extracted: ExtractedGraphData,
        note_id: str,
        raw_text: str
    ) -> Dict[str, int]:
        """Insert extracted nodes, actions, goals, and multi-edges into Neo4j."""
        if not self._is_connected or not self._driver:
            # In-memory storage for testing without live Neo4j instance
            nodes_added = 0
            for e in extracted.entities:
                self._mock_nodes[e.name.lower()] = {
                    "id": f"node_{len(self._mock_nodes) + 1}",
                    "name": e.name,
                    "type": e.type,
                    "description": e.description
                }
                nodes_added += 1
            for g in extracted.goals:
                self._mock_nodes[g.objective.lower()] = {
                    "id": f"goal_{len(self._mock_nodes) + 1}",
                    "name": g.objective,
                    "type": "Goal",
                    "motive": g.motive
                }
                nodes_added += 1
            edges_added = 0
            for r in extracted.relations:
                self._mock_edges.append({
                    "source": r.source,
                    "target": r.target,
                    "type": r.relation_type,
                    "details": r.details
                })
                edges_added += 1
            return {"nodes_created": nodes_added, "edges_created": edges_added}

        with self._driver.session() as session:
            # 1. Create NoteChunk provenance
            session.run(
                """
                MERGE (c:NoteChunk {id: $note_id})
                SET c.text = $raw_text, c.created_at = datetime()
                """,
                note_id=note_id, raw_text=raw_text
            )

            # 2. Merge Entities
            for e in extracted.entities:
                session.run(
                    """
                    MERGE (n:Entity {name: $name})
                    ON CREATE SET n.type = $type, n.description = $description, n.created_at = datetime()
                    ON MATCH SET n.description = coalesce($description, n.description)
                    WITH n
                    MATCH (c:NoteChunk {id: $note_id})
                    MERGE (n)-[:EVIDENCED_BY]->(c)
                    """,
                    name=e.name, type=e.type, description=e.description, note_id=note_id
                )

            # 3. Create Actions & Goals
            for a in extracted.actions:
                session.run(
                    """
                    CREATE (act:Action {
                        id: randomUUID(),
                        verb: $verb,
                        description: $description,
                        status: $status,
                        created_at: datetime()
                    })
                    WITH act
                    MATCH (c:NoteChunk {id: $note_id})
                    MERGE (act)-[:EVIDENCED_BY]->(c)
                    """,
                    verb=a.verb, description=a.description, status=a.status, note_id=note_id
                )

            for g in extracted.goals:
                session.run(
                    """
                    MERGE (goal:Goal {objective: $objective})
                    ON CREATE SET goal.motive = $motive, goal.created_at = datetime()
                    WITH goal
                    MATCH (c:NoteChunk {id: $note_id})
                    MERGE (goal)-[:EVIDENCED_BY]->(c)
                    """,
                    objective=g.objective, motive=g.motive, note_id=note_id
                )

            # 4. Create Multi-Edges
            for r in extracted.relations:
                query = f"""
                MATCH (s) WHERE toLower(s.name) = toLower($source) OR toLower(s.objective) = toLower($source)
                MATCH (t) WHERE toLower(t.name) = toLower($target) OR toLower(t.objective) = toLower($target)
                MERGE (s)-[rel:{r.relation_type}]->(t)
                SET rel.details = $details, rel.updated_at = datetime()
                """
                session.run(query, source=r.source, target=r.target, details=r.details)

            # 5. Connect Thematic Motifs
            for motif in extracted.thematic_motifs:
                session.run(
                    """
                    MERGE (m:ThematicMotif {pattern_name: $pattern_name})
                    WITH m
                    MATCH (c:NoteChunk {id: $note_id})
                    MERGE (m)-[:ABSTRACTS]->(c)
                    """,
                    pattern_name=motif, note_id=note_id
                )

            return {
                "nodes_created": len(extracted.entities) + len(extracted.actions) + len(extracted.goals),
                "edges_created": len(extracted.relations)
            }

    def traverse_subgraph(self, entity_names: List[str], max_hops: int = 2) -> List[Dict[str, Any]]:
        """Traverse 1-2 hops around anchor entities."""
        if not self._is_connected or not self._driver:
            results = []
            for name in entity_names:
                normalized = name.lower()
                if normalized in self._mock_nodes:
                    node = self._mock_nodes[normalized]
                    results.append({
                        "source": node["name"],
                        "source_type": node["type"],
                        "relation": "RELATED_TO",
                        "target": node.get("motive", "Connected knowledge node"),
                        "target_type": "Detail",
                        "hop": 1
                    })
            for edge in self._mock_edges:
                if any(e.lower() in [edge["source"].lower(), edge["target"].lower()] for e in entity_names):
                    results.append({
                        "source": edge["source"],
                        "source_type": "Entity",
                        "relation": edge["type"],
                        "target": edge["target"],
                        "target_type": "Entity",
                        "details": edge.get("details", "")
                    })
            return results

        with self._driver.session() as session:
            cypher = f"""
            MATCH (e) WHERE toLower(e.name) IN [name IN $names | toLower(name)]
            OPTIONAL MATCH path = (e)-[r*1..{max_hops}]-(neighbor)
            UNWIND relationships(path) AS rel
            RETURN startNode(rel).name AS source,
                   labels(startNode(rel))[0] AS source_type,
                   type(rel) AS relation,
                   endNode(rel).name AS target,
                   labels(endNode(rel))[0] AS target_type,
                   rel.details AS details,
                   length(path) AS hop
            LIMIT 50
            """
            result = session.run(cypher, names=entity_names)
            triples = []
            for record in result:
                triples.append({
                    "source": record["source"] or "Unknown",
                    "source_type": record["source_type"] or "Entity",
                    "relation": record["relation"] or "RELATED_TO",
                    "target": record["target"] or "Unknown",
                    "target_type": record["target_type"] or "Entity",
                    "details": record.get("details") or "",
                    "hop": record.get("hop", 1)
                })
            return triples

    def get_entity_connections(self, entity_name: str) -> Dict[str, Any]:
        """Fetch all connected relationships for a given entity."""
        triples = self.traverse_subgraph([entity_name], max_hops=2)
        return {
            "entity": entity_name,
            "connections_count": len(triples),
            "connections": triples
        }

neo4j_client = Neo4jClient()
