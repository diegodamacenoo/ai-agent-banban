import { FastifyInstance, FastifyRequest, FastifyReply, FastifyError } from 'fastify';
import { BaseError } from './base-error';
import { ErrorLogger } from './error-logger';
import { InternalServerError } from './http-errors';

/**
 * Handler centralizado de erros para a API v2
 */
export class ErrorHandler {
  /**
   * Registra o handler de erros no servidor Fastify
   */
  static register(server: FastifyInstance) {
    server.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
      ErrorHandler.handleError(error, request, reply);
    });
  }

  /**
   * Processa e responde a erros de forma padronizada
   */
  static handleError(error: Error, request: FastifyRequest, reply: FastifyReply) {
    // Log do erro
    ErrorLogger.logError(error, {
      url: request.url,
      method: request.method,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
      userId: (request as any).user?.id,
      tenantId: (request as any).tenant?.id
    });

    // Se for um erro customizado, usar sua estrutura
    if (error instanceof BaseError) {
      return reply.code(error.statusCode).send(error.toJSON());
    }

    // Se for erro de validação do Fastify
    if ((error as any).validation) {
      const validationError = error as any;
      const messages = validationError.validation.map((v: any) => v.message).join('; ');
      
      return reply.code(400).send({
        success: false,
        error: {
          type: 'VALIDATION_ERROR',
          message: `Validation error: ${messages}`,
          timestamp: new Date().toISOString(),
          context: {
            validation: validationError.validation,
            url: request.url,
            method: request.method
          }
        }
      });
    }

    // Se for erro de JWT do Fastify
    if ((error as any).code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER') {
      return reply.code(401).send({
        success: false,
        error: {
          type: 'AUTHENTICATION_ERROR',
          message: 'Authorization header is required',
          timestamp: new Date().toISOString(),
          context: {
            url: request.url,
            method: request.method
          }
        }
      });
    }

    if ((error as any).code === 'FST_JWT_AUTHORIZATION_TOKEN_INVALID') {
      return reply.code(401).send({
        success: false,
        error: {
          type: 'AUTHENTICATION_ERROR',
          message: 'Invalid token',
          timestamp: new Date().toISOString(),
          context: {
            url: request.url,
            method: request.method
          }
        }
      });
    }

    // Para erros não tratados, converter para InternalServerError
    const internalError = new InternalServerError(
      'An unexpected error occurred',
      {
        originalError: error.message,
        url: request.url,
        method: request.method
      }
    );

    return reply.code(internalError.statusCode).send(internalError.toJSON());
  }

  /**
   * Middleware para capturar erros não tratados em rotas específicas
   */
  static async catchAsync(
    fn: (request: FastifyRequest, reply: FastifyReply) => Promise<any>
  ) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        return await fn(request, reply);
      } catch (error) {
        ErrorHandler.handleError(error as Error, request, reply);
      }
    };
  }

  /**
   * Valida se um erro deve ser exposto ao cliente
   */
  static shouldExposeError(error: Error): boolean {
    if (error instanceof BaseError) {
      return error.isOperational;
    }
    return false;
  }

  /**
   * Sanitiza dados sensíveis do erro antes de retornar ao cliente
   */
  static sanitizeError(error: BaseError): BaseError {
    // Em produção, podemos remover informações sensíveis
    if (process.env.NODE_ENV === 'production') {
      if (error.context) {
        const sanitizedContext = { ...error.context };
        
        // Remove campos sensíveis
        delete sanitizedContext.password;
        delete sanitizedContext.token;
        delete sanitizedContext.secret;
        delete sanitizedContext.key;
        
        // Criar novo erro com contexto sanitizado
        return new (error.constructor as any)(
          error.message,
          error.statusCode,
          error.errorCode,
          error.isOperational,
          sanitizedContext
        );
      }
    }
    
    return error;
  }
}