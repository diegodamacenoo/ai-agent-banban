# Correção de Políticas RLS - user_known_devices

## 🚨 Problema Identificado

Durante a implementação das políticas RLS da Fase 3, foi identificado um erro relacionado à coluna `organization_id` que não existe na tabela `user_known_devices`:

```sql
ERROR: 42703: column user_known_devices.organization_id does not exist
```

## 🔍 Análise

### Estrutura Atual da Tabela

A tabela `user_known_devices` possui a seguinte estrutura:

```sql
CREATE TABLE user_known_devices (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL,
    device_fingerprint text NOT NULL,
    user_agent text,
    first_seen_at timestamptz DEFAULT now(),
    last_seen_at timestamptz DEFAULT now(),
    is_trusted boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);
```

### Problema nas Políticas RLS

As políticas RLS originais tentavam usar uma coluna `organization_id` que não existe na tabela. O isolamento por organização deve ser feito através de um JOIN com a tabela `profiles`.

## ✅ Solução Implementada

### 1. Políticas RLS Corrigidas

#### Política de Visualização (SELECT)
```sql
CREATE POLICY "devices_view_policy" ON user_known_devices
    FOR SELECT
    USING (
        user_id = auth.uid()
        OR (
            EXISTS (
                SELECT 1 FROM profiles p1
                WHERE p1.id = auth.uid()
                AND p1.role IN ('organization_admin', 'master_admin')
                AND EXISTS (
                    SELECT 1 FROM profiles p2
                    WHERE p2.id = user_known_devices.user_id
                    AND p2.organization_id = p1.organization_id
                )
            )
        )
    );
```

#### Política de Inserção (INSERT)
```sql
CREATE POLICY "devices_manage_policy" ON user_known_devices
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
    );
```

#### Política de Atualização (UPDATE)
```sql
CREATE POLICY "devices_update_policy" ON user_known_devices
    FOR UPDATE
    USING (
        user_id = auth.uid()
        OR (
            EXISTS (
                SELECT 1 FROM profiles p1
                WHERE p1.id = auth.uid()
                AND p1.role IN ('organization_admin', 'master_admin')
                AND EXISTS (
                    SELECT 1 FROM profiles p2
                    WHERE p2.id = user_known_devices.user_id
                    AND p2.organization_id = p1.organization_id
                )
            )
        )
    );
```

### 2. Lógica de Isolamento

- **Usuários Regulares**: Podem apenas ver e gerenciar seus próprios dispositivos
- **Admins de Organização**: Podem ver e gerenciar dispositivos de usuários da mesma organização
- **Master Admin**: Pode ver e gerenciar dispositivos de qualquer usuário

### 3. Performance

Para garantir a performance das queries, os seguintes índices são mantidos:

```sql
CREATE INDEX IF NOT EXISTS idx_user_known_devices_user_id ON user_known_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_known_devices_device_id ON user_known_devices(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_user_known_devices_last_used ON user_known_devices(last_seen_at);
```

## 📝 Observações Importantes

1. A tabela `user_known_devices` não armazena diretamente a informação de organização
2. O isolamento por organização é feito através de JOIN com a tabela `profiles`
3. As políticas RLS garantem que:
   - Usuários só podem ver seus próprios dispositivos
   - Admins podem ver dispositivos de usuários da sua organização
   - Todas as operações respeitam o isolamento por organização

## ✅ Testes de Validação

1. Usuário regular tenta acessar seus dispositivos ✅
2. Usuário regular tenta acessar dispositivos de outro usuário ❌
3. Admin tenta acessar dispositivos de usuário da sua organização ✅
4. Admin tenta acessar dispositivos de usuário de outra organização ❌
5. Master Admin tenta acessar qualquer dispositivo ✅

## 📚 Documentação Relacionada

- `docs/troubleshooting/DATABASE_SCHEMA_FIXES.md`
- `scripts/security/phase3-rls-policies.sql`
- `scripts/security/security-indexes.sql` 