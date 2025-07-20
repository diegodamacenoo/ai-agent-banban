# Cleanup Legacy Routes - Fase 4 Route Simplification

## 📋 Rotas Legacy Identificadas para Remoção

### Rotas Estáticas Duplicadas
Estas rotas agora são tratadas pela rota universal `/[slug]/[...path]`:

```bash
# Rotas que serão removidas:
src/app/(protected)/alertas/page.tsx           → Substituída por /[slug]/alerts
src/app/(protected)/catalog/page.tsx           → Substituída por /[slug]/catalog  
src/app/(protected)/events/page.tsx            → Substituída por /[slug]/events
src/app/(protected)/reports/page.tsx           → Substituída por /[slug]/reports
src/app/(protected)/webhooks/page.tsx          → Substituída por /[slug]/webhooks

# Rotas que serão mantidas (administrativas):
src/app/(protected)/admin/                     → Mantida (admin routes)
src/app/(protected)/settings/                  → Mantida (configurações globais)
src/app/(protected)/setup-account/             → Mantida (setup inicial)
```

### Rotas Dinâmicas Duplicadas

```bash
# Rotas antigas:
src/app/(protected)/[slug]/page.tsx            → Conflita com rota universal
src/app/(protected)/[slug]/[module]/page.tsx   → Substituída por /[slug]/[...path]

# Arquivos relacionados que serão removidos:
src/app/(protected)/[slug]/client-page.tsx     → Substituído por UniversalHomePage
src/app/(protected)/[slug]/[module]/DynamicModulePage.tsx → Substituído por UniversalModuleLoader
```

## 🔄 Plano de Migração

### Fase 1: Backup e Preparação
```bash
# 1. Criar backup das rotas atuais
mkdir -p backups/legacy-routes
cp -r src/app/(protected)/alertas backups/legacy-routes/
cp -r src/app/(protected)/catalog backups/legacy-routes/
cp -r src/app/(protected)/events backups/legacy-routes/
cp -r src/app/(protected)/reports backups/legacy-routes/
cp -r src/app/(protected)/webhooks backups/legacy-routes/
cp -r src/app/(protected)/[slug] backups/legacy-routes/
```

### Fase 2: Mapeamento de Redirecionamentos
```typescript
// Adicionado ao middleware de rota universal:
const legacyMappings = {
  // Rotas estáticas antigas → novas
  '/alertas': (orgSlug: string) => `/${orgSlug}/alerts`,
  '/catalog': (orgSlug: string) => `/${orgSlug}/catalog`,
  '/events': (orgSlug: string) => `/${orgSlug}/events`,
  '/reports': (orgSlug: string) => `/${orgSlug}/reports`,
  '/webhooks': (orgSlug: string) => `/${orgSlug}/webhooks`,
  
  // Redirecionamentos específicos do banban
  'banban-performance': 'performance',
  'banban-insights': 'insights',
  'banban-alerts': 'alerts',
  'banban-inventory': 'inventory'
};
```

### Fase 3: Validação de Componentes
```bash
# Verificar se todos os componentes podem ser carregados pela rota universal:

# 1. Alertas
/[slug]/alerts → @/clients/banban/modules/alerts/page.tsx ✅

# 2. Catalog  
/[slug]/catalog → @/clients/banban/modules/catalog/page.tsx ✅

# 3. Events
/[slug]/events → @/clients/banban/modules/events/page.tsx ✅

# 4. Reports
/[slug]/reports → @/clients/banban/modules/reports/page.tsx ✅

# 5. Webhooks
/[slug]/webhooks → @/clients/banban/modules/webhooks/page.tsx ✅
```

### Fase 4: Remoção Gradual

#### Passo 1: Remover rotas estáticas
```bash
# Comandos para executar:
rm -rf src/app/(protected)/alertas/
rm -rf src/app/(protected)/catalog/
rm -rf src/app/(protected)/events/
rm -rf src/app/(protected)/reports/
rm -rf src/app/(protected)/webhooks/
```

#### Passo 2: Substituir rota dinâmica antiga
```bash
# Remover arquivos antigos:
rm src/app/(protected)/[slug]/page.tsx
rm src/app/(protected)/[slug]/client-page.tsx
rm src/app/(protected)/[slug]/[module]/page.tsx
rm src/app/(protected)/[slug]/[module]/DynamicModulePage.tsx

# Mover layout se necessário:
mv src/app/(protected)/[slug]/layout.tsx src/app/(protected)/[slug]/[...path]/layout.tsx
```

#### Passo 3: Cleanup de imports e referências
```bash
# Buscar e substituir referências antigas:
grep -r "alertas/page" src/ --include="*.tsx" --include="*.ts"
grep -r "catalog/page" src/ --include="*.tsx" --include="*.ts"
grep -r "events/page" src/ --include="*.tsx" --include="*.ts"
grep -r "reports/page" src/ --include="*.tsx" --include="*.ts"
grep -r "webhooks/page" src/ --include="*.tsx" --include="*.ts"

# Substituir por novos padrões de rota
```

## 🧪 Testes de Migração

### Cenários de Teste
```typescript
// Testes a serem executados:

// 1. Redirecionamentos funcionando
test('/alertas → /{orgSlug}/alerts')
test('/catalog → /{orgSlug}/catalog')

// 2. Rotas dinâmicas funcionando
test('/{orgSlug}/alerts → carrega módulo alerts')
test('/{orgSlug}/performance → carrega módulo performance')

// 3. Subpáginas funcionando
test('/{orgSlug}/alerts/config → carrega sub-página')
test('/{orgSlug}/performance/analytics → carrega sub-página')

// 4. Fallbacks funcionando
test('/{orgSlug}/inexistente → ModuleNotFound')
test('/{orgSlug-invalido}/alerts → 404')

// 5. Permissões funcionando
test('acesso negado → ModuleErrorFallback')
test('módulo desabilitado → 404')
```

### Scripts de Validação
```bash
# 1. Verificar se todas as rotas antigas foram removidas
find src/app -name "page.tsx" | grep -E "(alertas|catalog|events|reports|webhooks)" && echo "❌ Rotas antigas encontradas" || echo "✅ Rotas antigas removidas"

# 2. Verificar se rota universal está funcionando
curl -I "http://localhost:3000/{test-org}/alerts" | grep "200" && echo "✅ Rota universal funcionando" || echo "❌ Erro na rota universal"

# 3. Verificar redirecionamentos
curl -I "http://localhost:3000/alertas" | grep "30[1-8]" && echo "✅ Redirecionamentos funcionando" || echo "❌ Redirecionamentos não configurados"
```

## 📊 Impacto Esperado

### Redução de Complexidade
```
Antes:
- 15+ arquivos page.tsx duplicados
- 3 sistemas de roteamento diferentes  
- Lógica de verificação espalhada

Depois:
- 1 arquivo de rota universal
- 1 sistema de roteamento unificado
- Lógica centralizada no middleware
```

### Benefícios
- ✅ **-80% de código** relacionado a roteamento
- ✅ **-90% de duplicação** de lógica de verificação
- ✅ **+100% de flexibilidade** para novos módulos
- ✅ **Cache unificado** de verificações de acesso
- ✅ **Debugging simplificado** com logs centralizados

### Riscos Mitigados
- 🔒 **Backup completo** antes da migração
- 🔒 **Testes automatizados** para validação
- 🔒 **Rollback rápido** se necessário
- 🔒 **Redirecionamentos automáticos** para compatibilidade

## ⚠️ Atenção

### Pontos Críticos
1. **Verificar middleware de autenticação** ainda funciona
2. **Validar permissões** estão sendo respeitadas
3. **Testar performance** da rota universal
4. **Confirmar SEO** não foi afetado (metadata)

### Rollback Plan
```bash
# Se algo der errado, restaurar backup:
rm -rf src/app/(protected)/[slug]/[...path]/
cp -r backups/legacy-routes/* src/app/(protected)/
git checkout HEAD~1 src/app/(protected)/
```

---

**Status**: Pronto para execução  
**Estimativa**: 2-3 horas para migração completa  
**Reversível**: Sim, com backup completo