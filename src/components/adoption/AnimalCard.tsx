"use client";

import Image from "next/image";
import { useSwipeable } from "react-swipeable";
import type { Animal } from "@/types/animals";

function ageLabel(months: number): string {
  if (months < 12) return `${months}mo`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem === 0 ? `${years}yr` : `${years}yr ${rem}mo`;
}

interface AnimalCardProps {
  animal: Animal;
  onSwipeRight: (id: string) => void;
  onSwipeLeft: (id: string) => void;
  disabled?: boolean;
}

export function AnimalCard({ animal, onSwipeRight, onSwipeLeft, disabled }: AnimalCardProps) {
  const handlers = useSwipeable({
    onSwipedRight: () => !disabled && onSwipeRight(animal.id),
    onSwipedLeft: () => !disabled && onSwipeLeft(animal.id),
    delta: 50,
    swipeDuration: 500,
    preventScrollOnSwipe: true,
    trackMouse: true,
  });

  const primaryPhoto = animal.photo_urls[0] ?? null;

  return (
    <article
      {...handlers}
      data-testid="animal-card"
      className="relative w-full max-w-sm mx-auto rounded-2xl overflow-hidden shadow-xl bg-white select-none touch-pan-y"
    >
      <div className="relative h-72 bg-gray-200">
        {primaryPhoto ? (
          <Image
            src={primaryPhoto}
            alt={animal.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 384px"
            priority
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-4xl">🐾</div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-baseline gap-2 mb-1">
          <h2 className="text-xl font-bold text-gray-900">{animal.name}</h2>
          <span className="text-sm text-gray-500 capitalize">{animal.species}</span>
        </div>

        <div className="flex flex-wrap gap-2 text-sm text-gray-600 mb-2">
          {animal.breed && <span>{animal.breed}</span>}
          <span>·</span>
          <span>{ageLabel(animal.age_months)}</span>
          {animal.shelter && (
            <>
              <span>·</span>
              <span>{animal.shelter.name}</span>
            </>
          )}
        </div>

        {animal.description && (
          <p className="text-sm text-gray-700 line-clamp-3">{animal.description}</p>
        )}
      </div>

      {/* Desktop action buttons */}
      <div className="flex border-t">
        <button
          onClick={() => !disabled && onSwipeLeft(animal.id)}
          aria-label="Skip"
          className="flex-1 py-3 text-2xl hover:bg-red-50 transition-colors disabled:opacity-40"
          disabled={disabled}
        >
          ✕
        </button>
        <button
          onClick={() => !disabled && onSwipeRight(animal.id)}
          aria-label="Save to favourites"
          className="flex-1 py-3 text-2xl hover:bg-green-50 transition-colors disabled:opacity-40"
          disabled={disabled}
        >
          ♥
        </button>
      </div>
    </article>
  );
}
