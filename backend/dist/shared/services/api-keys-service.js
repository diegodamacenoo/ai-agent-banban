"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiKeysService = exports.ApiKeysService = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const crypto_1 = require("crypto");
const logger_1 = require("../../utils/logger");
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});
class ApiKeysService {
    generateApiKey() {
        const keyBytes = (0, crypto_1.randomBytes)(32);
        const key = `ak_${keyBytes.toString('hex')}`;
        const hash = (0, crypto_1.createHash)('sha256').update(key).digest('hex');
        const prefix = key.substring(0, 12) + '...';
        return { key, hash, prefix };
    }
    async createApiKey(data) {
        const { key, hash, prefix } = this.generateApiKey();
        const defaultExpiresAt = new Date();
        defaultExpiresAt.setMonth(defaultExpiresAt.getMonth() + 6);
        const apiKeyData = {
            id: crypto.randomUUID(),
            name: data.name,
            description: data.description || null,
            key_hash: hash,
            prefix,
            permissions: data.permissions,
            expires_at: data.expires_at || defaultExpiresAt.toISOString(),
            rate_limit: data.rate_limit || 1000,
            organization_id: data.organization_id || process.env.BANBAN_ORG_ID,
            is_active: true,
            usage_count: 0,
            created_at: new Date().toISOString(),
            last_used_at: null,
        };
        logger_1.logger.info(`🔑 Criando nova API Key: ${data.name}`);
        const { data: insertedData, error } = await supabase
            .from('api_keys')
            .insert(apiKeyData)
            .select()
            .single();
        if (error) {
            logger_1.logger.error('❌ Erro ao criar API Key:', error);
            throw new Error(`Erro ao criar API Key: ${error.message}`);
        }
        logger_1.logger.info(`✅ API Key criada com sucesso: ${insertedData.id}`);
        return {
            id: insertedData.id,
            name: insertedData.name,
            description: insertedData.description,
            permissions: insertedData.permissions,
            expires_at: insertedData.expires_at,
            rate_limit: insertedData.rate_limit,
            organization_id: insertedData.organization_id,
            api_key: key,
            created_at: insertedData.created_at,
            is_active: insertedData.is_active,
        };
    }
    async listApiKeys(organizationId) {
        const { data, error } = await supabase
            .from('api_keys')
            .select('*')
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false });
        if (error) {
            logger_1.logger.error('❌ Erro ao listar API Keys:', error);
            throw new Error(`Erro ao listar API Keys: ${error.message}`);
        }
        return data.map(item => ({
            id: item.id,
            name: item.name,
            description: item.description,
            permissions: item.permissions,
            expires_at: item.expires_at,
            rate_limit: item.rate_limit,
            organization_id: item.organization_id,
            created_at: item.created_at,
            last_used_at: item.last_used_at,
            is_active: item.is_active,
            usage_count: item.usage_count,
            prefix: item.prefix,
        }));
    }
    async updateApiKey(id, data, organizationId) {
        const { data: updatedData, error } = await supabase
            .from('api_keys')
            .update({
            ...data,
            updated_at: new Date().toISOString(),
        })
            .eq('id', id)
            .eq('organization_id', organizationId)
            .select()
            .single();
        if (error) {
            logger_1.logger.error('❌ Erro ao atualizar API Key:', error);
            throw new Error(`Erro ao atualizar API Key: ${error.message}`);
        }
        logger_1.logger.info(`✅ API Key atualizada: ${id}`);
        return {
            id: updatedData.id,
            name: updatedData.name,
            description: updatedData.description,
            permissions: updatedData.permissions,
            expires_at: updatedData.expires_at,
            rate_limit: updatedData.rate_limit,
            organization_id: updatedData.organization_id,
            created_at: updatedData.created_at,
            last_used_at: updatedData.last_used_at,
            is_active: updatedData.is_active,
            usage_count: updatedData.usage_count,
            prefix: updatedData.prefix,
        };
    }
    async revokeApiKey(id, organizationId) {
        const { error } = await supabase
            .from('api_keys')
            .update({
            is_active: false,
            revoked_at: new Date().toISOString(),
        })
            .eq('id', id)
            .eq('organization_id', organizationId);
        if (error) {
            logger_1.logger.error('❌ Erro ao revogar API Key:', error);
            throw new Error(`Erro ao revogar API Key: ${error.message}`);
        }
        logger_1.logger.info(`✅ API Key revogada: ${id}`);
    }
    async validateApiKey(apiKey, requiredPermission) {
        try {
            const keyHash = (0, crypto_1.createHash)('sha256').update(apiKey).digest('hex');
            const { data, error } = await supabase
                .from('api_keys')
                .select('*')
                .eq('key_hash', keyHash)
                .eq('is_active', true)
                .single();
            if (error || !data) {
                logger_1.logger.debug(`🔍 API Key não encontrada ou inativa`);
                return {
                    valid: false,
                    error: 'API Key inválida ou inativa',
                };
            }
            if (data.expires_at && new Date(data.expires_at) < new Date()) {
                logger_1.logger.debug(`⏰ API Key expirada: ${data.id}`);
                return {
                    valid: false,
                    error: 'API Key expirada',
                };
            }
            if (requiredPermission && !data.permissions.includes(requiredPermission)) {
                logger_1.logger.debug(`🚫 Permissão insuficiente para API Key: ${data.id}`);
                return {
                    valid: false,
                    error: 'Permissão insuficiente',
                };
            }
            await supabase
                .from('api_keys')
                .update({
                last_used_at: new Date().toISOString(),
                usage_count: data.usage_count + 1,
            })
                .eq('id', data.id);
            logger_1.logger.debug(`✅ API Key validada com sucesso: ${data.id}`);
            return {
                valid: true,
                api_key_id: data.id,
                organization_id: data.organization_id,
                permissions: data.permissions,
                rate_limit: data.rate_limit,
                expires_at: data.expires_at,
            };
        }
        catch (error) {
            logger_1.logger.error('❌ Erro ao validar API Key:', error);
            return {
                valid: false,
                error: `Erro interno: ${error.message}`,
            };
        }
    }
    async logApiKeyUsage(apiKeyId, endpoint, method, responseStatus, organizationId, ipAddress, userAgent, processingTimeMs) {
        try {
            const logData = {
                api_key_id: apiKeyId,
                endpoint,
                method,
                ip_address: ipAddress || null,
                user_agent: userAgent || null,
                response_status: responseStatus,
                processing_time_ms: processingTimeMs || null,
                organization_id: organizationId,
            };
            const { error } = await supabase
                .from('api_key_usage_logs')
                .insert({
                ...logData,
                created_at: new Date().toISOString(),
            });
            if (error) {
                logger_1.logger.error('❌ Erro ao registrar uso da API Key:', error);
            }
        }
        catch (error) {
            logger_1.logger.error('❌ Erro ao registrar uso da API Key:', error);
        }
    }
    async getApiKeyStats(apiKeyId, organizationId) {
        try {
            const { data, error } = await supabase
                .from('api_key_usage_logs')
                .select('response_status, processing_time_ms, created_at')
                .eq('api_key_id', apiKeyId)
                .eq('organization_id', organizationId)
                .order('created_at', { ascending: false });
            if (error) {
                logger_1.logger.error('❌ Erro ao obter estatísticas:', error);
                throw new Error(`Erro ao obter estatísticas: ${error.message}`);
            }
            const now = new Date();
            const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            const stats = {
                total_requests: data.length,
                last_7_days: data.filter(log => new Date(log.created_at) >= last7Days).length,
                last_30_days: data.filter(log => new Date(log.created_at) >= last30Days).length,
                average_response_time: data.reduce((sum, log) => sum + (log.processing_time_ms || 0), 0) / (data.length || 1),
                error_rate: data.filter(log => log.response_status >= 400).length / (data.length || 1),
            };
            return stats;
        }
        catch (error) {
            logger_1.logger.error('❌ Erro ao calcular estatísticas:', error);
            throw error;
        }
    }
    async getExpiringApiKeys(organizationId, daysAhead = 30) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + daysAhead);
        const { data, error } = await supabase
            .from('api_keys')
            .select('*')
            .eq('organization_id', organizationId)
            .eq('is_active', true)
            .lt('expires_at', futureDate.toISOString())
            .order('expires_at', { ascending: true });
        if (error) {
            logger_1.logger.error('❌ Erro ao buscar API Keys próximas do vencimento:', error);
            throw new Error(`Erro ao buscar API Keys próximas do vencimento: ${error.message}`);
        }
        return data.map(item => ({
            id: item.id,
            name: item.name,
            description: item.description,
            permissions: item.permissions,
            expires_at: item.expires_at,
            rate_limit: item.rate_limit,
            organization_id: item.organization_id,
            created_at: item.created_at,
            last_used_at: item.last_used_at,
            is_active: item.is_active,
            usage_count: item.usage_count,
            prefix: item.prefix,
        }));
    }
}
exports.ApiKeysService = ApiKeysService;
exports.apiKeysService = new ApiKeysService();
//# sourceMappingURL=api-keys-service.js.map