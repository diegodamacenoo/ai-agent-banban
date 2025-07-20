import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/core/api/rate-limiter';
import { headers } from 'next/headers';

/**
 * Endpoint de teste para clientes padrÃ£o (SaaS)
 * Equivalente ao /api/test do backend Fastify para clientes customizados
 */
export async function GET(request: NextRequest) {
  try {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for');
    const { success } = await withRateLimit('standard', ip ?? "127.0.0.1");
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    // Extrair headers de tenant se disponÃ­veis
    const tenantId = request.headers.get('x-tenant-id');
    const clientType = request.headers.get('x-client-type') || 'standard';
    const organizationName = request.headers.get('x-organization-name');

    // Log da requisiÃ§Ã£o
    console.debug('ðŸ“ Next.js API Route - Test endpoint called', {
      clientType,
      tenantId,
      organizationName,
      userAgent: request.headers.get('user-agent'),
      url: request.url
    });

    const response = {
      message: 'Next.js API Route is working! ðŸš€',
      timestamp: new Date().toISOString(),
      clientType: clientType,
      tenantId: tenantId || 'no-tenant',
      organizationName: organizationName || 'unknown',
      backendType: 'nextjs-api-routes',
      headers: {
        'x-tenant-id': tenantId,
        'x-client-type': clientType,
        'x-organization-name': organizationName
      },
      note: 'This is the standard SaaS endpoint served by Next.js API Routes'
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Type': 'nextjs-standard'
      }
    });

  } catch (error) {
    console.error('âŒ Next.js API Route Error:', error);
    
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        backendType: 'nextjs-api-routes'
      },
      { status: 500 }
    );
  }
}

// Suporte para outros mÃ©todos HTTP
export async function POST(request: NextRequest) {
  return GET(request);
}

export async function PUT(request: NextRequest) {
  return GET(request);
}

export async function DELETE(request: NextRequest) {
  return GET(request);
} 
