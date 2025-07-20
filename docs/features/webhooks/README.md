# Visão Geral do Sistema de Webhooks

## 1. O que são Webhooks?

Webhooks são uma forma de a plataforma Axon notificar sistemas externos sobre eventos que acontecem em tempo real. Em vez de o sistema externo precisar consultar nossa API repetidamente para verificar se há novos dados (polling), a Axon envia uma requisição HTTP (`POST`) para uma URL pré-configurada (um "endpoint de webhook") assim que um evento ocorre.

**Caso de Uso Principal:** Sincronizar dados entre a Axon e sistemas legados (ERPs, CRMs, etc.), notificar sistemas de análise, ou acionar fluxos de trabalho em ferramentas de automação.

## 2. Arquitetura do Sistema de Webhooks

A arquitetura é projetada para ser robusta, segura e escalável, utilizando Edge Functions do Supabase para processamento.

```mermaid
graph TD
    subgraph "Plataforma Axon"
        A[Ação do Usuário] --> B{Lógica de Negócio};
        B --> |1. Evento Disparado| C[Fila de Eventos (pg_net)];
    end

    subgraph "Infraestrutura Supabase"
        D(Listener da Fila) --> E[Edge Function: Processador de Webhooks];
        E --> |3. Prepara Payload| E;
        E --> |4. Assina Digitalmente| E;
    end

    subgraph "Sistema Externo do Cliente"
        F[Endpoint do Webhook (URL do Cliente)]
    end

    C --> |2. Notificação| D;
    E --> |5. Envia Requisição POST| F;
    F --> |6. Retorna 200 OK| E;
```

**Fluxo:**

1.  **Disparo do Evento:** Uma ação na plataforma (ex: um produto é criado, um pedido é atualizado) dispara um evento na lógica de negócio do backend. O evento e seus dados são inseridos em uma fila no PostgreSQL (usando a extensão `pg_net`).
2.  **Processamento na Edge Function:** Uma Edge Function do Supabase está constantemente ouvindo essa fila. Ao receber um novo evento, ela:
    - Busca os detalhes completos do evento no banco de dados.
    - Monta o payload (corpo da requisição) do webhook.
    - Busca as URLs dos endpoints de webhook que estão inscritos para aquele tipo de evento e para aquele `tenant_id`.
3.  **Assinatura e Segurança:** Para garantir a autenticidade, a Edge Function assina cada payload de webhook com um segredo único por cliente. O hash da assinatura é enviado no header `X-Axon-Signature`.
4.  **Envio:** A Edge Function envia a requisição `POST` para cada URL inscrita.
5.  **Confirmação e Retentativas:**
    - Se o sistema externo responder com um status `2xx` (sucesso), o evento é marcado como processado.
    - Se a resposta for um erro (`4xx` ou `5xx`) ou houver timeout, o sistema tentará reenviar o webhook algumas vezes com um intervalo de tempo crescente (backoff exponencial). Se todas as tentativas falharem, o evento é movido para uma "fila de falhas" para análise manual.

## 3. Conceitos Principais

- **Evento (`event`):** A ação que ocorreu na plataforma. Ex: `product.created`, `order.updated`.
- **Endpoint (`endpoint`):** A URL do sistema externo que receberá as notificações do webhook. Cada cliente pode configurar múltiplos endpoints.
- **Inscrição (`subscription`):** A associação entre um evento e um endpoint. Um cliente pode se inscrever para receber notificações do evento `product.created` em `https://erp.cliente.com/hooks/products`.
- **Payload (`payload`):** O corpo de dados (JSON) enviado na requisição do webhook, contendo informações sobre o evento.
- **Assinatura (`signature`):** Um hash HMAC enviado no header `X-Axon-Signature` para que o sistema externo possa verificar que a requisição veio de fato da Axon.

Para um guia detalhado sobre como configurar e validar webhooks, consulte o **[Guia de Integração de Webhooks](./webhook-integration-guide.md)**. 