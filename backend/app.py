"""FastAPI application for the medical RAG chatbot."""

import asyncio
import os
import uuid
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Path as PathParam
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from src.helper import download_hugging_face_embeddings
from src.prompt import contextualize_prompt, system_prompt

load_dotenv()

# Restricting IDs to this pattern also prevents path traversal in history file names.
CONVERSATION_ID_PATTERN = r"^[A-Za-z0-9_-]{1,64}$"
HISTORY_DIR = Path(os.getenv("CHAT_HISTORY_DIR", "chat_history"))
# Only the most recent messages are sent to the model, to keep prompts small.
MAX_HISTORY_MESSAGES = int(os.getenv("MAX_HISTORY_MESSAGES", "10"))


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    conversation_id: str | None = Field(default=None, pattern=CONVERSATION_ID_PATTERN)


class ChatResponse(BaseModel):
    answer: str
    conversation_id: str


def get_memory(conversation_id: str):
    """File-backed LangChain memory: one JSON file per conversation."""
    from langchain.memory import ConversationBufferMemory
    from langchain_community.chat_message_histories import FileChatMessageHistory

    HISTORY_DIR.mkdir(parents=True, exist_ok=True)
    return ConversationBufferMemory(
        chat_memory=FileChatMessageHistory(str(HISTORY_DIR / f"{conversation_id}.json")),
        memory_key="chat_history",
        return_messages=True,
    )


def answer_with_memory(conversation_id: str, message: str) -> str:
    memory = get_memory(conversation_id)
    history = memory.load_memory_variables({})["chat_history"][-MAX_HISTORY_MESSAGES:]
    result: Any = app.state.rag_chain.invoke({"input": message, "chat_history": history})
    answer = str(result["answer"])
    memory.save_context({"input": message}, {"output": answer})
    return answer


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

    from langchain.chains import create_history_aware_retriever, create_retrieval_chain
    from langchain.chains.combine_documents import create_stuff_documents_chain
    from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
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
    # Follow-up questions are rewritten using the history before retrieval.
    # With an empty history this step is skipped (no extra LLM call).
    rephrase_prompt = ChatPromptTemplate.from_messages(
        [
            ("system", contextualize_prompt),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{input}"),
        ]
    )
    history_aware_retriever = create_history_aware_retriever(
        chat_model, retriever, rephrase_prompt
    )
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system_prompt),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{input}"),
        ]
    )
    answer_chain = create_stuff_documents_chain(chat_model, prompt)
    app.state.rag_chain = create_retrieval_chain(history_aware_retriever, answer_chain)
    yield
    app.state.rag_chain = None


app = FastAPI(title="Medical Chatbot API", version="1.0.0", lifespan=lifespan)
allowed_origins = [
    origin.strip()
    for origin in os.getenv("FRONTEND_ORIGINS", "https://medichatbot.krishokai.xyz").split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)


@app.get("/")
async def root() -> dict[str, str]:
    return {
        "message": "Medical Chatbot API is running",
        "docs": "/docs",
        "frontend": "https://medichatbot.krishokai.xyz",
    }


@app.get("/health")
@app.get("/api/health", include_in_schema=False)
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest) -> ChatResponse:
    message = payload.message.strip()
    if not message:
        raise HTTPException(status_code=422, detail="Message cannot be blank")

    conversation_id = payload.conversation_id or uuid.uuid4().hex
    try:
        answer = await asyncio.to_thread(answer_with_memory, conversation_id, message)
        return ChatResponse(answer=answer, conversation_id=conversation_id)
    except Exception as exc:
        # Keep provider details out of the public API response.
        raise HTTPException(
            status_code=502, detail="Unable to generate an answer right now"
        ) from exc


@app.delete("/api/chat/{conversation_id}", status_code=204)
async def delete_conversation(
    conversation_id: str = PathParam(pattern=CONVERSATION_ID_PATTERN),
) -> None:
    """Forget a conversation's memory (called when the user deletes a chat)."""
    (HISTORY_DIR / f"{conversation_id}.json").unlink(missing_ok=True)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8080)
