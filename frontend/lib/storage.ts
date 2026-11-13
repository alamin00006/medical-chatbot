import type { ChatMessage, Conversation } from "@/types/chat";

const STORAGE_KEY = "medical-chatbot.conversations.v1";
export const THEME_KEY = "medical-chatbot.theme";
export const MAX_CONVERSATIONS = 50;

const isMessage = (value: unknown): value is ChatMessage => {
  if (!value || typeof value !== "object") return false;
  const m = value as Record<string, unknown>;
  return (
    typeof m.id === "string" &&
    (m.role === "user" || m.role === "assistant") &&
    typeof m.content === "string" &&
    typeof m.createdAt === "number"
  );
};

const isConversation = (value: unknown): value is Conversation => {
  if (!value || typeof value !== "object") return false;
  const c = value as Record<string, unknown>;
  return (
    typeof c.id === "string" &&
    typeof c.title === "string" &&
    typeof c.createdAt === "number" &&
    typeof c.updatedAt === "number" &&
    Array.isArray(c.messages) &&
    c.messages.every(isMessage)
  );
};

export const loadConversations = (): Conversation[] => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isConversation).slice(0, MAX_CONVERSATIONS) : [];
  } catch {
    return [];
  }
};

export const saveConversations = (conversations: Conversation[]) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations.slice(0, MAX_CONVERSATIONS)));
  } catch {
    // Storage can be full or blocked (private mode); the chat keeps working in memory.
  }
};
