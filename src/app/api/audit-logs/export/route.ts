import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { z } from 'zod';

// Schema de validação para exportação
const exportQuerySchema = z.object({
  format: z.enum(['csv', 'json']).default('csv'),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  actionType: z.string().optional(),
  ipAddress: z.string().optional(),
  limit: z.coerce.number().min(1).max(10000).default(1000), // Limite para exportação
});

/**
 * GET /api/audit-logs/export
 * 
 * @description Exporta logs de auditoria do usuário autenticado em formato CSV ou JSON
 * 
 * @param {string} format - Formato de exportação (csv|json)
 * @param {string} dateFrom - Data início (DD/MM/AAAA)
 * @param {string} dateTo - Data fim (DD/MM/AAAA)
 * @param {string} actionType - Tipo de ação (filtro)
 * @param {string} ipAddress - Endereço IP (filtro)
 * @param {number} limit - Limite de registros (máx 10.000)
 * 
 * @returns {File} Arquivo CSV ou JSON para download
 * 
 * @security RLS automático + validação de autenticação
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);
    
    // Verificar autenticação
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Validar parâmetros
    const queryParams = exportQuerySchema.parse({
      format: searchParams.get('format'),
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      actionType: searchParams.get('actionType') || undefined,
      ipAddress: searchParams.get('ipAddress') || undefined,
      limit: searchParams.get('limit'),
    });

    const { format, dateFrom, dateTo, actionType, ipAddress, limit } = queryParams;

    // Construir query base
    let query = supabase
      .from('audit_logs')
      .select(`
        id,
        action_type,
        resource_type,
        resource_id,
        action_timestamp,
        details
      `)
      .eq('actor_user_id', user.id)
      .order('action_timestamp', { ascending: false })
      .limit(limit);

    // Aplicar filtros de data
    if (dateFrom) {
      const startDate = parseBrazilianDate(dateFrom);
      if (startDate) {
        query = query.gte('action_timestamp', startDate.toISOString());
      }
    }

    if (dateTo) {
      const endDate = parseBrazilianDate(dateTo);
      if (endDate) {
        endDate.setHours(23, 59, 59, 999);
        query = query.lte('action_timestamp', endDate.toISOString());
      }
    }

    // Aplicar filtro por tipo de ação
    if (actionType && actionType.trim()) {
      query = query.ilike('action_type', `%${actionType.trim()}%`);
    }

    // Aplicar filtro por IP
    if (ipAddress && ipAddress.trim()) {
      query = query.or(`details->>'ip_address'.ilike.%${ipAddress.trim()}%`);
    }

    // Executar query
    const { data: logs, error: logsError } = await query;

    if (logsError) {
      console.error('Erro ao buscar logs para exportação:', logsError);
      return NextResponse.json(
        { error: 'Erro ao buscar logs para exportação' },
        { status: 500 }
      );
    }

    // Buscar informações do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .single();

    const userDisplayName = profile 
      ? `${profile.first_name} ${profile.last_name}`.trim() || user.email
      : user.email;

    // Transformar dados para exportação
    const exportData = logs?.map(log => ({
      ID: log.id.toString(),
      Usuario: userDisplayName,
      'Tipo de Ação': formatActionType(log.action_type),
      'Tipo de Recurso': log.resource_type,
      'ID do Recurso': log.resource_id,
      'Data e Hora': formatTimestamp(log.action_timestamp),
      'Endereço IP': log.details?.ip_address || 'N/A',
      'Navegador/Dispositivo': formatUserAgent(log.details?.user_agent || 'N/A'),
      'Detalhes Adicionais': JSON.stringify(log.details || {}),
    })) || [];

    // Gerar arquivo baseado no formato
    if (format === 'csv') {
      const csvContent = generateCSV(exportData);
      const fileName = `logs-auditoria-${new Date().toISOString().split('T')[0]}.csv`;
      
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Cache-Control': 'no-cache',
        },
      });
    } else {
      // JSON format
      const jsonContent = JSON.stringify({
        metadata: {
          exported_at: new Date().toISOString(),
          exported_by: userDisplayName,
          total_records: exportData.length,
          filters_applied: { dateFrom, dateTo, actionType, ipAddress }
        },
        logs: exportData
      }, null, 2);
      
      const fileName = `logs-auditoria-${new Date().toISOString().split('T')[0]}.json`;
      
      return new NextResponse(jsonContent, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Cache-Control': 'no-cache',
        },
      });
    }

  } catch (error) {
    console.error('Erro crítico na exportação de audit logs:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * Gera conteúdo CSV a partir dos dados
 */
function generateCSV(data: any[]): string {
  if (data.length === 0) {
    return 'Nenhum dado para exportar';
  }

  // Headers
  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');

  // Rows
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      // Escapar aspas e quebras de linha
      const escaped = String(value).replace(/"/g, '""');
      // Envolver em aspas se contém vírgula, quebra de linha ou aspas
      return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
    }).join(',');
  });

  return [csvHeaders, ...csvRows].join('\n');
}

/**
 * Converte data no formato DD/MM/AAAA para Date
 */
function parseBrazilianDate(dateStr: string): Date | null {
  const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const match = dateStr.match(regex);
  
  if (!match) return null;
  
  const [, day, month, year] = match;
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  
  // Validar se a data é válida
  if (date.getDate() !== parseInt(day) || 
      date.getMonth() !== parseInt(month) - 1 || 
      date.getFullYear() !== parseInt(year)) {
    return null;
  }
  
  return date;
}

/**
 * Formata timestamp para exibição
 */
function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * Formata tipo de ação para exibição amigável
 */
function formatActionType(actionType: string): string {
  const actionMap: Record<string, string> = {
    'user_login': 'Login',
    'user_logout': 'Logout',
    'password_changed': 'Alteração de senha',
    'profile_updated': 'Atualização de perfil',
    'data_export_requested': 'Solicitação de exportação',
    'data_export_downloaded': 'Download de dados',
    'account_deactivated': 'Desativação de conta',
    'account_deletion_requested': 'Solicitação de exclusão',
    'account_deletion_confirmed': 'Confirmação de exclusão',
    'mfa_enabled': 'MFA habilitado',
    'mfa_disabled': 'MFA desabilitado',
    'api_token_created': 'Token API criado',
    'api_token_revoked': 'Token API revogado',
    'audit_logs_viewed': 'Visualização de logs',
    'audit_logs_exported': 'Exportação de logs'
  };

  return actionMap[actionType] || actionType.replace(/_/g, ' ').toUpperCase();
}

/**
 * Formata User-Agent para exibição simplificada
 */
function formatUserAgent(userAgent: string): string {
  if (userAgent === 'N/A' || !userAgent) return 'N/A';
  
  // Detectar navegador
  let browser = 'Desconhecido';
  let os = 'Desconhecido';
  
  // Navegadores
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
  else if (userAgent.includes('Edg')) browser = 'Edge';
  else if (userAgent.includes('Opera')) browser = 'Opera';
  
  // Sistemas operacionais
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac OS')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iOS')) os = 'iOS';
  
  return `${browser}/${os}`;
} 