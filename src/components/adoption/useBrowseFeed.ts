"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { Animal, AnimalsQueryParams } from "@/types/animals";

interface UseBrowseFeedOptions {
  params?: AnimalsQueryParams;
}

interface UseBrowseFeedResult {
  current: Animal | null;
  queueLength: number;
  isLoading: boolean;
  isExhausted: boolean;
  handleFavourite: () => void;
  handleSkip: () => void;
}

export function useBrowseFeed({ params = {} }: UseBrowseFeedOptions = {}): UseBrowseFeedResult {
  const [queue, setQueue] = useState<Animal[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExhausted, setIsExhausted] = useState(false);
  // skipped IDs are session-only — never fetched again in this session
  const skipped = useRef<Set<string>>(new Set());

  const fetchMore = useCallback(async (nextCursor: string | null) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const search = new URLSearchParams();
      if (params.species) search.set("species", params.species);
      if (params.maxAgeMonths) search.set("maxAgeMonths", String(params.maxAgeMonths));
      if (nextCursor) search.set("cursor", nextCursor);
      search.set("limit", "10");

      const res = await fetch(`/api/animals?${search.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch animals");

      const json = await res.json();
      const fresh: Animal[] = (json.data ?? []).filter(
        (a: Animal) => !skipped.current.has(a.id)
      );
      setQueue((prev) => [...prev, ...fresh]);
      setCursor(json.nextCursor);
      if (!json.nextCursor && fresh.length === 0) setIsExhausted(true);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, params.species, params.maxAgeMonths]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchMore(null); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const advance = useCallback(() => {
    setQueue((prev) => {
      const next = prev.slice(1);
      // prefetch when fewer than 3 remain
      if (next.length < 3 && cursor && !isLoading) {
        fetchMore(cursor);
      } else if (next.length === 0 && !cursor) {
        setIsExhausted(true);
      }
      return next;
    });
  }, [cursor, isLoading, fetchMore]);

  const handleFavourite = useCallback(() => {
    const animal = queue[0];
    if (!animal) return;
    // fire-and-forget — optimistic UI, no error surface on this ticket
    fetch("/api/animals/favourites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ animal_id: animal.id }),
    });
    advance();
  }, [queue, advance]);

  const handleSkip = useCallback(() => {
    const animal = queue[0];
    if (!animal) return;
    skipped.current.add(animal.id);
    advance();
  }, [queue, advance]);

  return {
    current: queue[0] ?? null,
    queueLength: queue.length,
    isLoading,
    isExhausted,
    handleFavourite,
    handleSkip,
  };
}
