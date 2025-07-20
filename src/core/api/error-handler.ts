import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

// Tipos de erro padronizados
export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT = 'RATE_LIMIT_ERROR',
  DATABASE = 'DATABASE_ERROR',
  INTERNAL = 'INTERNAL_SERVER_ERROR'
}

// Interface para erros padronizados
interface StandardError {
  type: ErrorType
  message: string
  code: number
  details?: unknown
}

// Mapeamento de cÃ³digos HTTP
const HTTP_CODES = {
  [ErrorType.VALIDATION]: 400,
  [ErrorType.AUTHENTICATION]: 401,
  [ErrorType.AUTHORIZATION]: 403,
  [ErrorType.NOT_FOUND]: 404,
  [ErrorType.RATE_LIMIT]: 429,
  [ErrorType.DATABASE]: 500,
  [ErrorType.INTERNAL]: 500
}

// FunÃ§Ã£o para criar erro padronizado
export function createError(
  type: ErrorType,
  message: string,
  details?: unknown
): StandardError {
  return {
    type,
    message,
    code: HTTP_CODES[type],
    details
  }
}

// Handler de erros para APIs
export function handleApiError(error: unknown) {
  console.error('API Error:', error)

  // Se jÃ¡ Ã© um erro padronizado, retornar diretamente
  if ((error as StandardError).type && (error as StandardError).code) {
    const standardError = error as StandardError
    return NextResponse.json(
      {
        error: standardError.type,
        message: standardError.message,
        details: standardError.details
      },
      { status: standardError.code }
    )
  }

  // Erro do Supabase
  if ((error as Error).message?.includes('supabase')) {
    return NextResponse.json(
      {
        error: ErrorType.DATABASE,
        message: 'Erro no banco de dados',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }

  // Erro genÃ©rico
  return NextResponse.json(
    {
      error: ErrorType.INTERNAL,
      message: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    },
    { status: 500 }
  )
}

// Tipo para handlers de API
type ApiHandler = (
  req: NextRequest,
  params?: { params: Record<string, string> }
) => Promise<NextResponse> | NextResponse

// Wrapper para rotas de API
export function withErrorHandler(handler: ApiHandler): ApiHandler {
  return async (req: NextRequest, params?: { params: Record<string, string> }) => {
    try {
      return await handler(req, params)
    } catch (error) {
      return handleApiError(error)
    }
  }
}

// FunÃ§Ã£o para validar payload
export function validatePayload<T>(
  data: unknown,
  schema: { parse: (data: unknown) => T }
): T {
  try {
    return schema.parse(data)
  } catch (error) {
    throw createError(
      ErrorType.VALIDATION,
      'Dados invÃ¡lidos',
      error
    )
  }
} 
