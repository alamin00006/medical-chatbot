"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChatComposer } from "@/components/ChatComposer";
import { ChatHeader } from "@/components/ChatHeader";
import { AlertIcon, RefreshIcon } from "@/components/icons";
import { MessageList } from "@/components/MessageList";
import { Sidebar } from "@/components/Sidebar";
import { WelcomePanel } from "@/components/WelcomePanel";
import { useApiStatus } from "@/hooks/useApiStatus";
import { useChat } from "@/hooks/useChat";

export const ChatWindow = () => {
  const chat = useChat();
  const status = useApiStatus();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const focusInput = () => window.requestAnimationFrame(() => inputRef.current?.focus());

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chat.messages.length, chat.isPending, chat.error]);

  const handleNewConversation = () => {
    chat.newConversation();
    closeSidebar();
    focusInput();
  };

  const handleSelect = (id: string) => {
    chat.selectConversation(id);
    closeSidebar();
  };

  const showWelcome = chat.messages.length === 0 && !chat.isPending;

  return (
    <div className="app">
      <a className="skip-link" href="#composer-input">Skip to message input</a>

      <Sidebar
        open={sidebarOpen}
        hydrated={chat.hydrated}
        conversations={chat.conversations}
        activeId={chat.activeConversation?.id ?? null}
        onClose={closeSidebar}
        onNewConversation={handleNewConversation}
        onSelect={handleSelect}
        onDelete={chat.deleteConversation}
      />
      <div className="scrim" data-open={sidebarOpen} onClick={closeSidebar} aria-hidden="true" />

      <main className="main">
        <ChatHeader
          title={chat.activeConversation?.title ?? "New conversation"}
          status={status}
          onOpenSidebar={() => setSidebarOpen(true)}
          onNewConversation={handleNewConversation}
        />

        <div className="thread">
          <div className="thread-inner">
            {showWelcome ? (
              <WelcomePanel onPromptSelect={chat.sendMessage} disabled={chat.isBusy} />
            ) : (
              <MessageList messages={chat.messages} pending={chat.isPending} />
            )}
            <div ref={bottomRef} className="thread-end" />
          </div>
        </div>

        <div className="dock">
          <div className="dock-inner">
            {chat.error && (
              <div className="alert" role="alert">
                <AlertIcon width={18} height={18} />
                <p>{chat.error.message}</p>
                <button type="button" className="btn btn-ghost btn-sm" onClick={chat.retry} disabled={chat.isBusy}>
                  <RefreshIcon width={15} height={15} />
                  Retry
                </button>
              </div>
            )}
            {status === "offline" && !chat.error && (
              <div className="alert alert-warn" role="status">
                <AlertIcon width={18} height={18} />
                <p>The assistant service is unreachable right now. Messages may fail until it&apos;s back online.</p>
              </div>
            )}
            <ChatComposer
              value={chat.draft}
              onChange={chat.setDraft}
              onSubmit={() => chat.sendMessage()}
              onStop={chat.stop}
              isPending={chat.isPending}
              isBusy={chat.isBusy}
              inputRef={inputRef}
            />
            <p className="disclaimer">
              For general information only — not medical advice. In an emergency, call your local emergency number.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
