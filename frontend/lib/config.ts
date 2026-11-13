/**
 * Empty (default) = same-origin: requests go to /api/* and the Next.js proxy route
 * forwards them to BACKEND_URL. Set NEXT_PUBLIC_API_URL only to call the API directly.
 */
export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

/** Must match ChatRequest.message max_length in the FastAPI backend. */
export const MAX_MESSAGE_LENGTH = 4000;

export const REQUEST_TIMEOUT_MS = 90_000;
export const HEALTH_POLL_MS = 30_000;

export const APP_NAME = "Medical Chatbot";
export const ASSISTANT_NAME = "Medical Assistant";
