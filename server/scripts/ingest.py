"""
ingest.py — One-time RAG ingestion script for Concept in 60 Seconds.

Usage:
  1. Set PINECONE_API_KEY in your environment (or server/.env)
  2. Run: python server/scripts/ingest.py

What it does:
  - Reads Dsa.pdf from the project root
  - Splits text into overlapping chunks
  - Embeds each chunk with sentence-transformers/all-MiniLM-L6-v2 (384-dim)
  - Upserts all vectors + metadata into Pinecone index 'concept60-dsa'
"""

import os
import sys
import math
from pathlib import Path
from dotenv import dotenv_values

# ── Load .env from server/.env ──────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).parent
SERVER_DIR  = SCRIPT_DIR.parent
PROJECT_DIR = SERVER_DIR.parent
ENV_PATH    = SERVER_DIR / ".env"

env_vals = dotenv_values(ENV_PATH)
for k, v in env_vals.items():
    os.environ.setdefault(k, v)

# ── Config ───────────────────────────────────────────────────────────────────
PDF_PATH        = PROJECT_DIR / "Dsa.pdf"
PINECONE_API_KEY = os.environ.get("PINECONE_API_KEY", "")
INDEX_NAME      = os.environ.get("PINECONE_INDEX", "concept60-dsa")
CHUNK_SIZE      = 500    # words per chunk
CHUNK_OVERLAP   = 50     # words overlap between chunks
BATCH_SIZE      = 100    # upsert batch size
EMBED_DIM       = 384    # all-MiniLM-L6-v2 output dimension


def extract_text_from_pdf(pdf_path: Path) -> str:
    """Extract all text from all pages of the PDF."""
    from pypdf import PdfReader
    reader = PdfReader(str(pdf_path))
    pages_text = []
    for i, page in enumerate(reader.pages):
        text = page.extract_text()
        if text:
            pages_text.append(text.strip())
    return "\n\n".join(pages_text)


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """Split text into overlapping word-based chunks."""
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = min(start + chunk_size, len(words))
        chunk = " ".join(words[start:end])
        if chunk.strip():
            chunks.append(chunk.strip())
        if end >= len(words):
            break
        start += chunk_size - overlap
    return chunks


def main():
    # ── Validate prereqs ───────────────────────────────────────────────────
    if not PINECONE_API_KEY:
        print("❌ ERROR: PINECONE_API_KEY not set in server/.env or environment.")
        print("   Add this line to server/.env:")
        print("   PINECONE_API_KEY=your_pinecone_api_key")
        sys.exit(1)

    if not PDF_PATH.exists():
        print(f"❌ ERROR: PDF not found at {PDF_PATH}")
        sys.exit(1)

    # ── Extract text ───────────────────────────────────────────────────────
    print(f"📄 Reading PDF: {PDF_PATH}")
    text = extract_text_from_pdf(PDF_PATH)
    print(f"   Extracted {len(text):,} characters from {PDF_PATH.name}")

    # ── Chunk ──────────────────────────────────────────────────────────────
    chunks = chunk_text(text)
    print(f"   Created {len(chunks)} chunks (size={CHUNK_SIZE} words, overlap={CHUNK_OVERLAP} words)")

    # ── Load embedding model ───────────────────────────────────────────────
    print("\n🔢 Loading embedding model (sentence-transformers/all-MiniLM-L6-v2)...")
    from sentence_transformers import SentenceTransformer
    model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    print("   Model loaded.")

    # ── Connect to Pinecone ────────────────────────────────────────────────
    print(f"\n☁️  Connecting to Pinecone (index: {INDEX_NAME})...")
    from pinecone import Pinecone, ServerlessSpec
    pc = Pinecone(api_key=PINECONE_API_KEY)

    existing_indexes = [idx.name for idx in pc.list_indexes()]
    if INDEX_NAME not in existing_indexes:
        print(f"   Index '{INDEX_NAME}' not found — creating it...")
        pc.create_index(
            name=INDEX_NAME,
            dimension=EMBED_DIM,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1"),
        )
        print(f"   ✅ Index '{INDEX_NAME}' created (dim={EMBED_DIM}, metric=cosine).")
    else:
        print(f"   Index '{INDEX_NAME}' already exists. Upserting vectors...")

    index = pc.Index(INDEX_NAME)

    # ── Embed & upsert in batches ──────────────────────────────────────────
    print(f"\n⚡ Embedding and upserting {len(chunks)} chunks in batches of {BATCH_SIZE}...")
    try:
        from tqdm import tqdm
        use_tqdm = True
    except ImportError:
        use_tqdm = False

    batch_range = range(0, len(chunks), BATCH_SIZE)
    iterator = tqdm(batch_range, desc="Ingesting", unit="batch") if use_tqdm else batch_range

    total_upserted = 0
    for batch_start in iterator:
        batch_chunks = chunks[batch_start : batch_start + BATCH_SIZE]
        embeddings = model.encode(batch_chunks, show_progress_bar=False).tolist()

        vectors = [
            {
                "id": f"dsa_chunk_{batch_start + i}",
                "values": emb,
                "metadata": {
                    "text": chunk,
                    "source": "Dsa.pdf",
                    "category": "dsa",
                    "chunk_index": batch_start + i,
                },
            }
            for i, (chunk, emb) in enumerate(zip(batch_chunks, embeddings))
        ]

        index.upsert(vectors=vectors)
        total_upserted += len(vectors)

        if not use_tqdm:
            done = min(batch_start + BATCH_SIZE, len(chunks))
            print(f"   Upserted {done}/{len(chunks)} chunks...")

    # ── Final stats ────────────────────────────────────────────────────────
    stats = index.describe_index_stats()
    print(f"\n✅ Ingestion complete!")
    print(f"   Total chunks upserted : {total_upserted}")
    print(f"   Pinecone vector count  : {stats.total_vector_count}")
    print(f"   Index                  : {INDEX_NAME}")
    print(f"\n🚀 Your RAG pipeline is ready. Start the embedding service and server next.")


if __name__ == "__main__":
    main()
