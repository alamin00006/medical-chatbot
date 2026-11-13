"use client";

import axios from "axios";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { API_URL, REQUEST_TIMEOUT_MS } from "@/lib/config";
import { MAX_CONVERSATIONS, loadConversations, saveConversations } from "@/lib/storage";
import type { ChatError, ChatMessage, ChatResponse, Conversation } from "@/types/chat";

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const makeMessage = (role: ChatMessage["role"], content: string): ChatMessage => ({
  id: createId(),
  role,
  content,
  createdAt: Date.now(),
});

const makeTitle = (content: string) => {
  const singleLine = content.replace(/\s+/g, " ").trim();
  return singleLine.length > 60 ? `${singleLine.slice(0, 57)}…` : singleLine;
};

/** Reasoning models can leak <think> blocks; never show them to patients. */
const cleanAnswer = (answer: string) => answer.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

const describeError = (cause: unknown): string => {
  if (axios.isAxiosError<{ detail?: unknown }>(cause)) {
    if (cause.code === "ECONNABORTED") return "The assistant took too long to respond. Please try again.";
    const detail = cause.response?.data?.detail;
    if (typeof detail === "string" && detail) return detail;
    if (cause.response?.status === 422) return "That message couldn't be processed. Try rephrasing it.";
    if (!cause.response) return "Can't reach the assistant. Check your connection or that the API server is running.";
  }
  return "Something went wrong while generating an answer. Please try again.";
};

export const useChat = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<ChatError | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load saved conversations after mount so server and client markup match.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage
    setConversations(loadConversations());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveConversations(conversations);
  }, [conversations, hydrated]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeId) ?? null,
    [conversations, activeId],
  );

  const appendMessage = useCallback((conversationId: string, message: ChatMessage) => {
    setConversations((current) => {
      const target = current.find((conversation) => conversation.id === conversationId);
      if (!target) return current;
      const updated = { ...target, messages: [...target.messages, message], updatedAt: message.createdAt };
      return [updated, ...current.filter((conversation) => conversation.id !== conversationId)];
    });
  }, []);

  const requestAnswer = useCallback(
    async (conversationId: string, content: string) => {
      const controller = new AbortController();
      abortRef.current = controller;
      setError(null);
      setPendingId(conversationId);

      try {
        const { data } = await axios.post<ChatResponse>(
          `${API_URL}/api/chat`,
          { message: content },
          { signal: controller.signal, timeout: REQUEST_TIMEOUT_MS },
        );
        const answer = cleanAnswer(data.answer) || "I couldn't find an answer to that in my knowledge base.";
        appendMessage(conversationId, makeMessage("assistant", answer));
      } catch (cause) {
        if (!axios.isCancel(cause)) setError({ conversationId, message: describeError(cause), retryContent: content });
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
          setPendingId(null);
        }
      }
    },
    [appendMessage],
  );

  const sendMessage = useCallback(
    (text?: string) => {
      const content = (text ?? draft).trim();
      if (!content || pendingId) return;

      const userMessage = makeMessage("user", content);
      let conversationId = activeConversation?.id;

      if (conversationId) {
        appendMessage(conversationId, userMessage);
      } else {
        conversationId = createId();
        const conversation: Conversation = {
          id: conversationId,
          title: makeTitle(content),
          messages: [userMessage],
          createdAt: userMessage.createdAt,
          updatedAt: userMessage.createdAt,
        };
        setConversations((current) => [conversation, ...current].slice(0, MAX_CONVERSATIONS));
        setActiveId(conversationId);
      }

      setDraft("");
      void requestAnswer(conversationId, content);
    },
    [activeConversation, appendMessage, draft, pendingId, requestAnswer],
  );

  const retry = useCallback(() => {
    if (error && !pendingId) void requestAnswer(error.conversationId, error.retryContent);
  }, [error, pendingId, requestAnswer]);

  const stop = useCallback(() => abortRef.current?.abort(), []);

  const newConversation = useCallback(() => {
    setActiveId(null);
    setDraft("");
    setError(null);
  }, []);

  const selectConversation = useCallback((id: string) => {
    setActiveId(id);
    setError((current) => (current?.conversationId === id ? current : null));
  }, []);

  const deleteConversation = useCallback(
    (id: string) => {
      if (pendingId === id) abortRef.current?.abort();
      setConversations((current) => current.filter((conversation) => conversation.id !== id));
      setError((current) => (current?.conversationId === id ? null : current));
      setActiveId((current) => (current === id ? null : current));
    },
    [pendingId],
  );

  return {
    conversations,
    hydrated,
    activeConversation,
    messages: activeConversation?.messages ?? [],
    draft,
    setDraft,
    isBusy: pendingId !== null,
    isPending: pendingId !== null && pendingId === activeConversation?.id,
    error: error && error.conversationId === activeConversation?.id ? error : null,
    sendMessage,
    retry,
    stop,
    newConversation,
    selectConversation,
    deleteConversation,
  };
};
