import pytest
from app.rag.parsers import parse_obsidian_markdown, parse_code_architecture_text, universal_document_parser
from app.core.models import DocumentType
from app.api.ingest import ingest_any_document

def test_obsidian_markdown_parser():
    raw_markdown = """---
tags: [database, architecture]
aliases: [Neo4j Setup]
author: Kaiwal
---

# Neo4j Migration
We decided to connect [[Neo4j Database]] with [[Qdrant Vector Index|Qdrant]] in order to achieve sub-100ms multi-hop traversal.
See also #performance/latency and #database.
"""
    parsed = parse_obsidian_markdown(raw_markdown)
    assert parsed["frontmatter"]["tags"] == ["database", "architecture"]
    assert parsed["frontmatter"]["author"] == "Kaiwal"
    assert "Neo4j Database" in parsed["wikilinks"]
    assert "Qdrant Vector Index" in parsed["wikilinks"]
    assert "performance/latency" in parsed["tags"] or "database" in parsed["tags"]
    # Check that wikilink aliases were cleaned
    assert "Qdrant" in parsed["clean_text"]
    assert "[[" not in parsed["clean_text"]

def test_universal_parser_creates_explicit_relations():
    raw_markdown = "Linking [[Neo4j]] to [[FastAPI Backend]]."
    text, relations, wikilinks = universal_document_parser(
        raw_markdown,
        source_type=DocumentType.OBSIDIAN,
        title="Architecture Doc"
    )
    assert "Neo4j" in wikilinks
    assert "FastAPI Backend" in wikilinks
    assert len(relations) == 2
    assert relations[0].relation_type == "REFERENCES"
    assert relations[0].source == "Architecture Doc"
    assert relations[0].target == "Neo4j"

def test_code_architecture_parser():
    code_text = "Refactored backend/app/rag/hybrid_retriever.py and src/components/graph.tsx to fix #142."
    parsed = parse_code_architecture_text(code_text)
    assert "backend/app/rag/hybrid_retriever.py" in parsed["files_referenced"]
    assert "src/components/graph.tsx" in parsed["files_referenced"]
    assert "142" in parsed["issues_referenced"]

def test_ingest_any_document_obsidian():
    raw_doc = """---
tags: [evals, regression]
---
Implemented offline eval suite to prevent hallucination regressions.
Referenced [[Golden QA Benchmark]] for validation.
"""
    res = ingest_any_document(
        content=raw_doc,
        title="Evals Guide",
        source_type=DocumentType.OBSIDIAN,
        author="Kaiwal"
    )
    assert res["status"] == "SUCCESS"
    assert res["nodes_created"] > 0
    assert "Golden QA Benchmark" in res["wikilinks_detected"]
