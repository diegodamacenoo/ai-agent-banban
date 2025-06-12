// React e Next.js imports
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Bibliotecas de terceiros
import { z } from 'zod';

// Tipos
// (tipos são inferidos do Supabase e Zod)

// Componentes da UI (design system, genéricos)
// (não aplicável para API routes)

// Componentes da aplicação (específicos de features)
// (não aplicável para API routes)

// Hooks personalizados
// (não aplicável para API routes)

// Utilitários e Helpers
import { createSupabaseClient } from '@/lib/supabase/server';
import { createAuditLog, AUDIT_ACTION_TYPES, AUDIT_RESOURCE_TYPES, captureRequestInfo } from '@/lib/utils/audit-logger';

// Estilos
// (não aplicável para API routes)

/**
 * Schema de validação para alteração de senha.
 * @description Valida os dados necessários para alterar a senha do usuário.
 */
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: z.string().min(8, 'Nova senha deve ter pelo menos 8 caracteres'),
  confirmNewPassword: z.string().min(1, 'Confirmação de senha é obrigatória'),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "As senhas não coincidem",
  path: ["confirmNewPassword"],
});

/**
 * API Route para alteração de senha do usuário.
 * 
 * @description Permite que usuários autenticados alterem suas senhas.
 * Verifica a senha atual antes de permitir a alteração.
 * 
 * @param {Request} request - Requisição contendo { currentPassword, newPassword, confirmNewPassword }
 * @returns {Promise<NextResponse>} Resposta de sucesso ou erro
 * 
 * @security 
 * - Requer autenticação válida
 * - Verifica senha atual antes da alteração
 * - Registra log de auditoria da alteração
 * - Valida força da nova senha (mínimo 8 caracteres)
 * 
 * @example
 * POST /api/auth/change-password
 * Body: { currentPassword: "old123", newPassword: "new12345", confirmNewPassword: "new12345" }
 * Response: { success: true }
 */
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);

    // Verificação de autenticação
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Erro de autenticação:', userError);
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Parse e validação do body da requisição
    const body = await request.json();
    console.log('DEBUG - Dados recebidos para mudança de senha');

    const validation = changePasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Dados inválidos', 
        details: validation.error.errors 
      }, { status: 400 });
    }

    const validatedData = validation.data;

    // Verificação da senha atual através de tentativa de login
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: validatedData.currentPassword,
    });

    if (signInError) {
      console.error('Erro ao verificar senha atual:', signInError);
      return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 400 });
    }

    // Execução da atualização da senha
    const { error: updateError } = await supabase.auth.updateUser({
      password: validatedData.newPassword
    });

    if (updateError) {
      console.error('Erro ao atualizar senha:', updateError);
      return NextResponse.json({ error: 'Erro ao atualizar senha' }, { status: 500 });
    }

    // Registro de log de auditoria
    try {
      const { ipAddress, userAgent, organizationId } = await captureRequestInfo(user.id);
      await createAuditLog({
        actor_user_id: user.id,
        action_type: AUDIT_ACTION_TYPES.PASSWORD_CHANGED,
        resource_type: AUDIT_RESOURCE_TYPES.USER,
        resource_id: user.id,
        ip_address: ipAddress,
        user_agent: userAgent,
        organization_id: organizationId,
        details: {
          user_email: user.email
        }
      });
    } catch (auditError) {
      console.error('Erro ao criar log de auditoria:', auditError);
      // Não falha a operação por causa do log de auditoria
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro na rota POST:', error);
    return NextResponse.json({ error: 'Erro ao alterar senha' }, { status: 500 });
  }
} 