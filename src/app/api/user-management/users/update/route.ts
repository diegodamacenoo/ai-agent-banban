import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { createSupabaseClient } from "@/lib/supabase/server";
import {
  createAuditLog,
  AUDIT_ACTION_TYPES,
  AUDIT_RESOURCE_TYPES,
} from "@/lib/utils/audit-logger";
import {
  userRoleOptions,
  type UserRole,
} from "@/app/(protected)/settings/types/user-settings-types";

const updateUserSchema = z.object({
  id: z.string().min(1, "ID do usuário é obrigatório"),
  perfil: z.enum(userRoleOptions).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Parse do body da requisição
    const body = await request.json();
    const validation = updateUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Dados inválidos",
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { id, perfil } = validation.data;

    // Monta o objeto de atualização apenas com os campos fornecidos
    const updateData: { role?: UserRole } = {};
    if (perfil) {
      updateData.role = perfil;
    }

    // Se nenhum dado válido foi fornecido, retorna sucesso sem alteração
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: true });
    }

    // Autenticação
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    // Verificação de permissões
    const { data: userProfile, error: userProfileError } = await supabase
      .from("profiles")
      .select("role, organization_id")
      .eq("id", session.user.id)
      .single();

    if (userProfileError || !userProfile) {
      return NextResponse.json(
        { success: false, error: "Erro ao buscar perfil do usuário" },
        { status: 403 }
      );
    }

    if (userProfile.role !== "organization_admin") {
      return NextResponse.json(
        {
          success: false,
          error: "Apenas administradores podem atualizar perfis de usuário",
        },
        { status: 403 }
      );
    }

    // Buscar dados do usuário para validação e log
    const { data: targetUser, error: targetUserError } = await supabase
      .from("profiles")
      .select("first_name, last_name, role, organization_id")
      .eq("id", id)
      .single();

    if (targetUserError || !targetUser) {
      console.error(
        "Erro ao buscar usuário a ser atualizado:",
        targetUserError
      );
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Buscar email do usuário da tabela auth.users
    const { data: authUser, error: authUserError } =
      await supabase.auth.admin.getUserById(id);
    const userEmail = authUser?.user?.email || null;

    if (authUserError) {
      console.error("Erro ao buscar email do usuário:", authUserError);
      return NextResponse.json(
        { success: false, error: "Erro ao buscar email do usuário" },
        { status: 500 }
      );
    }

    // Verifica se o usuário pertence à mesma organização
    if (targetUser.organization_id !== userProfile.organization_id) {
      return NextResponse.json(
        { success: false, error: "Usuário não encontrado na sua organização" },
        { status: 404 }
      );
    }

    // Atualiza o perfil do usuário
    const { error: updateError } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", id);

    if (updateError) {
      console.error("Erro ao atualizar perfil do usuário:", updateError);
      return NextResponse.json(
        { success: false, error: "Erro ao atualizar perfil" },
        { status: 500 }
      );
    }

    // Registrar log de auditoria
    await createAuditLog({
      actor_user_id: session.user.id,
      action_type: AUDIT_ACTION_TYPES.USER_UPDATED,
      resource_type: AUDIT_RESOURCE_TYPES.USER,
      resource_id: id,
      details: {
        target_user_email: userEmail,
        target_user_name: targetUser
          ? `${targetUser.first_name} ${targetUser.last_name}`.trim()
          : null,
        changes: updateData,
        previous_role: targetUser.role,
        new_role: updateData.role,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro inesperado ao atualizar usuário:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
