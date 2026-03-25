"use client";

import { useState, useEffect, useCallback } from "react";
import { formatSlackText } from "./slack-format";

let cachedUserMap: Record<string, string> | null = null;

export function useSlackFormat() {
  const [userMap, setUserMap] = useState<Record<string, string>>(cachedUserMap || {});

  useEffect(() => {
    if (cachedUserMap) return;
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => {
        cachedUserMap = data;
        setUserMap(data);
      })
      .catch(() => {});
  }, []);

  const fmt = useCallback(
    (text: string | null | undefined) => formatSlackText(text, userMap),
    [userMap]
  );

  return fmt;
}
