import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { apiKeysService } from '../../shared/services/api-keys-service';
import { 
  CreateApiKeySchema, 
  UpdateApiKeySchema,
  CreateApiKeyType,
  UpdateApiKeyType
} from '@/shared/schemas/api-keys-schema';
import { logger } from '../../utils/logger';

interface CreateApiKeyRequest extends FastifyRequest {
  body: CreateApiKeyType;
}

interface UpdateApiKeyRequest extends FastifyRequest {
  body: UpdateApiKeyType;
  params: {
    id: string;
  };
}

interface DeleteApiKeyRequest extends FastifyRequest {
  params: {
    id: string;
  };
}

interface ListApiKeysRequest extends FastifyRequest {
  query: {
    organization_id?: string;
  };
}

interface ApiKeyStatsRequest extends FastifyRequest {
  params: {
    id: string;
  };
  query: {
    organization_id?: string;
  };
}

export async function apiKeysAdminRoutes(server: FastifyInstance) {
  // Todas as rotas administrativas requerem autenticação de usuário (JWT)
  server.addHook('preHandler', server.authenticateUser);

  // POST /api/admin/api-keys - Criar nova API Key
  server.post('/', {
    schema: {
      description: 'Criar nova API Key',
      tags: ['admin', 'api-keys'],
      body: CreateApiKeySchema,
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                api_key: { type: 'string' },
                permissions: { type: 'array', items: { type: 'string' } },
                expires_at: { type: 'string' },
                created_at: { type: 'string' },
              }
            }
          }
        }
      }
    }
  }, async (request: CreateApiKeyRequest, reply: FastifyReply) => {
    try {
      logger.info('🔑 Criando nova API Key:', request.body.name);

      // Usar organização do usuário logado ou a fornecida no body
      const organizationId = request.body.organization_id || process.env.BANBAN_ORG_ID!;
      
      const apiKey = await apiKeysService.createApiKey({
        ...request.body,
        organization_id: organizationId,
      });

      logger.info('✅ API Key criada com sucesso:', apiKey.id);

      return reply.code(201).send({
        success: true,
        data: apiKey,
      });
    } catch (error) {
      logger.error('❌ Erro ao criar API Key:', error);
      return reply.code(500).send({
        success: false,
        error: 'Erro interno do servidor',
        message: (error as Error).message,
      });
    }
  });

  // GET /api/admin/api-keys - Listar API Keys
  server.get('/', {
    schema: {
      description: 'Listar API Keys da organização',
      tags: ['admin', 'api-keys'],
      querystring: {
        type: 'object',
        properties: {
          organization_id: { type: 'string', format: 'uuid' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  prefix: { type: 'string' },
                  permissions: { type: 'array', items: { type: 'string' } },
                  expires_at: { type: 'string' },
                  is_active: { type: 'boolean' },
                  usage_count: { type: 'number' },
                  last_used_at: { type: 'string' },
                  created_at: { type: 'string' },
                }
              }
            }
          }
        }
      }
    }
  }, async (request: ListApiKeysRequest, reply: FastifyReply) => {
    try {
      const organizationId = request.query.organization_id || process.env.BANBAN_ORG_ID!;
      
      const apiKeys = await apiKeysService.listApiKeys(organizationId);

      return reply.send({
        success: true,
        data: apiKeys,
      });
    } catch (error) {
      logger.error('❌ Erro ao listar API Keys:', error);
      return reply.code(500).send({
        success: false,
        error: 'Erro interno do servidor',
        message: (error as Error).message,
      });
    }
  });

  // PUT /api/admin/api-keys/:id - Atualizar API Key
  server.put('/:id', {
    schema: {
      description: 'Atualizar API Key',
      tags: ['admin', 'api-keys'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
      },
      body: UpdateApiKeySchema,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                permissions: { type: 'array', items: { type: 'string' } },
                expires_at: { type: 'string' },
                is_active: { type: 'boolean' },
                updated_at: { type: 'string' },
              }
            }
          }
        }
      }
    }
  }, async (request: UpdateApiKeyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const organizationId = process.env.BANBAN_ORG_ID!;

      logger.info('🔄 Atualizando API Key:', id);

      const updatedApiKey = await apiKeysService.updateApiKey(id, request.body, organizationId);

      logger.info('✅ API Key atualizada com sucesso:', id);

      return reply.send({
        success: true,
        data: updatedApiKey,
      });
    } catch (error) {
      logger.error('❌ Erro ao atualizar API Key:', error);
      return reply.code(500).send({
        success: false,
        error: 'Erro interno do servidor',
        message: (error as Error).message,
      });
    }
  });

  // DELETE /api/admin/api-keys/:id - Revogar API Key
  server.delete('/:id', {
    schema: {
      description: 'Revogar API Key',
      tags: ['admin', 'api-keys'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: DeleteApiKeyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const organizationId = process.env.BANBAN_ORG_ID!;

      logger.info('🚫 Revogando API Key:', id);

      await apiKeysService.revokeApiKey(id, organizationId);

      logger.info('✅ API Key revogada com sucesso:', id);

      return reply.send({
        success: true,
        message: 'API Key revogada com sucesso',
      });
    } catch (error) {
      logger.error('❌ Erro ao revogar API Key:', error);
      return reply.code(500).send({
        success: false,
        error: 'Erro interno do servidor',
        message: (error as Error).message,
      });
    }
  });

  // GET /api/admin/api-keys/:id/stats - Obter estatísticas de uso
  server.get('/:id/stats', {
    schema: {
      description: 'Obter estatísticas de uso da API Key',
      tags: ['admin', 'api-keys'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                total_requests: { type: 'number' },
                last_7_days: { type: 'number' },
                last_30_days: { type: 'number' },
                average_response_time: { type: 'number' },
                error_rate: { type: 'number' },
              }
            }
          }
        }
      }
    }
  }, async (request: ApiKeyStatsRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const organizationId = request.query.organization_id || process.env.BANBAN_ORG_ID!;

      const stats = await apiKeysService.getApiKeyStats(id, organizationId);

      return reply.send({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('❌ Erro ao obter estatísticas:', error);
      return reply.code(500).send({
        success: false,
        error: 'Erro interno do servidor',
        message: (error as Error).message,
      });
    }
  });

  // GET /api/admin/api-keys/expiring - Listar API Keys próximas do vencimento
  server.get('/expiring', {
    schema: {
      description: 'Listar API Keys próximas do vencimento',
      tags: ['admin', 'api-keys'],
      querystring: {
        type: 'object',
        properties: {
          days_ahead: { type: 'number', minimum: 1, maximum: 365, default: 30 },
          organization_id: { type: 'string', format: 'uuid' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  prefix: { type: 'string' },
                  expires_at: { type: 'string' },
                  days_until_expiry: { type: 'number' },
                }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = request.query as { days_ahead?: number; organization_id?: string };
      const organizationId = query.organization_id || process.env.BANBAN_ORG_ID!;
      const daysAhead = query.days_ahead || 30;

      const expiringKeys = await apiKeysService.getExpiringApiKeys(organizationId, daysAhead);

      // Adicionar cálculo de dias até expiração
      const keysWithDaysLeft = expiringKeys.map(key => {
        const expiryDate = new Date(key.expires_at || '');
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        return {
          ...key,
          days_until_expiry: daysUntilExpiry,
        };
      });

      return reply.send({
        success: true,
        data: keysWithDaysLeft,
      });
    } catch (error) {
      logger.error('❌ Erro ao listar API Keys próximas do vencimento:', error);
      return reply.code(500).send({
        success: false,
        error: 'Erro interno do servidor',
        message: (error as Error).message,
      });
    }
  });
}