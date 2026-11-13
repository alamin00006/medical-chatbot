"use client";

import { useEffect, useRef, useState } from "react";
import { CheckIcon, CopyIcon, MedicalMark } from "@/components/icons";
import { Markdown } from "@/components/Markdown";
import { ASSISTANT_NAME } from "@/lib/config";
import type { ChatMessage } from "@/types/chat";

const timeFormatter = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be unavailable on insecure origins; fail silently.
    }
  };

  return (
    <button type="button" className="msg-action" onClick={copy} aria-label={copied ? "Copied" : "Copy answer"}>
      {copied ? <CheckIcon width={15} height={15} /> : <CopyIcon width={15} height={15} />}
      <span>{copied ? "Copied" : "Copy"}</span>
    </button>
  );
};

const AssistantAvatar = () => (
  <span className="msg-avatar" aria-hidden="true"><MedicalMark width={15} height={15} /></span>
);

type MessageListProps = { messages: ChatMessage[]; pending: boolean };

export const MessageList = ({ messages, pending }: MessageListProps) => (
  <ol className="messages" role="log" aria-live="polite" aria-label="Conversation">
    {messages.map((message) => {
      const time = timeFormatter.format(message.createdAt);
      const iso = new Date(message.createdAt).toISOString();

      if (message.role === "user") {
        return (
          <li key={message.id} className="msg msg-user">
            <span className="sr-only">You said:</span>
            <div className="msg-bubble">{message.content}</div>
            <time className="msg-time" dateTime={iso}>{time}</time>
          </li>
        );
      }

      return (
        <li key={message.id} className="msg msg-assistant">
          <AssistantAvatar />
          <div className="msg-body">
            <div className="msg-meta">
              <span className="msg-name">{ASSISTANT_NAME}</span>
              <time className="msg-time" dateTime={iso}>{time}</time>
            </div>
            <Markdown content={message.content} />
            <div className="msg-actions">
              <CopyButton text={message.content} />
            </div>
          </div>
        </li>
      );
    })}

    {pending && (
      <li className="msg msg-assistant msg-pending">
        <AssistantAvatar />
        <div className="msg-body">
          <div className="msg-meta"><span className="msg-name">{ASSISTANT_NAME}</span></div>
          <div className="typing" role="status">
            <span className="typing-dots" aria-hidden="true"><i /><i /><i /></span>
            <span>Searching the knowledge base…</span>
          </div>
        </div>
      </li>
    )}
  </ol>
);
