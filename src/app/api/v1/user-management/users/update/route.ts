import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cookies, headers } from "next/headers";
import { createSupabaseServerClient } from "@/core/supabase/server";
import { createAuditLog } from '@/features/security/audit-logger';
import { AUDIT_ACTION_TYPES, AUDIT_RESOURCE_TYPES } from '@/core/schemas/audit';
import {
  userRoleOptions,
  type UserRole,
} from "@/app/(protected)/settings/types/user-settings-types";
import { ratelimit } from "@/shared/utils/rate-limiter";
import { captureRequestInfo } from '@/core/auth/request-info';

const updateUserSchema = z.object({
  id: z.string().min(1, "ID do usuÃ¡rio Ã© obrigatÃ³rio"),
  perfil: z.enum(userRoleOptions).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for');
    const { success } = await ratelimit.limit(ip ?? "127.0.0.1");

    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    // Parse do body da requisiÃ§Ã£o
    const body = await request.json();
    const validation = updateUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Dados invÃ¡lidos",
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { id, perfil } = validation.data;

    // Monta o objeto de atualizaÃ§Ã£o apenas com os campos fornecidos
    const updateData: { role?: UserRole } = {};
    if (perfil) {
      updateData.role = perfil;
    }

    // Se nenhum dado vÃ¡lido foi fornecido, retorna sucesso sem alteraÃ§Ã£o
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: true });
    }

    // AutenticaÃ§Ã£o
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "UsuÃ¡rio nÃ£o autenticado" },
        { status: 401 }
      );
    }

    // VerificaÃ§Ã£o de permissÃµes
    const { data: userProfile, error: userProfileError } = await supabase
      .from("profiles")
      .select("role, organization_id")
      .eq("id", user.id)
      .single();

    if (userProfileError || !userProfile) {
      return NextResponse.json(
        { success: false, error: "Erro ao buscar perfil do usuÃ¡rio" },
        { status: 403 }
      );
    }

    if (userProfile.role !== "organization_admin") {
      return NextResponse.json(
        {
          success: false,
          error: "Apenas administradores podem atualizar perfis de usuÃ¡rio",
        },
        { status: 403 }
      );
    }

    // Buscar dados do usuÃ¡rio para validaÃ§Ã£o e log
    const { data: targetUser, error: targetUserError } = await supabase
      .from("profiles")
      .select("first_name, last_name, role, organization_id")
      .eq("id", id)
      .single();

    if (targetUserError || !targetUser) {
      console.error(
        "Erro ao buscar usuÃ¡rio a ser atualizado:",
        targetUserError
      );
      return NextResponse.json(
        { error: "UsuÃ¡rio nÃ£o encontrado" },
        { status: 404 }
      );
    }

    // Buscar email do usuÃ¡rio da tabela auth.users
    const { data: authUser, error: authUserError } =
      await supabase.auth.admin.getUserById(id);
    const userEmail = authUser?.user?.email || null;

    if (authUserError) {
      console.error("Erro ao buscar email do usuÃ¡rio:", authUserError);
      return NextResponse.json(
        { success: false, error: "Erro ao buscar email do usuÃ¡rio" },
        { status: 500 }
      );
    }

    // Verifica se o usuÃ¡rio pertence Ã  mesma organizaÃ§Ã£o
    if (targetUser.organization_id !== userProfile.organization_id) {
      return NextResponse.json(
        { success: false, error: "UsuÃ¡rio nÃ£o encontrado na sua organizaÃ§Ã£o" },
        { status: 404 }
      );
    }

    // Atualiza o perfil do usuÃ¡rio
    const { error: updateError } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", id);

    if (updateError) {
      console.error("Erro ao atualizar perfil do usuÃ¡rio:", updateError);
      return NextResponse.json(
        { success: false, error: "Erro ao atualizar perfil" },
        { status: 500 }
      );
    }

    // Registrar atualização no log de auditoria
    const { ipAddress, userAgent } = await captureRequestInfo(id);
    await createAuditLog({
      actor_user_id: id,
      action_type: AUDIT_ACTION_TYPES.USER_UPDATED,
      resource_type: AUDIT_RESOURCE_TYPES.USER,
      resource_id: id,
      organization_id: userProfile.organization_id,
      details: {
        updated_fields: Object.keys(updateData),
        updated_by_admin: true,
      },
      old_value: targetUser,
      new_value: targetUser,
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro inesperado ao atualizar usuÃ¡rio:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
