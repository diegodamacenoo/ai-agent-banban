import { NextRequest, NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { createSupabaseServerClient } from '@/core/supabase/server';
import { withRateLimit } from '@/core/api/rate-limiter';
import { 
  AUDIT_ACTION_TYPES,
  AUDIT_RESOURCE_TYPES,
  type AuditActionType,
  type AuditResourceType 
} from '@/core/schemas/audit';
import { getUserProfile } from '@/shared/utils/supabase-helpers';

interface AuditLogProfile {
  first_name: string;
  last_name: string;
  email: string;
}

interface AuditLog {
  id: string;
  actor_user_id: string;
  organization_id: string;
  action_type: AuditActionType;
  resource_type: AuditResourceType;
  resource_id: string;
  details: Record<string, any>;
  ip_address: string;
  user_agent: string;
  created_at: string;
  profiles: AuditLogProfile;
}

export async function GET(request: NextRequest) {
  try {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for');
    const { success, headers: rateHeaders } = await withRateLimit('standard', 'audit-logs-export-api');
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { 
        status: 429,
        headers: rateHeaders
      });
    }

    const supabase = await createSupabaseServerClient();
    
    // Verificar autenticação
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Acesso não autorizado' },
        { status: 401 }
      );
    }

    // Verificar se tem permissão para exportar logs (método robusto)
    const { data: profile, error: profileError } = await getUserProfile(supabase, user.id, 'role, organization_id');

    if (profileError) {
      console.error('Erro ao buscar perfil do usuário:', profileError);
      return NextResponse.json(
        { error: 'Erro ao verificar permissões' },
        { status: 500 }
      );
    }

    if (!profile || !(profile as any).organization_id || (profile as any).role !== 'master_admin') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas master admins podem exportar logs.' },
        { status: 403 }
      );
    }

    // Ler parâmetros da query
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const actionType = searchParams.get('action_type') as AuditActionType;
    const resourceType = searchParams.get('resource_type') as AuditResourceType;

    // Construir query base
    let query = supabase
      .from('audit_logs')
      .select(`
        id,
        actor_user_id,
        organization_id,
        action_type,
        resource_type,
        resource_id,
        details,
        ip_address,
        user_agent,
        created_at,
        profiles!audit_logs_actor_user_id_fkey (
          first_name,
          last_name,
          email
        )
      `)
      .eq('organization_id', (profile as any).organization_id)
      .order('created_at', { ascending: false });

    // Aplicar filtros
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    if (actionType && Object.values(AUDIT_ACTION_TYPES).includes(actionType)) {
      query = query.eq('action_type', actionType);
    }
    if (resourceType && Object.values(AUDIT_RESOURCE_TYPES).includes(resourceType)) {
      query = query.eq('resource_type', resourceType);
    }

    // Executar query
    const { data: logs, error: queryError } = await query;

    if (queryError) {
      console.error('Erro ao buscar logs de auditoria:', queryError);
      return NextResponse.json(
        { error: 'Erro ao buscar logs de auditoria' },
        { status: 500 }
      );
    }

    // Formatar dados para CSV
    const csvData = logs?.map((log: any) => ({
      id: log.id,
      data: log.created_at,
      usuario: `${log.profiles?.first_name || 'N/A'} ${log.profiles?.last_name || 'N/A'}`,
      email: log.profiles?.email || 'N/A',
      acao: log.action_type,
      recurso: log.resource_type,
      id_recurso: log.resource_id,
      detalhes: JSON.stringify(log.details),
      ip: log.ip_address,
      navegador: log.user_agent
    })) || [];

    // Gerar CSV
    const csvHeaders = [
      'ID',
      'Data',
      'Usuário',
      'Email',
      'Ação',
      'Recurso',
      'ID do Recurso',
      'Detalhes',
      'IP',
      'Navegador'
    ].join(',');

    const csvRows = csvData.map(row => [
      row.id,
      row.data,
      row.usuario,
      row.email,
      row.acao,
      row.recurso,
      row.id_recurso,
      row.detalhes,
      row.ip,
      row.navegador
    ].join(','));

    const csv = [csvHeaders, ...csvRows].join('\n');

    // Retornar CSV como download
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=audit_logs_${new Date().toISOString().split('T')[0]}.csv`
      }
    });

  } catch (error) {
    console.error('Erro na API de exportação de logs:', error);
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
