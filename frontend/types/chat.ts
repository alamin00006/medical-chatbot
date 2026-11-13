export type MessageRole = "assistant" | "user";

export type ChatMessage = {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: number;
};

export type Conversation = {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
};

export type ChatResponse = { answer: string };

export type ChatError = {
  conversationId: string;
  message: string;
  retryContent: string;
};

export type ApiStatus = "checking" | "online" | "offline";
