"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiKeyUsageLogSchema = exports.ApiKeyValidationSchema = exports.ValidateApiKeySchema = exports.UpdateApiKeySchema = exports.ApiKeyListSchema = exports.ApiKeyCreatedSchema = exports.CreateApiKeySchema = void 0;
exports.CreateApiKeySchema = {
    type: 'object',
    required: ['name', 'permissions'],
    properties: {
        name: { type: 'string', minLength: 1, maxLength: 100 },
        description: { type: 'string', maxLength: 500 },
        permissions: {
            type: 'array',
            items: {
                type: 'string',
                enum: [
                    'webhook:purchase',
                    'webhook:inventory',
                    'webhook:sales',
                    'webhook:transfer',
                    'webhook:returns',
                    'webhook:etl',
                    'system:admin',
                    'system:read',
                    'system:write'
                ]
            },
            minItems: 1
        },
        expires_at: { type: 'string', format: 'date-time' },
        rate_limit: { type: 'number', minimum: 1, maximum: 10000 },
        organization_id: { type: 'string', format: 'uuid' },
    }
};
exports.ApiKeyCreatedSchema = {
    type: 'object',
    properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        description: { type: 'string' },
        permissions: {
            type: 'array',
            items: { type: 'string' }
        },
        expires_at: { type: 'string', format: 'date-time' },
        rate_limit: { type: 'number' },
        organization_id: { type: 'string', format: 'uuid' },
        api_key: { type: 'string' },
        created_at: { type: 'string', format: 'date-time' },
        is_active: { type: 'boolean' },
    }
};
exports.ApiKeyListSchema = {
    type: 'object',
    properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        description: { type: 'string' },
        permissions: {
            type: 'array',
            items: { type: 'string' }
        },
        expires_at: { type: 'string', format: 'date-time' },
        rate_limit: { type: 'number' },
        organization_id: { type: 'string', format: 'uuid' },
        created_at: { type: 'string', format: 'date-time' },
        last_used_at: { type: 'string', format: 'date-time' },
        is_active: { type: 'boolean' },
        usage_count: { type: 'number' },
        prefix: { type: 'string' },
    }
};
exports.UpdateApiKeySchema = {
    type: 'object',
    properties: {
        name: { type: 'string', minLength: 1, maxLength: 100 },
        description: { type: 'string', maxLength: 500 },
        permissions: {
            type: 'array',
            items: {
                type: 'string',
                enum: [
                    'webhook:purchase',
                    'webhook:inventory',
                    'webhook:sales',
                    'webhook:transfer',
                    'webhook:returns',
                    'webhook:etl',
                    'system:admin',
                    'system:read',
                    'system:write'
                ]
            },
            minItems: 1
        },
        expires_at: { type: 'string', format: 'date-time' },
        rate_limit: { type: 'number', minimum: 1, maximum: 10000 },
        is_active: { type: 'boolean' },
    }
};
exports.ValidateApiKeySchema = {
    type: 'object',
    required: ['api_key'],
    properties: {
        api_key: { type: 'string', minLength: 32 },
        required_permission: {
            type: 'string',
            enum: [
                'webhook:purchase',
                'webhook:inventory',
                'webhook:sales',
                'webhook:transfer',
                'webhook:returns',
                'webhook:etl',
                'system:admin',
                'system:read',
                'system:write'
            ]
        },
        organization_id: { type: 'string', format: 'uuid' },
    }
};
exports.ApiKeyValidationSchema = {
    type: 'object',
    properties: {
        valid: { type: 'boolean' },
        api_key_id: { type: 'string', format: 'uuid' },
        organization_id: { type: 'string', format: 'uuid' },
        permissions: {
            type: 'array',
            items: { type: 'string' }
        },
        rate_limit: { type: 'number' },
        expires_at: { type: 'string', format: 'date-time' },
        error: { type: 'string' },
    }
};
exports.ApiKeyUsageLogSchema = {
    type: 'object',
    required: ['api_key_id', 'endpoint', 'method', 'response_status', 'organization_id'],
    properties: {
        api_key_id: { type: 'string', format: 'uuid' },
        endpoint: { type: 'string' },
        method: { type: 'string' },
        ip_address: { type: 'string' },
        user_agent: { type: 'string' },
        response_status: { type: 'number' },
        processing_time_ms: { type: 'number' },
        organization_id: { type: 'string', format: 'uuid' },
        created_at: { type: 'string', format: 'date-time' },
    }
};
//# sourceMappingURL=api-keys-schema.js.map