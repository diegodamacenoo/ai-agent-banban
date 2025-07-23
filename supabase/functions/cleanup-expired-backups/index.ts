import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get current timestamp
    const now = new Date().toISOString()
    
    // Find expired backups
    const { data: expiredBackups, error: queryError } = await supabase
      .from('module_backups')
      .select('id, implementation_id, backup_type, size_bytes, created_at, metadata')
      .lt('expires_at', now)

    if (queryError) {
      throw new Error(`Error querying expired backups: ${queryError.message}`)
    }

    console.log(`Found ${expiredBackups?.length || 0} expired backups`)

    const results = {
      deleted: 0,
      errors: 0,
      totalSizeFreed: 0,
      details: [] as any[]
    }

    // Process each expired backup
    for (const backup of expiredBackups || []) {
      try {
        // Delete the backup
        const { error: deleteError } = await supabase
          .from('module_backups')
          .delete()
          .eq('id', backup.id)

        if (deleteError) {
          throw new Error(`Error deleting backup: ${deleteError.message}`)
        }

        results.deleted++
        results.totalSizeFreed += backup.size_bytes || 0
        results.details.push({
          backup_id: backup.id,
          implementation_id: backup.implementation_id,
          backup_type: backup.backup_type,
          size_bytes: backup.size_bytes,
          created_at: backup.created_at,
          implementation_name: backup.metadata?.implementation_name
        })

        console.log(`Deleted expired backup ${backup.id}`)

      } catch (error) {
        console.error(`Error deleting backup ${backup.id}:`, error)
        results.errors++
        results.details.push({
          backup_id: backup.id,
          error: error.message
        })
      }
    }

    // Also cleanup orphaned backups (where implementation no longer exists)
    const { data: orphanedBackups, error: orphanError } = await supabase
      .from('module_backups')
      .select(`
        id,
        implementation_id,
        module_implementations!inner(id)
      `)
      .is('module_implementations.id', null)

    if (!orphanError && orphanedBackups) {
      console.log(`Found ${orphanedBackups.length} orphaned backups`)
      
      for (const orphan of orphanedBackups) {
        try {
          const { error: deleteError } = await supabase
            .from('module_backups')
            .delete()
            .eq('id', orphan.id)

          if (!deleteError) {
            results.deleted++
            console.log(`Deleted orphaned backup ${orphan.id}`)
          }
        } catch (error) {
          console.error(`Error deleting orphaned backup ${orphan.id}:`, error)
          results.errors++
        }
      }
    }

    // Log results to audit_logs if any action was taken
    if (results.deleted > 0 || results.errors > 0) {
      await supabase
        .from('audit_logs')
        .insert({
          actor_user_id: null,
          action_type: 'EXPIRED_BACKUPS_CLEANUP',
          resource_type: 'module_backup',
          details: {
            ...results,
            totalSizeFreedMB: (results.totalSizeFreed / 1024 / 1024).toFixed(2)
          }
        })
    }

    // Send notification if storage freed is significant (> 100MB)
    if (results.totalSizeFreed > 100 * 1024 * 1024) {
      // Get admin users to notify
      const { data: admins } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('role', 'admin')
        .limit(5)

      if (admins && admins.length > 0) {
        const notifications = admins.map(admin => ({
          user_id: admin.user_id,
          title: 'Limpeza de Backups Concluída',
          message: `Foram removidos ${results.deleted} backups expirados, liberando ${(results.totalSizeFreed / 1024 / 1024).toFixed(2)} MB de espaço.`,
          type: 'system_maintenance',
          metadata: {
            auto_generated: true,
            cleanup_type: 'expired_backups',
            ...results
          },
          read: false,
          created_at: now
        }))

        await supabase
          .from('notifications')
          .insert(notifications)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Deleted ${results.deleted} expired backups with ${results.errors} errors`,
        totalSizeFreedMB: (results.totalSizeFreed / 1024 / 1024).toFixed(2),
        ...results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error in cleanup function:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})