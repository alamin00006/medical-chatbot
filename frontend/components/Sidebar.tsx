"use client";

import { useEffect, useMemo, useRef } from "react";
import { CloseIcon, MedicalMark, MessageIcon, PlusIcon, ShieldIcon, TrashIcon } from "@/components/icons";
import { APP_NAME } from "@/lib/config";
import type { Conversation } from "@/types/chat";

type SidebarProps = {
  open: boolean;
  hydrated: boolean;
  conversations: Conversation[];
  activeId: string | null;
  onClose: () => void;
  onNewConversation: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
};

const DAY = 24 * 60 * 60 * 1000;

const groupConversations = (conversations: Conversation[]) => {
  const startOfToday = new Date().setHours(0, 0, 0, 0);
  const groups: { label: string; items: Conversation[] }[] = [
    { label: "Today", items: [] },
    { label: "Previous 7 days", items: [] },
    { label: "Older", items: [] },
  ];
  for (const conversation of conversations) {
    if (conversation.updatedAt >= startOfToday) groups[0].items.push(conversation);
    else if (conversation.updatedAt >= startOfToday - 7 * DAY) groups[1].items.push(conversation);
    else groups[2].items.push(conversation);
  }
  return groups.filter((group) => group.items.length > 0);
};

export const Sidebar = ({
  open,
  hydrated,
  conversations,
  activeId,
  onClose,
  onNewConversation,
  onSelect,
  onDelete,
}: SidebarProps) => {
  const closeRef = useRef<HTMLButtonElement>(null);
  const groups = useMemo(() => groupConversations(conversations), [conversations]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <aside className="sidebar" data-open={open} aria-label="Conversations">
      <div className="sidebar-top">
        <div className="brand">
          <span className="brand-mark"><MedicalMark width={18} height={18} /></span>
          <span className="brand-text">
            <strong>{APP_NAME}</strong>
            <small>RAG knowledge assistant</small>
          </span>
        </div>
        <button ref={closeRef} type="button" className="icon-btn sidebar-close" onClick={onClose} aria-label="Close sidebar">
          <CloseIcon />
        </button>
      </div>

      <button type="button" className="btn btn-primary btn-block" onClick={onNewConversation}>
        <PlusIcon width={18} height={18} />
        New conversation
      </button>

      <nav className="history" aria-label="Conversation history">
        {hydrated && groups.length === 0 && (
          <div className="history-empty">
            <MessageIcon width={18} height={18} />
            <p>Your conversations will appear here.</p>
          </div>
        )}
        {groups.map((group) => (
          <section className="history-group" key={group.label}>
            <h2 className="history-label">{group.label}</h2>
            <ul>
              {group.items.map((conversation) => {
                const active = conversation.id === activeId;
                return (
                  <li className="history-item" data-active={active} key={conversation.id}>
                    <button
                      type="button"
                      className="history-link"
                      onClick={() => onSelect(conversation.id)}
                      aria-current={active ? "page" : undefined}
                      title={conversation.title}
                    >
                      <span>{conversation.title}</span>
                    </button>
                    <button
                      type="button"
                      className="history-delete"
                      onClick={() => onDelete(conversation.id)}
                      aria-label={`Delete conversation: ${conversation.title}`}
                      title="Delete"
                    >
                      <TrashIcon width={15} height={15} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </nav>

      <div className="sidebar-footer">
        <span className="sidebar-footer-icon"><ShieldIcon width={16} height={16} /></span>
        <div>
          <strong>Private by design</strong>
          <p>Chat memory is kept so follow-ups have context. Deleting a chat erases it. Avoid sharing personal identifiers.</p>
        </div>
      </div>
    </aside>
  );
};
