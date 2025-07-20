// Tipos de permissões para API Keys
export type ApiKeyPermissionType = 
  | 'webhook:purchase'
  | 'webhook:inventory'
  | 'webhook:sales'
  | 'webhook:transfer'
  | 'webhook:returns'
  | 'webhook:etl'
  | 'system:admin'
  | 'system:read'
  | 'system:write';

// Schema para criação de API Key
export const CreateApiKeySchema = {
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

export interface CreateApiKeyType {
  name: string;
  description?: string;
  permissions: ApiKeyPermissionType[];
  expires_at?: string;
  rate_limit?: number;
  organization_id?: string;
}

// Schema para resposta de API Key criada
export const ApiKeyCreatedSchema = {
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
    api_key: { type: 'string' }, // Só retornado na criação
    created_at: { type: 'string', format: 'date-time' },
    is_active: { type: 'boolean' },
  }
};

export interface ApiKeyCreatedType {
  id: string;
  name: string;
  description?: string;
  permissions: ApiKeyPermissionType[];
  expires_at?: string;
  rate_limit?: number;
  organization_id: string;
  api_key: string; // Só retornado na criação
  created_at: string;
  is_active: boolean;
}

// Schema para listagem de API Keys (sem expor a chave)
export const ApiKeyListSchema = {
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
    prefix: { type: 'string' }, // Primeiros caracteres da chave para identificação
  }
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
  prefix: string; // Primeiros caracteres da chave para identificação
}

// Schema para atualização de API Key
export const UpdateApiKeySchema = {
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

export interface UpdateApiKeyType {
  name?: string;
  description?: string;
  permissions?: ApiKeyPermissionType[];
  expires_at?: string;
  rate_limit?: number;
  is_active?: boolean;
}

// Schema para validação de API Key
export const ValidateApiKeySchema = {
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

export interface ValidateApiKeyType {
  api_key: string;
  required_permission?: ApiKeyPermissionType;
  organization_id?: string;
}

// Schema para resposta de validação
export const ApiKeyValidationSchema = {
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

export interface ApiKeyValidationType {
  valid: boolean;
  api_key_id?: string;
  organization_id?: string;
  permissions?: ApiKeyPermissionType[];
  rate_limit?: number;
  expires_at?: string;
  error?: string;
}

// Schema para logs de uso
export const ApiKeyUsageLogSchema = {
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