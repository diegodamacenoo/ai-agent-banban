import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/core/supabase/server';
import { cookies, headers } from 'next/headers';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createAuditLog } from '@/features/security/audit-logger';
import { AUDIT_ACTION_TYPES, AUDIT_RESOURCE_TYPES } from '@/core/schemas/audit';
import { withRateLimit } from '@/core/api/rate-limiter';

const profileUpdateSchema = z.object({
    first_name: z.string().min(1, 'Nome é obrigatório'),
    last_name: z.string().optional(),
    job_title: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    location: z.string().optional().nullable(),
    username: z.string().optional().nullable(),
    avatar_url: z.string().url().optional().nullable(),
    email: z.string().email('E-mail inválido'),
    role: z.string(),
    theme: z.string(),
    team_id: z.string().uuid().optional().nullable().or(z.literal("").transform(() => null)),
});

export type ProfileData = {
    first_name: string;
    last_name: string;
    job_title: string | null;
    phone: string | null;
    avatar_url: string | null;
    team_id: string | null;
    organization_id: string | null;
    username: string | null;
    location: string | null;
    email: string;
    role: string;
    theme: string;
};

export async function PUT(request: Request) {
    try {
        const headersList = await headers();
        const ip = headersList.get('x-forwarded-for');
        const { success: rateLimitSuccess, headers: rateHeaders } = await withRateLimit('standard', 'profile-update-api');
        if (!rateLimitSuccess) {
            return NextResponse.json({ error: "Too many requests" }, { 
                status: 429,
                headers: rateHeaders
            });
        }

        // Cria o cliente do Supabase usando o método correto
        const supabase = await createSupabaseServerClient();

        // Verifica se o usuário está autenticado
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            console.error('Erro de autenticação:', userError);
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        console.debug('DEBUG - Usuário autenticado:', user.id);
        
        // Obtém body da requisição
        const body = await request.json();
        console.debug('DEBUG - Dados recebidos:', body);

        // Valida os dados do corpo da requisição
        const validatedData = profileUpdateSchema.parse(body);  
        console.debug('DEBUG - Dados validados:', validatedData);

        // Atualiza o perfil do usuário
        const { data, error, success } = await updateProfile(validatedData, user.id);

        // Verifica se houve um erro na atualização
        if (!success || error) {
            console.error('Erro na atualização:', error);
            return NextResponse.json({ error }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Erro na rota PUT:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ 
                error: 'Dados inválidos', 
                details: error.errors 
            }, { status: 400 });
        }
        return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 });
    }
}

/**
 * Atualiza o perfil do usuário atualmente autenticado
 * @param {z.infer<typeof profileUpdateSchema>} formData Dados do perfil a serem atualizados
 * @param {string} userId ID do usuário
 * @returns {Promise<{success: boolean, error?: string, data?: ProfileData}>} Resultado da operação
 */
async function updateProfile(
    formData: z.infer<typeof profileUpdateSchema>, 
    userId: string
): Promise<{ success: boolean, error?: string, data?: ProfileData }> {
    try {
        const supabase = await createSupabaseServerClient();

        console.debug('DEBUG - Dados do perfil a serem atualizados:', formData);

        // Buscar dados atuais do perfil para comparar mudanças
        const { data: currentProfile } = await supabase
            .from('profiles')
            .select('first_name, last_name, job_title, phone, team_id, location, username, avatar_url')
            .eq('id', userId)
            .single();

        console.debug('DEBUG - Perfil atual:', currentProfile);

        // Preparar dados para atualização - garantir que valores vazios virem null
        const updateData = {
            first_name: formData.first_name,
            last_name: formData.last_name,
            job_title: formData.job_title || null,
            phone: formData.phone || null,
            // Garantir que team_id seja null se for string vazia
            team_id: formData.team_id && formData.team_id.trim() !== '' ? formData.team_id : null,
            location: formData.location || null,
            username: formData.username || null,
            avatar_url: formData.avatar_url || null,
            updated_at: new Date().toISOString()
        };

        console.debug('DEBUG - Dados preparados para update:', updateData);

        // Atualiza o perfil do usuário
        const { data, error } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', userId)
            .select('first_name, last_name, job_title, phone, avatar_url, team_id, organization_id, username, location, role')
            .single();

        console.debug('DEBUG - Perfil atualizado:', data);

        // Se houve um erro, retorna o erro
        if (error) {
            console.error('Erro ao atualizar perfil:', error);
            return { success: false, error: error.message };
        }

        // Registrar log de auditoria
        try {
            await createAuditLog({
                actor_user_id: userId,
                action_type: AUDIT_ACTION_TYPES.USER_UPDATED,
                resource_type: AUDIT_RESOURCE_TYPES.USER,
                resource_id: userId,
                details: {
                    changes: formData,
                    previous_values: currentProfile || {}
                }
            });
        } catch (auditError) {
            console.error('Erro ao criar log de auditoria:', auditError);
            // Não falha a operação por causa do log de auditoria
        }

        // Revalidar as rotas que possam exibir dados do perfil
        revalidatePath('/');

        // Adiciona o e-mail do objeto auth ao resultado
        const profileResult: ProfileData = {
            ...(data as any),
            email: formData.email
        };

        return { success: true, data: profileResult };
    } catch (error) {
        console.error('Erro inesperado ao atualizar perfil:', error);
        return { success: false, error: 'Falha ao atualizar o perfil' };
    }
} 
