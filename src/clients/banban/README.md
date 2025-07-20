# BanBan - Implementação Axon

## Sobre

BanBan é um cliente da plataforma Axon, focado em otimização de gestão de produtos e estoque para varejo. Esta implementação demonstra as capacidades da Axon em um cenário real de varejo.

## Funcionalidades Específicas

### Análise de Inventário
- Dashboard de métricas de estoque
- KPIs de giro e saúde do estoque
- Análise de distribuição por loja

### Gestão de Inventário
- Previsão de demanda por categoria
- Otimização de estoque por loja
- Alertas de reposição inteligente

### Automações
- Sugestão de reposição
- Redistribuição de estoque entre lojas
- Detecção de produtos críticos

## Estrutura

- `/components` - Componentes específicos do BanBan
- `/services` - Serviços específicos
- `/types` - Tipos e interfaces
- `/config` - Configurações do módulo

## Configuração

Para executar o ambiente BanBan:

1. Configure o subdomínio:
   ```
   banban.axon.localhost
   ```

2. Defina as variáveis de ambiente:
   ```
   NEXT_PUBLIC_CLIENT_TYPE=banban
   NEXT_PUBLIC_CLIENT_NAME=BanBan
   ```

3. Inicie o servidor com o perfil BanBan:
   ```bash
   npm run dev:banban
   ```

## Documentação Adicional

- [Guia de Implementação](/docs/clients/banban/implementation.md)
- [Fluxos de Negócio](/docs/clients/banban/business-flows.md)
- [Customizações](/docs/clients/banban/customizations.md) 