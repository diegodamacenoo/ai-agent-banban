# Referência da API BanBan

## Visão Geral

A API BanBan fornece endpoints para integração com o sistema de gestão de estoque. Esta documentação detalha os endpoints disponíveis, seus parâmetros e respostas.

## Base URL

```
https://api.banban.io/v1
```

## Autenticação

Todas as requisições devem incluir o token de autenticação no header:

```
Authorization: Bearer <seu_token>
```

## Endpoints

### Produtos

#### Listar Produtos

```
GET /api/products
```

**Parâmetros de Query**:
- `page` (opcional): Número da página (default: 1)
- `per_page` (opcional): Itens por página (default: 50, max: 100)
- `category` (opcional): Filtrar por categoria
- `status` (opcional): Filtrar por status (ativo/inativo)

**Exemplo de Resposta**:
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "external_id": "PROD2099",
      "name": "Produto Premium",
      "description": "Produto premium com tecnologia X",
      "category": "CATEGORIA_A",
      "sub_category": "SUBCATEGORIA_1",
      "status": "ativo",
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "total_pages": 10,
    "total_items": 500
  }
}
```

#### Obter Produto por ID

```
GET /api/products/:id
```

**Parâmetros de URL**:
- `id`: ID do produto

**Exemplo de Resposta**:
```json
{
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "external_id": "PROD2099",
    "name": "Produto Premium",
    "description": "Produto premium com tecnologia X",
    "category": "CATEGORIA_A",
    "sub_category": "SUBCATEGORIA_1",
    "variants": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174001",
        "size": "M",
        "color": "AZUL",
        "sku": "PROD2099-M-AZUL"
      }
    ],
    "status": "ativo",
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z"
  }
}
```

### Estoque

#### Obter Saldo de Estoque

```
GET /api/inventory/balance
```

**Parâmetros de Query**:
- `location_id` (opcional): ID da localização
- `product_id` (opcional): ID do produto
- `variant_id` (opcional): ID da variação
- `as_of_date` (opcional): Data de referência (formato: YYYY-MM-DD)

**Exemplo de Resposta**:
```json
{
  "data": [
    {
      "location_id": "123e4567-e89b-12d3-a456-426614174002",
      "product_id": "123e4567-e89b-12d3-a456-426614174000",
      "variant_id": "123e4567-e89b-12d3-a456-426614174001",
      "quantity": 150,
      "reserved_quantity": 10,
      "available_quantity": 140,
      "last_movement_date": "2024-01-14T15:30:00Z"
    }
  ]
}
```

#### Obter Movimentações de Estoque

```
GET /api/inventory/movements
```

**Parâmetros de Query**:
- `start_date`: Data inicial (formato: YYYY-MM-DD)
- `end_date`: Data final (formato: YYYY-MM-DD)
- `location_id` (opcional): ID da localização
- `product_id` (opcional): ID do produto
- `movement_type` (opcional): Tipo de movimentação (ENTRADA, SAIDA)

**Exemplo de Resposta**:
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174003",
      "location_id": "123e4567-e89b-12d3-a456-426614174002",
      "product_id": "123e4567-e89b-12d3-a456-426614174000",
      "variant_id": "123e4567-e89b-12d3-a456-426614174001",
      "movement_type": "ENTRADA",
      "quantity": 50,
      "document_id": "123e4567-e89b-12d3-a456-426614174004",
      "movement_date": "2024-01-14T15:30:00Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "total_pages": 5,
    "total_items": 250
  }
}
```

### Métricas de Estoque

#### Obter Giro de Estoque

```
GET /api/inventory/metrics/turnover
```

**Parâmetros de Query**:
- `start_date`: Data inicial (formato: YYYY-MM-DD)
- `end_date`: Data final (formato: YYYY-MM-DD)
- `location_id` (opcional): ID da localização
- `category` (opcional): Categoria de produtos

**Exemplo de Resposta**:
```json
{
  "data": {
    "overall_turnover": 4.5,
    "by_category": [
      {
        "category": "CATEGORIA_A",
        "turnover": 5.2
      }
    ],
    "by_location": [
      {
        "location_id": "123e4567-e89b-12d3-a456-426614174002",
        "location_name": "CD Principal",
        "turnover": 4.8
      }
    ]
  }
}
```

#### Obter Cobertura de Estoque

```
GET /api/inventory/metrics/coverage
```

**Parâmetros de Query**:
- `location_id` (opcional): ID da localização
- `category` (opcional): Categoria de produtos

**Exemplo de Resposta**:
```json
{
  "data": {
    "overall_coverage_days": 45,
    "by_category": [
      {
        "category": "CATEGORIA_A",
        "coverage_days": 42
      }
    ],
    "by_location": [
      {
        "location_id": "123e4567-e89b-12d3-a456-426614174002",
        "location_name": "CD Principal",
        "coverage_days": 48
      }
    ]
  }
}
```

### Pedidos

#### Listar Pedidos

```
GET /api/orders
```

**Parâmetros de Query**:
- `page` (opcional): Número da página (default: 1)
- `per_page` (opcional): Itens por página (default: 50, max: 100)
- `status` (opcional): Status do pedido
- `type` (opcional): Tipo do pedido (PURCHASE, TRANSFER)
- `start_date` (opcional): Data inicial (formato: YYYY-MM-DD)
- `end_date` (opcional): Data final (formato: YYYY-MM-DD)

**Exemplo de Resposta**:
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174005",
      "external_id": "PC2024001",
      "type": "PURCHASE",
      "status": "APPROVED",
      "supplier_id": "123e4567-e89b-12d3-a456-426614174006",
      "dest_location_id": "123e4567-e89b-12d3-a456-426614174002",
      "issue_date": "2024-01-15",
      "items": [
        {
          "product_id": "123e4567-e89b-12d3-a456-426614174000",
          "variant_id": "123e4567-e89b-12d3-a456-426614174001",
          "quantity": 100,
          "unit_cost": 89.50
        }
      ],
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "total_pages": 3,
    "total_items": 150
  }
}
```

## Códigos de Erro

| Código | Descrição                                |
|--------|------------------------------------------|
| 400    | Requisição inválida                      |
| 401    | Não autorizado                           |
| 403    | Acesso proibido                          |
| 404    | Recurso não encontrado                   |
| 422    | Erro de validação                        |
| 429    | Muitas requisições                       |
| 500    | Erro interno do servidor                 |

## Limites de Taxa

- 1000 requisições por minuto por token de API
- 10000 requisições por hora por token de API

## Webhooks

### Eventos Disponíveis

- `product.created`: Novo produto criado
- `product.updated`: Produto atualizado
- `inventory.movement`: Nova movimentação de estoque
- `inventory.low_stock`: Alerta de estoque baixo
- `order.created`: Novo pedido criado
- `order.status_changed`: Status do pedido alterado

### Formato do Payload

```json
{
  "event": "inventory.movement",
  "timestamp": "2024-01-15T10:00:00Z",
  "data": {
    "location_id": "123e4567-e89b-12d3-a456-426614174002",
    "product_id": "123e4567-e89b-12d3-a456-426614174000",
    "variant_id": "123e4567-e89b-12d3-a456-426614174001",
    "movement_type": "ENTRADA",
    "quantity": 50
  }
}
```

## Versionamento

A API é versionada através do prefixo na URL. A versão atual é v1.

## Suporte

Para suporte técnico, entre em contato:
- Email: api-support@banban.io
- Documentação: https://docs.banban.io
- Status da API: https://status.banban.io 