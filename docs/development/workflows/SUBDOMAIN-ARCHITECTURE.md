# 🌐 Arquitetura de Subdomínios - Sistema Multi-Tenant

## 📋 **Visão Geral**

O sistema foi implementado com arquitetura de subdomínios para oferecer experiências completamente customizadas por cliente, mantendo URLs limpas e profissionais.

## 🎯 **URLs Implementadas**

### **Clientes Fashion Customizados:**
- **BanBan**: `http://banban.localhost:3000/performance`
- **Riachuelo**: `http://riachuelo.localhost:3000/performance`
- **C&A**: `http://ca.localhost:3000/performance`

### **Cliente Padrão:**
- **Standard**: `http://localhost:3000/performance`

## 🏗️ **Arquitetura Implementada**

### **1. Middleware de Subdomínio**
**Arquivo**: `src/lib/utils/subdomain-middleware.ts`

```typescript
// Configuração centralizada de clientes
export const SUBDOMAIN_CONFIG = {
  'banban': {
    clientType: 'custom',
    organizationName: 'BanBan Fashion',
    customBackendUrl: 'http://localhost:4000',
    theme: { primary: '#8B5CF6', secondary: '#EC4899' },
    features: ['fashion-metrics', 'seasonal-analysis'],
    sector: 'fashion'
  },
  // ... outros clientes
}
```

**Funcionalidades:**
- ✅ Detecção automática de subdomínio
- ✅ Configuração por cliente
- ✅ Headers de contexto automáticos
- ✅ Suporte a desenvolvimento e produção

### **2. Middleware Principal Integrado**
**Arquivo**: `src/middleware.ts`

**Fluxo de Processamento:**
1. **Detecção de Subdomínio** → Headers de contexto
2. **Sessão Supabase** → Autenticação
3. **Redirecionamentos** → Preservando contexto do cliente

### **3. Hook de Configuração**
**Arquivo**: `src/hooks/useSubdomainConfig.ts`

```typescript
export function useSubdomainConfig() {
  return {
    config,           // Configuração completa do cliente
    subdomain,        // Subdomínio detectado
    isCustomClient,   // Boolean se é cliente customizado
    organizationName, // Nome da organização
    theme,           // Tema personalizado
    sector           // Setor (fashion, retail, etc.)
  };
}
```

### **4. Página Performance Dinâmica**
**Arquivo**: `src/app/(protected)/performance/page.tsx`

**Comportamento:**
- **Cliente Fashion** → Dashboard customizado com métricas especializadas
- **Cliente Padrão** → Dashboard básico com opção de upgrade
- **Backend Offline** → Tela de erro contextual

### **5. Navegação Dinâmica**
**Arquivo**: `src/app/ui/sidebar/components/nav-primary-dynamic.tsx`

**Funcionalidades:**
- ✅ Menu personalizado por cliente
- ✅ Badges com cores do tema
- ✅ Indicador de subdomínio
- ✅ Tooltips contextuais

## 🛠️ **Configuração de Desenvolvimento**

### **1. Configurar Hosts (Windows)**
```bash
# Abrir como Administrador
notepad C:\Windows\System32\drivers\etc\hosts

# Adicionar:
127.0.0.1    banban.localhost
127.0.0.1    riachuelo.localhost  
127.0.0.1    ca.localhost
```

### **2. Iniciar Serviços**
```bash
# Frontend
npm run dev

# Backend (porta 4000)
cd backend && npm start
```

### **3. Testar URLs**
- http://banban.localhost:3000/performance
- http://riachuelo.localhost:3000/performance
- http://ca.localhost:3000/performance
- http://localhost:3000/performance

## 🎨 **Personalização por Cliente**

### **BanBan Fashion**
- **Cores**: Roxo (#8B5CF6) + Rosa (#EC4899)
- **Ícone**: Camisa (Shirt)
- **Badge**: "BANBAN Fashion"
- **Features**: Fashion metrics, análise sazonal

### **Riachuelo**
- **Cores**: Vermelho (#DC2626) + Âmbar (#F59E0B)
- **Badge**: "RIACHUELO Fashion"
- **Features**: Fashion metrics, análise sazonal

### **C&A**
- **Cores**: Cinza (#1F2937) + Azul (#3B82F6)
- **Badge**: "CA Fashion"
- **Features**: Fashion metrics, análise sazonal

## 🔒 **Segurança e Isolamento**

### **Headers de Contexto**
```http
X-Client-Subdomain: banban
X-Client-Type: custom
X-Organization-Name: BanBan Fashion
X-Custom-Backend-URL: http://localhost:4000
X-Client-Sector: fashion
X-Client-Theme: {"primary":"#8B5CF6","secondary":"#EC4899"}
```

### **Isolamento de Dados**
- ✅ Configuração por subdomínio
- ✅ Backend routing automático
- ✅ Sessões isoladas (possível)
- ✅ Temas independentes

## 📈 **Escalabilidade**

### **Adicionar Novo Cliente Fashion**
1. **Configurar** em `SUBDOMAIN_CONFIG`
2. **Adicionar** entrada no hosts
3. **Testar** URL automaticamente

### **Adicionar Novo Setor**
1. **Criar** configuração do setor
2. **Implementar** dashboard específico
3. **Configurar** features e tema

## 🚀 **Produção**

### **DNS Configuration**
```dns
banban.seudominio.com    → IP_DO_SERVIDOR
riachuelo.seudominio.com → IP_DO_SERVIDOR
ca.seudominio.com        → IP_DO_SERVIDOR
```

### **Nginx/Apache**
```nginx
server {
    server_name *.seudominio.com;
    # Proxy para Next.js
}
```

## ✅ **Vantagens Implementadas**

### **Para Clientes**
- ✅ **URLs brandadas** (banban.seudominio.com)
- ✅ **Experiência personalizada** (cores, temas)
- ✅ **Dashboards especializados** por setor
- ✅ **Isolamento completo** de dados

### **Para Desenvolvimento**
- ✅ **Configuração centralizada**
- ✅ **Fácil adição** de novos clientes
- ✅ **Middleware transparente**
- ✅ **Debugging simplificado**

### **Para Operação**
- ✅ **Escalabilidade horizontal**
- ✅ **Manutenção independente**
- ✅ **Monitoramento por cliente**
- ✅ **Deploy unificado**

## 🔧 **Troubleshooting**

### **Subdomínio não detectado**
1. Verificar configuração do hosts
2. Limpar cache do browser
3. Verificar console de debug

### **Dashboard não customizado**
1. Verificar configuração em `SUBDOMAIN_CONFIG`
2. Verificar backend status
3. Verificar headers de middleware

### **Tema não aplicado**
1. Verificar configuração de cores
2. Verificar CSS inline
3. Verificar hook `useSubdomainConfig`

## 📝 **Próximos Passos**

- [ ] **SSL/HTTPS** para subdomínios
- [ ] **Cache** por subdomínio
- [ ] **Analytics** separados
- [ ] **Backup** por cliente
- [ ] **API Rate Limiting** por subdomínio

---

**Status**: ✅ **100% Implementado e Funcional**
**Última Atualização**: Janeiro 2025 