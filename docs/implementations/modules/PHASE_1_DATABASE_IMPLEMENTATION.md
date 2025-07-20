# Fase 1: Implementação da Base de Dados - Sistema de Módulos

## 📋 Resumo

Esta fase implementa a fundação do novo sistema de gestão de módulos dinâmico, criando as tabelas e estruturas necessárias para substituir o sistema hardcoded atual.

## 🗃️ Arquivos Criados

### Migrations SQL

1. **`20250702000000_create_module_system_refactor.sql`**
   - Schema principal das 4 tabelas core
   - Índices de performance
   - Triggers de auditoria
   - Constraints de integridade

2. **`20250702000001_populate_banban_modules.sql`**
   - População dos módulos Banban existentes
   - Implementações para diferentes client_types
   - Estrutura de navegação hierárquica

3. **`20250702000002_seed_tenant_modules.sql`**
   - Migração automática de `organization_modules` → `tenant_modules`
   - Seeds padrão para organizações sem módulos
   - Funções de migração e estatísticas

4. **`20250702000003_create_rls_policies.sql`**
   - Políticas RLS para segurança multi-tenant
   - Funções auxiliares para controle de acesso
   - Índices compostos para performance

5. **`20250702000004_test_queries.sql`**
   - Queries de validação e teste
   - Exemplos de uso para desenvolvimento
   - Queries de monitoramento e debug

## 🏗️ Estrutura das Tabelas

### 1. `core_modules` - Catálogo Global
Armazena a definição de todos os módulos disponíveis no sistema.

```sql
- id (UUID, PK)
- slug (VARCHAR, UNIQUE) - identificador URL-friendly
- name (VARCHAR) - nome display
- description (TEXT) - descrição do módulo
- category (VARCHAR) - categoria (analytics, operations, insights, etc)
- version (VARCHAR) - versão do módulo
- maturity_status (VARCHAR) - ALPHA, BETA, GA, DEPRECATED
- pricing_tier (VARCHAR) - FREE, PREMIUM, ENTERPRISE
```

### 2. `module_implementations` - Implementações por Cliente
Define como cada módulo é implementado para diferentes tipos de cliente.

```sql
- id (UUID, PK)
- module_id (UUID, FK → core_modules)
- client_type (VARCHAR) - banban, riachuelo, default, etc
- component_path (VARCHAR) - caminho do componente React
- name (VARCHAR) - nome personalizado por cliente
- icon_name (VARCHAR) - ícone Lucide
- permissions (TEXT[]) - permissões necessárias
- config (JSONB) - configurações específicas
- is_available (BOOLEAN) - se está disponível
```

### 3. `module_navigation` - Estrutura de Navegação
Define como os módulos aparecem na navegação (sidebar).

```sql
- id (UUID, PK)
- implementation_id (UUID, FK → module_implementations)
- nav_type (VARCHAR) - direct, submenu
- nav_title (VARCHAR) - título na navegação
- nav_order (INTEGER) - ordem de exibição
- parent_id (UUID, FK → module_navigation) - para submenus
- route_path (VARCHAR) - caminho da rota
- is_external (BOOLEAN) - se é link externo
```

### 4. `tenant_modules` - Instâncias Ativas
Define quais módulos estão ativos para cada organização.

```sql
- id (UUID, PK)
- organization_id (UUID, FK → organizations)
- module_id (UUID, FK → core_modules)
- implementation_id (UUID, FK → module_implementations)
- is_visible (BOOLEAN) - se aparece na UI
- operational_status (VARCHAR) - ENABLED, DISABLED, UPGRADING
- custom_config (JSONB) - configurações por tenant
- installed_at (TIMESTAMP) - quando foi instalado
- last_accessed_at (TIMESTAMP) - último acesso
```

## 🔐 Segurança (RLS)

### Políticas Implementadas

1. **Admins** podem gerenciar tudo
2. **Usuários** só veem módulos da própria organização
3. **Organization Admins** podem configurar módulos da própria org
4. **Service Role** tem acesso total (para migrations)

### Funções de Segurança

- `user_has_module_access(module_slug, org_id)` - verifica acesso
- `get_user_accessible_modules(org_slug)` - lista módulos acessíveis

## 📊 Dados Populados

### Módulos Core Criados

1. **insights** - Insights Avançados (PREMIUM, GA)
2. **performance** - Performance Analytics (FREE, GA)
3. **alerts** - Alertas Inteligentes (FREE, GA)
4. **inventory** - Gestão de Estoque (PREMIUM, GA)
5. **analytics** - Analytics Avançado (PREMIUM, BETA)
6. **data-processing** - Processamento de Dados (ENTERPRISE, BETA)

### Implementações por Cliente

- **Banban**: Todas as 6 implementações com componentes específicos
- **Custom**: 4 implementações usando componentes Banban como fallback
- **Default**: 2 implementações básicas

### Navegação Configurada

- **Insights**: Submenu com Dashboard, Análises, Relatórios
- **Performance**: Item direto
- **Alerts**: Submenu com Ativos, Configurações, Histórico
- **Inventory**: Submenu com Visão Geral, Movimentações, Ajustes
- **Analytics**: Submenu com Dashboard, Tendências, Previsões
- **Data Processing**: Submenu com Status, Logs, Configurações

## 🔄 Migração Automática

### Funcionalidades

1. **Migração de `organization_modules`**: Converte dados existentes
2. **Mapeamento inteligente**: Reconhece módulos antigos (banban-insights → insights)
3. **Fallbacks**: Usa implementações default quando necessário
4. **Seeds automáticos**: Cria módulos padrão para orgs vazias

### Estatísticas

A migração fornece estatísticas completas:
- Total de organizações processadas
- Módulos criados por organização
- Mapeamentos bem-sucedidos vs falhados

## 🚀 Como Usar

### 1. Executar Migrations

```bash
# No dashboard do Supabase, execute as migrations na ordem:
1. 20250702000000_create_module_system_refactor.sql
2. 20250702000001_populate_banban_modules.sql
3. 20250702000002_seed_tenant_modules.sql
4. 20250702000003_create_rls_policies.sql
```

### 2. Validar Instalação

Execute o arquivo de teste:
```sql
-- Execute 20250702000004_test_queries.sql
-- para verificar se tudo está funcionando
```

### 3. Verificar Dados

```sql
-- Ver módulos ativos para uma organização
SELECT * FROM get_organization_modules_with_navigation('org-uuid-here');

-- Ver estatísticas do sistema
SELECT * FROM core_modules;
SELECT COUNT(*) FROM tenant_modules;
```

## 📈 Performance

### Índices Criados

- **Tenant modules**: org_id + status para queries rápidas
- **Navigation**: implementation_id + order para ordenação
- **Implementations**: module_id + client_type para joins

### Otimizações

- Queries com LIMIT em funções RLS
- Índices parciais (WHERE clauses)
- Índices compostos para joins frequentes

## 🐛 Debug e Troubleshooting

### Queries Úteis

```sql
-- Verificar organizações sem módulos
SELECT o.name, COUNT(tm.id) 
FROM organizations o 
LEFT JOIN tenant_modules tm ON tm.organization_id = o.id 
GROUP BY o.id, o.name 
HAVING COUNT(tm.id) = 0;

-- Verificar integridade
SELECT 'Problemas de integridade' as issue, COUNT(*) 
FROM tenant_modules tm 
LEFT JOIN core_modules cm ON cm.id = tm.module_id 
WHERE cm.id IS NULL;

-- Ver estatísticas de uso
SELECT cm.name, COUNT(tm.id) as uso 
FROM core_modules cm 
LEFT JOIN tenant_modules tm ON tm.module_id = cm.id 
GROUP BY cm.id, cm.name 
ORDER BY uso DESC;
```

### Possíveis Problemas

1. **Organizações sem módulos**: Execute `seed_default_modules_for_empty_organizations()`
2. **Módulos não mapeados**: Verifique logs da migração no output SQL
3. **RLS bloqueando acesso**: Verifique role do usuário em `profiles`

## ✅ Validação de Sucesso

Após executar as migrations, você deve ter:

- [ ] 4 novas tabelas criadas
- [ ] 6+ core modules populados
- [ ] 10+ implementações criadas
- [ ] 15+ itens de navegação configurados
- [ ] Tenant modules criados para orgs existentes
- [ ] RLS policies ativas e funcionando
- [ ] Funções auxiliares disponíveis

## 🔄 Próximos Passos

Com a Fase 1 completa, você pode prosseguir para:

1. **Fase 2**: Implementar ModuleRegistry e ModuleLoader
2. **Fase 3**: Criar DynamicSidebar
3. **Fase 4**: Simplificar rotas universais
4. **Fase 5**: Interface admin para gestão de módulos

## 📝 Notas Importantes

- **Backup**: Sempre faça backup antes de executar migrations
- **Ambiente**: Teste primeiro em desenvolvimento
- **Rollback**: Mantenha scripts de rollback para emergências
- **Monitoramento**: Use as queries de debug para monitorar o sistema

---

**Fase 1 Concluída** ✅  
Base de dados implementada e pronta para desenvolvimento das próximas fases.