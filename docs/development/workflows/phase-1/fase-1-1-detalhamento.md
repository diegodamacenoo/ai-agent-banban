# Fase 1.1 - Infraestrutura Base (Detalhamento)

## 🎯 **Objetivo da Fase 1.1**

Criar a **base fundamental** do sistema multi-tenant dual, permitindo que uma única instalação do BanBan AI Agent suporte tanto:
- **Clientes customizados** (projetos únicos)
- **Clientes padrão** (SaaS recorrente)

**Duração:** 3 dias  
**Resultado:** Database e sistema de roteamento preparados para suportar ambos os modelos

---

## 📊 **O que será implementado exatamente**

### **DIA 1: Extensão do Schema Database**

#### **1.1.1 Modificar tabela `organizations`**
```sql
-- Adicionar colunas para suporte dual
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS:
  client_type TEXT DEFAULT 'standard' CHECK (client_type IN ('custom', 'standard')),
  implementation_config JSONB DEFAULT '{}',
  custom_backend_url TEXT NULL,
  is_implementation_complete BOOLEAN DEFAULT false,
  implementation_date TIMESTAMPTZ,
  implementation_team_notes TEXT;

-- Índices para performance
CREATE INDEX idx_organizations_client_type ON organizations(client_type);
CREATE INDEX idx_organizations_implementation_status ON organizations(is_implementation_complete);
```

**O que isso permite:**
- ✅ Identificar se cliente é customizado ou padrão
- ✅ Armazenar configurações específicas em JSON
- ✅ Apontar para backend customizado (quando necessário)
- ✅ Controlar status de implementação

#### **1.1.2 Criar tabela `custom_modules`**
```sql
CREATE TABLE custom_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  module_name TEXT NOT NULL,
  module_version TEXT DEFAULT '1.0.0',
  custom_code_path TEXT,  -- ex: '/clients/client-a/plugins/performance'
  api_endpoints JSONB DEFAULT '[]',
  configuration JSONB DEFAULT '{}',
  deployed_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_custom_modules_org ON custom_modules(organization_id);
CREATE INDEX idx_custom_modules_active ON custom_modules(is_active);
CREATE UNIQUE INDEX idx_custom_modules_org_name ON custom_modules(organization_id, module_name);
```

**O que isso permite:**
- ✅ Cadastrar módulos específicos por cliente
- ✅ Controlar versões de módulos customizados
- ✅ Mapear endpoints customizados
- ✅ Ativar/desativar módulos por cliente

#### **1.1.3 Criar tabela `implementation_templates`**
```sql
CREATE TABLE implementation_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  client_type TEXT CHECK (client_type IN ('custom', 'standard')),
  base_modules JSONB DEFAULT '[]',
  customization_points JSONB DEFAULT '{}',
  example_config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dados iniciais
INSERT INTO implementation_templates (name, client_type, base_modules, description) VALUES
('Standard SaaS', 'standard', '["performance", "inventory", "alerts"]', 'Template padrão para clientes SaaS'),
('Fashion Retail', 'custom', '["fashion-performance", "size-analysis", "seasonal-trends"]', 'Template para varejo de moda'),
('Grocery Chain', 'custom', '["perishable-management", "supplier-analysis", "waste-tracking"]', 'Template para supermercados');
```

**O que isso permite:**
- ✅ Templates pré-configurados para tipos de negócio
- ✅ Accelerar implementação de novos clientes
- ✅ Padronizar configurações por setor

---

### **DIA 2: Sistema de Roteamento Frontend**

#### **1.2.1 Hook para detectar tipo de cliente**
```typescript
// src/hooks/useClientType.ts
import { useOrganization } from '@/contexts/OrganizationContext';

export function useClientType() {
  const { organization } = useOrganization();
  
  if (!organization) {
    return {
      clientType: null,
      isCustom: false,
      isStandard: false,
      isLoading: true,
      customModules: [],
      standardModules: [],
      backendUrl: null
    };
  }

  const clientType = organization.client_type || 'standard';
  const config = organization.implementation_config || {};
  
  return {
    clientType,
    isCustom: clientType === 'custom',
    isStandard: clientType === 'standard',
    isLoading: false,
    customModules: config.custom_modules || [],
    standardModules: config.enabled_standard_modules || [],
    backendUrl: organization.custom_backend_url,
    isImplementationComplete: organization.is_implementation_complete
  };
}
```

#### **1.2.2 Utilitário de roteamento de API**
```typescript
// src/lib/utils/api-router.ts
import { createClient } from '@/lib/supabase/client';

export class APIRouter {
  private supabase = createClient();

  async routeRequest(
    module: string, 
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ) {
    // Buscar organização atual
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: profile } = await this.supabase
      .from('profiles')
      .select(`
        organization_id,
        organizations (
          id,
          client_type,
          custom_backend_url,
          implementation_config
        )
      `)
      .eq('id', user.id)
      .single();

    if (!profile?.organizations) {
      throw new Error('Organization not found');
    }

    const org = profile.organizations;

    // Rotear baseado no tipo de cliente
    if (org.client_type === 'custom') {
      return this.routeToCustomBackend(org, module, endpoint, method, data);
    } else {
      return this.routeToStandardModule(module, endpoint, method, data);
    }
  }

  private async routeToCustomBackend(
    org: any, 
    module: string, 
    endpoint: string, 
    method: string, 
    data?: any
  ) {
    const baseUrl = org.custom_backend_url || process.env.NEXT_PUBLIC_CUSTOM_BACKEND_URL;
    
    if (!baseUrl) {
      throw new Error('Custom backend URL not configured');
    }

    const url = `${baseUrl}/api/${module}${endpoint}`;
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await this.getAuthToken()}`,
        'x-organization-id': org.id
      },
      body: data ? JSON.stringify(data) : undefined
    });

    if (!response.ok) {
      throw new Error(`Custom backend error: ${response.statusText}`);
    }

    return response.json();
  }

  private async routeToStandardModule(
    module: string,
    endpoint: string,
    method: string,
    data?: any
  ) {
    // Usar edge functions para clientes padrão
    const functionName = `standard-${module}`;
    
    const { data: result, error } = await this.supabase.functions.invoke(functionName, {
      body: {
        endpoint,
        method,
        data
      }
    });

    if (error) {
      throw new Error(`Standard module error: ${error.message}`);
    }

    return result;
  }

  private async getAuthToken(): Promise<string> {
    const { data: { session } } = await this.supabase.auth.getSession();
    return session?.access_token || '';
  }
}

// Instância singleton
export const apiRouter = new APIRouter();
```

#### **1.2.3 Context Provider para organização**
```typescript
// src/contexts/OrganizationContext.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Organization {
  id: string;
  name: string;
  client_type: 'custom' | 'standard';
  custom_backend_url?: string;
  implementation_config: any;
  is_implementation_complete: boolean;
}

interface OrganizationContextType {
  organization: Organization | null;
  isLoading: boolean;
  error: string | null;
  refreshOrganization: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | null>(null);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClient();

  const fetchOrganization = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setOrganization(null);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          organization_id,
          organizations (
            id,
            name,
            client_type,
            custom_backend_url,
            implementation_config,
            is_implementation_complete
          )
        `)
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      
      if (profile?.organizations) {
        setOrganization(profile.organizations as Organization);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganization();
  }, []);

  return (
    <OrganizationContext.Provider value={{
      organization,
      isLoading,
      error,
      refreshOrganization: fetchOrganization
    }}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within OrganizationProvider');
  }
  return context;
}
```

---

### **DIA 3: Estrutura Base do Backend Fastify**

#### **1.3.1 Setup inicial do projeto**
```bash
# Criar pasta do core backend
mkdir core-backend
cd core-backend

# Inicializar projeto Node.js
npm init -y

# Instalar dependências essenciais
npm install fastify @fastify/type-provider-typebox @sinclair/typebox @supabase/supabase-js dotenv

# Dependências de desenvolvimento
npm install -D typescript @types/node tsx jest @types/jest
```

#### **1.3.2 Configuração TypeScript**
```json
// core-backend/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

#### **1.3.3 Servidor base**
```typescript
// core-backend/src/server.ts
import Fastify from 'fastify';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { config } from 'dotenv';

// Carregar variáveis de ambiente
config();

const server = Fastify({
  logger: {
    level: 'info',
    transport: process.env.NODE_ENV === 'development' ? {
      target: 'pino-pretty',
      options: {
        colorize: true
      }
    } : undefined
  }
}).withTypeProvider<TypeBoxTypeProvider>();

// Health check
server.get('/health', async (request, reply) => {
  return { 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  };
});

// Rota de teste
server.get('/api/test', async (request, reply) => {
  const orgId = request.headers['x-organization-id'];
  
  return {
    message: 'Custom backend funcionando!',
    organization_id: orgId,
    timestamp: new Date().toISOString()
  };
});

// Inicialização do servidor
const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3001;
    const host = process.env.HOST || '0.0.0.0';
    
    await server.listen({ port, host });
    server.log.info(`🚀 Custom backend iniciado em http://${host}:${port}`);
  } catch (err) {
    server.log.error('Erro ao iniciar servidor:', err);
    process.exit(1);
  }
};

// Tratamento de sinais
process.on('SIGINT', async () => {
  server.log.info('Recebido SIGINT, finalizando servidor...');
  await server.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  server.log.info('Recebido SIGTERM, finalizando servidor...');
  await server.close();
  process.exit(0);
});

start();
```

#### **1.3.4 Scripts e configuração**
```json
// core-backend/package.json (scripts)
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "jest",
    "lint": "eslint src/**/*.ts"
  }
}
```

```bash
# core-backend/.env.example
NODE_ENV=development
PORT=3001
HOST=0.0.0.0

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Logging
LOG_LEVEL=info
```

---

## 🔍 **Validação e Testes**

### **Teste 1: Schema Database**
```sql
-- Verificar se as tabelas foram criadas
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('organizations', 'custom_modules', 'implementation_templates')
ORDER BY table_name, ordinal_position;

-- Testar inserção de organização customizada
INSERT INTO organizations (name, client_type, implementation_config) VALUES 
('Teste Custom Client', 'custom', '{"enabled_modules": ["fashion-performance"]}');

-- Testar inserção de módulo customizado
INSERT INTO custom_modules (organization_id, module_name, custom_code_path) VALUES 
((SELECT id FROM organizations WHERE name = 'Teste Custom Client'), 
 'performance', 
 '/clients/test-client/plugins/performance');
```

### **Teste 2: Frontend Routing**
```typescript
// Teste no console do browser
import { apiRouter } from '@/lib/utils/api-router';

// Testar roteamento
const result = await apiRouter.routeRequest('performance', '/metrics', 'GET');
console.log('Resultado:', result);
```

### **Teste 3: Backend Fastify**
```bash
# Iniciar o backend
cd core-backend
npm run dev

# Testar health check
curl http://localhost:3001/health

# Testar API com organization header
curl -H "x-organization-id: test-org-id" http://localhost:3001/api/test
```

---

## 📋 **Checklist de Conclusão**

### **Database (Dia 1)**
- [ ] Tabela `organizations` estendida com colunas multi-tenant
- [ ] Tabela `custom_modules` criada e indexada
- [ ] Tabela `implementation_templates` criada com dados iniciais
- [ ] Migrations executadas sem erros
- [ ] Testes de inserção funcionando

### **Frontend Routing (Dia 2)**
- [ ] Hook `useClientType` implementado
- [ ] Context `OrganizationProvider` funcionando
- [ ] Class `APIRouter` com roteamento dual
- [ ] Testes de detecção de tipo de cliente
- [ ] Integração com Supabase auth

### **Backend Base (Dia 3)**
- [ ] Projeto Fastify inicializado
- [ ] TypeScript configurado
- [ ] Servidor básico funcionando
- [ ] Health check respondendo
- [ ] Rota de teste com organization header
- [ ] Scripts de desenvolvimento configurados

---

## 🎯 **Resultado Esperado**

Ao final da Fase 1.1, teremos:

✅ **Database preparado** para suportar clientes customizados e padrão  
✅ **Frontend capaz** de detectar tipo de cliente e rotear chamadas  
✅ **Backend básico** pronto para receber requisições customizadas  
✅ **Infraestrutura dual** funcionando end-to-end  

**Próxima fase:** Implementar o sistema de plugins dinâmicos (1.2)

---

**Está claro o que será feito?** Podemos começar pelo Dia 1 (schema database) ou você tem alguma dúvida sobre algum ponto específico? 