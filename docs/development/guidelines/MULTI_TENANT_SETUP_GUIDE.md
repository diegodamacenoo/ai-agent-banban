# Guia de Configuração Multi-Tenant - Correção das Migrações

## 🚨 Problema Identificado

As colunas multi-tenant não foram criadas na tabela `organizations`, causando o erro:
```
Error: ❌ Erro ao criar organizações: {}
```

## 🔧 Solução: Aplicar Migrações Manualmente

### Passo 1: Acessar o Supabase Dashboard

1. Abra seu navegador e acesse: https://supabase.com/dashboard
2. Faça login em sua conta
3. Selecione o projeto: **bopytcghbmuywfltmwhk**

### Passo 2: Abrir o SQL Editor

1. No menu lateral esquerdo, clique em **"SQL Editor"**
2. Clique em **"New query"** para criar uma nova consulta

### Passo 3: Executar as Migrações Multi-Tenant

Copie e cole o seguinte código SQL no editor e execute:

```sql
-- =================================================================
-- MIGRAÇÕES MULTI-TENANT - FASE 1.1
-- =================================================================

-- 1. Adicionar colunas multi-tenant à tabela organizations
DO $$
BEGIN
    -- Verificar se client_type já existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organizations' 
        AND column_name = 'client_type'
    ) THEN
        -- Aplicar extensões na tabela organizations
        ALTER TABLE organizations ADD COLUMN client_type TEXT DEFAULT 'standard' CHECK (client_type IN ('custom', 'standard'));
        ALTER TABLE organizations ADD COLUMN implementation_config JSONB DEFAULT '{}';
        ALTER TABLE organizations ADD COLUMN custom_backend_url TEXT;
        ALTER TABLE organizations ADD COLUMN is_implementation_complete BOOLEAN DEFAULT false;
        ALTER TABLE organizations ADD COLUMN implementation_date TIMESTAMPTZ;
        ALTER TABLE organizations ADD COLUMN implementation_team_notes TEXT;
        
        -- Criar índices
        CREATE INDEX idx_organizations_client_type ON organizations(client_type);
        CREATE INDEX idx_organizations_implementation_status ON organizations(is_implementation_complete);
        
        RAISE NOTICE 'Colunas multi-tenant adicionadas à tabela organizations';
    ELSE
        RAISE NOTICE 'Colunas multi-tenant já existem na tabela organizations';
    END IF;
END
$$;

-- 2. Criar tabela custom_modules
CREATE TABLE IF NOT EXISTS custom_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    module_name TEXT NOT NULL,
    module_version TEXT DEFAULT '1.0.0',
    custom_code_path TEXT,
    api_endpoints JSONB DEFAULT '[]',
    configuration JSONB DEFAULT '{}',
    deployed_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para custom_modules
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_custom_modules_org') THEN
        CREATE INDEX idx_custom_modules_org ON custom_modules(organization_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_custom_modules_active') THEN
        CREATE INDEX idx_custom_modules_active ON custom_modules(is_active);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_custom_modules_org_name') THEN
        CREATE UNIQUE INDEX idx_custom_modules_org_name ON custom_modules(organization_id, module_name);
    END IF;
END
$$;

-- 3. Criar função de trigger para updated_at em custom_modules
CREATE OR REPLACE FUNCTION update_custom_modules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trigger_update_custom_modules_updated_at'
    ) THEN
        CREATE TRIGGER trigger_update_custom_modules_updated_at
            BEFORE UPDATE ON custom_modules
            FOR EACH ROW
            EXECUTE FUNCTION update_custom_modules_updated_at();
    END IF;
END
$$;

-- 4. Criar tabela implementation_templates
CREATE TABLE IF NOT EXISTS implementation_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    client_type TEXT CHECK (client_type IN ('custom', 'standard')),
    base_modules JSONB DEFAULT '[]',
    customization_points JSONB DEFAULT '{}',
    example_config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para implementation_templates
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_implementation_templates_client_type') THEN
        CREATE INDEX idx_implementation_templates_client_type ON implementation_templates(client_type);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_implementation_templates_active') THEN
        CREATE INDEX idx_implementation_templates_active ON implementation_templates(is_active);
    END IF;
END
$$;

-- 5. Criar função de trigger para updated_at em implementation_templates
CREATE OR REPLACE FUNCTION update_implementation_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trigger_update_implementation_templates_updated_at'
    ) THEN
        CREATE TRIGGER trigger_update_implementation_templates_updated_at
            BEFORE UPDATE ON implementation_templates
            FOR EACH ROW
            EXECUTE FUNCTION update_implementation_templates_updated_at();
    END IF;
END
$$;

-- 6. Inserir dados iniciais em implementation_templates
INSERT INTO implementation_templates (name, client_type, base_modules, description)
SELECT * FROM (VALUES
    ('Standard SaaS', 'standard', '["performance", "inventory", "alerts"]'::jsonb, 'Template padrão para clientes SaaS'),
    ('Fashion Retail', 'custom', '["fashion-performance", "size-analysis", "seasonal-trends"]'::jsonb, 'Template para varejo de moda'),
    ('Grocery Chain', 'custom', '["perishable-management", "supplier-analysis", "waste-tracking"]'::jsonb, 'Template para supermercados')
) AS new_data(name, client_type, base_modules, description)
WHERE NOT EXISTS (
    SELECT 1 FROM implementation_templates 
    WHERE implementation_templates.name = new_data.name
);

-- 7. Aplicar correção na tabela organizations se necessário
DO $$
BEGIN
    -- Verificar se a coluna id tem default gen_random_uuid()
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organizations' 
        AND column_name = 'id' 
        AND column_default LIKE '%gen_random_uuid%'
    ) THEN
        ALTER TABLE organizations ALTER COLUMN id SET DEFAULT gen_random_uuid();
        RAISE NOTICE 'Default gen_random_uuid() aplicado à coluna id da tabela organizations';
    END IF;
END
$$;

-- 8. Relatório final
SELECT 
    'organizations' as tabela,
    COUNT(*) as registros,
    'Tabela principal' as tipo
FROM organizations

UNION ALL

SELECT 
    'custom_modules' as tabela,
    COUNT(*) as registros,
    'Módulos customizados' as tipo
FROM custom_modules

UNION ALL

SELECT 
    'implementation_templates' as tabela,
    COUNT(*) as registros,
    'Templates de implementação' as tipo
FROM implementation_templates;

-- 9. Verificar estrutura das colunas multi-tenant
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'organizations' 
AND column_name IN ('client_type', 'custom_backend_url', 'implementation_config', 'is_implementation_complete')
ORDER BY column_name;
```

### Passo 4: Executar a Query

1. Clique no botão **"Run"** (▶️) no canto inferior direito
2. Aguarde a execução (pode levar alguns segundos)
3. Verifique se há mensagens de sucesso ou erro na parte inferior

### Passo 5: Verificar o Resultado

Você deve ver uma saída similar a:

```
NOTICE: Colunas multi-tenant adicionadas à tabela organizations
```

E uma tabela com os resultados finais mostrando:
- organizations: X registros
- custom_modules: 0 registros  
- implementation_templates: 3 registros

### Passo 6: Testar a Configuração

1. Volte para o aplicativo Next.js
2. Acesse `/multi-tenant-demo`
3. Clique em **"Configurar Organizações de Teste"**
4. Agora deve funcionar sem erros!

## 🔍 Verificação de Sucesso

Após executar as migrações, você deve conseguir:

✅ Criar organizações de teste sem erros  
✅ Ver colunas multi-tenant na tabela organizations  
✅ Usar o sistema multi-tenant completo  

## 🚨 Se Ainda Houver Problemas

Se ainda encontrar erros após executar as migrações:

1. **Verifique as permissões**: Certifique-se de que está usando o service role key no .env.local
2. **Verifique o RLS**: As políticas RLS podem estar bloqueando as operações
3. **Execute novamente**: Pode executar a migração múltiplas vezes - ela é idempotente

## 📝 Próximos Passos

Depois que as migrações estiverem aplicadas, você pode:

1. ✅ Testar o sistema multi-tenant no `/multi-tenant-demo`
2. ✅ Prosseguir com **DIA 2**: Sistema de Roteamento Frontend
3. ✅ Implementar **DIA 3**: Estrutura Base Backend Fastify

---

**Status**: 🔧 Execute as migrações SQL acima para corrigir o problema 