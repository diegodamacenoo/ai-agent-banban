# Testes de Webhook - Estrutura Organizada

Esta pasta contém todos os testes organizados para os webhooks do projeto BanBan.

## Estrutura de Pastas

### `/inventory-flow/`
Testes específicos para o webhook Inventory Flow:
- `test-inventory-validation.ps1` - Testes de validação (casos negativos)
- `test-positive-inventory.ps1` - Testes positivos (casos de sucesso)
- `test-simple-webhook.ps1` - Teste mínimo para diagnóstico
- `test-inventory-flow.json` - Dados de teste completos
- `test-inventory-flow-validation.json` - Dados para testes de validação

### `/purchase-flow/`
Testes para o webhook Purchase Flow:
- `test-purchase-flow.json` - Dados de teste para compras

### `/sales-flow/`
Testes para o webhook Sales Flow:
- `test-sales-flow.json` - Dados de teste para vendas

### `/transfer-flow/`
Testes para o webhook Transfer Flow:
- `test-transfer-flow.json` - Dados de teste para transferências

### `/obsolete/`
Arquivos de teste obsoletos mantidos para referência histórica:
- Arquivos JavaScript antigos
- Scripts PowerShell duplicados ou obsoletos

## Como Usar

### Inventory Flow
```powershell
# Teste completo positivo
scripts/tests/inventory-flow/test-positive-inventory.ps1

# Teste de validações (casos negativos)
scripts/tests/inventory-flow/test-inventory-validation.ps1

# Teste mínimo para diagnóstico
scripts/tests/inventory-flow/test-simple-webhook.ps1
```

### Outros Fluxos
Os arquivos JSON podem ser usados com curl ou Invoke-WebRequest para testar os respectivos webhooks.

## Status Atual

✅ **Inventory Flow**: 100% funcional e testado
🔄 **Purchase Flow**: Aguardando implementação
🔄 **Sales Flow**: Aguardando implementação  
🔄 **Transfer Flow**: Aguardando implementação

## Notas Importantes

- Todos os testes do Inventory Flow foram validados e estão funcionando
- Os scripts PowerShell incluem tratamento de erro adequado
- Os arquivos JSON contêm payloads realistas para cada tipo de webhook
- A pasta `/obsolete/` pode ser removida após confirmação de que não há dependências 