export type ApiKeyPermissionType = 'webhook:purchase' | 'webhook:inventory' | 'webhook:sales' | 'webhook:transfer' | 'webhook:returns' | 'webhook:etl' | 'system:admin' | 'system:read' | 'system:write';
export declare const CreateApiKeySchema: {
    type: string;
    required: string[];
    properties: {
        name: {
            type: string;
            minLength: number;
            maxLength: number;
        };
        description: {
            type: string;
            maxLength: number;
        };
        permissions: {
            type: string;
            items: {
                type: string;
                enum: string[];
            };
            minItems: number;
        };
        expires_at: {
            type: string;
            format: string;
        };
        rate_limit: {
            type: string;
            minimum: number;
            maximum: number;
        };
        organization_id: {
            type: string;
            format: string;
        };
    };
};
export interface CreateApiKeyType {
    name: string;
    description?: string;
    permissions: ApiKeyPermissionType[];
    expires_at?: string;
    rate_limit?: number;
    organization_id?: string;
}
export declare const ApiKeyCreatedSchema: {
    type: string;
    properties: {
        id: {
            type: string;
            format: string;
        };
        name: {
            type: string;
        };
        description: {
            type: string;
        };
        permissions: {
            type: string;
            items: {
                type: string;
            };
        };
        expires_at: {
            type: string;
            format: string;
        };
        rate_limit: {
            type: string;
        };
        organization_id: {
            type: string;
            format: string;
        };
        api_key: {
            type: string;
        };
        created_at: {
            type: string;
            format: string;
        };
        is_active: {
            type: string;
        };
    };
};
export interface ApiKeyCreatedType {
    id: string;
    name: string;
    description?: string;
    permissions: ApiKeyPermissionType[];
    expires_at?: string;
    rate_limit?: number;
    organization_id: string;
    api_key: string;
    created_at: string;
    is_active: boolean;
}
export declare const ApiKeyListSchema: {
    type: string;
    properties: {
        id: {
            type: string;
            format: string;
        };
        name: {
            type: string;
        };
        description: {
            type: string;
        };
        permissions: {
            type: string;
            items: {
                type: string;
            };
        };
        expires_at: {
            type: string;
            format: string;
        };
        rate_limit: {
            type: string;
        };
        organization_id: {
            type: string;
            format: string;
        };
        created_at: {
            type: string;
            format: string;
        };
        last_used_at: {
            type: string;
            format: string;
        };
        is_active: {
            type: string;
        };
        usage_count: {
            type: string;
        };
        prefix: {
            type: string;
        };
    };
};
export interface ApiKeyListType {
    id: string;
    name: string;
    description?: string;
    permissions: ApiKeyPermissionType[];
    expires_at?: string;
    rate_limit?: number;
    organization_id: string;
    created_at: string;
    last_used_at?: string;
    is_active: boolean;
    usage_count: number;
    prefix: string;
}
export declare const UpdateApiKeySchema: {
    type: string;
    properties: {
        name: {
            type: string;
            minLength: number;
            maxLength: number;
        };
        description: {
            type: string;
            maxLength: number;
        };
        permissions: {
            type: string;
            items: {
                type: string;
                enum: string[];
            };
            minItems: number;
        };
        expires_at: {
            type: string;
            format: string;
        };
        rate_limit: {
            type: string;
            minimum: number;
            maximum: number;
        };
        is_active: {
            type: string;
        };
    };
};
export interface UpdateApiKeyType {
    name?: string;
    description?: string;
    permissions?: ApiKeyPermissionType[];
    expires_at?: string;
    rate_limit?: number;
    is_active?: boolean;
}
export declare const ValidateApiKeySchema: {
    type: string;
    required: string[];
    properties: {
        api_key: {
            type: string;
            minLength: number;
        };
        required_permission: {
            type: string;
            enum: string[];
        };
        organization_id: {
            type: string;
            format: string;
        };
    };
};
export interface ValidateApiKeyType {
    api_key: string;
    required_permission?: ApiKeyPermissionType;
    organization_id?: string;
}
export declare const ApiKeyValidationSchema: {
    type: string;
    properties: {
        valid: {
            type: string;
        };
        api_key_id: {
            type: string;
            format: string;
        };
        organization_id: {
            type: string;
            format: string;
        };
        permissions: {
            type: string;
            items: {
                type: string;
            };
        };
        rate_limit: {
            type: string;
        };
        expires_at: {
            type: string;
            format: string;
        };
        error: {
            type: string;
        };
    };
};
export interface ApiKeyValidationType {
    valid: boolean;
    api_key_id?: string;
    organization_id?: string;
    permissions?: ApiKeyPermissionType[];
    rate_limit?: number;
    expires_at?: string;
    error?: string;
}
export declare const ApiKeyUsageLogSchema: {
    type: string;
    required: string[];
    properties: {
        api_key_id: {
            type: string;
            format: string;
        };
        endpoint: {
            type: string;
        };
        method: {
            type: string;
        };
        ip_address: {
            type: string;
        };
        user_agent: {
            type: string;
        };
        response_status: {
            type: string;
        };
        processing_time_ms: {
            type: string;
        };
        organization_id: {
            type: string;
            format: string;
        };
        created_at: {
            type: string;
            format: string;
        };
    };
};
export interface ApiKeyUsageLogType {
    api_key_id: string;
    endpoint: string;
    method: string;
    ip_address?: string;
    user_agent?: string;
    response_status: number;
    processing_time_ms?: number;
    organization_id: string;
    created_at: string;
}
//# sourceMappingURL=api-keys-schema.d.ts.map