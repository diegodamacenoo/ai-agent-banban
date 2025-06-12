import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { createSupabaseClient } from "@/lib/supabase/server";
import {
  createAuditLog,
  AUDIT_ACTION_TYPES,
  AUDIT_RESOURCE_TYPES,
} from "@/lib/utils/audit-logger";

const hardDeleteUserSchema = z.object({
  id: z.string().min(1, "ID do usuário é obrigatório"),
});

export async function POST(request: NextRequest) {
  try {
    console.log("[HARD-DELETE] Iniciando processo de hard delete");
    
    // Parse do body da requisição
    const body = await request.json();
    console.log("[HARD-DELETE] Body recebido:", { id: body.id });
    
    const validation = hardDeleteUserSchema.safeParse(body);

    if (!validation.success) {
      console.log("[HARD-DELETE] Validação falhou:", validation.error.errors);
      return NextResponse.json(
        {
          success: false,
          error: "Dados inválidos",
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { id } = validation.data;
    console.log("[HARD-DELETE] ID validado:", id);

    // Autenticação
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.log("[HARD-DELETE] Erro de sessão:", sessionError);
      return NextResponse.json(
        { success: false, error: "Usuário não autenticado" },
        { status: 401 }
      );
    }
    
    console.log("[HARD-DELETE] Usuário autenticado:", session.user.id);

    // Verificação de permissões
    const { data: userProfile, error: userProfileError } = await supabase
      .from("profiles")
      .select("role, organization_id")
      .eq("id", session.user.id)
      .single();

    if (userProfileError || !userProfile) {
      console.log("[HARD-DELETE] Erro ao buscar perfil:", userProfileError);
      return NextResponse.json(
        { success: false, error: "Erro ao buscar perfil do usuário" },
        { status: 403 }
      );
    }

    console.log("[HARD-DELETE] Perfil do usuário:", userProfile);

    if (userProfile.role !== "organization_admin") {
      console.log("[HARD-DELETE] Usuário não é admin:", userProfile.role);
      return NextResponse.json(
        {
          success: false,
          error:
            "Apenas administradores podem excluir permanentemente usuários",
        },
        { status: 403 }
      );
    }

    // Impede auto-exclusão
    if (id === session.user.id) {
      console.log("[HARD-DELETE] Tentativa de auto-exclusão");
      return NextResponse.json(
        {
          success: false,
          error: "Você não pode excluir permanentemente sua própria conta",
        },
        { status: 400 }
      );
    }

    // Buscar dados do usuário para validação e log
    console.log("[HARD-DELETE] Buscando dados do usuário alvo:", id);
    const { data: targetUser, error: targetUserError } = await supabase
      .from("profiles")
      .select("deleted_at, first_name, last_name, organization_id")
      .eq("id", id)
      .single();

    console.log("[HARD-DELETE] Resultado da busca:", { targetUser, targetUserError });

    if (targetUserError || !targetUser) {
      console.error("[HARD-DELETE] Erro ao buscar usuário a ser removido:", targetUserError);
      return NextResponse.json(
        { success: false, error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    console.log("[HARD-DELETE] Dados do usuário alvo:", targetUser);

    // Buscar email do usuário da tabela auth.users
    console.log("[HARD-DELETE] Buscando email do usuário");
    let userEmail = null;
    try {
      const { data: authUser, error: authUserError } =
        await supabase.auth.admin.getUserById(id);
      
      console.log("[HARD-DELETE] Resultado da busca do auth user:", { authUser, authUserError });
      
      userEmail = authUser?.user?.email || null;

      if (authUserError) {
        console.error("[HARD-DELETE] Erro ao buscar email do usuário:", authUserError);
        return NextResponse.json(
          { success: false, error: "Erro ao buscar email do usuário" },
          { status: 500 }
        );
      }

      console.log("[HARD-DELETE] Email do usuário:", userEmail);
    } catch (authError) {
      console.error("[HARD-DELETE] Exceção ao buscar email do usuário:", authError);
      return NextResponse.json(
        { success: false, error: "Erro ao buscar email do usuário" },
        { status: 500 }
      );
    }

    // Verifica se o usuário pertence à mesma organização
    if (targetUser.organization_id !== userProfile.organization_id) {
      console.log("[HARD-DELETE] Usuário de organização diferente");
      return NextResponse.json(
        { success: false, error: "Usuário não encontrado na sua organização" },
        { status: 404 }
      );
    }

    if (!targetUser.deleted_at) {
      console.log("[HARD-DELETE] Usuário não está marcado como deletado");
      return NextResponse.json(
        {
          success: false,
          error:
            "Apenas usuários previamente excluídos podem ser removidos permanentemente",
        },
        { status: 400 }
      );
    }

    // Exclui o perfil (hard delete)
    console.log("[HARD-DELETE] Executando hard delete do perfil");
    const { error: deleteError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("[HARD-DELETE] Erro ao excluir perfil do usuário:", deleteError);
      return NextResponse.json(
        { success: false, error: "Erro ao excluir usuário permanentemente" },
        { status: 500 }
      );
    }

    console.log("[HARD-DELETE] Perfil excluído com sucesso");

    // Registrar log de auditoria
    console.log("[HARD-DELETE] Registrando log de auditoria");
    try {
      await createAuditLog({
        actor_user_id: session.user.id,
        action_type: AUDIT_ACTION_TYPES.USER_DELETED,
        resource_type: AUDIT_RESOURCE_TYPES.USER,
        resource_id: id,
        details: {
          action: "hard_delete",
          target_user_email: userEmail,
          target_user_name: targetUser
            ? `${targetUser.first_name} ${targetUser.last_name}`.trim()
            : null,
        },
      });
      console.log("[HARD-DELETE] Log de auditoria registrado com sucesso");
    } catch (auditError) {
      console.error("[HARD-DELETE] Erro ao registrar log de auditoria:", auditError);
      // Não falhar a operação por causa do log de auditoria
      // O hard delete já foi executado com sucesso
    }

    console.log("[HARD-DELETE] Processo concluído com sucesso");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[HARD-DELETE] Erro inesperado ao excluir usuário permanentemente:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
