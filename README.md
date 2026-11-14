# Medical Chatbot

A retrieval-augmented medical question answering app with a FastAPI backend and a separate Next.js frontend.

## Requirements

- Python 3.12 (recommended; the pinned Pinecone integration does not support Python 3.14)
- Node.js 20.9+
- Pinecone and Groq API keys

## Backend

Clone the project, activate the local Conda environment, and install the backend dependencies:

```bash
git clone https://github.com/alamin00006/medical-chatbot.git
cd medical-chatbot

# Create this environment once if it does not already exist.
conda create -n medicalbot python=3.12 -y
conda activate medicalbot

cd backend
pip install -r requirements.txt
```

Create `backend/.env` from the repository root:

```ini
PINECONE_API_KEY=your-pinecone-api-key
GROQ_API_KEY=your-groq-api-key
PINECONE_INDEX_NAME=medical-chatbot
GROQ_MODEL=qwen/qwen3.8-27b
FRONTEND_ORIGINS=http://localhost:3000
```

Start the API from `backend/` with your Python environment active:

```bash
python app.py
# or, with auto-reload during development:
uvicorn app:app --reload --host 0.0.0.0 --port 8080
```

The API root at <http://localhost:8080/> returns its status and links. API docs are at <http://localhost:8080/docs>, and the health check is at <http://localhost:8080/health>.

## Frontend

In another terminal:

```bash
cd medical-chatbot/frontend
npm install
```

Copy `frontend/.env.example` to `frontend/.env.local` and start Next.js:

```bash
npm run dev
```

Open <http://localhost:3000>. The browser calls `/api/*` on the same origin, and the Next.js proxy route (`frontend/app/api/[...path]/route.ts`) forwards those requests to `BACKEND_URL` (default `http://localhost:8080`). Setting `NEXT_PUBLIC_API_URL` makes the browser call the API directly instead.

### Conversation memory

The backend uses LangChain `ConversationBufferMemory` with `FileChatMessageHistory`, so follow-up questions keep context. Each conversation is stored as `backend/chat_history/<conversation_id>.json` (git-ignored). The frontend sends its `conversation_id` with every message, and deleting a chat in the sidebar calls `DELETE /api/chat/{conversation_id}` to erase that memory. Only the last `MAX_HISTORY_MESSAGES` (default 10) messages are sent to the model.

To populate the Pinecone index, configure `backend/.env` and run `python store_index.py` from `backend/`.
