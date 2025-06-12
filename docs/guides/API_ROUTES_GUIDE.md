# 🛣️ Guia de API Routes

Este documento fornece diretrizes detalhadas para implementação de API Routes no projeto, especialmente para uso em Client Components.

---

## 📋 **Princípios Fundamentais**

### **1. 🔒 Segurança em Primeiro Lugar**
Todas as API Routes **DEVEM** implementar:
- ✅ Autenticação usando `createSupabaseClient(cookieStore)`
- ✅ Validação de dados com Zod schemas
- ✅ Verificação de permissões (RLS ou manual)
- ✅ Logs de auditoria quando aplicável

### **2. 📝 Estrutura Padrão**
```typescript
import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { createAuditLog, AUDIT_ACTION_TYPES, AUDIT_RESOURCE_TYPES, captureRequestInfo } from '@/lib/utils/audit-logger';

// Schema de validação
const requestSchema = z.object({
  // definir campos aqui
});

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);

    // 1. Verificar autenticação
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // 2. Validar dados de entrada
    const body = await request.json();
    const validation = requestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Dados inválidos', 
        details: validation.error.errors 
      }, { status: 400 });
    }

    // 3. Verificar permissões (se necessário)
    // ... lógica de permissões

    // 4. Executar operação
    // ... lógica principal

    // 5. Registrar log de auditoria
    try {
      const { ipAddress, userAgent, organizationId } = await captureRequestInfo(user.id);
      await createAuditLog({
        actor_user_id: user.id,
        action_type: AUDIT_ACTION_TYPES.APPROPRIATE_ACTION,
        resource_type: AUDIT_RESOURCE_TYPES.APPROPRIATE_RESOURCE,
        // ... outros campos
      });
    } catch (auditError) {
      console.error('Erro ao criar log de auditoria:', auditError);
      // Não falha a operação por causa do log de auditoria
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro na rota:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
```

---

## 🗂️ **Organização de Arquivos**

### **Estrutura de Diretórios**
```
src/app/api/
├── auth/
│   ├── change-password/
│   │   └── route.ts
│   └── email-change/
│       └── route.ts
├── profiles/
│   ├── me/
│   │   └── route.ts
│   └── update/
│       └── route.ts
├── user-management/
│   ├── invites/
│   │   ├── invite/
│   │   │   └── route.ts
│   │   ├── resend/
│   │   │   └── route.ts
│   │   └── cancel/
│   │       └── route.ts
│   └── users/
│       ├── soft-delete/
│       │   └── route.ts
│       └── restore/
│           └── route.ts
└── settings/
    └── organization/
        └── route.ts
```

### **Convenções de Nomenclatura**
- **Diretórios**: Use kebab-case (`user-management`, `soft-delete`)
- **Arquivos**: Sempre `route.ts` para API Routes
- **Endpoints**: Reflitam a estrutura de diretórios (`/api/user-management/invites/invite`)

---

## 🔧 **Métodos HTTP e Casos de Uso**

### **POST - Criação e Ações**
```typescript
// Criar novos recursos ou executar ações
export async function POST(request: Request) {
  // Lógica para criar/executar ação
}
```
**Exemplos**: Enviar convite, soft delete, restaurar usuário

### **PUT - Atualização Completa**
```typescript
// Atualizar recursos existentes
export async function PUT(request: Request) {
  // Lógica para atualizar
}
```
**Exemplos**: Atualizar perfil, alterar configurações

### **GET - Leitura de Dados**
```typescript
// Buscar dados (quando necessário em Client Components)
export async function GET(request: Request) {
  // Lógica para buscar dados
}
```
**Exemplos**: Listar usuários, buscar configurações

### **DELETE - Remoção**
```typescript
// Remover recursos (hard delete)
export async function DELETE(request: Request) {
  // Lógica para remover
}
```
**Exemplos**: Hard delete de usuários, remover arquivos

---

## 🛡️ **Validação e Segurança**

### **1. Schemas Zod Reutilizáveis**
```typescript
// src/lib/schemas/user-management.ts
export const inviteUserSchema = z.object({
  email: z.string().email('E-mail inválido'),
  role: z.enum(['reader', 'editor', 'organization_admin']),
  expiresIn: z.number().int().min(1).max(30).default(7),
});

export const softDeleteUserSchema = z.object({
  id: z.string().uuid('ID de usuário inválido'),
});
```

### **2. Verificação de Permissões**
```typescript
// Verificar se usuário é admin
const { data: userProfile } = await supabase
  .from('profiles')
  .select('role, organization_id')
  .eq('id', user.id)
  .single();

if (userProfile.role !== 'organization_admin') {
  return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
}
```

### **3. Validação de Organização**
```typescript
// Verificar se recursos pertencem à mesma organização
if (targetResource.organization_id !== userProfile.organization_id) {
  return NextResponse.json({ 
    error: 'Não é possível acessar recurso de outra organização' 
  }, { status: 403 });
}
```

---

## 📊 **Logs de Auditoria**

### **Quando Implementar**
- ✅ Mudanças em dados de usuários
- ✅ Alterações de permissões
- ✅ Operações administrativas
- ✅ Mudanças de configurações
- ❌ Operações de leitura simples

### **Padrão de Implementação**
```typescript
try {
  const { ipAddress, userAgent, organizationId } = await captureRequestInfo(user.id);
  await createAuditLog({
    actor_user_id: user.id,
    action_type: AUDIT_ACTION_TYPES.USER_INVITE_SENT,
    resource_type: AUDIT_RESOURCE_TYPES.INVITE,
    resource_id: inviteId, // quando aplicável
    ip_address: ipAddress,
    user_agent: userAgent,
    organization_id: organizationId,
    details: {
      // Dados específicos da operação
      invited_email: data.email,
      role: data.role,
    }
  });
} catch (auditError) {
  console.error('Erro ao criar log de auditoria:', auditError);
  // IMPORTANTE: Não falhar a operação por causa do log
}
```

---

## 🔄 **Tratamento de Erros**

### **Códigos de Status HTTP**
- **200**: Sucesso
- **400**: Dados inválidos (validação falhou)
- **401**: Não autenticado
- **403**: Não autorizado (sem permissão)
- **404**: Recurso não encontrado
- **500**: Erro interno do servidor

### **Formato de Resposta de Erro**
```typescript
// Erro de validação
return NextResponse.json({ 
  error: 'Dados inválidos', 
  details: validation.error.errors 
}, { status: 400 });

// Erro de negócio
return NextResponse.json({ 
  error: 'Usuário não pode excluir a si mesmo' 
}, { status: 400 });

// Erro interno
return NextResponse.json({ 
  error: 'Erro interno do servidor' 
}, { status: 500 });
```

### **Formato de Resposta de Sucesso**
```typescript
// Sucesso simples
return NextResponse.json({ success: true });

// Sucesso com dados
return NextResponse.json({ 
  success: true, 
  data: result 
});
```

---

## 🧪 **Testando API Routes**

### **Teste Manual com curl**
```bash
# POST request
curl -X POST http://localhost:3000/api/user-management/invites/invite \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","role":"reader"}'

# PUT request
curl -X PUT http://localhost:3000/api/profiles/update \
  -H "Content-Type: application/json" \
  -d '{"first_name":"João","last_name":"Silva"}'
```

### **Teste com Postman/Insomnia**
1. Configure cookies de autenticação
2. Teste diferentes cenários (sucesso, erro de validação, erro de permissão)
3. Verifique logs de auditoria no banco

---

## 📝 **Checklist de Implementação**

Antes de considerar uma API Route completa, verifique:

- [ ] ✅ Autenticação implementada
- [ ] ✅ Validação Zod implementada
- [ ] ✅ Verificação de permissões (quando aplicável)
- [ ] ✅ Logs de auditoria (quando aplicável)
- [ ] ✅ Tratamento de erros adequado
- [ ] ✅ Códigos de status HTTP corretos
- [ ] ✅ Logs de debug/console.error para troubleshooting
- [ ] ✅ Documentação atualizada
- [ ] ✅ Testado manualmente

---

## 🔗 **Integração com Client Components**

### **Padrão de Chamada**
```typescript
const handleAction = async (data: FormData) => {
  setIsLoading(true);
  try {
    const result = await fetch('/api/endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // IMPORTANTE: Para enviar cookies
      body: JSON.stringify(data),
    });

    const response = await result.json();

    if (result.ok && response.success) {
      toast({ description: "Operação realizada com sucesso." });
      onSuccess?.();
    } else {
      toast({
        description: response.error || "Erro na operação",
        variant: "destructive"
      });
    }
  } catch (error) {
    toast({
      description: "Erro inesperado",
      variant: "destructive"
    });
  } finally {
    setIsLoading(false);
  }
};
```

---

**Última atualização**: Dezembro 2024  
**Responsável**: Equipe de Desenvolvimento 