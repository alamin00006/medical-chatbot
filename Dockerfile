# ---------- Medical Chatbot API (FastAPI) ----------
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    HF_HOME=/opt/hf-cache \
    CHAT_HISTORY_DIR=/app/chat_history

WORKDIR /app

# CPU-only PyTorch first: sentence-transformers would otherwise pull the
# multi-GB CUDA build, which this app does not need.
RUN pip install --index-url https://download.pytorch.org/whl/cpu torch==2.7.1

COPY requirements.txt .
RUN pip install -r requirements.txt

# Bake the embedding model into the image so containers start without downloading it.
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')"

COPY app.py ./
COPY src ./src

RUN useradd --create-home --uid 10001 appuser \
    && mkdir -p "$CHAT_HISTORY_DIR" \
    && chown -R appuser:appuser /app "$HF_HOME"
USER appuser

EXPOSE 8080

# The model and RAG chain load at startup, so allow a generous start period.
HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8080/health', timeout=4)" || exit 1

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "1"]
