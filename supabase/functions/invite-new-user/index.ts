import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const siteUrl = Deno.env.get('SUPABASE_SITE_URL');
// Mapeamento de roles para o enum correto
const roleMapping = {
  'admin': 'organization_admin',
  'organization_admin': 'organization_admin',
  'editor': 'editor',
  'reader': 'reader',
  'visitor': 'visitor',
  'master_admin': 'master_admin'
};
serve(async (req)=>{
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    const { email, organization_id, role, first_name, last_name } = await req.json();
    if (!email || !organization_id || !role) {
      return new Response(JSON.stringify({
        error: 'Email, organization_id e role são obrigatórios'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Mapear o role para o enum correto
    const mappedRole = roleMapping[role];
    if (!mappedRole) {
      return new Response(JSON.stringify({
        error: `Role inválido. Roles válidos: ${Object.keys(roleMapping).join(', ')}`
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Verificar se a organização existe
    const { data: org, error: orgError } = await supabase.from('organizations').select('id, company_trading_name').eq('id', organization_id).single();
    if (orgError || !org) {
      return new Response(JSON.stringify({
        error: 'Organização não encontrada'
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Verificar se o email já existe no auth
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const emailExists = existingUsers.users?.some((user)=>user.email === email);
    if (emailExists) {
      return new Response(JSON.stringify({
        error: 'Este e-mail já está em uso'
      }), {
        status: 409,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Primeiro, usar o Auth Admin API para convidar o usuário
    const { data: authData, error: authError } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: {
        first_name: first_name || '',
        last_name: last_name || '',
        role: mappedRole,
        organization_id: organization_id,
        organization_name: org.company_trading_name,
        status: 'active',
        is_setup_complete: false,
        // Adicionar dados para o template de email
        invite_type: 'organization_invite',
        company_name: org.company_trading_name
      },
      redirectTo: `${siteUrl}/auth/callback?type=invite&next=${encodeURIComponent('/setup-account?from=invite')}`
    });
    if (authError) {
      console.error('Erro ao enviar convite via Auth API:', authError);
      return new Response(JSON.stringify({
        error: `Erro ao enviar convite: ${authError.message}`
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Agora que temos o user_id do auth, criar o registro na tabela profiles (se first_name e last_name foram fornecidos)
    if (authData.user) {
      // Se first_name e last_name foram fornecidos, criar registro na tabela profiles (para compatibilidade com CreateUserSheet)
      if (first_name && last_name) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            first_name: first_name,
            last_name: last_name,
            role: mappedRole,
            organization_id: organization_id,
            status: 'ACTIVE',
            is_setup_complete: false,
            prefers_email_notifications: true,
            prefers_push_notifications: true,
            theme: 'light',
            is_2fa_enabled: false,
          });

        if (profileError) {
          console.error('Erro ao criar perfil do usuário:', profileError);
          // Se o perfil não foi criado, devemos remover o usuário da autenticação para manter consistência
          try {
            await supabase.auth.admin.deleteUser(authData.user.id);
            console.log('Usuário removido da autenticação devido ao erro no perfil');
          } catch (cleanupError) {
            console.error('Erro ao limpar usuário após falha no perfil:', cleanupError);
          }
          
          return new Response(JSON.stringify({
            error: `Falha ao criar perfil do usuário: ${profileError.message}`
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        console.log('Perfil criado com sucesso para usuário:', authData.user.id);
      }

      // Criar registro na tabela user_invites para tracking
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 7) // 7 dias para expirar
      ;
      const { data: invite, error: inviteError } = await supabase.from('user_invites').insert({
        user_id: authData.user.id,
        email,
        role: mappedRole,
        organization_id,
        status: 'pending',
        expires_at: expirationDate.toISOString()
      }).select().single();
      if (inviteError) {
        console.error('Erro ao criar convite:', inviteError);
        // Note: O convite por email já foi enviado, mas falhou o registro na tabela
        return new Response(JSON.stringify({
          success: true,
          warning: 'Convite enviado mas erro ao registrar na base de dados',
          error_details: inviteError.message,
          auth_user_id: authData.user.id
        }), {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      return new Response(JSON.stringify({
        success: true,
        invite_id: invite.id,
        auth_user_id: authData.user.id,
        profile_created: !!(first_name && last_name),
        message: 'Convite enviado com sucesso!',
        redirect_link: `${siteUrl}/auth/callback?type=invite&next=${encodeURIComponent('/setup-account?from=invite')}`
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    } else {
      return new Response(JSON.stringify({
        error: 'Falha ao obter dados do usuário após criação'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
  } catch (error) {
    console.error('Erro inesperado:', error);
    return new Response(JSON.stringify({
      error: 'Erro interno do servidor',
      details: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
