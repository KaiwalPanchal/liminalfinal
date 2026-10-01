#!/usr/bin/env python3
"""
Offline Grounded GraphRAG Evaluation Runner.
Evaluates Context Recall and Refusal Precision against golden_qa.jsonl benchmark.
Exits with code 1 if thresholds are not met when --fail-on-regression is enabled.
"""

import sys
import os
import json
import argparse
from pathlib import Path

# Add backend directory to sys.path so app imports work
backend_dir = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(backend_dir))

from app.rag.hybrid_retriever import hybrid_retrieve
from app.rag.generator import generate_grounded_response

# Ensure UTF-8 output encoding on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

TARGET_CONTEXT_RECALL = 0.85
TARGET_REFUSAL_PRECISION = 0.95

def run_evaluations(golden_path: Path, fail_on_regression: bool = False) -> int:
    if not golden_path.exists():
        print(f"Error: Golden QA dataset not found at {golden_path}")
        return 1

    total_cases = 0
    grounded_cases = 0
    grounded_hits = 0
    refusal_cases = 0
    refusal_successes = 0

    print("=" * 65)
    print(">> RUNNING LIMINAL GROUNDED GRAPHRAG EVALUATION SUITE")
    print(f">> Dataset: {golden_path.name}")
    print("=" * 65)

    with open(golden_path, "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            case = json.loads(line.strip())
            total_cases += 1
            query = case["query"]
            expected_nodes = [n.lower() for n in case.get("expected_nodes", [])]
            expected_status = case.get("expected_status", "GROUNDED")
            case_id = case.get("id", f"case_{total_cases}")

            # Run Retrieval & Grounded Generation
            context, cited_nodes, ret_latency = hybrid_retrieve(query, max_hops=2, top_k=5)
            response = generate_grounded_response(query, context, cited_nodes, ret_latency)

            retrieved_node_names = [n.entity_name.lower() for n in response.cited_nodes]
            # Also check text of retrieved passages for node presence
            context_text = " ".join([p.get("text", "").lower() for p in context])

            if expected_status == "GROUNDED":
                grounded_cases += 1
                # Check how many expected nodes were recovered
                if expected_nodes:
                    matched = sum(
                        1 for en in expected_nodes
                        if en in retrieved_node_names or en in context_text
                    )
                    recall = matched / len(expected_nodes)
                    if recall >= 0.75 and response.status == "GROUNDED":
                        grounded_hits += 1
                        print(f"  [PASS] [{case_id}] GROUNDED ({recall*100:.0f}% recall): {query[:45]}...")
                    else:
                        print(f"  [FAIL] [{case_id}] RECALL MISS: {query[:45]}...")
                else:
                    if response.status == "GROUNDED":
                        grounded_hits += 1
            elif expected_status == "REFUSED_INSUFFICIENT_CONTEXT":
                refusal_cases += 1
                if response.status == "REFUSED_INSUFFICIENT_CONTEXT":
                    refusal_successes += 1
                    print(f"  [PASS] [{case_id}] REFUSED: {query[:45]}...")
                else:
                    print(f"  [FAIL] [{case_id}] HALLUCINATION/UNREFUSED: {query[:45]}...")

    context_recall = (grounded_hits / grounded_cases) if grounded_cases > 0 else 1.0
    refusal_precision = (refusal_successes / refusal_cases) if refusal_cases > 0 else 1.0

    print("\n" + "=" * 65)
    print(">> EVALUATION BENCHMARK SCOREBOARD")
    print("=" * 65)
    print(f"Total Test Cases Evaluated : {total_cases}")
    print(f"Grounded Queries           : {grounded_cases} (Hits: {grounded_hits})")
    print(f"Refusal Queries            : {refusal_cases} (Hits: {refusal_successes})")
    print("-" * 65)
    print(f"Context Recall             : {context_recall * 100:.1f}% (Threshold: {TARGET_CONTEXT_RECALL * 100:.1f}%)")
    print(f"Refusal Precision          : {refusal_precision * 100:.1f}% (Threshold: {TARGET_REFUSAL_PRECISION * 100:.1f}%)")
    print("=" * 65)

    passed_recall = context_recall >= TARGET_CONTEXT_RECALL
    passed_refusal = refusal_precision >= TARGET_REFUSAL_PRECISION

    if passed_recall and passed_refusal:
        print("[SUCCESS] ALL QUALITY GATES PASSED! Ready for production deployment.")
        return 0
    else:
        print("[FAILED] QUALITY GATE REGRESSION DETECTED!")
        if not passed_recall:
            print(f"   Context Recall failed: {context_recall:.2f} < {TARGET_CONTEXT_RECALL}")
        if not passed_refusal:
            print(f"   Refusal Precision failed: {refusal_precision:.2f} < {TARGET_REFUSAL_PRECISION}")
        if fail_on_regression:
            return 1
        return 0

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run GraphRAG offline evals")
    parser.add_argument(
        "--golden-file",
        type=str,
        default=str(Path(__file__).parent / "golden_qa.jsonl"),
        help="Path to golden QA dataset"
    )
    parser.add_argument(
        "--fail-on-regression",
        action="store_true",
        help="Exit with code 1 if metrics fall below target thresholds"
    )
    args = parser.parse_args()
    exit_code = run_evaluations(Path(args.golden_file), fail_on_regression=args.fail_on_regression)
    sys.exit(exit_code)
