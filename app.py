"""FastAPI application for the medical RAG chatbot."""

import asyncio
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from src.helper import download_hugging_face_embeddings
from src.prompt import system_prompt

load_dotenv()


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)


class ChatResponse(BaseModel):
    answer: str


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load the embedding model and RAG chain once when the API starts."""
    pinecone_key = os.getenv("PINECONE_API_KEY")
    groq_key = os.getenv("GROQ_API_KEY")
    if not pinecone_key or not groq_key:
        raise RuntimeError("PINECONE_API_KEY and GROQ_API_KEY must be set in .env")

    ssl_cert_file = os.getenv("SSL_CERT_FILE")
    if ssl_cert_file and not Path(ssl_cert_file).is_file():
        os.environ.pop("SSL_CERT_FILE", None)

    os.environ["PINECONE_API_KEY"] = pinecone_key
    os.environ["GROQ_API_KEY"] = groq_key

    from langchain.chains import create_retrieval_chain
    from langchain.chains.combine_documents import create_stuff_documents_chain
    from langchain_core.prompts import ChatPromptTemplate
    from langchain_groq import ChatGroq
    from langchain_pinecone import PineconeVectorStore

    embeddings = download_hugging_face_embeddings()
    docsearch = PineconeVectorStore.from_existing_index(
        index_name=os.getenv("PINECONE_INDEX_NAME", "medical-chatbot"),
        embedding=embeddings,
    )
    retriever = docsearch.as_retriever(
        search_type="similarity", search_kwargs={"k": 3}
    )
    chat_model = ChatGroq(model=os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b"))
    prompt = ChatPromptTemplate.from_messages(
        [("system", system_prompt), ("human", "{input}")]
    )
    answer_chain = create_stuff_documents_chain(chat_model, prompt)
    app.state.rag_chain = create_retrieval_chain(retriever, answer_chain)
    yield
    app.state.rag_chain = None


app = FastAPI(title="Medical Chatbot API", version="1.0.0", lifespan=lifespan)
allowed_origins = [
    origin.strip()
    for origin in os.getenv("FRONTEND_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)


@app.get("/")
async def root() -> dict[str, str]:
    return {
        "message": "Medical Chatbot API is running",
        "docs": "/docs",
        "frontend": "http://localhost:3000",
    }


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest) -> ChatResponse:
    message = payload.message.strip()
    if not message:
        raise HTTPException(status_code=422, detail="Message cannot be blank")

    try:
        result: Any = await asyncio.to_thread(
            app.state.rag_chain.invoke, {"input": message}
        )
        return ChatResponse(answer=str(result["answer"]))
    except Exception as exc:
        # Keep provider details out of the public API response.
        raise HTTPException(
            status_code=502, detail="Unable to generate an answer right now"
        ) from exc


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8080)
