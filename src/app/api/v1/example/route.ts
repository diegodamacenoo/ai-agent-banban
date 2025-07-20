import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withErrorHandler } from '@/core/api/error-handler'
import { withRateLimit } from '@/core/api/rate-limiter'
import { createError, ErrorType } from '@/core/api/error-handler'
import { withCors } from '@/core/api/cors-config'

// Schema de validação
const ExampleSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  age: z.number().min(18)
})

// Handler da rota
async function handler(req: Request) {
  // Verificar rate limit
  const { success, headers: rateHeaders } = await withRateLimit('standard', 'example-api')
  if (!success) {
    throw createError(
      ErrorType.RATE_LIMIT,
      'Muitas requisições. Tente novamente em alguns minutos.'
    )
  }

  // Validar método
  if (req.method !== 'POST') {
    throw createError(
      ErrorType.VALIDATION,
      'Método não permitido'
    )
  }

  try {
    // Validar payload
    const data = await req.json()
    const validated = ExampleSchema.parse(data)

    // Processar dados
    // ... lógica de negócio aqui ...

    // Retornar resposta
    return NextResponse.json(
      { message: 'Dados processados com sucesso', data: validated },
      {
        status: 200,
        headers: rateHeaders
      }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createError(
        ErrorType.VALIDATION,
        'Dados inválidos',
        error.errors
      )
    }
    throw error
  }
}

// Exportar handler com tratamento de erros e CORS
export const POST = withCors(withErrorHandler(handler)) 
