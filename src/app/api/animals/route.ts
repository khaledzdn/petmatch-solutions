import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AnimalSpecies, AnimalsResponse } from "@/types/animals";

const PAGE_SIZE = 10;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const species = searchParams.get("species") as AnimalSpecies | null;
  const maxAgeMonths = searchParams.get("maxAgeMonths");
  const cursor = searchParams.get("cursor");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? String(PAGE_SIZE), 10), 50);

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
    .limit(limit + 1); // fetch one extra to determine if there's a next page

  if (species) {
    query = query.eq("species", species);
  }

  if (maxAgeMonths) {
    const max = parseInt(maxAgeMonths, 10);
    if (!isNaN(max)) query = query.lte("age_months", max);
  }

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: "INTERNAL_ERROR", message: error.message }, { status: 500 });
  }

  const rows = data ?? [];
  const hasNextPage = rows.length > limit;
  const items = hasNextPage ? rows.slice(0, limit) : rows;
  const nextCursor = hasNextPage ? items[items.length - 1].created_at : null;

  // Supabase types shelter as array from the join; the runtime value is a single object.
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
