# Resolução: Discrepância entre IDs de Módulos BanBan

## 🔍 **Problema Identificado**

A interface admin mostra apenas "Alerts" como módulo atribuído à BanBan, mas o banco de dados contém:
```json
{
  "features": ["insights", "performance", "banban-alerts"],
  "custom_modules": ["insights-advanced", "performance-advanced", "banban-alerts-advanced"],
  "subscribed_modules": ["insights", "performance", "banban-alerts"],
  "enabled_standard_modules": []
}
```

## 🧩 **Causa Raiz**

**Discrepância entre IDs de módulos:**
- **No banco**: `["insights", "performance", "banban-alerts"]`
- **No ModuleDiscoveryService**: `["banban-insights", "banban-performance", "banban-alerts"]`

O sistema de discovery gera IDs com prefixo `banban-` para módulos customizados, mas o banco contém IDs sem prefixo.

## 🛠️ **Soluções Implementadas**

### **1. Script de Migração SQL** 
📁 `scripts/fix-banban-module-ids.sql`

```sql
-- Corrige IDs no banco de dados
UPDATE organizations 
SET implementation_config = jsonb_build_object(
  'subscribed_modules', jsonb_build_array('banban-insights', 'banban-performance', 'banban-alerts'),
  'custom_modules', jsonb_build_array('banban-insights-advanced', 'banban-performance-advanced', 'banban-alerts-advanced'),
  'enabled_standard_modules', jsonb_build_array(),
  'features', jsonb_build_array('banban-insights', 'banban-performance', 'banban-alerts')
)
WHERE (company_trading_name ILIKE '%banban%' OR company_legal_name ILIKE '%banban%')
AND implementation_config IS NOT NULL;
```

### **2. Utilitário de Mapeamento**
📁 `src/shared/utils/module-mapping.ts`

- ✅ **normalizeModuleId()**: Converte IDs antigos para novos
- ✅ **migrateImplementationConfig()**: Migra configuração completa
- ✅ **needsConfigMigration()**: Detecta se precisa migração
- ✅ **generateMigrationReport()**: Relatório de mudanças

### **3. Migração Automática no Layout**
📁 `src/app/(protected)/[slug]/layout.tsx`

```typescript
// Verificar se a configuração precisa ser migrada (IDs incorretos)
if (organization && organization.implementation_config && needsConfigMigration(organization.implementation_config, organization.client_type)) {
  console.log('🔄 Migrando IDs de módulos para formato correto...');
  const originalConfig = { ...organization.implementation_config };
  organization.implementation_config = migrateImplementationConfig(organization.implementation_config, organization.client_type);
  
  console.log('📋 Migração de módulos aplicada:', {
    antes: originalConfig.subscribed_modules,
    depois: organization.implementation_config.subscribed_modules
  });
}
```

## 📋 **Mapeamento de IDs**

| ID Antigo | ID Correto | Nome de Exibição |
|-----------|------------|------------------|
| `insights` | `banban-insights` | Insights Avançados |
| `performance` | `banban-performance` | Performance |
| `alerts` | `banban-alerts` | Alertas |
| `inventory` | `banban-inventory` | Gestão de Estoque |
| `data-processing` | `banban-data-processing` | Processamento de Dados |

## 🧪 **Como Testar**

### **1. Verificar Banco Atual**
```sql
SELECT 
  company_trading_name,
  implementation_config->'subscribed_modules' as modules
FROM organizations 
WHERE company_trading_name ILIKE '%banban%';
```

### **2. Aplicar Migração**
```bash
# Executar script SQL
psql -f scripts/fix-banban-module-ids.sql

# Ou aplicar via Supabase Dashboard
```

### **3. Verificar Interface Admin**
1. Acessar `/admin/organizations/[id]`
2. Verificar se **3 módulos** aparecem como atribuídos:
   - ✅ Insights Avançados (`banban-insights`)
   - ✅ Performance (`banban-performance`) 
   - ✅ Alertas (`banban-alerts`)

### **4. Verificar Interface Tenant**
1. Acessar `/banban`
2. Verificar se **3 itens** aparecem na sidebar:
   - ✅ Insights Avançados
   - ✅ Performance
   - ✅ Alertas

## ✅ **Status da Resolução**

- [x] **Problema identificado**: Discrepância entre IDs no banco vs discovery
- [x] **Script de migração**: Criado para corrigir banco de dados
- [x] **Utilitário de mapeamento**: Implementado para normalização automática
- [x] **Migração automática**: Integrada no layout do tenant
- [x] **Documentação**: Completa com instruções de teste

## 🔄 **Próximos Passos**

1. **Executar script SQL** no banco de dados de produção
2. **Testar interface admin** para verificar 3 módulos
3. **Testar interface tenant** para verificar navegação
4. **Monitorar logs** para verificar migrações automáticas

## 📝 **Arquivos Alterados**

- ✅ `scripts/fix-banban-module-ids.sql` - Script de migração
- ✅ `src/shared/utils/module-mapping.ts` - Utilitário de normalização
- ✅ `src/app/(protected)/[slug]/layout.tsx` - Migração automática
- ✅ `docs/troubleshooting/BANBAN_MODULE_IDS_MISMATCH_RESOLUTION.md` - Esta documentação 