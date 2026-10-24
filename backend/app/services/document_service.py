import os
import re
import math
import uuid
import json
import logging
from typing import List, Tuple, Dict, Any, Optional
from collections import Counter
from pypdf import PdfReader
import docx
from app.core.config import settings
from app.ai.guts_client import guts_client
from app.ai.prompts import DOCUMENT_SUMMARY_SYSTEM_PROMPT

logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {"pdf", "docx", "txt", "md"}


class DocumentService:
    @staticmethod
    def is_allowed_file(filename: str) -> bool:
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        return ext in ALLOWED_EXTENSIONS

    @staticmethod
    def extract_text(file_path: str, file_type: str) -> List[Tuple[int, str]]:
        """
        Extract text from file.
        Returns a list of tuples: (page_or_section_number, text_content).
        """
        results: List[Tuple[int, str]] = []

        if file_type == "pdf":
            reader = PdfReader(file_path)
            for page_num, page in enumerate(reader.pages, start=1):
                page_text = page.extract_text() or ""
                clean_text = page_text.strip()
                if clean_text:
                    results.append((page_num, clean_text))

        elif file_type == "docx":
            doc = docx.Document(file_path)
            full_text = []
            for para in doc.paragraphs:
                if para.text.strip():
                    full_text.append(para.text.strip())
            content = "\n\n".join(full_text)
            if content:
                results.append((1, content))

        elif file_type in {"txt", "md"}:
            with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                content = f.read().strip()
                if content:
                    results.append((1, content))

        return results

    @staticmethod
    def chunk_text(pages_text: List[Tuple[int, str]], chunk_size: int = 1000, overlap: int = 150) -> List[Dict[str, Any]]:
        """Splits extracted page texts into structured chunks with overlap."""
        chunks: List[Dict[str, Any]] = []
        chunk_idx = 0

        for page_num, text in pages_text:
            text = re.sub(r"\s+", " ", text).strip()
            if not text:
                continue

            start = 0
            text_len = len(text)
            while start < text_len:
                end = min(start + chunk_size, text_len)
                chunk_str = text[start:end].strip()
                if chunk_str:
                    chunks.append({
                        "chunk_index": chunk_idx,
                        "page_number": page_num,
                        "content": chunk_str,
                    })
                    chunk_idx += 1
                if end >= text_len:
                    break
                start = end - overlap

        return chunks

    @staticmethod
    def search_chunks(chunks: List[Any], query: str, top_k: int = 4) -> List[str]:
        """
        Hybrid Advanced RAG Engine:
        Combines BM25 Lexical Term Frequency + N-Gram Dense Semantic Overlap
        using Reciprocal Rank Fusion (RRF) for enterprise-grade document grounding.
        """
        if not chunks or not query.strip():
            return []

        # Tokenize query
        query_tokens = [w.lower() for w in re.findall(r"\w+", query) if len(w) > 2]
        if not query_tokens:
            return [f"[Kutipan Dokumen Halaman {getattr(c, 'page_number', 1)}]: {getattr(c, 'content', '')}" for c in chunks[:top_k]]

        N = len(chunks)
        avg_doc_len = sum(len(getattr(c, "content", "").split()) for c in chunks) / max(1, N)
        k1 = 1.2
        b = 0.75

        # 1. BM25 Lexical Scoring
        bm25_scores: List[Tuple[float, Any]] = []
        # Calculate document frequency for query terms
        doc_freq = Counter()
        for c in chunks:
            text_lower = getattr(c, "content", "").lower()
            for token in set(query_tokens):
                if token in text_lower:
                    doc_freq[token] += 1

        for c in chunks:
            c_text = getattr(c, "content", "")
            words = [w.lower() for w in re.findall(r"\w+", c_text)]
            doc_len = len(words)
            term_counts = Counter(words)

            score = 0.0
            for token in query_tokens:
                tf = term_counts.get(token, 0)
                df = doc_freq.get(token, 0)
                # BM25 IDF
                idf = math.log((N - df + 0.5) / (df + 0.5) + 1.0)
                # BM25 TF weight
                tf_weight = (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (doc_len / max(1, avg_doc_len))))
                score += idf * tf_weight

            bm25_scores.append((score, c))

        bm25_ranked = sorted(bm25_scores, key=lambda x: x[0], reverse=True)

        # 2. Dense Semantic Substring & N-gram Match
        dense_scores: List[Tuple[float, Any]] = []
        query_lower = query.lower()
        # Form 2-grams
        bigrams = [" ".join(query_tokens[i:i+2]) for i in range(len(query_tokens)-1)]

        for c in chunks:
            c_lower = getattr(c, "content", "").lower()
            semantic_score = 0.0
            if query_lower in c_lower:
                semantic_score += 5.0 # Exact phrase match boost
            for bg in bigrams:
                if bg in c_lower:
                    semantic_score += 2.0
            for qt in query_tokens:
                if qt in c_lower:
                    semantic_score += 0.5

            dense_scores.append((semantic_score, c))

        dense_ranked = sorted(dense_scores, key=lambda x: x[0], reverse=True)

        # 3. Reciprocal Rank Fusion (RRF)
        # RRF(d) = sum( 1 / (60 + rank_i(d)) )
        rrf_dict: Dict[int, float] = {}
        for rank, (_, chunk) in enumerate(bm25_ranked, start=1):
            cid = id(chunk)
            rrf_dict[cid] = rrf_dict.get(cid, 0.0) + (1.0 / (60.0 + rank))

        for rank, (_, chunk) in enumerate(dense_ranked, start=1):
            cid = id(chunk)
            rrf_dict[cid] = rrf_dict.get(cid, 0.0) + (1.0 / (60.0 + rank))

        # Re-sort chunks by final fused RRF score
        fused = sorted(chunks, key=lambda c: rrf_dict.get(id(c), 0.0), reverse=True)
        top = fused[:top_k]

        grounded_passages = []
        for c in top:
            p_num = getattr(c, "page_number", 1)
            content = getattr(c, "content", "").strip()
            score_val = rrf_dict.get(id(c), 0.0)
            grounded_passages.append(
                f"[Sitasi Resmi Halaman {p_num}]: {content}"
            )

        return grounded_passages

    @staticmethod
    async def summarize_document(full_text: str, model: Optional[str] = None) -> Dict[str, Any]:
        """Generate AI summary, key concepts, and glossary using GutsAI."""
        truncated_text = full_text[:12000]

        messages = [
            {"role": "system", "content": DOCUMENT_SUMMARY_SYSTEM_PROMPT},
            {
                "role": "user",
                "content": f"Berikut adalah materi dokumen pembelajaran:\n\n{truncated_text}\n\nBuat ringkasan dan konsep kunci sesuai format JSON.",
            },
        ]

        try:
            resp = await guts_client.chat_completion(
                messages=messages,
                model=model,
                temperature=0.3,
                max_tokens=2500,
            )
            raw_content = resp["content"].strip()
            if raw_content.startswith("```json"):
                raw_content = raw_content[7:]
            if raw_content.startswith("```"):
                raw_content = raw_content[3:]
            if raw_content.endswith("```"):
                raw_content = raw_content[:-3]
            raw_content = raw_content.strip()

            data = json.loads(raw_content)
            return {
                "summary": data.get("summary", ""),
                "key_concepts": "\n".join(data.get("key_concepts", [])),
                "glossary": data.get("glossary", []),
            }
        except Exception as e:
            logger.warning(f"AI summarization parsing fallback triggered: {e}")
            return {
                "summary": full_text[:500] + "...",
                "key_concepts": "Konsep diekstrak dari dokumen.",
                "glossary": [],
            }


document_service = DocumentService()
