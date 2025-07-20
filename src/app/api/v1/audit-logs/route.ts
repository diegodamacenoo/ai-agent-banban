import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/core/supabase/server';
import { cookies, headers } from 'next/headers';
import { z } from 'zod';
import { withRateLimit } from '@/core/api/rate-limiter';
import { Profile } from '@/shared/types/supabase';

// Schema de validação para os parâmetros de filtro
const auditLogsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(10).max(100).default(20),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  userEmail: z.string().email().optional().or(z.literal('')),
  actionType: z.string().optional(),
  ipAddress: z.string().optional(),
});

/**
 * GET /api/audit-logs
 * 
 * @description Busca logs de auditoria do usuário autenticado com filtros e paginação
 * 
 * @param {number} page - Número da página (padrão: 1)
 * @param {number} limit - Itens por página (10-100, padrão: 20)
 * @param {string} dateFrom - Data início (DD/MM/AAAA)
 * @param {string} dateTo - Data fim (DD/MM/AAAA)
 * @param {string} userEmail - Email do usuário (filtro)
 * @param {string} actionType - Tipo de ação (filtro)
 * @param {string} ipAddress - Endereço IP (filtro)
 * 
 * @returns {Object} Lista paginada de logs com metadados
 * 
 * @security RLS automático + validação de autenticação
 */
export async function GET(request: NextRequest) {
  try {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for');
    const { success, headers: rateHeaders } = await withRateLimit('standard', 'audit-logs-api');
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { 
        status: 429,
        headers: rateHeaders
      });
    }

    const { searchParams } = new URL(request.url);
    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient();
    
    // Verificar autenticação
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Validar e sanitizar parâmetros
    const queryParams = auditLogsQuerySchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      userEmail: searchParams.get('userEmail') || undefined,
      actionType: searchParams.get('actionType') || undefined,
      ipAddress: searchParams.get('ipAddress') || undefined,
    });

    const { page, limit, dateFrom, dateTo, userEmail, actionType, ipAddress } = queryParams;
    const offset = (page - 1) * limit;

    // Construir query base
    let query = supabase
      .from('audit_logs')
      .select(`
        id,
        action_type,
        resource_type,
        resource_id,
        action_timestamp,
        ip_address,
        user_agent,
        organization_id,
        details
      `, { count: 'exact' })
      .eq('actor_user_id', user.id) // RLS dupla para segurança extra
      .order('action_timestamp', { ascending: false });

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
        // Adicionar 23:59:59 para incluir todo o dia
        endDate.setHours(23, 59, 59, 999);
        query = query.lte('action_timestamp', endDate.toISOString());
      }
    }

    // Aplicar filtro por tipo de ação
    if (actionType?.trim()) {
      query = query.ilike('action_type', `%${actionType.trim()}%`);
    }

    // Aplicar filtro por IP
    if (ipAddress?.trim()) {
      query = query.ilike('ip_address', `%${ipAddress.trim()}%`);
    }

    // Aplicar paginação
    query = query.range(offset, offset + limit - 1);

    // Executar query
    const { data: logs, error: logsError, count } = await query;

    if (logsError) {
      console.error('Erro ao buscar logs de auditoria:', logsError);
      return NextResponse.json(
        { error: 'Erro ao buscar logs de auditoria' },
        { status: 500 }
      );
    }

    // Buscar informações do usuário para exibição
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .single();

    const userDisplayName = profile 
      ? `${profile.first_name} ${profile.last_name}`.trim() || user.email
      : user.email;

    // Transformar dados para o formato esperado pelo frontend
    const transformedLogs = logs?.map(log => ({
      id: log.id.toString(),
      usuario: userDisplayName,
      acao: formatActionType(log.action_type),
      data: formatTimestamp(log.action_timestamp),
      ip: maskIP(log.ip_address || 'N/A'),
      dispositivo: formatUserAgent(log.user_agent || 'N/A'),
      detalhes: log.details
    })) || [];

    // Calcular metadados de paginação
    const totalPages = Math.ceil((count || 0) / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return NextResponse.json({
      data: transformedLogs,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNextPage,
        hasPreviousPage
      },
      filters: {
        dateFrom,
        dateTo,
        actionType,
        ipAddress
      }
    });

  } catch (error) {
    console.error('Erro crítico na API de audit logs:', error);
    
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
    minute: '2-digit'
  });
}

/**
 * Formata tipo de ação para exibição amigável
 */
function formatActionType(actionType: string): string {
  const actionMap: Record<string, string> = {
    'user_login': 'Entrou no sistema',
    'user_logout': 'Saiu do sistema',
    'password_changed': 'Alterou senha',
    'profile_updated': 'Atualizou perfil',
    'data_export_requested': 'Solicitou exportação de dados',
    'data_export_downloaded': 'Fez download de dados',
    'account_deactivated': 'Desativou conta',
    'account_deletion_requested': 'Solicitou exclusão de conta',
    'account_deletion_confirmed': 'Confirmou exclusão de conta',
    'mfa_enabled': 'Habilitou 2FA',
    'mfa_disabled': 'Desabilitou 2FA',
    'api_token_created': 'Criou token API',
    'api_token_revoked': 'Revogou token API',
    'audit_logs_viewed': 'Visualizou logs',
    'security_alert_settings_updated': 'Atualizou configurações de alertas de segurança',
    'organization_settings_updated': 'Atualizou configurações da organização',
    'user_enrolled_mfa': 'Ativou 2FA',
    'user_unenrolled_mfa': 'Desativou 2FA',
    'user_data_exported': 'Exportou dados',
    'user_data_imported': 'Importou dados',
    'user_data_deleted': 'Excluiu dados',
    'user_data_updated': 'Atualizou dados',
    'user_data_viewed': 'Visualizou dados',
    'user_data_downloaded': 'Fez download de dados',
  };

  return actionMap[actionType] || actionType.replace(/_/g, ' ').toUpperCase();
}

/**
 * Mascara endereço IP para privacidade (mantém apenas último octeto)
 */
function maskIP(ip: string): string {
  if (ip === 'N/A' || !ip) return 'N/A';
  
  // IPv4
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const ipv4Match = ip.match(ipv4Regex);
  
  if (ipv4Match) {
    return `XXX.XXX.XXX.${ipv4Match[4]}`;
  }
  
  // IPv6 (simplificado)
  if (ip.includes(':')) {
    const parts = ip.split(':');
    if (parts.length > 2) {
      return `XXXX:XXXX:...:${parts[parts.length - 1]}`;
    }
  }
  
  return 'XXX.XXX.XXX.XXX';
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
