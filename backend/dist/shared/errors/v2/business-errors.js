"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModuleError = exports.TenantError = exports.ExternalServiceError = exports.ConfigurationError = exports.DataIntegrityError = exports.BusinessError = void 0;
const base_error_1 = require("./base-error");
class BusinessError extends base_error_1.BaseError {
    constructor(message, context) {
        super(message, 422, 'BUSINESS_ERROR', true, context);
    }
}
exports.BusinessError = BusinessError;
class DataIntegrityError extends base_error_1.BaseError {
    constructor(message, context) {
        super(message, 422, 'DATA_INTEGRITY_ERROR', true, context);
    }
}
exports.DataIntegrityError = DataIntegrityError;
class ConfigurationError extends base_error_1.BaseError {
    constructor(message, context) {
        super(message, 500, 'CONFIGURATION_ERROR', false, context);
    }
}
exports.ConfigurationError = ConfigurationError;
class ExternalServiceError extends base_error_1.BaseError {
    constructor(message, context) {
        super(message, 502, 'EXTERNAL_SERVICE_ERROR', true, context);
    }
}
exports.ExternalServiceError = ExternalServiceError;
class TenantError extends base_error_1.BaseError {
    constructor(message, context) {
        super(message, 400, 'TENANT_ERROR', true, context);
    }
}
exports.TenantError = TenantError;
class ModuleError extends base_error_1.BaseError {
    constructor(message, context) {
        super(message, 404, 'MODULE_ERROR', true, context);
    }
}
exports.ModuleError = ModuleError;
//# sourceMappingURL=business-errors.js.map