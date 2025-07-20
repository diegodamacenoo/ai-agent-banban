# Referência de Headers de Segurança

## Visão Geral
Este documento detalha a implementação dos headers de segurança no projeto, incluindo Content Security Policy (CSP), HSTS e outros headers críticos de segurança.

## Headers Implementados

### Content Security Policy (CSP)
O CSP é configurado com as seguintes diretrizes:

```typescript
// Diretivas principais
default-src: ['self']                    // Restringe todas as fontes por padrão
script-src: ['self', fontes confiáveis]  // Controla carregamento de scripts
style-src: ['self', 'unsafe-inline']     // Necessário para styled-components
img-src: ['self', 'data:', 'https:']     // Permite imagens seguras
connect-src: ['self', APIs necessárias]  // Controla conexões AJAX/WebSocket
```

#### Relatórios de Violação
- Endpoint: `/api/csp-report`
- Armazenamento: Tabela `private.csp_violations`
- Monitoramento: Logs detalhados de violações

### HTTP Strict Transport Security (HSTS)
```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```
- Força HTTPS por 2 anos
- Inclui subdomínios
- Habilitado para preload list

### Outros Headers Críticos
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy`: Controle granular de recursos

## Implementação

### Middleware
Os headers são aplicados no middleware do Next.js:
```typescript
src/lib/security/security-headers.ts  // Configuração principal
src/middleware.ts                     // Aplicação dos headers
```

### Validação
- Verificação automática de headers obrigatórios
- Validação de valores específicos (HSTS, CSP)
- Logs de warning para headers ausentes

## Monitoramento e Manutenção

### Monitoramento
1. Logs de violações de CSP
2. Alertas para headers ausentes
3. Métricas de segurança no dashboard

### Manutenção
1. Revisão regular das políticas
2. Atualização de fontes confiáveis
3. Análise de relatórios de violação

## Testes

### Testes Automatizados
1. Verificação de headers em todas as rotas
2. Validação de CSP
3. Testes de regressão

### Testes Manuais
1. Verificação via ferramentas de segurança
2. Testes de penetração
3. Validação de relatórios

## Troubleshooting

### Problemas Comuns
1. Violações de CSP
   - Verificar logs detalhados
   - Analisar relatórios de violação
   - Ajustar políticas conforme necessário

2. Headers Ausentes
   - Verificar middleware
   - Validar configurações
   - Checar logs de erro

### Soluções
1. Para violações de CSP:
   ```sql
   -- Consultar violações recentes
   SELECT * FROM private.csp_violations
   WHERE created_at > NOW() - INTERVAL '24 hours'
   ORDER BY created_at DESC;
   ```

2. Para headers ausentes:
   - Verificar logs do middleware
   - Validar configuração em `security-headers.ts`
   - Testar rota específica com ferramentas de segurança

## Recursos Adicionais

### Ferramentas de Teste
1. [Mozilla Observatory](https://observatory.mozilla.org/)
2. [Security Headers](https://securityheaders.com/)
3. [CSP Evaluator](https://csp-evaluator.withgoogle.com/)

### Documentação
1. [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
2. [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
3. [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)

## Atualizações e Changelog

### Última Atualização
- Data: 21/03/2024
- Versão: 1.0.0
- Mudanças:
  - Implementação inicial dos headers de segurança
  - Configuração do sistema de relatórios CSP
  - Criação da documentação de referência 