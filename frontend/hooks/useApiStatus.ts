"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { API_URL, HEALTH_POLL_MS } from "@/lib/config";
import type { ApiStatus } from "@/types/chat";

export const useApiStatus = (): ApiStatus => {
  const [status, setStatus] = useState<ApiStatus>("checking");

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        await axios.get(`${API_URL}/health`, { timeout: 5_000 });
        if (!cancelled) setStatus("online");
      } catch {
        if (!cancelled) setStatus("offline");
      }
    };

    void check();
    const interval = window.setInterval(check, HEALTH_POLL_MS);
    const onFocus = () => void check();
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return status;
};
