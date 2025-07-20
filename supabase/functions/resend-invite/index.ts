import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const siteUrl = Deno.env.get('SUPABASE_SITE_URL')!

interface ResendInviteRequest {
  invite_id: string
}

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const { invite_id }: ResendInviteRequest = await req.json()

    if (!invite_id) {
      return new Response(
        JSON.stringify({ error: 'invite_id é obrigatório' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Buscar o convite
    const { data: invite, error: inviteError } = await supabase
      .from('user_invites')
      .select('*')
      .eq('id', invite_id)
      .single()

    if (inviteError || !invite) {
      return new Response(
        JSON.stringify({ error: 'Convite não encontrado' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verificar se o convite ainda está pendente
    if (invite.status !== 'pending') {
      return new Response(
        JSON.stringify({ error: 'Apenas convites pendentes podem ser reenviados' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Reenviar o convite usando Auth Admin API
    const { data: authData, error: authError } = await supabase.auth.admin.inviteUserByEmail(
      invite.email,
      {
        data: {
          first_name: '',
          last_name: '',
          role: invite.role,
          organization_id: invite.organization_id,
          status: 'active',
          is_setup_complete: false
        },
        redirectTo: `${siteUrl}/auth/callback?type=invite&next=${encodeURIComponent('/setup-account?from=invite')}`
      }
    )

    if (authError) {
      console.error('Erro ao reenviar convite via Auth API:', authError)
      return new Response(
        JSON.stringify({ error: `Erro ao reenviar convite: ${authError.message}` }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Atualizar a data de atualização do convite
    const { error: updateError } = await supabase
      .from('user_invites')
      .update({ 
        updated_at: new Date().toISOString(),
        // Estender expiração por mais 7 dias
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })
      .eq('id', invite_id)

    if (updateError) {
      console.error('Erro ao atualizar convite:', updateError)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Convite reenviado com sucesso!',
        invite_id: invite_id
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Erro inesperado:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})