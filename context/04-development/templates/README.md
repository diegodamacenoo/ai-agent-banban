# Templates de Módulos Axon - Sistema Atualizado

Este diretório contém templates padronizados para criação de módulos no sistema Axon, seguindo as especificações da arquitetura genérica multi-tenant e as melhores práticas identificadas no projeto.

**Versão:** 2.0.0  
**Última Atualização:** 02/01/2025

## 📁 Estrutura dos Templates

### `/standard-module/`
Template para módulos padrão (gratuitos) do sistema Axon.

**Características:**
- Categoria: `analytics`, `operations`, `insights`, `reports`, `settings`, `admin`
- Pricing: `free`
- Autor: `Axon Team`
- Aprovação: Não requerida
- Uso interno: Não
- Compatibilidade: Todos os tipos de cliente
- Integração: Supabase nativo, RLS policies, real-time

### `/custom-module/`
Template para módulos customizados (premium) para clientes específicos.

**Características:**
- Categoria: `custom`
- Pricing: `premium` com usage-based billing
- Autor: Definido pelo cliente
- Aprovação: Requerida
- Uso interno: Sim
- Compatibilidade: Cliente específico
- Recursos avançados: ML, analytics avançado, integrações externas

## 🛠️ Como Usar os Templates

### 1. Escolher o Template Apropriado

```bash
# Para módulos padrão (todos os clientes)
cp -r context/04-development/templates/standard-module/ src/core/modules/standard/meu-modulo/

# Para módulos customizados (cliente específico)
cp -r context/04-development/templates/custom-module/ src/core/modules/banban/meu-modulo/
```

### 2. Variáveis de Substituição

Os templates contêm placeholders que devem ser substituídos:

| Placeholder | Descrição | Exemplo Standard | Exemplo Custom |
|-------------|-----------|------------------|----------------|
| `{{MODULE_NAME}}` | Nome amigável do módulo | `Analytics Avançado` | `BanBan Insights` |
| `{{MODULE_SLUG}}` | Identificador único (kebab-case) | `advanced-analytics` | `banban-insights` |
| `{{MODULE_CLASS}}` | Nome da classe (PascalCase) | `AdvancedAnalytics` | `BanbanInsights` |
| `{{MODULE_DESCRIPTION}}` | Descrição detalhada | `Sistema de analytics` | `Insights específicos BanBan` |
| `{{MODULE_CATEGORY}}` | Categoria do módulo | `analytics` | `custom` |
| `{{CLIENT_NAME}}` | Nome do cliente (custom only) | - | `BanBan Team` |
| `{{CLIENT_ORGANIZATION}}` | Organização do cliente | - | `BanBan Fashion` |
| `{{CLIENT_SLUG}}` | Slug do cliente | - | `banban` |
| `{{CLIENT_DOMAIN}}` | Domínio do cliente | - | `banban.com.br` |

### 3. Script de Geração Automática

```bash
# Módulo padrão
./scripts/generate-module.sh "advanced-analytics" "standard" "analytics" "Axon Team"

# Módulo customizado
./scripts/generate-module.sh "fashion-insights" "custom" "insights" "BanBan Team" "banban"
```

## 📋 Estrutura Obrigatória de Módulos (Atualizada)

```
meu-modulo/
├── module.json                 # 📄 Manifesto do módulo (OBRIGATÓRIO)
├── README.md                   # 📚 Documentação principal (OBRIGATÓRIO)
├── types/                      # 📝 Definições TypeScript
│   ├── index.ts               # Tipos principais e schemas Zod
│   ├── interfaces.ts          # Interfaces de negócio
│   └── api.ts                 # Tipos de API e responses
├── services/                   # 🔧 Lógica de negócio
│   ├── index.ts              # Export principal
│   ├── [ModuleName]Service.ts # Serviço principal
│   ├── validators.ts         # Validações Zod
│   └── cache.ts              # Gerenciamento de cache
├── handlers/                   # 🎛️ Manipuladores de eventos
│   ├── index.ts              # Handlers de API
│   ├── api-handlers.ts       # Endpoints REST
│   └── webhook-handlers.ts   # Webhooks (se aplicável)
├── components/                 # 🎨 Componentes React (se aplicável)
│   ├── index.ts             
│   ├── [Module]Widget.tsx    # Widget para dashboard
│   ├── [Module]Config.tsx    # Painel de configuração
│   └── [Module]Page.tsx      # Página principal
├── utils/                      # 🛠️ Utilitários específicos
│   ├── index.ts
│   ├── helpers.ts
│   └── constants.ts
├── tests/                      # 🧪 Testes (OBRIGATÓRIO)
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── migrations/                 # 🗃️ Migrações SQL (se usar BD)
│   └── [timestamp]_[nome].sql
├── docs/                       # 📖 Documentação adicional
│   ├── API.md
│   ├── SETUP.md
│   └── EXAMPLES.md
└── .env.example               # 🔧 Variáveis de ambiente
```

## ✅ Checklist de Validação Atualizado

Antes de submeter um módulo, verificar:

### **Arquivos Obrigatórios**
- [ ] `module.json` válido conforme novo schema
- [ ] `README.md` documentado com exemplos
- [ ] `types/index.ts` com interfaces e schemas Zod
- [ ] `services/[Nome]Service.ts` implementa interface padrão
- [ ] `tests/` com coverage ≥ 70%

### **Integração Sistema Axon**
- [ ] Integração com Supabase configurada
- [ ] Políticas RLS implementadas para multi-tenant
- [ ] Health check endpoint implementado
- [ ] Logs estruturados (JSON) configurados
- [ ] Error handling robusto em todas as funções

### **Segurança e Performance**
- [ ] Validação de entrada com Zod schemas
- [ ] Sanitização de dados sensíveis nos logs
- [ ] Rate limiting implementado (se aplicável)
- [ ] Cache configurado adequadamente
- [ ] Migrations idempotentes

### **Documentação e Qualidade**
- [ ] API documentada com OpenAPI/schemas
- [ ] Variáveis de ambiente documentadas
- [ ] Exemplos de uso funcionais
- [ ] Troubleshooting guide
- [ ] Changelog seguindo semver

## 🔧 Configuração do Ambiente

### Dependências Obrigatórias

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "typescript": "^5.3.0",
    "jest": "^29.7.0",
    "@typescript-eslint/eslint-plugin": "^6.15.0"
  }
}
```

### TypeScript Config

```json
{
  "extends": "@axon/tsconfig",
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "exactOptionalPropertyTypes": true,
    "paths": {
      "@/*": ["./src/*"],
      "@/shared/*": ["./src/shared/*"],
      "@/core/*": ["./src/core/*"]
    }
  },
  "include": ["src/**/*", "types/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

## 🏗️ Arquitetura de Módulos

### Módulos Standard
- **Localização**: `src/core/modules/standard/`
- **Tabelas**: `{module_slug}_*`
- **Clientes**: Todos (banban, default, standard)
- **Billing**: Gratuito
- **Exemplo**: `analytics`, `performance`, `alerts`

### Módulos Custom
- **Localização**: `src/core/modules/{client_slug}/`
- **Tabelas**: `{client_slug}_{module_slug}_*`
- **Clientes**: Específico do cliente
- **Billing**: Premium com usage-based
- **Exemplo**: `banban/insights`, `banban/fashion-analytics`

### Multi-Tenant Isolation
Todos os módulos seguem o padrão de isolamento por organização:
```sql
-- RLS Policy Example
CREATE POLICY "organization_isolation" ON module_data
    FOR ALL USING (
        organization_id = get_user_organization_id() OR is_master_admin()
    );
```

## 📖 Recursos Adicionais

- [Guia de Desenvolvimento de Módulos](../module-development-guide.md)
- [Arquitetura do Sistema](../../02-architecture/)
- [Esquema de Banco de Dados](../../02-architecture/database-schema.md)
- [Documentação da API](../../../docs/api/)
- [Exemplos de Módulos](../../../src/core/modules/)

## 🚀 Próximos Passos

1. **Escolher template** apropriado (standard vs custom)
2. **Copiar e personalizar** com suas variáveis
3. **Implementar funcionalidades** específicas do módulo
4. **Escrever testes** unitários e de integração
5. **Validar com pipeline** CI/CD
6. **Submeter para revisão** técnica
7. **Deploy em produção** seguindo checklist

## 🔄 Versionamento dos Templates

### v2.0.0 (02/01/2025)
- ✅ Integração completa com arquitetura genérica multi-tenant
- ✅ Suporte a schemas Zod para validação robusta
- ✅ Templates de componentes React atualizados
- ✅ Políticas RLS padronizadas
- ✅ Health checks e monitoramento integrado
- ✅ Usage-based billing para módulos custom

### v1.0.0 (27/12/2024)
- Versão inicial dos templates
- Estrutura básica de módulos
- Integração com sistema de lifecycle

---

**Estes templates fornecem uma base sólida e profissional para desenvolvimento de módulos de alta qualidade no sistema Axon, seguindo todas as melhores práticas e padrões arquiteturais identificados.** 