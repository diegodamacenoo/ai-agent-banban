# Melhores Práticas ECA - Guia de Desenvolvimento

## 📋 Sumário

- [Princípios Fundamentais](#princípios-fundamentais)
- [Estrutura de Código](#estrutura-de-código)
- [Gerenciamento de Estado](#gerenciamento-de-estado)
- [Tratamento de Erros](#tratamento-de-erros)
- [Performance](#performance)
- [Segurança](#segurança)
- [Testes](#testes)
- [Monitoramento](#monitoramento)
- [Documentação](#documentação)
- [Deployment](#deployment)

---

## 🎯 Princípios Fundamentais

### 1. Single Responsibility Principle (SRP)

Cada módulo deve ter uma única responsabilidade bem definida.

```typescript
// ✅ Correto: Responsabilidade única
class PurchaseOrderService {
  async createPurchaseOrder(data: CreatePurchaseOrderDto): Promise<PurchaseOrder> {
    // Apenas lógica de criação de pedido
  }
}

class PurchaseOrderValidator {
  validate(data: CreatePurchaseOrderDto): ValidationResult {
    // Apenas validação
  }
}

// ❌ Incorreto: Múltiplas responsabilidades
class PurchaseOrderManager {
  async createPurchaseOrder(data: CreatePurchaseOrderDto): Promise<PurchaseOrder> {
    // Validação + criação + envio de email + logging
  }
}
```

### 2. Open/Closed Principle (OCP)

Módulos devem estar abertos para extensão, mas fechados para modificação.

```typescript
// ✅ Correto: Extensível através de interfaces
interface PaymentProcessor {
  process(amount: number): Promise<PaymentResult>;
}

class CreditCardProcessor implements PaymentProcessor {
  async process(amount: number): Promise<PaymentResult> {
    // Implementação específica
  }
}

class PaymentService {
  constructor(private processor: PaymentProcessor) {}
  
  async processPayment(amount: number): Promise<PaymentResult> {
    return this.processor.process(amount);
  }
}

// ❌ Incorreto: Difícil de estender
class PaymentService {
  async processPayment(amount: number, type: 'credit' | 'debit'): Promise<PaymentResult> {
    if (type === 'credit') {
      // Lógica cartão de crédito
    } else if (type === 'debit') {
      // Lógica cartão de débito
    }
    // Adicionar novo tipo requer modificação desta classe
  }
}
```

### 3. Dependency Inversion Principle (DIP)

Dependa de abstrações, não de implementações concretas.

```typescript
// ✅ Correto: Dependência de abstração
interface Repository<T> {
  save(entity: T): Promise<void>;
  findById(id: string): Promise<T | null>;
}

class UserService {
  constructor(private userRepository: Repository<User>) {}
  
  async getUser(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }
}

// ❌ Incorreto: Dependência de implementação concreta
class UserService {
  private userRepository = new PostgresUserRepository();
  
  async getUser(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }
}
```

---

## 🏗️ Estrutura de Código

### 1. Organização de Arquivos

```
src/modules/custom/client-name/flow-name/
├── index.ts                    # Registro do módulo
├── schemas/                    # Schemas de validação
│   ├── requests/
│   │   ├── create-order.schema.ts
│   │   └── update-order.schema.ts
│   └── responses/
│       ├── order.schema.ts
│       └── order-list.schema.ts
├── services/                   # Lógica de negócio
│   ├── order.service.ts
│   ├── validation.service.ts
│   └── notification.service.ts
├── repositories/               # Acesso a dados
│   ├── order.repository.ts
│   └── audit.repository.ts
├── types/                      # Tipos e interfaces
│   ├── order.types.ts
│   └── events.types.ts
├── utils/                      # Utilitários específicos
│   ├── calculations.ts
│   └── formatters.ts
├── constants/                  # Constantes
│   └── order.constants.ts
└── tests/                      # Testes
    ├── unit/
    ├── integration/
    └── fixtures/
```

### 2. Naming Conventions

```typescript
// ✅ Correto: Nomes descritivos e consistentes
class PurchaseOrderService {
  async createPurchaseOrder(data: CreatePurchaseOrderDto): Promise<PurchaseOrder> {}
  async updatePurchaseOrderStatus(id: string, status: OrderStatus): Promise<void> {}
  async getPurchaseOrderById(id: string): Promise<PurchaseOrder | null> {}
}

// Interfaces com prefixo I ou sufixo Interface
interface IPurchaseOrderRepository {
  save(order: PurchaseOrder): Promise<void>;
}

// Tipos com sufixo Type
type OrderStatusType = 'pending' | 'approved' | 'rejected';

// Enums em PascalCase
enum OrderStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

// Constantes em UPPER_SNAKE_CASE
const MAX_ORDER_ITEMS = 100;
const DEFAULT_TIMEOUT = 30000;

// ❌ Incorreto: Nomes ambíguos
class OrderManager {
  async process(data: any): Promise<any> {}
  async handle(id: string): Promise<void> {}
  async get(id: string): Promise<any> {}
}
```

### 3. Imports e Exports

```typescript
// ✅ Correto: Imports organizados
// Imports de bibliotecas externas primeiro
import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';

// Imports do projeto
import { OrderService } from '../services/order.service';
import { OrderRepository } from '../repositories/order.repository';
import { CreateOrderSchema } from '../schemas/create-order.schema';

// Imports de tipos
import type { Order, CreateOrderDto } from '../types/order.types';

// ✅ Correto: Exports organizados
export { OrderService } from './services/order.service';
export { OrderRepository } from './repositories/order.repository';
export type { Order, CreateOrderDto } from './types/order.types';

// ❌ Incorreto: Imports desorganizados
import { OrderService } from '../services/order.service';
import { FastifyRequest } from 'fastify';
import type { Order } from '../types/order.types';
import { z } from 'zod';
import { OrderRepository } from '../repositories/order.repository';
```

---

## 🔄 Gerenciamento de Estado

### 1. Imutabilidade

```typescript
// ✅ Correto: Estado imutável
interface OrderState {
  readonly id: string;
  readonly status: OrderStatus;
  readonly items: readonly OrderItem[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

class OrderAggregate {
  private constructor(private state: OrderState) {}
  
  static create(data: CreateOrderData): OrderAggregate {
    return new OrderAggregate({
      id: uuidv4(),
      status: OrderStatus.PENDING,
      items: data.items,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
  
  updateStatus(newStatus: OrderStatus): OrderAggregate {
    return new OrderAggregate({
      ...this.state,
      status: newStatus,
      updatedAt: new Date()
    });
  }
  
  getState(): OrderState {
    return { ...this.state };
  }
}

// ❌ Incorreto: Estado mutável
class OrderAggregate {
  public id: string;
  public status: OrderStatus;
  public items: OrderItem[];
  
  updateStatus(newStatus: OrderStatus): void {
    this.status = newStatus; // Mutação direta
  }
}
```

### 2. Máquinas de Estado

```typescript
// ✅ Correto: Máquina de estado bem definida
interface StateTransition {
  from: OrderStatus;
  to: OrderStatus;
  event: string;
  condition?: (context: any) => boolean;
}

class OrderStateMachine {
  private transitions: StateTransition[] = [
    { from: OrderStatus.PENDING, to: OrderStatus.APPROVED, event: 'approve' },
    { from: OrderStatus.APPROVED, to: OrderStatus.PROCESSING, event: 'process' },
    { from: OrderStatus.PROCESSING, to: OrderStatus.COMPLETED, event: 'complete' },
    { from: OrderStatus.PROCESSING, to: OrderStatus.CANCELLED, event: 'cancel' }
  ];
  
  canTransition(from: OrderStatus, event: string, context?: any): boolean {
    const transition = this.transitions.find(t => 
      t.from === from && t.event === event
    );
    
    if (!transition) return false;
    
    return transition.condition ? transition.condition(context) : true;
  }
  
  transition(from: OrderStatus, event: string, context?: any): OrderStatus {
    if (!this.canTransition(from, event, context)) {
      throw new Error(`Invalid transition: ${from} -> ${event}`);
    }
    
    const transition = this.transitions.find(t => 
      t.from === from && t.event === event
    )!;
    
    return transition.to;
  }
}

// ❌ Incorreto: Transições não controladas
class OrderService {
  async updateStatus(id: string, newStatus: OrderStatus): Promise<void> {
    // Permite qualquer transição sem validação
    await this.repository.updateStatus(id, newStatus);
  }
}
```

### 3. Event Sourcing

```typescript
// ✅ Correto: Event sourcing implementado
interface DomainEvent {
  id: string;
  aggregateId: string;
  eventType: string;
  payload: any;
  timestamp: Date;
  version: number;
}

class OrderCreatedEvent implements DomainEvent {
  id = uuidv4();
  eventType = 'OrderCreated';
  timestamp = new Date();
  
  constructor(
    public aggregateId: string,
    public payload: CreateOrderData,
    public version: number
  ) {}
}

abstract class AggregateRoot {
  protected uncommittedEvents: DomainEvent[] = [];
  protected version = 0;
  
  protected addEvent(event: DomainEvent): void {
    this.uncommittedEvents.push(event);
    this.apply(event);
  }
  
  abstract apply(event: DomainEvent): void;
  
  getUncommittedEvents(): DomainEvent[] {
    return [...this.uncommittedEvents];
  }
  
  markEventsAsCommitted(): void {
    this.uncommittedEvents = [];
  }
}

// ❌ Incorreto: Mudanças diretas sem eventos
class OrderAggregate {
  private status: OrderStatus;
  
  updateStatus(newStatus: OrderStatus): void {
    this.status = newStatus; // Sem evento, sem rastreabilidade
  }
}
```

---

## 🚨 Tratamento de Erros

### 1. Hierarquia de Erros

```typescript
// ✅ Correto: Hierarquia de erros bem definida
abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;
  
  constructor(message: string, public readonly context?: any) {
    super(message);
    this.name = this.constructor.name;
  }
}

class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR';
  readonly statusCode = 400;
}

class NotFoundError extends DomainError {
  readonly code = 'NOT_FOUND';
  readonly statusCode = 404;
}

class BusinessRuleError extends DomainError {
  readonly code = 'BUSINESS_RULE_ERROR';
  readonly statusCode = 422;
}

// ❌ Incorreto: Erros genéricos
class OrderService {
  async getOrder(id: string): Promise<Order> {
    const order = await this.repository.findById(id);
    if (!order) {
      throw new Error('Order not found'); // Muito genérico
    }
    return order;
  }
}
```

### 2. Error Handling Middleware

```typescript
// ✅ Correto: Middleware centralizado
export const errorHandler = (
  error: Error,
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const logger = request.log;
  
  if (error instanceof DomainError) {
    logger.warn({
      error: error.message,
      code: error.code,
      context: error.context,
      correlationId: request.correlationId
    });
    
    return reply.status(error.statusCode).send({
      error: {
        code: error.code,
        message: error.message,
        correlationId: request.correlationId
      }
    });
  }
  
  if (error instanceof ValidationError) {
    logger.warn({
      error: error.message,
      validation: error.validation,
      correlationId: request.correlationId
    });
    
    return reply.status(400).send({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: error.validation,
        correlationId: request.correlationId
      }
    });
  }
  
  // Log de erro não esperado
  logger.error({
    error: error.message,
    stack: error.stack,
    correlationId: request.correlationId
  });
  
  return reply.status(500).send({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
      correlationId: request.correlationId
    }
  });
};
```

### 3. Result Pattern

```typescript
// ✅ Correto: Result pattern para operações que podem falhar
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

class OrderService {
  async createOrder(data: CreateOrderDto): Promise<Result<Order, ValidationError>> {
    try {
      const validationResult = this.validateOrder(data);
      if (!validationResult.success) {
        return { success: false, error: validationResult.error };
      }
      
      const order = await this.repository.save(data);
      return { success: true, data: order };
    } catch (error) {
      return { success: false, error: error as ValidationError };
    }
  }
}

// Uso do Result
const result = await orderService.createOrder(data);
if (result.success) {
  console.log('Order created:', result.data);
} else {
  console.error('Failed to create order:', result.error);
}

// ❌ Incorreto: Exceptions para controle de fluxo
class OrderService {
  async createOrder(data: CreateOrderDto): Promise<Order> {
    if (!this.isValid(data)) {
      throw new Error('Invalid data'); // Exception para validação
    }
    
    return this.repository.save(data);
  }
}
```

---

## ⚡ Performance

### 1. Caching Strategy

```typescript
// ✅ Correto: Cache bem estruturado
interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
  clear(pattern?: string): Promise<void>;
}

class OrderService {
  constructor(
    private repository: OrderRepository,
    private cache: CacheService
  ) {}
  
  async getOrder(id: string): Promise<Order | null> {
    const cacheKey = `order:${id}`;
    
    // Tentar cache primeiro
    const cached = await this.cache.get<Order>(cacheKey);
    if (cached) {
      return cached;
    }
    
    // Buscar no banco
    const order = await this.repository.findById(id);
    if (order) {
      await this.cache.set(cacheKey, order, 300); // 5 minutos
    }
    
    return order;
  }
  
  async updateOrder(id: string, data: UpdateOrderDto): Promise<void> {
    await this.repository.update(id, data);
    
    // Invalidar cache
    await this.cache.del(`order:${id}`);
  }
}

// ❌ Incorreto: Sem estratégia de cache
class OrderService {
  async getOrder(id: string): Promise<Order | null> {
    return this.repository.findById(id); // Sempre busca no banco
  }
}
```

### 2. Lazy Loading

```typescript
// ✅ Correto: Lazy loading para dados pesados
class OrderService {
  async getOrder(id: string): Promise<Order | null> {
    return this.repository.findById(id);
  }
  
  async getOrderWithItems(id: string): Promise<Order | null> {
    const order = await this.repository.findById(id);
    if (!order) return null;
    
    // Carregar itens apenas quando necessário
    const items = await this.repository.getOrderItems(id);
    return { ...order, items };
  }
  
  async getOrderWithHistory(id: string): Promise<Order | null> {
    const order = await this.repository.findById(id);
    if (!order) return null;
    
    // Carregar histórico apenas quando necessário
    const history = await this.repository.getOrderHistory(id);
    return { ...order, history };
  }
}

// ❌ Incorreto: Sempre carrega tudo
class OrderService {
  async getOrder(id: string): Promise<Order | null> {
    const order = await this.repository.findById(id);
    const items = await this.repository.getOrderItems(id);
    const history = await this.repository.getOrderHistory(id);
    
    return { ...order, items, history }; // Sempre carrega tudo
  }
}
```

### 3. Pagination

```typescript
// ✅ Correto: Paginação eficiente
interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

class OrderService {
  async getOrders(
    filters: OrderFilters,
    options: PaginationOptions
  ): Promise<PaginatedResult<Order>> {
    const offset = (options.page - 1) * options.limit;
    
    const [orders, total] = await Promise.all([
      this.repository.findMany(filters, {
        limit: options.limit,
        offset,
        sortBy: options.sortBy,
        sortOrder: options.sortOrder
      }),
      this.repository.count(filters)
    ]);
    
    const totalPages = Math.ceil(total / options.limit);
    
    return {
      data: orders,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        totalPages,
        hasNext: options.page < totalPages,
        hasPrev: options.page > 1
      }
    };
  }
}

// ❌ Incorreto: Sem paginação
class OrderService {
  async getOrders(filters: OrderFilters): Promise<Order[]> {
    return this.repository.findMany(filters); // Retorna todos os registros
  }
}
```

---

## 🔐 Segurança

### 1. Input Validation

```typescript
// ✅ Correto: Validação robusta
import { z } from 'zod';

const CreateOrderSchema = z.object({
  supplierId: z.string().uuid(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1).max(1000),
    unitPrice: z.number().min(0).max(999999.99)
  })).min(1).max(100),
  deliveryDate: z.string().datetime(),
  notes: z.string().max(500).optional()
});

class OrderController {
  async createOrder(request: FastifyRequest, reply: FastifyReply) {
    try {
      const validatedData = CreateOrderSchema.parse(request.body);
      const order = await this.orderService.createOrder(validatedData);
      reply.send({ success: true, data: order });
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.status(400).send({
          error: 'Validation failed',
          details: error.errors
        });
      } else {
        throw error;
      }
    }
  }
}

// ❌ Incorreto: Sem validação
class OrderController {
  async createOrder(request: FastifyRequest, reply: FastifyReply) {
    const order = await this.orderService.createOrder(request.body); // Sem validação
    reply.send({ success: true, data: order });
  }
}
```

### 2. Authorization

```typescript
// ✅ Correto: Autorização granular
interface AuthContext {
  userId: string;
  tenantId: string;
  roles: string[];
  permissions: string[];
}

class OrderService {
  async getOrder(id: string, context: AuthContext): Promise<Order | null> {
    const order = await this.repository.findById(id);
    if (!order) return null;
    
    // Verificar se o usuário tem acesso ao pedido
    if (order.tenantId !== context.tenantId) {
      throw new ForbiddenError('Access denied');
    }
    
    // Verificar permissões específicas
    if (!context.permissions.includes('orders:read')) {
      throw new ForbiddenError('Insufficient permissions');
    }
    
    return order;
  }
  
  async updateOrder(id: string, data: UpdateOrderDto, context: AuthContext): Promise<void> {
    const order = await this.repository.findById(id);
    if (!order) {
      throw new NotFoundError('Order not found');
    }
    
    if (order.tenantId !== context.tenantId) {
      throw new ForbiddenError('Access denied');
    }
    
    if (!context.permissions.includes('orders:update')) {
      throw new ForbiddenError('Insufficient permissions');
    }
    
    await this.repository.update(id, data);
  }
}

// ❌ Incorreto: Sem autorização
class OrderService {
  async getOrder(id: string): Promise<Order | null> {
    return this.repository.findById(id); // Sem verificação de acesso
  }
}
```

### 3. Rate Limiting

```typescript
// ✅ Correto: Rate limiting implementado
interface RateLimiter {
  isAllowed(key: string, limit: number, window: number): Promise<boolean>;
  getRemainingAttempts(key: string): Promise<number>;
}

class RateLimitingService {
  constructor(private rateLimiter: RateLimiter) {}
  
  async checkRateLimit(userId: string, endpoint: string): Promise<void> {
    const key = `rate_limit:${userId}:${endpoint}`;
    const isAllowed = await this.rateLimiter.isAllowed(key, 100, 3600); // 100 req/hour
    
    if (!isAllowed) {
      const remaining = await this.rateLimiter.getRemainingAttempts(key);
      throw new RateLimitError(`Rate limit exceeded. Try again in ${remaining} seconds`);
    }
  }
}

// Middleware de rate limiting
export const rateLimitMiddleware = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const userId = request.user?.id;
  const endpoint = request.routerPath;
  
  if (userId && endpoint) {
    await rateLimitingService.checkRateLimit(userId, endpoint);
  }
};

// ❌ Incorreto: Sem rate limiting
class OrderController {
  async createOrder(request: FastifyRequest, reply: FastifyReply) {
    // Sem proteção contra abuse
    const order = await this.orderService.createOrder(request.body);
    reply.send({ success: true, data: order });
  }
}
```

---

## 🧪 Testes

### 1. Testes Unitários

```typescript
// ✅ Correto: Testes unitários bem estruturados
describe('OrderService', () => {
  let orderService: OrderService;
  let mockRepository: jest.Mocked<OrderRepository>;
  let mockCache: jest.Mocked<CacheService>;
  
  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    };
    
    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      clear: jest.fn()
    };
    
    orderService = new OrderService(mockRepository, mockCache);
  });
  
  describe('getOrder', () => {
    it('should return cached order when available', async () => {
      // Arrange
      const orderId = 'order-123';
      const cachedOrder = { id: orderId, status: 'pending' };
      mockCache.get.mockResolvedValue(cachedOrder);
      
      // Act
      const result = await orderService.getOrder(orderId);
      
      // Assert
      expect(result).toEqual(cachedOrder);
      expect(mockCache.get).toHaveBeenCalledWith(`order:${orderId}`);
      expect(mockRepository.findById).not.toHaveBeenCalled();
    });
    
    it('should fetch from repository when not cached', async () => {
      // Arrange
      const orderId = 'order-123';
      const order = { id: orderId, status: 'pending' };
      mockCache.get.mockResolvedValue(null);
      mockRepository.findById.mockResolvedValue(order);
      
      // Act
      const result = await orderService.getOrder(orderId);
      
      // Assert
      expect(result).toEqual(order);
      expect(mockRepository.findById).toHaveBeenCalledWith(orderId);
      expect(mockCache.set).toHaveBeenCalledWith(`order:${orderId}`, order, 300);
    });
    
    it('should return null when order not found', async () => {
      // Arrange
      const orderId = 'non-existent';
      mockCache.get.mockResolvedValue(null);
      mockRepository.findById.mockResolvedValue(null);
      
      // Act
      const result = await orderService.getOrder(orderId);
      
      // Assert
      expect(result).toBeNull();
      expect(mockCache.set).not.toHaveBeenCalled();
    });
  });
});

// ❌ Incorreto: Testes mal estruturados
describe('OrderService', () => {
  it('should work', async () => {
    const orderService = new OrderService();
    const result = await orderService.getOrder('123');
    expect(result).toBeTruthy(); // Teste muito vago
  });
});
```

### 2. Testes de Integração

```typescript
// ✅ Correto: Testes de integração abrangentes
describe('Order API Integration', () => {
  let app: FastifyInstance;
  let database: DatabaseConnection;
  
  beforeAll(async () => {
    // Setup do banco de teste
    database = await createTestDatabase();
    app = await createTestApp(database);
  });
  
  afterAll(async () => {
    await database.cleanup();
    await app.close();
  });
  
  beforeEach(async () => {
    await database.clearData();
    await database.seedTestData();
  });
  
  describe('POST /orders', () => {
    it('should create order successfully', async () => {
      // Arrange
      const orderData = {
        supplierId: 'supplier-123',
        items: [
          { productId: 'product-123', quantity: 10, unitPrice: 99.99 }
        ]
      };
      
      // Act
      const response = await app.inject({
        method: 'POST',
        url: '/api/orders',
        headers: {
          'Authorization': 'Bearer valid-token',
          'Content-Type': 'application/json'
        },
        payload: orderData
      });
      
      // Assert
      expect(response.statusCode).toBe(201);
      
      const result = JSON.parse(response.body);
      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        id: expect.any(String),
        status: 'pending',
        supplierId: orderData.supplierId
      });
      
      // Verificar no banco
      const savedOrder = await database.orders.findById(result.data.id);
      expect(savedOrder).toBeTruthy();
    });
    
    it('should return validation error for invalid data', async () => {
      // Arrange
      const invalidData = {
        supplierId: 'invalid-uuid',
        items: [] // Array vazio
      };
      
      // Act
      const response = await app.inject({
        method: 'POST',
        url: '/api/orders',
        headers: {
          'Authorization': 'Bearer valid-token',
          'Content-Type': 'application/json'
        },
        payload: invalidData
      });
      
      // Assert
      expect(response.statusCode).toBe(400);
      
      const result = JSON.parse(response.body);
      expect(result.error).toBe('Validation failed');
      expect(result.details).toHaveLength(2);
    });
  });
});
```

### 3. Testes de Carga

```typescript
// ✅ Correto: Testes de carga estruturados
describe('Order API Load Tests', () => {
  let app: FastifyInstance;
  
  beforeAll(async () => {
    app = await createTestApp();
  });
  
  afterAll(async () => {
    await app.close();
  });
  
  it('should handle concurrent order creation', async () => {
    // Arrange
    const concurrency = 100;
    const requests = Array.from({ length: concurrency }, (_, i) => ({
      method: 'POST',
      url: '/api/orders',
      headers: {
        'Authorization': 'Bearer valid-token',
        'Content-Type': 'application/json'
      },
      payload: {
        supplierId: 'supplier-123',
        items: [
          { productId: 'product-123', quantity: 1, unitPrice: 10.00 }
        ]
      }
    }));
    
    // Act
    const startTime = Date.now();
    const responses = await Promise.all(
      requests.map(request => app.inject(request))
    );
    const endTime = Date.now();
    
    // Assert
    const successCount = responses.filter(r => r.statusCode === 201).length;
    const avgResponseTime = (endTime - startTime) / concurrency;
    
    expect(successCount).toBeGreaterThan(concurrency * 0.95); // 95% success rate
    expect(avgResponseTime).toBeLessThan(100); // Average < 100ms
    
    // Verificar se não houve memory leaks
    const memoryUsage = process.memoryUsage();
    expect(memoryUsage.heapUsed).toBeLessThan(100 * 1024 * 1024); // < 100MB
  });
});
```

---

## 📊 Monitoramento

### 1. Métricas de Negócio

```typescript
// ✅ Correto: Métricas de negócio bem definidas
interface BusinessMetrics {
  ordersCreated: Counter;
  orderProcessingTime: Histogram;
  orderValue: Histogram;
  orderErrors: Counter;
}

class OrderService {
  constructor(
    private repository: OrderRepository,
    private metrics: BusinessMetrics
  ) {}
  
  async createOrder(data: CreateOrderDto): Promise<Order> {
    const startTime = Date.now();
    
    try {
      const order = await this.repository.save(data);
      
      // Métricas de sucesso
      this.metrics.ordersCreated.inc({
        supplier: data.supplierId,
        tenant: data.tenantId
      });
      
      this.metrics.orderValue.observe(
        { tenant: data.tenantId },
        order.totalValue
      );
      
      return order;
    } catch (error) {
      // Métricas de erro
      this.metrics.orderErrors.inc({
        type: error.constructor.name,
        tenant: data.tenantId
      });
      
      throw error;
    } finally {
      // Métricas de tempo
      const duration = Date.now() - startTime;
      this.metrics.orderProcessingTime.observe(
        { tenant: data.tenantId },
        duration
      );
    }
  }
}
```

### 2. Logs Estruturados

```typescript
// ✅ Correto: Logs estruturados
interface LogContext {
  correlationId: string;
  userId?: string;
  tenantId: string;
  operation: string;
  [key: string]: any;
}

class Logger {
  info(message: string, context: LogContext): void {
    console.log(JSON.stringify({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...context
    }));
  }
  
  error(message: string, error: Error, context: LogContext): void {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      timestamp: new Date().toISOString(),
      ...context
    }));
  }
}

class OrderService {
  constructor(
    private repository: OrderRepository,
    private logger: Logger
  ) {}
  
  async createOrder(data: CreateOrderDto, context: LogContext): Promise<Order> {
    this.logger.info('Creating order', {
      ...context,
      operation: 'createOrder',
      supplierId: data.supplierId,
      itemCount: data.items.length
    });
    
    try {
      const order = await this.repository.save(data);
      
      this.logger.info('Order created successfully', {
        ...context,
        operation: 'createOrder',
        orderId: order.id,
        totalValue: order.totalValue
      });
      
      return order;
    } catch (error) {
      this.logger.error('Failed to create order', error, {
        ...context,
        operation: 'createOrder',
        supplierId: data.supplierId
      });
      
      throw error;
    }
  }
}

// ❌ Incorreto: Logs não estruturados
class OrderService {
  async createOrder(data: CreateOrderDto): Promise<Order> {
    console.log('Creating order for supplier:', data.supplierId);
    
    try {
      const order = await this.repository.save(data);
      console.log('Order created:', order.id);
      return order;
    } catch (error) {
      console.error('Error creating order:', error.message);
      throw error;
    }
  }
}
```

### 3. Health Checks

```typescript
// ✅ Correto: Health checks abrangentes
interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  message?: string;
  duration?: number;
  details?: Record<string, any>;
}

class HealthChecker {
  private checks: Map<string, () => Promise<HealthCheck>> = new Map();
  
  register(name: string, check: () => Promise<HealthCheck>): void {
    this.checks.set(name, check);
  }
  
  async runAll(): Promise<{
    status: 'healthy' | 'unhealthy' | 'degraded';
    checks: HealthCheck[];
    timestamp: string;
  }> {
    const results: HealthCheck[] = [];
    
    for (const [name, check] of this.checks) {
      const startTime = Date.now();
      
      try {
        const result = await Promise.race([
          check(),
          new Promise<HealthCheck>((_, reject) => 
            setTimeout(() => reject(new Error('Health check timeout')), 5000)
          )
        ]);
        
        result.duration = Date.now() - startTime;
        results.push(result);
      } catch (error) {
        results.push({
          name,
          status: 'unhealthy',
          message: error instanceof Error ? error.message : 'Unknown error',
          duration: Date.now() - startTime
        });
      }
    }
    
    const overallStatus = this.determineOverallStatus(results);
    
    return {
      status: overallStatus,
      checks: results,
      timestamp: new Date().toISOString()
    };
  }
  
  private determineOverallStatus(checks: HealthCheck[]): 'healthy' | 'unhealthy' | 'degraded' {
    const hasUnhealthy = checks.some(c => c.status === 'unhealthy');
    const hasDegraded = checks.some(c => c.status === 'degraded');
    
    if (hasUnhealthy) return 'unhealthy';
    if (hasDegraded) return 'degraded';
    return 'healthy';
  }
}

// Health checks específicos
const databaseHealthCheck = async (): Promise<HealthCheck> => {
  try {
    const startTime = Date.now();
    await database.raw('SELECT 1');
    
    return {
      name: 'database',
      status: 'healthy',
      duration: Date.now() - startTime,
      message: 'Database connection is healthy'
    };
  } catch (error) {
    return {
      name: 'database',
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Database connection failed'
    };
  }
};

const cacheHealthCheck = async (): Promise<HealthCheck> => {
  try {
    const startTime = Date.now();
    await cache.ping();
    
    return {
      name: 'cache',
      status: 'healthy',
      duration: Date.now() - startTime,
      message: 'Cache is healthy'
    };
  } catch (error) {
    return {
      name: 'cache',
      status: 'degraded',
      message: error instanceof Error ? error.message : 'Cache is unavailable'
    };
  }
};
```

---

## 📖 Documentação

### 1. Documentação de Código

```typescript
// ✅ Correto: Documentação clara e útil
/**
 * Serviço responsável por gerenciar o ciclo de vida dos pedidos de compra.
 * 
 * Este serviço implementa a lógica de negócio para criação, atualização e
 * consulta de pedidos, incluindo validações, caching e auditoria.
 * 
 * @example
 * ```typescript
 * const orderService = new OrderService(repository, cache, logger);
 * const order = await orderService.createOrder(orderData, context);
 * ```
 */
class OrderService {
  /**
   * Cria um novo pedido de compra.
   * 
   * @param data - Dados do pedido a ser criado
   * @param context - Contexto de autenticação e autorização
   * @returns Promise com o pedido criado
   * 
   * @throws {ValidationError} Quando os dados do pedido são inválidos
   * @throws {ForbiddenError} Quando o usuário não tem permissão
   * @throws {BusinessRuleError} Quando regras de negócio são violadas
   * 
   * @example
   * ```typescript
   * const orderData = {
   *   supplierId: 'supplier-123',
   *   items: [{ productId: 'product-456', quantity: 10, unitPrice: 99.99 }]
   * };
   * 
   * const order = await orderService.createOrder(orderData, authContext);
   * ```
   */
  async createOrder(
    data: CreateOrderDto,
    context: AuthContext
  ): Promise<Order> {
    // Implementação...
  }
  
  /**
   * Atualiza o status de um pedido existente.
   * 
   * Esta operação valida se a transição de status é permitida de acordo
   * com a máquina de estados do pedido.
   * 
   * @param id - ID do pedido a ser atualizado
   * @param newStatus - Novo status do pedido
   * @param context - Contexto de autorização
   * 
   * @throws {NotFoundError} Quando o pedido não existe
   * @throws {StateTransitionError} Quando a transição não é permitida
   */
  async updateOrderStatus(
    id: string,
    newStatus: OrderStatus,
    context: AuthContext
  ): Promise<void> {
    // Implementação...
  }
}

// ❌ Incorreto: Documentação inadequada ou ausente
class OrderService {
  // Cria pedido
  async createOrder(data: any): Promise<any> {
    // Implementação...
  }
  
  // Atualiza status
  async updateOrderStatus(id: string, status: string): Promise<void> {
    // Implementação...
  }
}
```

### 2. README e Documentação de Projeto

```markdown
# Order Management Service

## Visão Geral

O Order Management Service é responsável por gerenciar o ciclo de vida completo dos pedidos de compra, incluindo criação, aprovação, processamento e finalização.

## Arquitetura

```
OrderService
├── OrderRepository (persistência)
├── CacheService (cache)
├── Logger (auditoria)
├── StateMachine (transições)
└── NotificationService (notificações)
```

## Instalação

```bash
npm install
npm run build
npm test
```

## Configuração

```typescript
const config = {
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  },
  cache: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379')
  }
};
```

## Uso

### Criar Pedido

```typescript
const orderData = {
  supplierId: 'supplier-123',
  items: [
    { productId: 'product-456', quantity: 10, unitPrice: 99.99 }
  ]
};

const order = await orderService.createOrder(orderData, authContext);
```

### Estados do Pedido

| Estado | Descrição |
|--------|-----------|
| PENDING | Pedido criado, aguardando aprovação |
| APPROVED | Pedido aprovado, pronto para processamento |
| PROCESSING | Pedido sendo processado |
| COMPLETED | Pedido finalizado com sucesso |
| CANCELLED | Pedido cancelado |

## API Endpoints

### POST /api/orders

Cria um novo pedido de compra.

**Request:**
```json
{
  "supplierId": "supplier-123",
  "items": [
    {
      "productId": "product-456",
      "quantity": 10,
      "unitPrice": 99.99
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "order-789",
    "status": "PENDING",
    "supplierId": "supplier-123",
    "totalValue": 999.90,
    "createdAt": "2025-07-09T10:00:00Z"
  }
}
```

## Testes

```bash
npm test              # Testes unitários
npm run test:integration  # Testes de integração
npm run test:coverage     # Cobertura de testes
```

## Monitoramento

O serviço expõe métricas Prometheus em `/metrics`:

- `orders_created_total` - Total de pedidos criados
- `order_processing_time_seconds` - Tempo de processamento
- `order_value_total` - Valor total dos pedidos

## Troubleshooting

### Erro: "Invalid state transition"
- Verifique se a transição de estado é permitida
- Consulte a documentação da máquina de estados

### Erro: "Validation failed"
- Verifique se todos os campos obrigatórios estão presentes
- Confirme se os tipos de dados estão corretos

## Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Implemente os testes
4. Submeta um Pull Request
```

---

## 🚀 Deployment

### 1. Containerização

```dockerfile
# ✅ Correto: Dockerfile otimizado
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package files primeiro (melhor cache)
COPY package*.json ./
COPY tsconfig.json ./

# Instalar dependências
RUN npm ci --only=production && npm cache clean --force

# Copiar código fonte
COPY src ./src

# Build da aplicação
RUN npm run build

# Estágio final
FROM node:20-alpine AS production

WORKDIR /app

# Instalar dumb-init para proper signal handling
RUN apk add --no-cache dumb-init

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Copiar apenas os arquivos necessários
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Configurar permissões
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expor porta
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

# Comando de inicialização
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
```

### 2. Environment Configuration

```typescript
// ✅ Correto: Configuração de ambiente estruturada
import { z } from 'zod';

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info'),
  
  // Database
  DATABASE_URL: z.string().url(),
  DATABASE_POOL_SIZE: z.coerce.number().default(10),
  
  // Cache
  REDIS_URL: z.string().url(),
  REDIS_POOL_SIZE: z.coerce.number().default(10),
  
  // Security
  JWT_SECRET: z.string().min(32),
  WEBHOOK_SECRET: z.string().min(16),
  
  // Integrations
  NOTIFICATION_WEBHOOK_URL: z.string().url().optional(),
  
  // Monitoring
  METRICS_ENABLED: z.coerce.boolean().default(true),
  TRACING_ENABLED: z.coerce.boolean().default(false),
  
  // Performance
  MAX_REQUEST_SIZE: z.coerce.number().default(1024 * 1024), // 1MB
  REQUEST_TIMEOUT: z.coerce.number().default(30000), // 30s
  
  // Features
  FEATURE_CACHING: z.coerce.boolean().default(true),
  FEATURE_RATE_LIMITING: z.coerce.boolean().default(true)
});

export type Environment = z.infer<typeof environmentSchema>;

export const config = environmentSchema.parse(process.env);
```

### 3. Graceful Shutdown

```typescript
// ✅ Correto: Graceful shutdown implementado
class GracefulShutdown {
  private isShuttingDown = false;
  private shutdownPromise: Promise<void> | null = null;
  
  constructor(
    private app: FastifyInstance,
    private database: DatabaseConnection,
    private cache: CacheService
  ) {
    // Registrar handlers de shutdown
    process.on('SIGTERM', () => this.shutdown('SIGTERM'));
    process.on('SIGINT', () => this.shutdown('SIGINT'));
    process.on('SIGUSR2', () => this.shutdown('SIGUSR2')); // Nodemon
  }
  
  private async shutdown(signal: string): Promise<void> {
    if (this.isShuttingDown) {
      return this.shutdownPromise!;
    }
    
    this.isShuttingDown = true;
    console.log(`Received ${signal}, starting graceful shutdown...`);
    
    this.shutdownPromise = this.performShutdown();
    return this.shutdownPromise;
  }
  
  private async performShutdown(): Promise<void> {
    const shutdownTimeout = 30000; // 30 segundos
    
    try {
      // Parar de aceitar novas conexões
      await this.app.close();
      
      // Aguardar requests em andamento terminarem
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Fechar conexões de banco e cache
      await Promise.all([
        this.database.close(),
        this.cache.disconnect()
      ]);
      
      console.log('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  }
}

// Uso
const gracefulShutdown = new GracefulShutdown(app, database, cache);
```

---

## 📖 Conclusão

Este guia de melhores práticas fornece uma base sólida para o desenvolvimento de aplicações ECA de alta qualidade. Seguindo estas práticas, você garantirá:

- **Código limpo e maintível**
- **Arquitetura escalável**
- **Segurança robusta**
- **Performance otimizada**
- **Testabilidade completa**
- **Monitoramento efetivo**

### Checklist de Implementação

- [ ] Estrutura de código bem organizada
- [ ] Nomenclatura consistente
- [ ] Tratamento de erros robusto
- [ ] Validação de entrada completa
- [ ] Autorização granular
- [ ] Testes abrangentes
- [ ] Logs estruturados
- [ ] Métricas de negócio
- [ ] Health checks
- [ ] Documentação completa
- [ ] Deployment automatizado
- [ ] Graceful shutdown

### Ferramentas Recomendadas

- **Validação**: Zod
- **Testes**: Jest, Supertest
- **Logging**: Pino
- **Métricas**: Prometheus
- **Tracing**: OpenTelemetry
- **Cache**: Redis
- **Database**: Supabase/PostgreSQL
- **Containerização**: Docker
- **CI/CD**: GitHub Actions

---

**Versão**: 1.0  
**Última atualização**: 2025-07-09  
**Autor**: Equipe de Arquitetura ECA  
**Revisão**: Equipe de Desenvolvimento Backend