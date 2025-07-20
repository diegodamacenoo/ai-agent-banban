import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Lista de origens permitidas
const allowedOrigins = [
  'http://localhost:3000',
  'https://banban.com.br',
  // Adicionar outros domÃ­nios conforme necessÃ¡rio
]

// ConfiguraÃ§Ãµes do CORS
const corsConfig = {
  // Headers padrÃ£o
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400', // 24 horas
}

// FunÃ§Ã£o para verificar origem
function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false
  return allowedOrigins.includes(origin) || origin.endsWith('.banban.com.br')
}

// Tipo para handlers de API
type ApiHandler = (req: NextRequest) => Promise<NextResponse> | NextResponse

// Middleware do CORS
export function withCors(handler: ApiHandler): ApiHandler {
  return async (req: NextRequest) => {
    const origin = req.headers.get('origin')
    
    // Verificar se a origem Ã© permitida
    if (!isOriginAllowed(origin)) {
      return new NextResponse(null, {
        status: 403,
        statusText: 'Forbidden'
      })
    }

    // Configurar headers do CORS
    const headers = {
      ...corsConfig,
      'Access-Control-Allow-Origin': origin || '*'
    }

    // Responder a requisiÃ§Ãµes OPTIONS
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, {
        headers,
        status: 204
      })
    }

    // Processar a requisiÃ§Ã£o normal
    const response = await handler(req)
    
    // Adicionar headers do CORS Ã  resposta
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  }
} 
