export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080").replace(/\/$/, "");

/** Must match ChatRequest.message max_length in the FastAPI backend. */
export const MAX_MESSAGE_LENGTH = 4000;

export const REQUEST_TIMEOUT_MS = 90_000;
export const HEALTH_POLL_MS = 30_000;

export const APP_NAME = "Medical Chatbot";
export const ASSISTANT_NAME = "Medical Assistant";
