"use client";

import { AnimalCard } from "./AnimalCard";
import { useBrowseFeed } from "./useBrowseFeed";
import type { AnimalsQueryParams } from "@/types/animals";

interface BrowseFeedProps {
  params?: AnimalsQueryParams;
}

export function BrowseFeed({ params }: BrowseFeedProps) {
  const { current, isLoading, isExhausted, handleFavourite, handleSkip } =
    useBrowseFeed({ params });

  if (isLoading && !current) {
    return (
      <div className="flex items-center justify-center h-64" aria-live="polite" aria-busy="true">
        <span className="text-gray-400 text-lg animate-pulse">Finding animals near you…</span>
      </div>
    );
  }

  if (isExhausted && !current) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center" aria-live="polite">
        <span className="text-5xl">🐾</span>
        <p className="text-gray-600 text-lg font-medium">You&apos;ve seen all available animals!</p>
        <p className="text-gray-400 text-sm">Check back soon &mdash; new pets arrive daily.</p>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div className="flex flex-col items-center gap-6 py-6 px-4">
      <AnimalCard
        key={current.id}
        animal={current}
        onSwipeRight={handleFavourite}
        onSwipeLeft={handleSkip}
        disabled={isLoading}
      />
      <p className="text-xs text-gray-400">Swipe right to save · Swipe left to skip</p>
    </div>
  );
}
