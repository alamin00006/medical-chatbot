"use client";

import { useCallback } from "react";
import { THEME_KEY } from "@/lib/storage";

/** Toggles light/dark. The icon swap is pure CSS, so no state or hydration mismatch. */
export const useThemeToggle = () =>
  useCallback(() => {
    const root = document.documentElement;
    const current =
      root.dataset.theme ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try {
      window.localStorage.setItem(THEME_KEY, next);
    } catch {
      // Ignore blocked storage; the theme still applies for this visit.
    }
  }, []);
