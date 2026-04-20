import { NextRequest, NextResponse } from "next/server";
// NextRequest is used only in POST; GET uses no request params
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const animalId = body?.animal_id as string | undefined;

  if (!animalId || typeof animalId !== "string") {
    return NextResponse.json({ error: "INVALID_INPUT", message: "animal_id required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("adopter_favourites")
    .insert({ adopter_id: user.id, animal_id: animalId });

  if (error) {
    // 23505 = unique violation — already favourited
    if (error.code === "23505") {
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "INTERNAL_ERROR", message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function GET() {
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("adopter_favourites")
    .select("animal_id")
    .eq("adopter_id", user.id);

  if (error) {
    return NextResponse.json({ error: "INTERNAL_ERROR", message: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data.map((r) => r.animal_id) });
}
