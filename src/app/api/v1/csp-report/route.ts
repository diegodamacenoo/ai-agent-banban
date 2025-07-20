import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/shared/utils/logger';
import { DEBUG_MODULES } from '@/shared/utils/debug-config';
import { createSupabaseServerClient } from '@/core/supabase/server';

const logger = createLogger(DEBUG_MODULES.SECURITY);

/**
 * Endpoint para receber relatórios de violação de CSP
 * 
 * Formato do relatório:
 * {
 *   "csp-report": {
 *     "document-uri": string,
 *     "referrer": string,
 *     "violated-directive": string,
 *     "effective-directive": string,
 *     "original-policy": string,
 *     "blocked-uri": string,
 *     "status-code": number
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const report = await request.json();
    const cspReport = report['csp-report'];
    
    if (!cspReport) {
      return NextResponse.json({ error: 'Invalid report format' }, { status: 400 });
    }

    // Extrair dados do relatório
    const {
      'document-uri': documentUri,
      'referrer': referrer,
      'violated-directive': violatedDirective,
      'effective-directive': effectiveDirective,
      'original-policy': originalPolicy,
      'blocked-uri': blockedUri,
      'status-code': statusCode
    } = cspReport;

    // Dados adicionais
    const userAgent = request.headers.get('user-agent');
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
    
    // Registrar violação no logger
    logger.warn('CSP Violation:', {
      documentUri,
      violatedDirective,
      blockedUri,
      userAgent,
      clientIP,
      timestamp: new Date().toISOString()
    });

    // Criar cliente Supabase
    const supabase = await createSupabaseServerClient();

    // Salvar violação no banco de dados
    const { data, error } = await supabase.rpc('insert_csp_violation', {
      document_uri: documentUri,
      violated_directive: violatedDirective,
      blocked_uri: blockedUri,
      effective_directive: effectiveDirective,
      original_policy: originalPolicy,
      referrer: referrer,
      status_code: statusCode,
      user_agent: userAgent,
      client_ip: clientIP,
      metadata: {
        headers: Object.fromEntries(request.headers.entries()),
        timestamp: new Date().toISOString()
      }
    });

    if (error) {
      logger.error('Error saving CSP violation:', error);
      return NextResponse.json({ error: 'Error saving violation' }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data }, { status: 201 });
  } catch (error) {
    logger.error('Error processing CSP report:', error);
    return NextResponse.json({ error: 'Invalid report format' }, { status: 400 });
  }
} 
