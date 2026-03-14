import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = createAdminClient();
  const url = new URL(req.url);
  const iso = url.searchParams.get("iso");
  const fuel = url.searchParams.get("fuel");
  const state = url.searchParams.get("state");
  const search = url.searchParams.get("search");

  let query = supabase.from("projects").select("*");

  if (iso) query = query.eq("iso_region", iso);
  if (fuel) query = query.eq("fuel_type", fuel);
  if (state) query = query.eq("state", state);
  if (search) {
    query = query.or(`project_name.ilike.%${search}%,queue_number.ilike.%${search}%,description.ilike.%${search}%`);
  }

  const { data, error } = await query.order("updated_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = createAdminClient();
  const body = await req.json();

  // Remove fields that shouldn't be inserted
  delete body.id;
  delete body.created_at;
  delete body.updated_at;

  // Convert security_milestones string to JSON if needed
  if (typeof body.security_milestones === "string") {
    try { body.security_milestones = JSON.parse(body.security_milestones); } catch { /* keep as-is */ }
  }

  const { data, error } = await supabase.from("projects").insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
