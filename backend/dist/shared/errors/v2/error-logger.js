"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorLogger = void 0;
const base_error_1 = require("./base-error");
const logger_1 = require("../../../utils/logger");
class ErrorLogger {
    static logError(error, context) {
        const errorInfo = {
            message: error.message,
            stack: error.stack,
            name: error.name,
            ...context
        };
        if (error instanceof base_error_1.BaseError) {
            errorInfo.statusCode = error.statusCode;
            errorInfo.errorCode = error.errorCode;
            errorInfo.isOperational = error.isOperational;
            errorInfo.context = error.context;
            errorInfo.timestamp = error.timestamp;
            if (error.statusCode >= 500) {
                logger_1.logger.error('Server error occurred', errorInfo);
            }
            else if (error.statusCode >= 400) {
                logger_1.logger.warn('Client error occurred', errorInfo);
            }
            else {
                logger_1.logger.info('Error occurred', errorInfo);
            }
        }
        else {
            logger_1.logger.error('Unexpected error occurred', errorInfo);
        }
    }
    static logAuthError(error, userId, userEmail) {
        this.logError(error, {
            userId,
            userEmail,
            type: 'authentication'
        });
    }
    static logValidationError(error, payload) {
        this.logError(error, {
            payload,
            type: 'validation'
        });
    }
    static logExternalServiceError(error, service, operation) {
        this.logError(error, {
            service,
            operation,
            type: 'external_service'
        });
    }
    static logTenantError(error, tenantId) {
        this.logError(error, {
            tenantId,
            type: 'tenant'
        });
    }
    static logModuleError(error, module, tenantId) {
        this.logError(error, {
            module,
            tenantId,
            type: 'module'
        });
    }
}
exports.ErrorLogger = ErrorLogger;
//# sourceMappingURL=error-logger.js.map