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

Copy `frontend/.env.example` to `frontend/.env.local` and start Next.js:

```bash
npm run dev
```

Open <http://localhost:3000>. The browser calls `/api/*` on the same origin, and the Next.js proxy route (`frontend/app/api/[...path]/route.ts`) forwards those requests to `BACKEND_URL` (default `http://localhost:8080`). Setting `NEXT_PUBLIC_API_URL` makes the browser call the API directly instead.

### Conversation memory

The backend uses LangChain `ConversationBufferMemory` with `FileChatMessageHistory`, so follow-up questions keep context. Each conversation is stored as `chat_history/<conversation_id>.json` (git-ignored). The frontend sends its `conversation_id` with every message, and deleting a chat in the sidebar calls `DELETE /api/chat/{conversation_id}` to erase that memory. Only the last `MAX_HISTORY_MESSAGES` (default 10) messages are sent to the model.

To populate the Pinecone index, configure the same `.env` keys and run `python store_index.py` from the repository root.

## Deployment (Docker Hub + GitHub Actions)

Every push to `main` runs [.github/workflows/deploy.yaml](.github/workflows/deploy.yaml):

1. **checks**: Python compile, frontend lint and type-check
2. **build-and-push**: builds both images and pushes them to Docker Hub, tagged with the commit SHA and `latest`
   - `<user>/medical-chatbot-backend` from the root `Dockerfile`
   - `<user>/medical-chatbot-frontend` from `frontend/Dockerfile`
3. **deploy**: runs on your server (a self-hosted runner), writes `.env`, then runs `docker compose pull` and `docker compose up -d`

### One-time setup

**Docker Hub:** create an access token (Account settings → Personal access tokens, Read & Write).

**GitHub repo → Settings → Secrets and variables → Actions:**

| Type | Name | Value |
| --- | --- | --- |
| Variable | `DOCKERHUB_USERNAME` | your Docker Hub username |
| Secret | `DOCKERHUB_TOKEN` | the Docker Hub access token |
| Secret | `PINECONE_API_KEY` | Pinecone key |
| Secret | `GROQ_API_KEY` | Groq key |
| Variable (optional) | `PINECONE_INDEX_NAME`, `GROQ_MODEL`, `APP_PORT` | defaults: `medical-chatbot`, `qwen/qwen3.8-27b`, `80` |

Also create an environment named `production` (Settings → Environments) to add required reviewers before deploys.

**Server (e.g. an Ubuntu EC2 instance or VPS):**

1. Install Docker with the Compose plugin, and add the runner user to the `docker` group.
2. In the repo, go to Settings → Actions → Runners → **New self-hosted runner** (Linux), and run the commands it shows on the server. Install it as a service with `sudo ./svc.sh install && sudo ./svc.sh start`.
3. Open port `80` (or `APP_PORT`) in the firewall or security group.

The app is then served at `http://<server-ip>/`. Conversation memory is kept in the `chat_history` Docker volume, so it survives redeploys.

### Run the published images manually

```bash
# .env with PINECONE_API_KEY and GROQ_API_KEY in the same folder as docker-compose.yml
export DOCKERHUB_USERNAME=<your-user> IMAGE_TAG=latest
docker compose pull
docker compose up -d
```
