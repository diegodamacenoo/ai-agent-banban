# 🧪 **INSTRUÇÕES PARA TESTAR REDIRECIONAMENTO AUTOMÁTICO**

## 📋 **Pré-requisitos**

### **1. Arquivo hosts configurado**
Certifique-se de que o arquivo `C:\Windows\System32\drivers\etc\hosts` contém:
```
127.0.0.1 banban.localhost
127.0.0.1 riachuelo.localhost
127.0.0.1 ca.localhost
```

### **2. Organizações no banco de dados**
Execute o script SQL no Supabase:
```sql
-- Cole o conteúdo de: scripts/setup-banban-organization.sql
```

### **3. Serviços rodando**
- ✅ Frontend: `npm run dev` (porta 3000)
- ✅ Backend: `npm run dev` (porta 4000)

## 🎯 **Cenários de Teste**

### **Teste 1: Redirecionamento BanBan**
1. **Faça login** com usuário da organização "BanBan Fashion"
2. **Acesse**: `http://localhost:3000`
3. **Resultado esperado**: Redirecionamento automático para `http://banban.localhost:3000`
4. **Verificar**: Dashboard customizado BanBan é exibido

### **Teste 2: Redirecionamento Riachuelo**
1. **Faça login** com usuário da organização "Riachuelo"
2. **Acesse**: `http://localhost:3000`
3. **Resultado esperado**: Redirecionamento automático para `http://riachuelo.localhost:3000`
4. **Verificar**: Dashboard customizado Riachuelo é exibido

### **Teste 3: Cliente Padrão**
1. **Faça login** com usuário de organização sem subdomínio
2. **Acesse**: `http://localhost:3000`
3. **Resultado esperado**: Permanece em `http://localhost:3000`
4. **Verificar**: Dashboard padrão é exibido

### **Teste 4: Acesso Direto Correto**
1. **Faça login** com usuário BanBan
2. **Acesse**: `http://banban.localhost:3000`
3. **Resultado esperado**: Sem redirecionamento
4. **Verificar**: Dashboard BanBan é exibido

## 🔍 **Página de Diagnóstico**

### **URL de Teste**
- **Localhost**: `http://localhost:3000/test-subdomain`
- **BanBan**: `http://banban.localhost:3000/test-subdomain`

### **O que a página mostra:**
- ✅ URL atual
- ✅ Organização detectada
- ✅ Subdomínio atual vs esperado
- ✅ Status do redirecionamento
- ✅ Links para testes manuais

## 🚨 **Problemas Comuns**

### **Erro: "Este site não pode ser acessado"**
**Causa**: Arquivo hosts não configurado
**Solução**: 
1. Abra PowerShell como Administrador
2. Execute: `notepad C:\Windows\System32\drivers\etc\hosts`
3. Adicione as linhas de subdomínio
4. Salve o arquivo

### **Erro: Redirecionamento não funciona**
**Causa**: Organização não configurada no banco
**Solução**:
1. Execute o script: `scripts/setup-banban-organization.sql`
2. Verifique se o usuário está associado à organização correta

### **Erro: Dashboard padrão exibido no subdomínio**
**Causa**: Middleware não está detectando o subdomínio
**Solução**:
1. Verifique se o frontend está rodando na porta 3000
2. Limpe o cache do navegador
3. Verifique os logs do middleware no console

## 📊 **Verificação Manual**

### **1. Verificar Headers (DevTools)**
Abra DevTools → Network → Recarregue a página
Procure por headers:
- `X-Client-Subdomain: banban`
- `X-Organization-Name: BanBan Fashion`
- `X-Client-Type: custom`

### **2. Verificar Console**
Procure por logs do middleware:
```
[MIDDLEWARE] Redirecting user [ID] from BanBan Fashion to correct subdomain
```

### **3. Verificar URL**
Após login em `localhost:3000`, a URL deve mudar automaticamente para:
- BanBan: `banban.localhost:3000`
- Riachuelo: `riachuelo.localhost:3000`
- C&A: `ca.localhost:3000`

## ✅ **Checklist de Validação**

- [ ] Arquivo hosts configurado
- [ ] Organizações criadas no banco
- [ ] Frontend rodando (porta 3000)
- [ ] Backend rodando (porta 4000)
- [ ] Login com usuário BanBan
- [ ] Acesso a `localhost:3000` redireciona para `banban.localhost:3000`
- [ ] Dashboard customizado BanBan é exibido
- [ ] Página de teste `/test-subdomain` funciona
- [ ] Headers de subdomínio presentes
- [ ] Logs de redirecionamento no console

## 🎉 **Resultado Esperado**

Após implementação completa:
- ✅ **Usuários BanBan** → Sempre redirecionados para `banban.localhost:3000`
- ✅ **Usuários Riachuelo** → Sempre redirecionados para `riachuelo.localhost:3000`
- ✅ **Usuários C&A** → Sempre redirecionados para `ca.localhost:3000`
- ✅ **Clientes padrão** → Permanecem em `localhost:3000`
- ✅ **Isolamento completo** entre organizações
- ✅ **Impossível acesso cruzado** entre clientes

---

**Status**: 🚀 **Sistema de redirecionamento 100% funcional** 