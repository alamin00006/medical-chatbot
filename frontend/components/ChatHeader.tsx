"use client";

import { MenuIcon, MoonIcon, PlusIcon, SunIcon } from "@/components/icons";
import { useThemeToggle } from "@/hooks/useTheme";
import type { ApiStatus } from "@/types/chat";

type ChatHeaderProps = {
  title: string;
  status: ApiStatus;
  onOpenSidebar: () => void;
  onNewConversation: () => void;
};

const STATUS_LABEL: Record<ApiStatus, string> = {
  checking: "Connecting",
  online: "Online",
  offline: "Offline",
};

export const ChatHeader = ({ title, status, onOpenSidebar, onNewConversation }: ChatHeaderProps) => {
  const toggleTheme = useThemeToggle();

  return (
    <header className="header">
      <button type="button" className="icon-btn header-menu" onClick={onOpenSidebar} aria-label="Open conversations">
        <MenuIcon />
      </button>

      <h1 className="header-title" title={title}>{title}</h1>

      <div className="header-actions">
        <span className="status" data-status={status} role="status" title={`Assistant API: ${STATUS_LABEL[status]}`}>
          <i aria-hidden="true" />
          <span>{STATUS_LABEL[status]}</span>
        </span>
        <button type="button" className="icon-btn" onClick={toggleTheme} aria-label="Toggle color theme" title="Toggle theme">
          <SunIcon className="icon-sun" />
          <MoonIcon className="icon-moon" />
        </button>
        <button type="button" className="icon-btn header-new" onClick={onNewConversation} aria-label="New conversation" title="New conversation">
          <PlusIcon />
        </button>
      </div>
    </header>
  );
};
