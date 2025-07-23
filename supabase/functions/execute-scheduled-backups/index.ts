import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BackupSchedule {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  nextBackup: string;
  lastBackup?: string;
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
    
    // Find implementations that need backup
    const { data: implementations, error: queryError } = await supabase
      .from('module_implementations')
      .select('id, name, template_config')
      .not('template_config->backupSchedule', 'is', null)
      .lte('template_config->backupSchedule->nextBackup', now)

    if (queryError) {
      throw new Error(`Error querying implementations: ${queryError.message}`)
    }

    console.log(`Found ${implementations?.length || 0} implementations needing backup`)

    const results = {
      processed: 0,
      errors: 0,
      details: [] as any[]
    }

    // Process each implementation
    for (const impl of implementations || []) {
      try {
        const schedule = impl.template_config?.backupSchedule as BackupSchedule
        
        if (!schedule?.enabled) {
          console.log(`Skipping ${impl.name} - backup not enabled`)
          continue
        }

        // Create backup data
        const { data: fullImpl, error: implError } = await supabase
          .from('module_implementations')
          .select(`
            *,
            base_module:base_modules(*)
          `)
          .eq('id', impl.id)
          .single()

        if (implError) {
          throw new Error(`Error fetching implementation data: ${implError.message}`)
        }

        // Get assignments for full backup
        const { data: assignments } = await supabase
          .from('tenant_module_assignments')
          .select('*')
          .eq('implementation_id', impl.id)

        const backupData = {
          implementation: fullImpl,
          base_module: fullImpl.base_module,
          assignments: assignments || [],
          backup_timestamp: now,
          backup_version: '1.0'
        }

        // Calculate backup size
        const backupSize = new TextEncoder().encode(JSON.stringify(backupData)).length

        // Calculate expiration date (30 days default)
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 30)

        // Create backup record
        const { data: backup, error: backupError } = await supabase
          .from('module_backups')
          .insert({
            implementation_id: impl.id,
            backup_type: 'full',
            backup_data: backupData,
            size_bytes: backupSize,
            created_by: null, // System backup
            expires_at: expiresAt.toISOString(),
            metadata: {
              version: fullImpl.version,
              description: 'Backup automático agendado',
              module_name: fullImpl.base_module?.name,
              implementation_name: fullImpl.name,
              compressed: false,
              encrypted: false,
              auto_generated: true
            }
          })
          .select()
          .single()

        if (backupError) {
          throw new Error(`Error creating backup: ${backupError.message}`)
        }

        // Calculate next backup date
        const nextBackup = calculateNextBackupDate(schedule.frequency)

        // Update implementation with last backup info
        const { error: updateError } = await supabase
          .from('module_implementations')
          .update({
            template_config: {
              ...impl.template_config,
              backupSchedule: {
                ...schedule,
                lastBackup: now,
                nextBackup: nextBackup.toISOString(),
                lastBackupId: backup.id
              }
            }
          })
          .eq('id', impl.id)

        if (updateError) {
          console.error(`Error updating implementation: ${updateError.message}`)
        }

        results.processed++
        results.details.push({
          implementation_id: impl.id,
          implementation_name: impl.name,
          backup_id: backup.id,
          size_bytes: backupSize,
          next_backup: nextBackup.toISOString()
        })

        console.log(`Backup created for ${impl.name}`)

      } catch (error) {
        console.error(`Error processing backup for ${impl.name}:`, error)
        results.errors++
        results.details.push({
          implementation_id: impl.id,
          implementation_name: impl.name,
          error: error.message
        })
      }
    }

    // Log results to audit_logs
    if (results.processed > 0 || results.errors > 0) {
      await supabase
        .from('audit_logs')
        .insert({
          actor_user_id: null,
          action_type: 'SCHEDULED_BACKUPS_EXECUTED',
          resource_type: 'module_backup',
          details: results
        })
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${results.processed} backups with ${results.errors} errors`,
        ...results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error in scheduled backup function:', error)
    
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

function calculateNextBackupDate(frequency: string): Date {
  const nextDate = new Date()
  
  switch (frequency) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1)
      break
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7)
      break
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1)
      break
    default:
      nextDate.setDate(nextDate.getDate() + 7) // Default: weekly
  }
  
  // Set to midnight UTC
  nextDate.setUTCHours(0, 0, 0, 0)
  
  return nextDate
}