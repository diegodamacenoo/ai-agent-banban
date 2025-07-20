# Guia de Desenvolvimento

## 🔒 Práticas de Segurança

### Autenticação e Autorização

#### 1. Timeout de Sessão
- Timeout por inatividade: 30 minutos
- Timeout absoluto: 8 horas
- Refresh automático de token: 15 minutos
- Implementação: `session-manager.ts`
- Componente de aviso: `session-timeout-warning.tsx`

```typescript
// Exemplo de uso do session manager
import { useSessionManager } from '@/lib/auth/session-manager';

function MyComponent() {
  const { isSessionExpired, timeUntilExpiry } = useSessionManager();
  // ...
}
```

#### 2. MFA para Operações Críticas
- Operações sensíveis definidas em `critical-operations.ts`
- Uso do componente `critical-operation-dialog.tsx`
- Hook `use-critical-operation.ts` para integração

```typescript
// Exemplo de uso do MFA em operações críticas
import { useCriticalOperation } from '@/hooks/use-critical-operation';

function DeleteOrgButton() {
  const { executeCriticalOperation } = useCriticalOperation();

  const handleDelete = async () => {
    await executeCriticalOperation({
      type: 'DELETE_ORGANIZATION',
      onConfirm: async () => {
        // Lógica de deleção
      }
    });
  };
}
```

#### 3. RBAC (Role-Based Access Control)

##### Verificação de Permissões
```typescript
// Hook de autorização
import { useAuthorization } from '@/hooks/use-authorization';

function MyComponent() {
  const { hasPermission } = useAuthorization();
  
  if (!hasPermission('users:create')) {
    return null;
  }
}
```

##### Componente de Controle de Acesso
```typescript
// Componente PermissionGate
import { PermissionGate } from '@/components/ui/permission-gate';

function MyComponent() {
  return (
    <PermissionGate 
      permission="users:create"
      fallback={<p>Acesso negado</p>}
    >
      <CreateUserForm />
    </PermissionGate>
  );
}
```

##### Proteção de Rotas
- Rotas protegidas são definidas no middleware
- Redirecionamento automático para `/access-denied`
- Suporte a múltiplas permissões por rota

```typescript
// Exemplo de configuração de rota protegida
const protectedRoutes = [
  {
    path: '/admin',
    permissions: ['admin:access']
  },
  {
    path: '/organizations',
    permissions: ['organizations:read']
  }
];
```

### Boas Práticas

1. **Sempre Use o PermissionGate**
   - Para conteúdo sensível na UI
   - Para botões de ações restritas
   - Para seções inteiras de páginas

2. **Verificação em Múltiplas Camadas**
   - Frontend: `PermissionGate` e hooks
   - Middleware: Proteção de rotas
   - Backend: Políticas RLS e verificações de permissão

3. **Operações Críticas**
   - Sempre use MFA para operações destrutivas
   - Documente novas operações críticas
   - Mantenha registro de auditoria

4. **Sessão e Tokens**
   - Não armazene tokens em localStorage
   - Use apenas cookies httpOnly
   - Implemente refresh token adequadamente

## 📝 Convenções de Código

### Estrutura de Diretórios
```
src/
  ├── app/              # Páginas Next.js
  ├── components/       # Componentes React
  │   └── ui/          # Componentes de UI reutilizáveis
  ├── hooks/           # Hooks personalizados
  ├── lib/             # Utilitários e configurações
  │   ├── auth/        # Lógica de autenticação
  │   ├── api/         # Lógica de API
  │   └── security/    # Configurações de segurança
  └── types/           # Definições de tipos
```

### Nomenclatura
- Componentes: PascalCase
- Hooks: camelCase com prefixo "use"
- Utilitários: camelCase
- Tipos/Interfaces: PascalCase
- Constantes: SCREAMING_SNAKE_CASE

### TypeScript
- Use tipos explícitos
- Evite `any`
- Documente interfaces complexas
- Use enums para valores fixos

## 🚀 Deploy e CI/CD

### Checklist de Segurança
- [ ] Verificar headers de segurança
- [ ] Validar políticas RLS
- [ ] Testar proteções RBAC
- [ ] Confirmar timeouts de sessão
- [ ] Verificar configurações MFA

### Logs e Monitoramento
- Use o logger estruturado
- Registre tentativas de acesso negado
- Monitore uso de operações críticas
- Mantenha trilha de auditoria

## 📚 Recursos Adicionais

- [Documentação do RBAC](./RBAC_IMPLEMENTATION_GUIDE.md)
- [Guia de MFA](./MFA_CRITICAL_OPERATIONS.md)
- [Política de Segurança](./SECURITY_POLICY.md)
- [Changelog](../changelog/CHANGELOG-COMPLIANCE-ACTION-PLAN.md) 