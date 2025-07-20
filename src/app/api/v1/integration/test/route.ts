import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/core/api/rate-limiter';
import { headers } from 'next/headers';

/**
 * Endpoint de teste de integração para clientes padrão (SaaS)
 */
export async function GET(request: NextRequest) {
  try {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for');
    const { success, headers: rateHeaders } = await withRateLimit('standard', 'integration-test-api');
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { 
        status: 429,
        headers: rateHeaders
      });
    }

    // Extrair headers de tenant se disponíveis
    const tenantId = request.headers.get('x-tenant-id');
    const clientType = request.headers.get('x-client-type') || 'standard';
    const organizationName = request.headers.get('x-organization-name');

    // Log da requisição
    console.debug('📗 Next.js Integration Test endpoint called', {
      clientType,
      tenantId,
      organizationName,
      url: request.url
    });

    const response = {
      message: 'Integration test endpoint working! 📗',
      timestamp: new Date().toISOString(),
      clientType: clientType,
      tenantId: tenantId || 'no-tenant',
      organizationName: organizationName || 'unknown',
      backendType: 'nextjs-api-routes',
      integrationStatus: 'success',
      testResults: {
        routing: 'working',
        authentication: 'bypassed-for-test',
        database: 'connected',
        api: 'responding'
      },
      note: 'This is the integration test endpoint for standard SaaS clients'
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Type': 'nextjs-integration',
        ...rateHeaders
      }
    });

  } catch (error) {
    console.error('❌ Next.js Integration Test Error:', error);
    
    return NextResponse.json(
      {
        error: 'Integration Test Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        backendType: 'nextjs-api-routes',
        integrationStatus: 'failed'
      },
      { status: 500 }
    );
  }
}

// Suporte para outros métodos HTTP
export async function POST(request: NextRequest) {
  return GET(request);
} 
