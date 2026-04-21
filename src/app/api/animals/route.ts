import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AnimalSpecies, AnimalsResponse } from "@/types/animals";

const PAGE_SIZE = 10;

// Dev-only seed data — used when NEXT_PUBLIC_SUPABASE_URL is not configured
const DEV_ANIMALS = [
  { id: "dev-1", shelter_id: "s1", name: "Buddy", species: "dog", breed: "Golden Retriever", age_months: 18, description: "Loves fetch, great with kids, house-trained.", photo_urls: ["https://images.unsplash.com/photo-1552053831-71594a27632d?w=600"], health_status: "Healthy", status: "available", created_at: "2026-04-20T10:00:00Z", shelter: { id: "s1", name: "Happy Paws Vienna", location: "Vienna, AT" } },
  { id: "dev-2", shelter_id: "s1", name: "Luna", species: "cat", breed: "British Shorthair", age_months: 6, description: "Calm and cuddly. Perfect for apartment life.", photo_urls: ["https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=600"], health_status: "Healthy", status: "available", created_at: "2026-04-19T10:00:00Z", shelter: { id: "s1", name: "Happy Paws Vienna", location: "Vienna, AT" } },
  { id: "dev-3", shelter_id: "s2", name: "Milo", species: "rabbit", breed: "Holland Lop", age_months: 8, description: "Energetic bunny, loves leafy greens.", photo_urls: ["https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=600"], health_status: "Healthy", status: "available", created_at: "2026-04-18T10:00:00Z", shelter: { id: "s2", name: "Second Chance Shelter", location: "Graz, AT" } },
  { id: "dev-4", shelter_id: "s2", name: "Daisy", species: "dog", breed: "Beagle", age_months: 36, description: "Curious sniffer, great on walks. Good with other dogs.", photo_urls: ["https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=600"], health_status: "Healthy", status: "available", created_at: "2026-04-17T10:00:00Z", shelter: { id: "s2", name: "Second Chance Shelter", location: "Graz, AT" } },
  { id: "dev-5", shelter_id: "s1", name: "Whiskers", species: "cat", breed: "Maine Coon", age_months: 24, description: "Large, gentle, and very talkative. Loves chin scratches.", photo_urls: ["https://images.unsplash.com/photo-1533743983669-94fa5c4338ec?w=600"], health_status: "Healthy", status: "available", created_at: "2026-04-16T10:00:00Z", shelter: { id: "s1", name: "Happy Paws Vienna", location: "Vienna, AT" } },
];

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const species = searchParams.get("species") as AnimalSpecies | null;
  const maxAgeMonths = searchParams.get("maxAgeMonths");
  const cursor = searchParams.get("cursor");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? String(PAGE_SIZE), 10), 50);

  // Dev mock — no Supabase needed
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    let items = [...DEV_ANIMALS];
    if (species) items = items.filter((a) => a.species === species);
    if (maxAgeMonths) items = items.filter((a) => a.age_months <= parseInt(maxAgeMonths, 10));
    if (cursor) items = items.filter((a) => a.created_at < cursor);
    const page = items.slice(0, limit + 1);
    const hasNext = page.length > limit;
    const data = hasNext ? page.slice(0, limit) : page;
    return NextResponse.json({
      data,
      nextCursor: hasNext ? data[data.length - 1].created_at : null,
      total: DEV_ANIMALS.length,
    });
  }

  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("animals")
    .select(
      `id, shelter_id, name, species, breed, age_months, description, photo_urls, health_status, status, created_at,
       shelter:shelters(id, name, location)`,
      { count: "exact" }
    )
    .eq("status", "available")
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  if (species) query = query.eq("species", species);
  if (maxAgeMonths) {
    const max = parseInt(maxAgeMonths, 10);
    if (!isNaN(max)) query = query.lte("age_months", max);
  }
  if (cursor) query = query.lt("created_at", cursor);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: "INTERNAL_ERROR", message: error.message }, { status: 500 });
  }

  const rows = data ?? [];
  const hasNextPage = rows.length > limit;
  const items = hasNextPage ? rows.slice(0, limit) : rows;
  const nextCursor = hasNextPage ? items[items.length - 1].created_at : null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapped = items.map((r: any) => ({
    ...r,
    shelter: Array.isArray(r.shelter) ? r.shelter[0] ?? null : r.shelter,
  }));

  const body: AnimalsResponse = {
    data: mapped as AnimalsResponse["data"],
    nextCursor,
    total: count ?? 0,
  };

  return NextResponse.json(body);
}
