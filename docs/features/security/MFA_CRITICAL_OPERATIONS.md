# MFA para Operações Críticas

## Visão Geral

Implementação de verificação MFA (Multi-Factor Authentication) para operações críticas do sistema, garantindo uma camada adicional de segurança para ações sensíveis.

## Operações Críticas

As seguintes operações requerem verificação MFA:

- **DELETE_ORGANIZATION**: Exclusão de organizações
- **UPDATE_BILLING**: Alterações em informações de faturamento
- **CHANGE_PERMISSIONS**: Modificação de permissões de usuários
- **API_KEY_MANAGEMENT**: Gerenciamento de chaves de API
- **SECURITY_SETTINGS**: Alterações em configurações de segurança
- **BULK_USER_ACTIONS**: Ações em massa sobre usuários
- **DATA_EXPORT**: Exportação de dados sensíveis

## Arquitetura

### 1. Gerenciador de Operações Críticas (`critical-operations.ts`)

- Definição de operações críticas
- Verificação de requisitos MFA
- Cache de verificações recentes
- Sistema de autorização

### 2. Componente de Diálogo MFA (`critical-operation-dialog.tsx`)

- Interface para verificação MFA
- Integração com o tema da aplicação
- Feedback visual do processo
- Tratamento de erros

### 3. Hook Personalizado (`use-critical-operation.ts`)

- Gerenciamento de estado
- Integração com sistema MFA
- Tratamento de erros
- Callbacks de sucesso/erro

## Fluxo de Verificação

1. **Início da Operação**
   - Verificação de permissão
   - Checagem de MFA ativo
   - Verificação de cache

2. **Processo de Verificação**
   - Exibição do diálogo
   - Entrada do código
   - Validação do token
   - Cache do resultado

3. **Conclusão**
   - Execução da operação
   - Registro em audit log
   - Feedback ao usuário

## Exemplo de Implementação

```typescript
// Uso do hook
const { execute, showMFADialog } = useCriticalOperation({
  operation: CRITICAL_OPERATIONS.DELETE_ORGANIZATION,
  userId,
  onSuccess: () => {
    // Ação após sucesso
  }
});

// Execução da operação
await execute(async () => {
  // Lógica da operação crítica
});
```

## Cache de Verificações

- **Duração**: 30 minutos
- **Escopo**: Por usuário e operação
- **Limpeza**: Automática após expiração

## Segurança

### 1. Proteções Implementadas

- Verificação server-side de tokens
- Cache com tempo limitado
- Validação de permissões
- Audit logging

### 2. Boas Práticas

- Uso de TOTP (Time-based One-Time Password)
- Códigos de 6 dígitos
- Limite de tentativas
- Feedback claro ao usuário

## Audit Logging

Todas as operações críticas são registradas com:

- Tipo de operação
- Usuário executor
- Timestamp
- Resultado da operação
- Detalhes específicos

## Considerações de UX

1. **Feedback Visual**
   - Indicadores de loading
   - Mensagens de erro claras
   - Confirmações de sucesso

2. **Usabilidade**
   - Interface intuitiva
   - Processo simplificado
   - Opções de cancelamento

## Próximos Passos

1. **Monitoramento**
   - [ ] Implementar métricas de uso
   - [ ] Alertas de tentativas suspeitas
   - [ ] Dashboard de operações críticas

2. **Melhorias**
   - [ ] Configuração dinâmica de operações críticas
   - [ ] Suporte a múltiplos fatores
   - [ ] Análise de risco em tempo real

3. **Documentação**
   - [ ] Guia de troubleshooting
   - [ ] Documentação para usuários finais
   - [ ] Exemplos de integração

## Referências

- [RFC 6238](https://tools.ietf.org/html/rfc6238) - TOTP
- [NIST Guidelines](https://pages.nist.gov/800-63-3/) - Autenticação Digital
- [Supabase Auth](https://supabase.com/docs/guides/auth) - Documentação 