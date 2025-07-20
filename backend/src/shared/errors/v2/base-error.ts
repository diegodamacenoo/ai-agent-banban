/**
 * Classe base para todos os erros customizados da API v2
 */
export abstract class BaseError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, any>;
  public readonly timestamp: string;

  constructor(
    message: string,
    statusCode: number,
    errorCode: string,
    isOperational = true,
    context?: Record<string, any>
  ) {
    super(message);
    
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    this.context = context;
    this.timestamp = new Date().toISOString();

    // Ensure the name of this error is the same as the class name
    Object.setPrototypeOf(this, new.target.prototype);
    
    // Capture stack trace if available
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Converte o erro para um formato JSON padronizado
   */
  toJSON() {
    return {
      success: false,
      error: {
        type: this.errorCode,
        message: this.message,
        timestamp: this.timestamp,
        context: this.context
      }
    };
  }

  /**
   * Verifica se o erro é operacional (esperado) ou não
   */
  static isOperationalError(error: Error): boolean {
    if (error instanceof BaseError) {
      return error.isOperational;
    }
    return false;
  }
}