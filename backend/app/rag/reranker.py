import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class Reranker:
    def __init__(self):
        self._model = None
        self._initialized = False

    def _lazy_init(self):
        if not self._initialized:
            try:
                from sentence_transformers import CrossEncoder
                from app.core.config import settings
                self._model = CrossEncoder(settings.RERANKER_MODEL, max_length=512)
                self._initialized = True
            except Exception as e:
                logger.warning("Could not load neural CrossEncoder (%s). Using lexical-overlap reranker.", e)
                self._initialized = True

    def rerank(self, query: str, candidate_passages: List[Dict[str, Any]], top_k: int = 5) -> List[Dict[str, Any]]:
        """Rerank candidate passages against the query."""
        if not candidate_passages:
            return []
        
        self._lazy_init()
        
        if self._model:
            try:
                pairs = [[query, p.get("text", "")] for p in candidate_passages]
                scores = self._model.predict(pairs)
                for i, score in enumerate(scores):
                    candidate_passages[i]["rerank_score"] = float(score)
                candidate_passages.sort(key=lambda x: x["rerank_score"], reverse=True)
                return candidate_passages[:top_k]
            except Exception as e:
                logger.warning("Neural reranking failed (%s). Falling back to heuristic reranking.", e)

        # High-precision Lexical + Semantic overlap heuristic
        q_tokens = set(query.lower().split())
        for p in candidate_passages:
            p_text = p.get("text", "").lower()
            overlap = sum(1 for token in q_tokens if token in p_text)
            p["rerank_score"] = float(overlap / (len(q_tokens) + 1e-5))

        candidate_passages.sort(key=lambda x: x["rerank_score"], reverse=True)
        return candidate_passages[:top_k]

reranker = Reranker()
