import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cookies, headers } from "next/headers";
import { createSupabaseServerClient } from "@/core/supabase/server";
import { createAuditLog } from "@/features/security/audit-logger";
import { AUDIT_ACTION_TYPES, AUDIT_RESOURCE_TYPES } from "@/core/schemas/audit";
import { withRateLimit } from "@/core/api/rate-limiter";
import { log } from "@/shared/utils/logger";

const hardDeleteUserSchema = z.object({
  id: z.string().min(1, "User ID is required"),
});

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for');
    const { success } = await withRateLimit('standard', ip ?? "127.0.0.1");

    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    log.info("[HARD-DELETE] Starting hard delete process");
    
    // Validate request data
    const validatedData = hardDeleteUserSchema.parse(await request.json());
    
    // Get user session
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      log.error("[HARD-DELETE] Authentication error:", authError);
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check permissions
    const { data: userProfile, error: userProfileError } = await supabase
      .from("profiles")
      .select("role, organization_id")
      .eq("id", user.id)
      .single();

    if (userProfileError || !userProfile) {
      log.error("[HARD-DELETE] Error fetching profile:", userProfileError);
      return NextResponse.json(
        { success: false, error: "Error fetching user profile" },
        { status: 403 }
      );
    }

    if (userProfile.role !== "organization_admin") {
      log.warn("[HARD-DELETE] User is not admin:", userProfile.role);
      return NextResponse.json(
        {
          success: false,
          error: "Only administrators can permanently delete users",
        },
        { status: 403 }
      );
    }

    // Prevent self-deletion
    if (validatedData.id === user.id) {
      log.warn("[HARD-DELETE] Self-deletion attempt");
      return NextResponse.json(
        {
          success: false,
          error: "You cannot permanently delete your own account",
        },
        { status: 400 }
      );
    }

    // Get target user data
    const { data: targetUser, error: targetUserError } = await supabase
      .from("profiles")
      .select("deleted_at, first_name, last_name, organization_id")
      .eq("id", validatedData.id)
      .single();

    if (targetUserError || !targetUser) {
      log.error("[HARD-DELETE] Error fetching user to delete:", targetUserError);
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Get user email from auth.users
    let userEmail = null;
    try {
      const { data: authUser, error: authUserError } =
        await supabase.auth.admin.getUserById(validatedData.id);
      
      userEmail = authUser?.user?.email || null;

      if (authUserError) {
        log.error("[HARD-DELETE] Error fetching user email:", authUserError);
        return NextResponse.json(
          { success: false, error: "Error fetching user email" },
          { status: 500 }
        );
      }
    } catch (authError) {
      log.error("[HARD-DELETE] Exception fetching user email:", authError);
      return NextResponse.json(
        { success: false, error: "Error fetching user email" },
        { status: 500 }
      );
    }

    // Check organization isolation
    if (targetUser.organization_id !== userProfile.organization_id) {
      log.warn("[HARD-DELETE] User from different organization");
      return NextResponse.json(
        { success: false, error: "User not found in your organization" },
        { status: 404 }
      );
    }

    // Check if user is soft deleted
    if (!targetUser.deleted_at) {
      log.warn("[HARD-DELETE] User is not marked as deleted");
      return NextResponse.json(
        {
          success: false,
          error: "Only previously deleted users can be permanently removed",
        },
        { status: 400 }
      );
    }

    // Hard delete profile
    const { error: deleteError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", validatedData.id);

    if (deleteError) {
      log.error("[HARD-DELETE] Error deleting user profile:", deleteError);
      return NextResponse.json(
        { success: false, error: "Error permanently deleting user" },
        { status: 500 }
      );
    }

    // Create audit log
    try {
      await createAuditLog({
        actor_user_id: user.id,
        action_type: AUDIT_ACTION_TYPES.USER_DELETED,
        resource_type: AUDIT_RESOURCE_TYPES.USER,
        resource_id: validatedData.id,
        details: { message: 'User permanently deleted', isAdmin: true }
      });
    } catch (auditError) {
      log.error("[HARD-DELETE] Error creating audit log:", auditError);
      // Don't fail the operation because of audit log
      // Hard delete was already successful
    }

    log.info("[HARD-DELETE] Process completed successfully");
    return NextResponse.json({ success: true });
  } catch (error) {
    log.error("[HARD-DELETE] Unexpected error permanently deleting user:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
