import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface CancelInviteRequest {
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

    const { invite_id }: CancelInviteRequest = await req.json()

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

    // Verificar se o convite pode ser cancelado
    if (invite.status === 'cancelled') {
      return new Response(
        JSON.stringify({ error: 'Este convite já foi cancelado' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (invite.status === 'accepted') {
      return new Response(
        JSON.stringify({ error: 'Não é possível cancelar um convite já aceito' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Cancelar o convite atualizando o status
    const { error: updateError } = await supabase
      .from('user_invites')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', invite_id)

    if (updateError) {
      console.error('Erro ao cancelar convite:', updateError)
      return new Response(
        JSON.stringify({ error: 'Erro ao cancelar convite na base de dados' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Se existe user_id, também remover o usuário do Auth (opcional)
    if (invite.user_id) {
      try {
        await supabase.auth.admin.deleteUser(invite.user_id)
      } catch (authError) {
        console.warn('Erro ao remover usuário do Auth (não crítico):', authError)
        // Não falhar a operação se não conseguir remover do Auth
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Convite cancelado com sucesso!',
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