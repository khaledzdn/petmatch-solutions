import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useBrowseFeed } from "../useBrowseFeed";
import type { Animal } from "@/types/animals";

function makeAnimal(id: string, created_at: string): Animal {
  return {
    id,
    shelter_id: "s1",
    name: `Animal ${id}`,
    species: "dog",
    breed: null,
    age_months: 12,
    description: "",
    photo_urls: [],
    health_status: "",
    status: "available",
    created_at,
    shelter: { id: "s1", name: "Shelter", location: "Vienna" },
  };
}

const animals = Array.from({ length: 5 }, (_, i) =>
  makeAnimal(`id-${i}`, `2026-04-${String(20 - i).padStart(2, "0")}T00:00:00Z`)
);

function mockFetch(pages: { data: Animal[]; nextCursor: string | null }[]) {
  let call = 0;
  return vi.fn(() => {
    const page = pages[call] ?? pages[pages.length - 1];
    call++;
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ data: page.data, nextCursor: page.nextCursor, total: page.data.length }),
    });
  });
}

describe("useBrowseFeed", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = mockFetch([{ data: animals, nextCursor: null }]);
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches animals on mount and exposes the first one as current", async () => {
    const { result } = renderHook(() => useBrowseFeed());
    await waitFor(() => expect(result.current.current).not.toBeNull());
    expect(result.current.current?.id).toBe("id-0");
  });

  it("advances to the next animal after handleFavourite", async () => {
    const { result } = renderHook(() => useBrowseFeed());
    await waitFor(() => expect(result.current.current).not.toBeNull());

    act(() => result.current.handleFavourite());
    expect(result.current.current?.id).toBe("id-1");
  });

  it("advances to the next animal after handleSkip", async () => {
    const { result } = renderHook(() => useBrowseFeed());
    await waitFor(() => expect(result.current.current).not.toBeNull());

    act(() => result.current.handleSkip());
    expect(result.current.current?.id).toBe("id-1");
  });

  it("does not re-show skipped animals", async () => {
    const { result } = renderHook(() => useBrowseFeed());
    await waitFor(() => expect(result.current.current).not.toBeNull());

    const skippedId = result.current.current!.id;
    act(() => result.current.handleSkip());
    const seen = new Set<string>();
    for (let i = 0; i < 5; i++) {
      if (result.current.current) seen.add(result.current.current.id);
      act(() => result.current.handleSkip());
    }
    expect(seen.has(skippedId)).toBe(false);
  });

  it("calls POST /api/animals/favourites when favourited", async () => {
    const postMock = vi.fn((_url: string, _opts?: RequestInit) => Promise.resolve({ ok: true }));
    vi.stubGlobal("fetch", (url: string, opts?: RequestInit) => {
      if (opts?.method === "POST") return postMock(url, opts);
      return (fetchMock as unknown as (url: string) => Promise<unknown>)(url);
    });

    const { result } = renderHook(() => useBrowseFeed());
    await waitFor(() => expect(result.current.current).not.toBeNull());

    act(() => result.current.handleFavourite());

    expect(postMock).toHaveBeenCalledWith(
      "/api/animals/favourites",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("marks isExhausted when feed is empty", async () => {
    fetchMock = mockFetch([{ data: [], nextCursor: null }]);
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useBrowseFeed());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isExhausted).toBe(true);
    expect(result.current.current).toBeNull();
  });

  it("auto-fetches the next page when an entire fetched page is already skipped", async () => {
    // Scenario: page 2 returns only animal-A which was previously skipped.
    // The hook must detect fresh.length===0 && nextCursor and immediately fetch page 3.
    const animalA = makeAnimal("animal-A", "2026-04-20T00:00:00Z");
    const animalB = makeAnimal("animal-B", "2026-04-19T00:00:00Z");

    // page1: [animalA] with cursor; page2: [animalA again] with cursor (all filtered); page3: [animalB]
    fetchMock = mockFetch([
      { data: [animalA], nextCursor: "cursor-p2" },
      { data: [animalA], nextCursor: "cursor-p3" }, // all pre-skipped — triggers auto-fetch
      { data: [animalB], nextCursor: null },
    ]);
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useBrowseFeed());

    // Page 1 loads; skip animalA so it enters the skip set
    await waitFor(() => expect(result.current.current?.id).toBe("animal-A"));
    act(() => result.current.handleSkip()); // animal-A now in skipped set; queue < 3 → fetch page 2

    // Page 2 returns only animal-A (already skipped) → hook auto-fetches page 3
    // Page 3 returns animal-B → should become current
    await waitFor(() => expect(result.current.current?.id).toBe("animal-B"), { timeout: 3000 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
