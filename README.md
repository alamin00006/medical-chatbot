# Medical Chatbot

A retrieval-augmented medical question answering app with a FastAPI backend and a separate Next.js frontend.

## Requirements

- Python 3.12 (recommended; the pinned Pinecone integration does not support Python 3.14)
- Node.js 20.9+
- Pinecone and Groq API keys

## Backend

Activate the `medicalbot` conda environment and install dependencies:

```bash
# First time only, if the environment doesn't exist yet:
# conda create -n medicalbot python=3.12 -y

conda activate medicalbot
pip install -r requirements.txt   # only needed if packages are missing
```

Create a root `.env` file:

```ini
PINECONE_API_KEY=your-pinecone-api-key
GROQ_API_KEY=your-groq-api-key
PINECONE_INDEX_NAME=medical-chatbot
GROQ_MODEL=qwen/qwen3.8-27b
FRONTEND_ORIGINS=http://localhost:3000
```

Start the API from the repository root (with `medicalbot` active):

```bash
python app.py
# or, with auto-reload during development:
uvicorn app:app --reload --host 0.0.0.0 --port 8080
```

The API root at <http://localhost:8080/> returns its status and links. API docs are at <http://localhost:8080/docs>, and the health check is at <http://localhost:8080/health>.

## Frontend

In another terminal:

```bash
cd frontend
npm install
```

Copy `frontend/.env.example` to `frontend/.env.local` (or configure `NEXT_PUBLIC_API_URL`) and start Next.js:

```bash
npm run dev
```

Open <http://localhost:3000>. By default, the frontend calls `http://localhost:8080/api/chat`. The API allows local Next.js development origins on `localhost` and `127.0.0.1`, including a different port if Next.js selects one automatically.

To populate the Pinecone index, configure the same `.env` keys and run `python store_index.py` from the repository root.
