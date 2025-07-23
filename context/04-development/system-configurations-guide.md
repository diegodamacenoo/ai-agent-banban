# Configurações Automáticas do Sistema

Sistema aplica configurações automaticamente em novas entidades (módulos, implementações, assignments).

## O que é Aplicado Automaticamente

**Módulos Base**: Versionamento inicial, auto-arquivamento, lifecycle padrão
**Implementações**: Versão 1.0.0, backup automático, verificação de limites  
**Assignments**: Notificações, aprovação obrigatória, política de retenção

**Verificações**: Modo manutenção, limites, aprovações obrigatórias

## Como Usar

Use as funções padrão de criação. O sistema aplica configurações automaticamente:

```typescript
// Cria e aplica configurações automaticamente
const newImpl = await createModuleImplementation(data)
const assignment = await createTenantAssignment(data)  
const module = await createBaseModule(data)
```

## Para Desenvolvedores

**❌ NÃO precisa**: Configurar versionamento, backup, limites, logs manualmente
**✅ DEVE**: Usar funções padrão, tratar erros das verificações automáticas

**Arquivo**: `src/app/actions/admin/modules/auto-config-applier.ts`

Sistema é **não-bloqueante**: falhas na configuração não impedem criação da entidade.