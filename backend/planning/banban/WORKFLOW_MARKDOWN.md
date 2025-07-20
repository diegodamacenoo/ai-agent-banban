# Fluxo regular
*Diagrama que imita o fluxo atual no ERP da BanBan.*

---

## Pedido de Entrada/Compra (PE)

### **COMERCIAL**

1.  **Criação da Ordem de Compra**
    *   **Decisão:** Produto, Fornecedor ou Pack possuem cadastro?
        *   **NÃO:**
            *   **Cadastro Produto** -> `Registra Novo Produto`
            *   **Cadastro Fornecedor** -> `Registra Novo Fornecedor`
            *   **Cadastro Pack** -> `Registra Novo Pack`
        *   **SIM:** (ou após os cadastros)
            *   **Criação do Pedido de Compra** -> `Registra Novo Pedido de Compra`
2.  **Fornecedor Fatura NF**
    *   `Registra Emissão de NF`
    *   `Atualiza Status (pré-baixa)`

---

## Recebimento

### **LOGÍSTICA**

1.  **Carga Chega no CD (portaria)**
    *   `Atualiza Status: Chegou no CD`
2.  **Aguardando conferência**
    *   `Atualiza Status: Aguardando conferência`
3.  **Em Conferência**
    *   `Atualiza Status: Em conferência`
4.  **Conferido com ou sem divergência**
    *   `Atualiza Status: Conferido sem divergência ou Conferido com divergência`
5.  **Efetivado**
    *   `Atualiza Status: Efetivado`

---

## Preparo para Transferência

### **COMERCIAL**

1.  **Criação do pedido de transferência**
    *   `Registra Pedido de Transferência`
2.  **Criação do mapa de separação**
    *   `Atualiza Status: Mapa de separação criado`

---

## Separação

### **LOGÍSTICA**

1.  **Aguardando separação**
    *   `Atualiza Status: Aguardando separação`
2.  **Em Separação (Entrega o mapa para o separador)**
    *   `Atualiza Status: Em separação`
3.  **Em separação (bipagem)**
    *   `Atualiza Status a cada bip: Conferido com divergência ou Conferido sem divergência`
4.  **Separado/conferido (pré-doca)**
    *   `Atualiza Status: Separado`
5.  **Embarcado (doca)**
    *   `Atualiza Status: Embarcado`
6.  **Faturado (caminhão)**
    *   `Atualiza Status: Faturado`
    *   `Registra NF de Transferência`

---

## Chegada em Loja

### **LOJA**

1.  **Inicia processo de conferência**
    *   `Registra Início`
2.  **Finaliza processo de conferência**
    *   `Registra Fim`
    *   `Atualiza Status: Conferido com Divergência ou Conferido sem divergência`

---

## Compra e Devolução

### **LOJA**

1.  **Cliente Compra**
    *   `Registra Venda`
2.  **Cliente devolve produto**
    *   **Decisão:** Mesma loja que comprou?
        *   **SIM:**
            *   `Registra NF de Devolução`
        *   **NÃO:**
            *   `Registra NF de Devolução`
            *   `Registra NF de Transferência`