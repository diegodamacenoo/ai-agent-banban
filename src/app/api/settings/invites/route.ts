import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function GET() {
  const supabase = createSupabaseAdminClient(await cookies());
  const { data, error } = await supabase
    .from("user_invites")
    .select("id, email, created_at, status, expires_at")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
} 