"""
Multi-Source Document Parsers for Liminal.
Supports Obsidian Markdown (YAML frontmatter + [[wikilinks]]),
Code Architecture / Git Commit logs, Postmortems, and Rich Yoopta JSON.
"""

import re
import json
from typing import Dict, Any, List, Tuple
from app.core.models import DocumentType, ExtractedRelation

def parse_obsidian_markdown(raw_markdown: str) -> Dict[str, Any]:
    """
    Parses Obsidian Markdown content:
    1. Extracts YAML frontmatter blocks (--- metadata ---)
    2. Extracts [[Wikilinks]] and [[Target|Alias]]
    3. Extracts #hashtags
    4. Produces normalized text representation
    """
    frontmatter: Dict[str, Any] = {}
    content = raw_markdown

    # 1. Extract YAML Frontmatter
    frontmatter_match = re.match(r'^---\s*\n(.*?)\n---\s*\n', raw_markdown, re.DOTALL)
    if frontmatter_match:
        yaml_text = frontmatter_match.group(1)
        content = raw_markdown[frontmatter_match.end():]
        # Lightweight key-value parser for YAML
        for line in yaml_text.splitlines():
            if ":" in line:
                key, val = line.split(":", 1)
                key = key.strip()
                val = val.strip()
                # Parse list format [a, b, c]
                if val.startswith("[") and val.endswith("]"):
                    items = [x.strip().strip("'\"") for x in val[1:-1].split(",") if x.strip()]
                    frontmatter[key] = items
                else:
                    frontmatter[key] = val.strip("'\"")

    # 2. Extract [[Wikilinks]]
    # Matches [[Target Page]] or [[Target Page|Display Text]]
    wikilink_matches = re.findall(r'\[\[(.*?)\]\]', content)
    wikilinks = []
    clean_content = content

    for link in wikilink_matches:
        if "|" in link:
            target, alias = link.split("|", 1)
            target = target.strip()
            alias = alias.strip()
            wikilinks.append(target)
            clean_content = clean_content.replace(f"[[{link}]]", alias)
        else:
            target = link.strip()
            wikilinks.append(target)
            clean_content = clean_content.replace(f"[[{link}]]", target)

    # 3. Extract #hashtags (excluding heading markdown #)
    hashtags = re.findall(r'(?<!\S)#([a-zA-Z0-9_\-\/]+)\b', clean_content)

    return {
        "frontmatter": frontmatter,
        "wikilinks": list(dict.fromkeys(wikilinks)),
        "tags": list(dict.fromkeys(hashtags)),
        "clean_text": clean_content.strip()
    }

def parse_code_architecture_text(raw_text: str) -> Dict[str, Any]:
    """Extract file paths, modules, and architectural tags from code/PR logs."""
    file_paths = re.findall(r'\b(?:src|backend|app|lib|components|tests)/[a-zA-Z0-9_\-\./]+\b', raw_text)
    issue_refs = re.findall(r'#(\d+)', raw_text)
    return {
        "files_referenced": list(dict.fromkeys(file_paths)),
        "issues_referenced": list(dict.fromkeys(issue_refs)),
        "clean_text": raw_text.strip()
    }

def universal_document_parser(
    content: Any,
    source_type: DocumentType,
    title: str = "Untitled"
) -> Tuple[str, List[ExtractedRelation], List[str]]:
    """
    Parses any incoming document into:
    - clean plain text for embeddings & NER
    - explicit pre-extracted relations (e.g. from [[wikilinks]])
    - detected wikilinks / entity tags
    """
    explicit_relations: List[ExtractedRelation] = []
    wikilinks_detected: List[str] = []

    # Handle Yoopta / JSON objects
    if isinstance(content, (dict, list)) and source_type == DocumentType.NOTE:
        from app.api.ingest import parse_yoopta_or_text
        text = parse_yoopta_or_text(content)
        return text, [], []

    raw_str = str(content)

    if source_type == DocumentType.OBSIDIAN or "[[" in raw_str:
        parsed = parse_obsidian_markdown(raw_str)
        clean_text = parsed["clean_text"]
        wikilinks_detected = parsed["wikilinks"]

        # Convert Obsidian [[wikilinks]] into explicit high-confidence graph edges
        for link in wikilinks_detected:
            explicit_relations.append(ExtractedRelation(
                source=title,
                target=link,
                relation_type="REFERENCES",
                details=f"Explicit Obsidian Wikilink from '{title}'"
            ))
        return clean_text, explicit_relations, wikilinks_detected

    if source_type == DocumentType.CODE_ARCHITECTURE:
        parsed = parse_code_architecture_text(raw_str)
        for f in parsed["files_referenced"]:
            explicit_relations.append(ExtractedRelation(
                source=title,
                target=f,
                relation_type="MODIFIES_FILE",
                details="Code Architecture Reference"
            ))
        return parsed["clean_text"], explicit_relations, parsed["files_referenced"]

    # Default fallback
    return raw_str.strip(), explicit_relations, []
