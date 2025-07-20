import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

serve(async (req) => {
  try {
    // Validação de segurança
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Inicializa cliente Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verifica alertas de segurança
    const { data: alerts, error: alertsError } = await supabaseClient
      .from('security_alerts')
      .select('*')
      .eq('status', 'PENDING')

    if (alertsError) throw alertsError

    // Processa alertas
    const processedAlerts = await Promise.all(
      (alerts || []).map(async (alert) => {
        const { error: updateError } = await supabaseClient
          .from('security_alerts')
          .update({ status: 'PROCESSED' })
          .eq('id', alert.id)

        if (updateError) throw updateError
        return alert
      })
    )

    return new Response(
      JSON.stringify({ success: true, data: processedAlerts }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in security-alerts:', error)
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}) 