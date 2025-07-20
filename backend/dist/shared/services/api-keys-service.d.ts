import { CreateApiKeyType, ApiKeyCreatedType, ApiKeyListType, UpdateApiKeyType, ApiKeyValidationType, ApiKeyPermissionType } from '../schemas/api-keys-schema';
export declare class ApiKeysService {
    private generateApiKey;
    createApiKey(data: CreateApiKeyType): Promise<ApiKeyCreatedType>;
    listApiKeys(organizationId: string): Promise<ApiKeyListType[]>;
    updateApiKey(id: string, data: UpdateApiKeyType, organizationId: string): Promise<ApiKeyListType>;
    revokeApiKey(id: string, organizationId: string): Promise<void>;
    validateApiKey(apiKey: string, requiredPermission?: ApiKeyPermissionType): Promise<ApiKeyValidationType>;
    logApiKeyUsage(apiKeyId: string, endpoint: string, method: string, responseStatus: number, organizationId: string, ipAddress?: string, userAgent?: string, processingTimeMs?: number): Promise<void>;
    getApiKeyStats(apiKeyId: string, organizationId: string): Promise<{
        total_requests: number;
        last_7_days: number;
        last_30_days: number;
        average_response_time: number;
        error_rate: number;
    }>;
    getExpiringApiKeys(organizationId: string, daysAhead?: number): Promise<ApiKeyListType[]>;
}
export declare const apiKeysService: ApiKeysService;
//# sourceMappingURL=api-keys-service.d.ts.map