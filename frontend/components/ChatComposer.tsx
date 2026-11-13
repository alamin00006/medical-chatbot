"use client";

import { useLayoutEffect, type FormEvent, type KeyboardEvent, type RefObject } from "react";
import { ArrowUpIcon, StopIcon } from "@/components/icons";
import { MAX_MESSAGE_LENGTH } from "@/lib/config";

type ChatComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  /** A request is in flight for the visible conversation. */
  isPending: boolean;
  /** A request is in flight anywhere (blocks new sends). */
  isBusy: boolean;
  inputRef: RefObject<HTMLTextAreaElement | null>;
};

const MAX_HEIGHT = 220;

export const ChatComposer = ({ value, onChange, onSubmit, onStop, isPending, isBusy, inputRef }: ChatComposerProps) => {
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
    el.style.overflowY = el.scrollHeight > MAX_HEIGHT ? "auto" : "hidden";
  }, [value, inputRef]);

  const remaining = MAX_MESSAGE_LENGTH - value.length;
  const canSend = value.trim().length > 0 && !isBusy;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (canSend) onSubmit();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      if (canSend) onSubmit();
    }
  };

  return (
    <form className="composer" onSubmit={handleSubmit} onClick={(event) => event.target === event.currentTarget && inputRef.current?.focus()}>
      <label htmlFor="composer-input" className="sr-only">Ask a health question</label>
      <textarea
        id="composer-input"
        ref={inputRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask a health question…"
        rows={1}
        maxLength={MAX_MESSAGE_LENGTH}
        autoComplete="off"
        enterKeyHint="send"
      />
      <div className="composer-bar">
        <span className="composer-hint">
          <kbd>Enter</kbd> to send · <kbd>Shift</kbd> + <kbd>Enter</kbd> for a new line
        </span>
        {remaining <= 500 && (
          <span className="composer-count" data-warn={remaining <= 100} aria-live="polite">
            {remaining} left
          </span>
        )}
        {isPending ? (
          <button type="button" className="send-btn send-btn-stop" onClick={onStop} aria-label="Stop generating" title="Stop">
            <StopIcon width={18} height={18} />
          </button>
        ) : (
          <button type="submit" className="send-btn" disabled={!canSend} aria-label="Send message" title="Send">
            <ArrowUpIcon width={18} height={18} />
          </button>
        )}
      </div>
    </form>
  );
};
