# 🚀 BanBan AI Agent - Backend Multi-Tenant

Backend Node.js com Fastify para o sistema multi-tenant do BanBan AI Agent, suportando tanto clientes customizados quanto padrão.

## 🎯 **Características**

- **Multi-tenant**: Suporte para clientes customizados e padrão
- **Fastify**: Framework rápido e eficiente
- **TypeScript**: Tipagem estática completa
- **Swagger**: Documentação automática da API
- **Rate Limiting**: Controle de taxa por tenant
- **CORS**: Configuração flexível de CORS
- **Security**: Headers de segurança com Helmet
- **Logging**: Sistema de logs estruturados com Pino

## 📁 **Estrutura do Projeto**

```
backend/
├── src/
│   ├── config/           # Configurações
│   │   └── config.ts     # Configuração principal
│   ├── plugins/          # Plugins do Fastify
│   │   └── index.ts      # Registro de plugins
│   ├── routes/           # Rotas da API
│   │   └── index.ts      # Rotas principais
│   ├── types/            # Tipos TypeScript
│   │   └── index.ts      # Definições de tipos
│   ├── utils/            # Utilitários
│   │   └── logger.ts     # Sistema de logging
│   └── index.ts          # Servidor principal
├── dist/                 # Build compilado
├── package.json          # Dependências e scripts
├── tsconfig.json         # Configuração TypeScript
├── .env.example          # Exemplo de variáveis de ambiente
└── README.md             # Este arquivo
```

## 🔧 **Instalação**

```bash
# Instalar dependências
npm install

# Copiar arquivo de configuração
cp .env.example .env

# Build do projeto
npm run build
```

## 🚀 **Scripts Disponíveis**

```bash
# Desenvolvimento
npm run dev              # Servidor em modo desenvolvimento
npm run dev:watch        # Desenvolvimento com watch

# Build e Produção
npm run build            # Compilar TypeScript
npm run start            # Iniciar servidor de produção
npm run clean            # Limpar pasta dist

# Verificações
npm run type-check       # Verificar tipos TypeScript
```

## ⚙️ **Configuração**

### **Variáveis de Ambiente**

```bash
# Servidor
NODE_ENV=development     # Ambiente (development/production/test)
PORT=4000               # Porta do servidor
HOST=0.0.0.0            # Host do servidor

# Logging
LOG_LEVEL=info          # Nível de log (trace/debug/info/warn/error)

# Multi-tenant
ENABLE_CUSTOM_ROUTING=true      # Habilitar roteamento customizado
DEFAULT_CLIENT_TYPE=standard    # Tipo padrão de cliente

# Rate Limiting
RATE_LIMIT_MAX=100      # Máximo de requisições
RATE_LIMIT_WINDOW=60000 # Janela de tempo (ms)

# CORS
CORS_ORIGIN=true        # Origem permitida (* ou domínios específicos)
CORS_CREDENTIALS=true   # Permitir credenciais

# API
API_PREFIX=/api         # Prefixo das rotas da API
API_VERSION=v1          # Versão da API

# Features
ENABLE_SWAGGER=true     # Habilitar documentação Swagger
ENABLE_HELMET=true      # Habilitar headers de segurança
ENABLE_RATE_LIMIT=true  # Habilitar rate limiting
```

## 🔗 **Endpoints**

### **Endpoints Base**
- `GET /health` - Health check do servidor
- `GET /info` - Informações do servidor
- `GET /docs` - Documentação Swagger (desenvolvimento)

### **API Endpoints**
- `GET /api/test` - Endpoint de teste
- `GET /api/custom/info` - Informações para clientes customizados
- `GET /api/standard/info` - Informações para clientes padrão
- `GET /api/route/:module/:endpoint` - Roteamento dinâmico

## 🏢 **Sistema Multi-Tenant**

### **Headers Obrigatórios**
```bash
X-Tenant-Id: tenant-uuid      # ID do tenant
X-Client-Type: custom|standard # Tipo de cliente
```

### **Tipos de Cliente**

#### **Cliente Customizado (`custom`)**
- Backend dedicado
- Módulos personalizados
- Configurações específicas
- Analytics avançados

#### **Cliente Padrão (`standard`)**
- Infraestrutura compartilhada
- Módulos padrão
- Configuração base
- Analytics básicos

## 🧪 **Testes**

### **Teste Manual com curl**

```bash
# Health check
curl http://localhost:4000/health

# Informações do servidor
curl http://localhost:4000/info

# Teste da API
curl http://localhost:4000/api/test

# Cliente customizado
curl -H "X-Tenant-Id: test-tenant" \
     -H "X-Client-Type: custom" \
     http://localhost:4000/api/custom/info

# Cliente padrão
curl http://localhost:4000/api/standard/info

# Roteamento dinâmico
curl -H "X-Tenant-Id: test-tenant" \
     -H "X-Client-Type: custom" \
     http://localhost:4000/api/route/analytics/performance
```

## 📊 **Logging**

O sistema usa **Pino** para logging estruturado:

```typescript
// Logger com contexto de tenant
const logger = createTenantLogger('tenant-id', 'custom');

// Logger para performance
logPerformance('database-query', 150, { table: 'users' });

// Logger para auditoria
logAudit('user-login', 'user-id', 'tenant-id', { ip: '127.0.0.1' });
```

## 🔒 **Segurança**

- **Helmet**: Headers de segurança automáticos
- **Rate Limiting**: Por IP + tenant
- **CORS**: Configuração flexível
- **Input Validation**: Schemas JSON automáticos

## 🚀 **Deploy**

### **Produção**
```bash
# Build
npm run build

# Configurar variáveis de ambiente
export NODE_ENV=production
export PORT=4000
export LOG_LEVEL=warn
export ENABLE_SWAGGER=false

# Iniciar
npm start
```

### **Docker** (opcional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3001
CMD ["npm", "start"]
```

## 🔄 **Integração com Frontend**

O backend se integra com o sistema de roteamento do frontend através do `APIRouter`:

```typescript
// No frontend (Next.js)
const result = await apiRouter.routeRequest('analytics', '/metrics', 'GET');
```

## 📚 **Documentação da API**

Acesse `http://localhost:3001/docs` para ver a documentação completa da API gerada automaticamente pelo Swagger.

## 🐛 **Troubleshooting**

### **Problemas Comuns**

1. **Erro de porta em uso**
   ```bash
   # Verificar processo usando a porta
   netstat -ano | findstr :3001
   # Matar processo se necessário
   taskkill /PID <PID> /F
   ```

2. **Erro de TypeScript**
   ```bash
   # Verificar tipos
   npm run type-check
   ```

3. **Logs de debug**
   ```bash
   # Habilitar logs detalhados
   LOG_LEVEL=debug npm run dev
   ```

## 🤝 **Contribuição**

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adicionar nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

---

**Versão:** 1.0.0  
**Autor:** BanBan AI Agent Team  
**Licença:** MIT 