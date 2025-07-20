import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/core/supabase/server";
import { cookies, headers } from "next/headers";
import { ratelimit } from "@/shared/utils/rate-limiter";

export async function GET() {
  try {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for');
    const { success } = await ratelimit.limit(ip ?? "127.0.0.1");

    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const supabase = await createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("user_invites")
      .select("id, email, created_at, status, expires_at")
      .order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  } catch (error) {
    console.error("[API_ERROR] /api/settings/invites:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
} 
