"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorHandler = void 0;
const base_error_1 = require("./base-error");
const error_logger_1 = require("./error-logger");
const http_errors_1 = require("./http-errors");
class ErrorHandler {
    static register(server) {
        server.setErrorHandler((error, request, reply) => {
            ErrorHandler.handleError(error, request, reply);
        });
    }
    static handleError(error, request, reply) {
        error_logger_1.ErrorLogger.logError(error, {
            url: request.url,
            method: request.method,
            userAgent: request.headers['user-agent'],
            ip: request.ip,
            userId: request.user?.id,
            tenantId: request.tenant?.id
        });
        if (error instanceof base_error_1.BaseError) {
            return reply.code(error.statusCode).send(error.toJSON());
        }
        if (error.validation) {
            const validationError = error;
            const messages = validationError.validation.map((v) => v.message).join('; ');
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
        if (error.code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER') {
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
        if (error.code === 'FST_JWT_AUTHORIZATION_TOKEN_INVALID') {
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
        const internalError = new http_errors_1.InternalServerError('An unexpected error occurred', {
            originalError: error.message,
            url: request.url,
            method: request.method
        });
        return reply.code(internalError.statusCode).send(internalError.toJSON());
    }
    static async catchAsync(fn) {
        return async (request, reply) => {
            try {
                return await fn(request, reply);
            }
            catch (error) {
                ErrorHandler.handleError(error, request, reply);
            }
        };
    }
    static shouldExposeError(error) {
        if (error instanceof base_error_1.BaseError) {
            return error.isOperational;
        }
        return false;
    }
    static sanitizeError(error) {
        if (process.env.NODE_ENV === 'production') {
            if (error.context) {
                const sanitizedContext = { ...error.context };
                delete sanitizedContext.password;
                delete sanitizedContext.token;
                delete sanitizedContext.secret;
                delete sanitizedContext.key;
                return new error.constructor(error.message, error.statusCode, error.errorCode, error.isOperational, sanitizedContext);
            }
        }
        return error;
    }
}
exports.ErrorHandler = ErrorHandler;
//# sourceMappingURL=error-handler.js.map