# Guia de Desenvolvimento de Clientes - Plataforma Axon

## 1. Visão Geral da Arquitetura Multi-cliente

A plataforma Axon foi projetada para ser modular e extensível, permitindo que diferentes clientes (tenants) utilizem uma base de código unificada enquanto mantêm suas funcionalidades, temas e configurações específicas. A principal diretriz é o **isolamento**: o código de um cliente nunca deve depender diretamente de outro.

A seleção do cliente ativo é controlada pela variável de ambiente `NEXT_PUBLIC_CLIENT_TYPE`. Com base nesse valor, a aplicação carrega dinamicamente os componentes, serviços e configurações apropriados.

## 2. Como Adicionar um Novo Cliente

Siga os passos abaixo para registrar um novo cliente na plataforma. Usaremos um cliente hipotético chamado **"NewClient"** como exemplo.

### Passo 1: Criar a Estrutura de Diretórios

Crie uma nova pasta para o cliente dentro de `src/clients/`:

```
src/clients/
├── banban/
└── newclient/      <-- Novo cliente
```

Dentro de `newclient/`, crie a seguinte estrutura:

```
src/clients/newclient/
├── __tests__/          # Testes específicos do cliente
├── components/         # Componentes React (ex: NewClientDashboard.tsx)
├── services/           # Lógica de negócio e chamadas de API (ex: NewClientService.ts)
├── types/              # Interfaces e tipos TypeScript (ex: index.ts)
├── config.ts           # Arquivo de configuração principal do cliente
└── index.ts            # Ponto de entrada para exportações do cliente
```

### Passo 2: Definir a Configuração

Crie o arquivo `src/clients/newclient/config.ts`. Ele deve exportar uma constante de configuração, seguindo a estrutura do `BANBAN_CONFIG` como modelo.

```typescript
// src/clients/newclient/config.ts
export const NEWCLIENT_CONFIG = {
  name: 'NewClient Inc.',
  type: 'newclient',
  features: { /* ... */ },
  endpoints: { /* ... */ },
  theme: { /* ... */ },
  // ... outras configurações
} as const;
```

### Passo 3: Criar o Ponto de Entrada

No arquivo `src/clients/newclient/index.ts`, exporte todos os artefatos importantes do cliente.

```typescript
// src/clients/newclient/index.ts
export { NEWCLIENT_CONFIG } from './config';
export { NewClientDashboard } from './components/NewClientDashboard';
export { NewClientService } from './services/NewClientService';
export * from './types';
```

### Passo 4: Registrar o Script de Desenvolvimento

Adicione um script no `package.json` para facilitar o desenvolvimento focado neste cliente.

```json
// package.json
"scripts": {
  // ...
  "dev:banban": "NEXT_PUBLIC_CLIENT_TYPE=banban next dev",
  "dev:newclient": "NEXT_PUBLIC_CLIENT_TYPE=newclient next dev" // <-- Novo script
},
```

### Passo 5: Configurar o Subdomínio Local

Adicione a entrada no seu arquivo de `hosts` para o ambiente de desenvolvimento local.

**Windows:** `C:\Windows\System32\drivers\etc\hosts`
**Linux/macOS:** `/etc/hosts`

```
127.0.0.1    newclient.axon.localhost
```

## 3. Boas Práticas

- **Mantenha o Isolamento:** Nunca importe de `src/clients/outro-cliente` dentro do seu diretório de cliente.
- **Use Componentes Genéricos:** Se um componente puder ser reutilizado, mova-o para `src/components/ui` ou `src/components/shared` e personalize-o via props.
- **Tipagem Forte:** Defina tipos e interfaces claros em `src/clients/[client-name]/types/`.
- **Configuração sobre Código:** Prefira controlar a lógica através de flags no arquivo de configuração do cliente em vez de usar condicionais `if (process.env.NEXT_PUBLIC_CLIENT_TYPE === '...')` espalhadas pelo código.
- **Exporte Apenas o Necessário:** Use o `index.ts` como uma fachada (facade) para expor apenas o que outros módulos precisam consumir.

## Clientes Atuais

### BanBan Fashion

BanBan é um cliente do setor de varejo de moda que utiliza a Axon para:

- Análise de performance de vendas
- Gestão de inventário inteligente
- Alertas automáticos de reposição
- Dashboard customizado para varejo

[Documentação BanBan](/docs/clients/banban/README.md)

## Adicionando Novos Clientes

Para adicionar um novo cliente:

1. Crie a estrutura de diretórios em `src/clients/[client-name]`
2. Configure o arquivo `config.ts`
3. Implemente os componentes necessários
4. Crie os serviços específicos
5. Documente as customizações

## Boas Práticas

1. **Isolamento**: Mantenha o código específico do cliente em seu diretório
2. **Reutilização**: Use componentes base da Axon quando possível
3. **Documentação**: Mantenha o README do cliente atualizado
4. **Tipagem**: Use TypeScript para todas as implementações
5. **Testes**: Implemente testes para customizações

## Desenvolvimento

Para desenvolver um cliente específico:

```bash
# Inicie o servidor com o tipo de cliente
npm run dev:[client-type]

# Exemplo para BanBan
npm run dev:banban
```

## Suporte

Para questões relacionadas à implementação de clientes:

- Consulte a [documentação técnica](/docs/technical/)
- Verifique os [guias de implementação](/docs/guides/)
- Entre em contato com o time Axon 