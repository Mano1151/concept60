"""
embed_service/main.py — Lightweight FastAPI microservice that exposes
sentence-transformers/all-MiniLM-L6-v2 embeddings over HTTP.

The Express server calls POST /embed at startup query time to convert
a text query into a 384-dimensional vector for Pinecone similarity search.

Start with:
  uvicorn main:app --host 0.0.0.0 --port 8001

Or use the helper script:
  python main.py
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import uvicorn
import os
import math
from pathlib import Path
from pinecone import Pinecone, ServerlessSpec
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

# ── Load model once at startup ─────────────────────────────────────────────
print("[embed-service] Loading sentence-transformers/all-MiniLM-L6-v2 ...")
model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
print("[embed-service] Model ready. Embedding dimension:", model.get_sentence_embedding_dimension())

# ── FastAPI app ────────────────────────────────────────────────────────────
app = FastAPI(
    title="Concept60 Embedding Service",
    description="Embeds text using all-MiniLM-L6-v2 (384-dim) for Pinecone RAG.",
    version="1.0.0",
)


class EmbedRequest(BaseModel):
    text: str


class EmbedResponse(BaseModel):
    vector: list[float]
    dim: int


@app.post("/embed", response_model=EmbedResponse)
async def embed(req: EmbedRequest):
    """Convert text to a 384-dimensional embedding vector."""
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="'text' field is required and must not be empty.")

    text = req.text.strip()[:2000]  # guard against very long input
    vector = model.encode(text, normalize_embeddings=True).tolist()

    return EmbedResponse(vector=vector, dim=len(vector))


@app.get("/health")
def health():
    """Health check endpoint."""
    return {"status": "ok", "model": "all-MiniLM-L6-v2", "dim": 384}


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
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


@app.post("/ingest")
async def ingest_pdf(file: UploadFile = File(...)):
    """Ingest a PDF file, chunk it, embed it, and upsert to Pinecone."""
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    api_key = os.environ.get("PINECONE_API_KEY")
    index_name = os.environ.get("PINECONE_INDEX", "concept60-dsa")

    if not api_key:
        raise HTTPException(status_code=500, detail="PINECONE_API_KEY not configured")

    temp_path = Path(f"/tmp/{file.filename}") if os.name != 'nt' else Path(f"C:/Windows/Temp/{file.filename}")
    
    try:
        # Save temp file
        with open(temp_path, "wb") as f:
            f.write(await file.read())

        # Extract text
        from pypdf import PdfReader
        reader = PdfReader(str(temp_path))
        pages_text = []
        for page in reader.pages:
            t = page.extract_text()
            if t:
                pages_text.append(t.strip())
        text = "\n\n".join(pages_text)

        if not text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from PDF")

        # Chunk text
        chunks = chunk_text(text)

        # Connect to Pinecone
        pc = Pinecone(api_key=api_key)
        existing_indexes = [idx.name for idx in pc.list_indexes()]
        embed_dim = model.get_sentence_embedding_dimension()
        if index_name not in existing_indexes:
            pc.create_index(
                name=index_name,
                dimension=embed_dim,
                metric="cosine",
                spec=ServerlessSpec(cloud="aws", region="us-east-1"),
            )
        index = pc.Index(index_name)

        # Embed and upsert
        batch_size = 100
        total_upserted = 0
        for batch_start in range(0, len(chunks), batch_size):
            batch_chunks = chunks[batch_start : batch_start + batch_size]
            embeddings = model.encode(batch_chunks, show_progress_bar=False, normalize_embeddings=True).tolist()

            vectors = [
                {
                    "id": f"{file.filename}_chunk_{batch_start + i}",
                    "values": emb,
                    "metadata": {
                        "text": chunk,
                        "source": file.filename,
                        "category": "general",
                        "chunk_index": batch_start + i,
                    },
                }
                for i, (chunk, emb) in enumerate(zip(batch_chunks, embeddings))
            ]
            index.upsert(vectors=vectors)
            total_upserted += len(vectors)

        return {
            "message": f"Successfully ingested {file.filename}",
            "chunksIngested": len(chunks),
            "vectorCount": total_upserted,
            "source": file.filename
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if temp_path.exists():
            temp_path.unlink(missing_ok=True)



if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")
