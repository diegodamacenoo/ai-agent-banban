# Phase 8: Testing Strategy - Sistema de Arquivamento e Exclusão

## Estratégia de Testes para Phase 8

### 1. Visão Geral dos Testes

A Phase 8 introduz funcionalidades críticas de arquivamento e exclusão que requerem testes abrangentes para garantir:
- Integridade dos dados
- Funcionalidade correta de cascata
- Validações de segurança
- Performance adequada
- Auditoria completa

### 2. Estrutura de Testes

#### 2.1 Tipos de Testes

```
├── Unit Tests (Testes Unitários)
│   ├── Server Actions
│   ├── Validation Functions
│   ├── Database Queries
│   └── Utility Functions
├── Integration Tests (Testes de Integração)
│   ├── Database Operations
│   ├── Cascade Operations
│   ├── API Endpoints
│   └── Authentication Flow
├── End-to-End Tests (Testes E2E)
│   ├── User Workflows
│   ├── Admin Operations
│   └── Error Scenarios
└── Performance Tests (Testes de Performance)
    ├── Database Queries
    ├── Mass Operations
    └── Load Testing
```

### 3. Testes Unitários

#### 3.1 Setup de Testes

```typescript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/app/actions/admin/configurable-modules.ts',
    '!src/**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

```typescript
// src/test/setup.ts
import { jest } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';

// Mock do Supabase
jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: jest.fn(() => mockSupabaseClient)
}));

// Mock client do Supabase
const mockSupabaseClient = {
  from: jest.fn(),
  auth: {
    getUser: jest.fn()
  }
};

// Configuração global
global.mockSupabaseClient = mockSupabaseClient;
```

#### 3.2 Testes de Arquivamento

```typescript
// src/app/actions/admin/__tests__/archive-operations.test.ts
import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { archiveBaseModule, archiveModuleImplementation } from '../configurable-modules';

describe('Archive Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('archiveBaseModule', () => {
    test('should archive module successfully', async () => {
      // Arrange
      const moduleId = 'test-module-id';
      const mockModule = {
        id: moduleId,
        name: 'Test Module',
        deleted_at: null
      };

      global.mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            is: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockModule,
                error: null
              })
            })
          })
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null
          })
        })
      });

      // Mock auth
      global.mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-id', email: 'admin@test.com' } },
        error: null
      });

      // Act
      const result = await archiveBaseModule(moduleId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toContain('arquivado com sucesso');
      expect(global.mockSupabaseClient.from).toHaveBeenCalledWith('base_modules');
      expect(global.mockSupabaseClient.from).toHaveBeenCalledWith('module_implementations');
    });

    test('should fail if module is already soft-deleted', async () => {
      // Arrange
      const moduleId = 'deleted-module-id';
      
      global.mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            is: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: null
              })
            })
          })
        })
      });

      // Act
      const result = await archiveBaseModule(moduleId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('não encontrado ou já soft-deletado');
    });

    test('should cascade archive to implementations', async () => {
      // Arrange
      const moduleId = 'module-with-implementations';
      const mockModule = {
        id: moduleId,
        name: 'Module with Implementations',
        deleted_at: null
      };

      let updateCallCount = 0;
      global.mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'base_modules') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                is: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockModule,
                    error: null
                  })
                })
              })
            }),
            update: jest.fn().mockImplementation((data) => {
              updateCallCount++;
              return {
                eq: jest.fn().mockResolvedValue({ error: null })
              };
            })
          };
        } else if (table === 'module_implementations') {
          return {
            update: jest.fn().mockImplementation((data) => {
              updateCallCount++;
              expect(data.archived_at).toBeDefined();
              return {
                eq: jest.fn().mockResolvedValue({ error: null })
              };
            })
          };
        }
        return {};
      });

      // Act
      const result = await archiveBaseModule(moduleId);

      // Assert
      expect(result.success).toBe(true);
      expect(updateCallCount).toBe(2); // base_modules + module_implementations
    });

    test('should handle authentication errors', async () => {
      // Arrange
      global.mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      });

      // Act
      const result = await archiveBaseModule('test-id');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('não autenticado');
    });
  });

  describe('archiveModuleImplementation', () => {
    test('should archive implementation successfully', async () => {
      // Arrange
      const implementationId = 'impl-id';
      const mockImplementation = {
        id: implementationId,
        name: 'Test Implementation',
        deleted_at: null
      };

      global.mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            is: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockImplementation,
                error: null
              })
            })
          })
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null
          })
        })
      });

      // Act
      const result = await archiveModuleImplementation(implementationId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toContain('arquivada com sucesso');
    });

    test('should not cascade to base module', async () => {
      // Arrange
      const implementationId = 'impl-id';
      const mockImplementation = {
        id: implementationId,
        name: 'Test Implementation',
        deleted_at: null
      };

      let fromCallCount = 0;
      global.mockSupabaseClient.from.mockImplementation((table) => {
        fromCallCount++;
        expect(table).toBe('module_implementations');
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              is: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockImplementation,
                  error: null
                })
              })
            })
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              error: null
            })
          })
        };
      });

      // Act
      const result = await archiveModuleImplementation(implementationId);

      // Assert
      expect(result.success).toBe(true);
      expect(fromCallCount).toBe(3); // select + update + audit_logs
    });
  });
});
```

#### 3.3 Testes de Soft Delete

```typescript
// src/app/actions/admin/__tests__/soft-delete-operations.test.ts
import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { deleteBaseModule, deleteModuleImplementation, deleteTenantAssignment } from '../configurable-modules';

describe('Soft Delete Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('deleteBaseModule', () => {
    test('should soft delete module successfully', async () => {
      // Arrange
      const moduleId = 'test-module-id';
      const mockModule = { id: moduleId, name: 'Test Module' };

      global.mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'base_modules') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockModule,
                  error: null
                })
              })
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                error: null
              })
            })
          };
        } else if (table === 'module_implementations') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                count: jest.fn().mockResolvedValue({
                  data: [],
                  count: 0,
                  error: null
                })
              })
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                error: null
              })
            })
          };
        } else if (table === 'tenant_module_assignments') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                count: jest.fn().mockResolvedValue({
                  data: [],
                  count: 0,
                  error: null
                })
              })
            })
          };
        }
        return {};
      });

      // Act
      const result = await deleteBaseModule(moduleId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toContain('excluído com sucesso');
    });

    test('should fail if module has active implementations', async () => {
      // Arrange
      const moduleId = 'module-with-implementations';
      const mockModule = { id: moduleId, name: 'Module with Implementations' };

      global.mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'base_modules') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockModule,
                  error: null
                })
              })
            })
          };
        } else if (table === 'module_implementations') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                is: jest.fn().mockReturnValue({
                  count: jest.fn().mockResolvedValue({
                    data: [{ id: 'impl-1' }, { id: 'impl-2' }],
                    count: 2,
                    error: null
                  })
                })
              })
            })
          };
        }
        return {};
      });

      // Act
      const result = await deleteBaseModule(moduleId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('implementações ativas associadas');
    });

    test('should fail if module has tenant assignments', async () => {
      // Arrange
      const moduleId = 'module-with-assignments';
      const mockModule = { id: moduleId, name: 'Module with Assignments' };

      global.mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'base_modules') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockModule,
                  error: null
                })
              })
            })
          };
        } else if (table === 'module_implementations') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                is: jest.fn().mockReturnValue({
                  count: jest.fn().mockResolvedValue({
                    data: [],
                    count: 0,
                    error: null
                  })
                })
              })
            })
          };
        } else if (table === 'tenant_module_assignments') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                count: jest.fn().mockResolvedValue({
                  data: [{ id: 'assignment-1' }],
                  count: 1,
                  error: null
                })
              })
            })
          };
        }
        return {};
      });

      // Act
      const result = await deleteBaseModule(moduleId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('assignments para tenants');
    });
  });

  describe('deleteTenantAssignment', () => {
    test('should hard delete assignment successfully', async () => {
      // Arrange
      const assignmentId = 'assignment-id';
      const mockAssignment = {
        id: assignmentId,
        organization_id: 'org-id',
        base_module_id: 'module-id'
      };

      global.mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockAssignment,
              error: null
            })
          })
        }),
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null
          })
        })
      });

      // Act
      const result = await deleteTenantAssignment(assignmentId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toContain('removido com sucesso');
    });

    test('should use hard delete, not soft delete', async () => {
      // Arrange
      const assignmentId = 'assignment-id';
      const mockAssignment = {
        id: assignmentId,
        organization_id: 'org-id',
        base_module_id: 'module-id'
      };

      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          error: null
        })
      });

      global.mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockAssignment,
              error: null
            })
          })
        }),
        delete: mockDelete
      });

      // Act
      const result = await deleteTenantAssignment(assignmentId);

      // Assert
      expect(result.success).toBe(true);
      expect(mockDelete).toHaveBeenCalled();
    });
  });
});
```

#### 3.4 Testes de Restauração

```typescript
// src/app/actions/admin/__tests__/restore-operations.test.ts
import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { restoreBaseModule, restoreModuleImplementation } from '../configurable-modules';

describe('Restore Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('restoreBaseModule', () => {
    test('should restore archived module successfully', async () => {
      // Arrange
      const moduleId = 'archived-module-id';
      const mockModule = {
        id: moduleId,
        name: 'Archived Module',
        archived_at: '2025-01-01T00:00:00Z',
        deleted_at: null
      };

      global.mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'base_modules') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockModule,
                  error: null
                })
              })
            }),
            update: jest.fn().mockImplementation((data) => {
              expect(data.archived_at).toBe(null);
              expect(data.deleted_at).toBe(null);
              return {
                eq: jest.fn().mockResolvedValue({ error: null })
              };
            })
          };
        } else if (table === 'module_implementations') {
          return {
            update: jest.fn().mockImplementation((data) => {
              expect(data.archived_at).toBe(null);
              expect(data.deleted_at).toBe(null);
              return {
                eq: jest.fn().mockResolvedValue({ error: null })
              };
            })
          };
        }
        return {};
      });

      // Act
      const result = await restoreBaseModule(moduleId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toContain('restaurado com sucesso');
    });

    test('should restore soft-deleted module successfully', async () => {
      // Arrange
      const moduleId = 'deleted-module-id';
      const mockModule = {
        id: moduleId,
        name: 'Deleted Module',
        archived_at: null,
        deleted_at: '2025-01-01T00:00:00Z'
      };

      global.mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'base_modules') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockModule,
                  error: null
                })
              })
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null })
            })
          };
        } else if (table === 'module_implementations') {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null })
            })
          };
        }
        return {};
      });

      // Act
      const result = await restoreBaseModule(moduleId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toContain('restaurado com sucesso');
    });

    test('should fail if module is already active', async () => {
      // Arrange
      const moduleId = 'active-module-id';
      const mockModule = {
        id: moduleId,
        name: 'Active Module',
        archived_at: null,
        deleted_at: null
      };

      global.mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockModule,
              error: null
            })
          })
        })
      });

      // Act
      const result = await restoreBaseModule(moduleId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('já está ativo');
    });

    test('should cascade restore to implementations', async () => {
      // Arrange
      const moduleId = 'module-with-implementations';
      const mockModule = {
        id: moduleId,
        name: 'Module with Implementations',
        archived_at: '2025-01-01T00:00:00Z',
        deleted_at: null
      };

      let cascadeUpdateCalled = false;
      global.mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'base_modules') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockModule,
                  error: null
                })
              })
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null })
            })
          };
        } else if (table === 'module_implementations') {
          return {
            update: jest.fn().mockImplementation((data) => {
              cascadeUpdateCalled = true;
              expect(data.archived_at).toBe(null);
              expect(data.deleted_at).toBe(null);
              return {
                eq: jest.fn().mockResolvedValue({ error: null })
              };
            })
          };
        }
        return {};
      });

      // Act
      const result = await restoreBaseModule(moduleId);

      // Assert
      expect(result.success).toBe(true);
      expect(cascadeUpdateCalled).toBe(true);
    });
  });
});
```

#### 3.5 Testes de Exclusão Permanente

```typescript
// src/app/actions/admin/__tests__/purge-operations.test.ts
import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { purgeBaseModule, purgeModuleImplementation } from '../configurable-modules';

describe('Purge Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('purgeBaseModule', () => {
    test('should purge soft-deleted module successfully', async () => {
      // Arrange
      const moduleId = 'soft-deleted-module-id';
      const mockModule = {
        id: moduleId,
        name: 'Soft Deleted Module',
        deleted_at: '2025-01-01T00:00:00Z'
      };

      global.mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'base_modules') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockModule,
                  error: null
                })
              })
            }),
            delete: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null })
            })
          };
        } else if (table === 'module_implementations') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                count: jest.fn().mockResolvedValue({
                  data: [],
                  count: 0,
                  error: null
                })
              })
            })
          };
        }
        return {};
      });

      // Act
      const result = await purgeBaseModule(moduleId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toContain('excluído permanentemente');
    });

    test('should fail if module is not soft-deleted', async () => {
      // Arrange
      const moduleId = 'active-module-id';
      const mockModule = {
        id: moduleId,
        name: 'Active Module',
        deleted_at: null
      };

      global.mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockModule,
              error: null
            })
          })
        })
      });

      // Act
      const result = await purgeBaseModule(moduleId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('não está soft-deletado');
    });

    test('should fail if module has implementations', async () => {
      // Arrange
      const moduleId = 'module-with-implementations';
      const mockModule = {
        id: moduleId,
        name: 'Module with Implementations',
        deleted_at: '2025-01-01T00:00:00Z'
      };

      global.mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'base_modules') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockModule,
                  error: null
                })
              })
            })
          };
        } else if (table === 'module_implementations') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                count: jest.fn().mockResolvedValue({
                  data: [{ id: 'impl-1' }],
                  count: 1,
                  error: null
                })
              })
            })
          };
        }
        return {};
      });

      // Act
      const result = await purgeBaseModule(moduleId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('implementações associadas');
    });

    test('should use hard delete, not soft delete', async () => {
      // Arrange
      const moduleId = 'soft-deleted-module-id';
      const mockModule = {
        id: moduleId,
        name: 'Soft Deleted Module',
        deleted_at: '2025-01-01T00:00:00Z'
      };

      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null })
      });

      global.mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'base_modules') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockModule,
                  error: null
                })
              })
            }),
            delete: mockDelete
          };
        } else if (table === 'module_implementations') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                count: jest.fn().mockResolvedValue({
                  data: [],
                  count: 0,
                  error: null
                })
              })
            })
          };
        }
        return {};
      });

      // Act
      const result = await purgeBaseModule(moduleId);

      // Assert
      expect(result.success).toBe(true);
      expect(mockDelete).toHaveBeenCalled();
    });
  });
});
```

#### 3.6 Testes de Listagem

```typescript
// src/app/actions/admin/__tests__/listing-operations.test.ts
import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { getBaseModules, getModuleImplementations, getTenantAssignments } from '../configurable-modules';

describe('Listing Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getBaseModules', () => {
    test('should filter out archived modules by default', async () => {
      // Arrange
      const mockModules = [
        { id: '1', name: 'Active Module', archived_at: null, deleted_at: null },
        { id: '2', name: 'Archived Module', archived_at: '2025-01-01T00:00:00Z', deleted_at: null }
      ];

      const mockIs = jest.fn().mockReturnValue({
        range: jest.fn().mockResolvedValue({
          data: [mockModules[0]], // Apenas módulo ativo
          count: 1,
          error: null
        })
      });

      global.mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            is: mockIs
          })
        })
      });

      // Act
      const result = await getBaseModules();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.modules).toHaveLength(1);
      expect(result.data?.modules[0].name).toBe('Active Module');
      expect(mockIs).toHaveBeenCalledWith('archived_at', null);
      expect(mockIs).toHaveBeenCalledWith('deleted_at', null);
    });

    test('should include archived modules when requested', async () => {
      // Arrange
      const mockModules = [
        { id: '1', name: 'Active Module', archived_at: null, deleted_at: null },
        { id: '2', name: 'Archived Module', archived_at: '2025-01-01T00:00:00Z', deleted_at: null }
      ];

      const mockIs = jest.fn().mockReturnValue({
        range: jest.fn().mockResolvedValue({
          data: mockModules,
          count: 2,
          error: null
        })
      });

      global.mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            is: mockIs
          })
        })
      });

      // Act
      const result = await getBaseModules({
        includeArchived: true,
        includeDeleted: false
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.modules).toHaveLength(2);
      expect(mockIs).toHaveBeenCalledWith('deleted_at', null);
      expect(mockIs).not.toHaveBeenCalledWith('archived_at', null);
    });

    test('should apply search filter correctly', async () => {
      // Arrange
      const mockOr = jest.fn().mockReturnValue({
        is: jest.fn().mockReturnValue({
          range: jest.fn().mockResolvedValue({
            data: [{ id: '1', name: 'Test Module' }],
            count: 1,
            error: null
          })
        })
      });

      global.mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            or: mockOr
          })
        })
      });

      // Act
      const result = await getBaseModules({
        search: 'test'
      });

      // Assert
      expect(result.success).toBe(true);
      expect(mockOr).toHaveBeenCalledWith('name.ilike.%test%,description.ilike.%test%,slug.ilike.%test%');
    });
  });

  describe('getTenantAssignments', () => {
    test('should filter by base_module and implementation state', async () => {
      // Arrange
      const mockAssignments = [
        {
          id: '1',
          organization_id: 'org-1',
          base_module: { name: 'Active Module', archived_at: null, deleted_at: null },
          implementation: { name: 'Active Implementation', archived_at: null, deleted_at: null }
        }
      ];

      const mockIs = jest.fn().mockReturnValue({
        range: jest.fn().mockResolvedValue({
          data: mockAssignments,
          count: 1,
          error: null
        })
      });

      global.mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            is: mockIs
          })
        })
      });

      // Act
      const result = await getTenantAssignments({
        includeArchived: false,
        includeDeleted: false
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.assignments).toHaveLength(1);
      expect(mockIs).toHaveBeenCalledWith('base_module.archived_at', null);
      expect(mockIs).toHaveBeenCalledWith('implementation.archived_at', null);
      expect(mockIs).toHaveBeenCalledWith('base_module.deleted_at', null);
      expect(mockIs).toHaveBeenCalledWith('implementation.deleted_at', null);
    });

    test('should include archived assignments when requested', async () => {
      // Arrange
      const mockAssignments = [
        {
          id: '1',
          organization_id: 'org-1',
          base_module: { name: 'Archived Module', archived_at: '2025-01-01T00:00:00Z', deleted_at: null },
          implementation: { name: 'Active Implementation', archived_at: null, deleted_at: null }
        }
      ];

      const mockIs = jest.fn().mockReturnValue({
        range: jest.fn().mockResolvedValue({
          data: mockAssignments,
          count: 1,
          error: null
        })
      });

      global.mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            is: mockIs
          })
        })
      });

      // Act
      const result = await getTenantAssignments({
        includeArchived: true,
        includeDeleted: false
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.assignments).toHaveLength(1);
      expect(mockIs).toHaveBeenCalledWith('base_module.deleted_at', null);
      expect(mockIs).toHaveBeenCalledWith('implementation.deleted_at', null);
      expect(mockIs).not.toHaveBeenCalledWith('base_module.archived_at', null);
      expect(mockIs).not.toHaveBeenCalledWith('implementation.archived_at', null);
    });
  });
});
```

### 4. Testes de Integração

#### 4.1 Testes de Cascata

```typescript
// src/app/actions/admin/__tests__/cascade-integration.test.ts
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { archiveBaseModule, restoreBaseModule, deleteBaseModule } from '../configurable-modules';

describe('Cascade Integration Tests', () => {
  let supabase: any;
  let testModuleId: string;
  let testImplementationIds: string[];

  beforeEach(async () => {
    supabase = await createSupabaseServerClient();
    
    // Criar módulo de teste
    const { data: module } = await supabase
      .from('base_modules')
      .insert({
        name: 'Test Cascade Module',
        slug: 'test-cascade-module',
        description: 'Module for testing cascade operations',
        category: 'test',
        icon: 'test-icon',
        route_pattern: '/test-cascade',
        created_by: 'test-user'
      })
      .select()
      .single();

    testModuleId = module.id;

    // Criar implementações de teste
    const { data: implementations } = await supabase
      .from('module_implementations')
      .insert([
        {
          base_module_id: testModuleId,
          implementation_key: 'test-impl-1',
          name: 'Test Implementation 1',
          description: 'First test implementation',
          component_path: '/test/impl1',
          created_by: 'test-user'
        },
        {
          base_module_id: testModuleId,
          implementation_key: 'test-impl-2',
          name: 'Test Implementation 2',
          description: 'Second test implementation',
          component_path: '/test/impl2',
          created_by: 'test-user'
        }
      ])
      .select();

    testImplementationIds = implementations.map(impl => impl.id);
  });

  afterEach(async () => {
    // Limpar dados de teste
    await supabase
      .from('module_implementations')
      .delete()
      .in('id', testImplementationIds);

    await supabase
      .from('base_modules')
      .delete()
      .eq('id', testModuleId);
  });

  test('should cascade archive from base module to implementations', async () => {
    // Act
    const result = await archiveBaseModule(testModuleId);

    // Assert
    expect(result.success).toBe(true);

    // Verificar se o módulo base foi arquivado
    const { data: baseModule } = await supabase
      .from('base_modules')
      .select('archived_at')
      .eq('id', testModuleId)
      .single();

    expect(baseModule.archived_at).not.toBeNull();

    // Verificar se as implementações foram arquivadas
    const { data: implementations } = await supabase
      .from('module_implementations')
      .select('archived_at')
      .in('id', testImplementationIds);

    implementations.forEach(impl => {
      expect(impl.archived_at).not.toBeNull();
    });
  });

  test('should cascade restore from base module to implementations', async () => {
    // Arrange - Primeiro arquivar
    await archiveBaseModule(testModuleId);

    // Act - Então restaurar
    const result = await restoreBaseModule(testModuleId);

    // Assert
    expect(result.success).toBe(true);

    // Verificar se o módulo base foi restaurado
    const { data: baseModule } = await supabase
      .from('base_modules')
      .select('archived_at, deleted_at')
      .eq('id', testModuleId)
      .single();

    expect(baseModule.archived_at).toBeNull();
    expect(baseModule.deleted_at).toBeNull();

    // Verificar se as implementações foram restauradas
    const { data: implementations } = await supabase
      .from('module_implementations')
      .select('archived_at, deleted_at')
      .in('id', testImplementationIds);

    implementations.forEach(impl => {
      expect(impl.archived_at).toBeNull();
      expect(impl.deleted_at).toBeNull();
    });
  });

  test('should cascade soft delete from base module to implementations', async () => {
    // Act
    const result = await deleteBaseModule(testModuleId);

    // Assert
    expect(result.success).toBe(true);

    // Verificar se o módulo base foi soft-deletado
    const { data: baseModule } = await supabase
      .from('base_modules')
      .select('deleted_at')
      .eq('id', testModuleId)
      .single();

    expect(baseModule.deleted_at).not.toBeNull();

    // Verificar se as implementações foram soft-deletadas
    const { data: implementations } = await supabase
      .from('module_implementations')
      .select('deleted_at')
      .in('id', testImplementationIds);

    implementations.forEach(impl => {
      expect(impl.deleted_at).not.toBeNull();
    });
  });
});
```

#### 4.2 Testes de Auditoria

```typescript
// src/app/actions/admin/__tests__/audit-integration.test.ts
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { archiveBaseModule, deleteBaseModule, restoreBaseModule, purgeBaseModule } from '../configurable-modules';

describe('Audit Integration Tests', () => {
  let supabase: any;
  let testModuleId: string;

  beforeEach(async () => {
    supabase = await createSupabaseServerClient();
    
    // Criar módulo de teste
    const { data: module } = await supabase
      .from('base_modules')
      .insert({
        name: 'Test Audit Module',
        slug: 'test-audit-module',
        description: 'Module for testing audit operations',
        category: 'test',
        icon: 'test-icon',
        route_pattern: '/test-audit',
        created_by: 'test-user'
      })
      .select()
      .single();

    testModuleId = module.id;
  });

  afterEach(async () => {
    // Limpar logs de auditoria
    await supabase
      .from('audit_logs')
      .delete()
      .eq('resource_id', testModuleId);

    // Limpar módulo de teste (se ainda existir)
    await supabase
      .from('base_modules')
      .delete()
      .eq('id', testModuleId);
  });

  test('should create audit log for archive operation', async () => {
    // Act
    const result = await archiveBaseModule(testModuleId);

    // Assert
    expect(result.success).toBe(true);

    // Verificar se o log de auditoria foi criado
    const { data: auditLogs } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('resource_id', testModuleId)
      .eq('action', 'archive_base_module');

    expect(auditLogs).toHaveLength(1);
    expect(auditLogs[0].resource_type).toBe('base_module');
    expect(auditLogs[0].details.security_level).toBe('HIGH');
    expect(auditLogs[0].details.action_type).toBe('SOFT_ARCHIVE');
  });

  test('should create audit log for soft delete operation', async () => {
    // Act
    const result = await deleteBaseModule(testModuleId);

    // Assert
    expect(result.success).toBe(true);

    // Verificar se o log de auditoria foi criado
    const { data: auditLogs } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('resource_id', testModuleId)
      .eq('action', 'delete_base_module');

    expect(auditLogs).toHaveLength(1);
    expect(auditLogs[0].resource_type).toBe('base_module');
    expect(auditLogs[0].details.security_level).toBe('HIGH');
    expect(auditLogs[0].details.action_type).toBe('SOFT_DELETE');
  });

  test('should create audit log for restore operation', async () => {
    // Arrange
    await archiveBaseModule(testModuleId);

    // Act
    const result = await restoreBaseModule(testModuleId);

    // Assert
    expect(result.success).toBe(true);

    // Verificar se o log de auditoria foi criado
    const { data: auditLogs } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('resource_id', testModuleId)
      .eq('action', 'restore_base_module');

    expect(auditLogs).toHaveLength(1);
    expect(auditLogs[0].resource_type).toBe('base_module');
    expect(auditLogs[0].details.security_level).toBe('MEDIUM');
    expect(auditLogs[0].details.action_type).toBe('RESTORE');
  });

  test('should create audit log for purge operation', async () => {
    // Arrange
    await deleteBaseModule(testModuleId);

    // Act
    const result = await purgeBaseModule(testModuleId);

    // Assert
    expect(result.success).toBe(true);

    // Verificar se o log de auditoria foi criado
    const { data: auditLogs } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('resource_id', testModuleId)
      .eq('action', 'purge_base_module');

    expect(auditLogs).toHaveLength(1);
    expect(auditLogs[0].resource_type).toBe('base_module');
    expect(auditLogs[0].details.security_level).toBe('CRITICAL');
    expect(auditLogs[0].details.action_type).toBe('HARD_DELETE');
  });
});
```

### 5. Testes End-to-End

#### 5.1 Fluxos de Usuário

```typescript
// src/app/actions/admin/__tests__/e2e-user-flows.test.ts
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { 
  createBaseModule, 
  createModuleImplementation, 
  createTenantAssignment,
  archiveBaseModule,
  restoreBaseModule,
  deleteBaseModule,
  purgeBaseModule 
} from '../configurable-modules';

describe('End-to-End User Flows', () => {
  let supabase: any;
  let testModuleId: string;
  let testImplementationId: string;
  let testOrganizationId: string;
  let testAssignmentId: string;

  beforeEach(async () => {
    supabase = await createSupabaseServerClient();
    
    // Criar organização de teste
    const { data: organization } = await supabase
      .from('organizations')
      .insert({
        name: 'Test Organization',
        slug: 'test-org',
        status: 'ACTIVE'
      })
      .select()
      .single();

    testOrganizationId = organization.id;
  });

  afterEach(async () => {
    // Limpar dados de teste
    if (testAssignmentId) {
      await supabase
        .from('tenant_module_assignments')
        .delete()
        .eq('id', testAssignmentId);
    }

    if (testImplementationId) {
      await supabase
        .from('module_implementations')
        .delete()
        .eq('id', testImplementationId);
    }

    if (testModuleId) {
      await supabase
        .from('base_modules')
        .delete()
        .eq('id', testModuleId);
    }

    await supabase
      .from('organizations')
      .delete()
      .eq('id', testOrganizationId);
  });

  test('complete module lifecycle: create -> implement -> assign -> archive -> restore -> delete -> purge', async () => {
    // 1. Criar módulo base
    const createModuleResult = await createBaseModule({
      name: 'E2E Test Module',
      slug: 'e2e-test-module',
      description: 'Module for end-to-end testing',
      category: 'test',
      icon: 'test-icon',
      route_pattern: '/e2e-test',
      permissions_required: [],
      supports_multi_tenant: true,
      config_schema: {},
      dependencies: [],
      version: '1.0.0',
      tags: ['test']
    });

    expect(createModuleResult.success).toBe(true);
    testModuleId = createModuleResult.data!.id;

    // 2. Criar implementação
    const createImplResult = await createModuleImplementation({
      base_module_id: testModuleId,
      implementation_key: 'e2e-test-impl',
      name: 'E2E Test Implementation',
      description: 'Implementation for end-to-end testing',
      version: '1.0.0',
      component_type: 'generated',
      template_type: 'dashboard',
      template_config: {},
      audience: 'generic',
      complexity: 'standard',
      priority: 'medium',
      is_default: true
    });

    expect(createImplResult.success).toBe(true);
    testImplementationId = createImplResult.data!.id;

    // 3. Criar assignment para tenant
    const createAssignmentResult = await createTenantAssignment({
      organization_id: testOrganizationId,
      base_module_id: testModuleId,
      implementation_id: testImplementationId,
      configuration: {},
      status: 'active',
      notify_tenant: false
    });

    expect(createAssignmentResult.success).toBe(true);
    testAssignmentId = createAssignmentResult.data!.id;

    // 4. Tentar deletar módulo (deve falhar por causa do assignment)
    const deleteWithAssignmentResult = await deleteBaseModule(testModuleId);
    expect(deleteWithAssignmentResult.success).toBe(false);
    expect(deleteWithAssignmentResult.error).toContain('assignments');

    // 5. Remover assignment
    const deleteAssignmentResult = await deleteTenantAssignment(testAssignmentId);
    expect(deleteAssignmentResult.success).toBe(true);
    testAssignmentId = ''; // Foi deletado

    // 6. Arquivar módulo
    const archiveResult = await archiveBaseModule(testModuleId);
    expect(archiveResult.success).toBe(true);

    // 7. Verificar que módulo e implementação foram arquivados
    const { data: archivedModule } = await supabase
      .from('base_modules')
      .select('archived_at')
      .eq('id', testModuleId)
      .single();

    expect(archivedModule.archived_at).not.toBeNull();

    const { data: archivedImpl } = await supabase
      .from('module_implementations')
      .select('archived_at')
      .eq('id', testImplementationId)
      .single();

    expect(archivedImpl.archived_at).not.toBeNull();

    // 8. Restaurar módulo
    const restoreResult = await restoreBaseModule(testModuleId);
    expect(restoreResult.success).toBe(true);

    // 9. Verificar que módulo e implementação foram restaurados
    const { data: restoredModule } = await supabase
      .from('base_modules')
      .select('archived_at, deleted_at')
      .eq('id', testModuleId)
      .single();

    expect(restoredModule.archived_at).toBeNull();
    expect(restoredModule.deleted_at).toBeNull();

    const { data: restoredImpl } = await supabase
      .from('module_implementations')
      .select('archived_at, deleted_at')
      .eq('id', testImplementationId)
      .single();

    expect(restoredImpl.archived_at).toBeNull();
    expect(restoredImpl.deleted_at).toBeNull();

    // 10. Soft delete do módulo
    const softDeleteResult = await deleteBaseModule(testModuleId);
    expect(softDeleteResult.success).toBe(true);

    // 11. Verificar que módulo e implementação foram soft-deletados
    const { data: softDeletedModule } = await supabase
      .from('base_modules')
      .select('deleted_at')
      .eq('id', testModuleId)
      .single();

    expect(softDeletedModule.deleted_at).not.toBeNull();

    const { data: softDeletedImpl } = await supabase
      .from('module_implementations')
      .select('deleted_at')
      .eq('id', testImplementationId)
      .single();

    expect(softDeletedImpl.deleted_at).not.toBeNull();

    // 12. Purgar implementação primeiro
    const purgeImplResult = await purgeModuleImplementation(testImplementationId);
    expect(purgeImplResult.success).toBe(true);

    // 13. Verificar que implementação foi fisicamente removida
    const { data: purgedImpl } = await supabase
      .from('module_implementations')
      .select('id')
      .eq('id', testImplementationId)
      .single();

    expect(purgedImpl).toBeNull();
    testImplementationId = ''; // Foi purgado

    // 14. Purgar módulo base
    const purgeModuleResult = await purgeBaseModule(testModuleId);
    expect(purgeModuleResult.success).toBe(true);

    // 15. Verificar que módulo foi fisicamente removido
    const { data: purgedModule } = await supabase
      .from('base_modules')
      .select('id')
      .eq('id', testModuleId)
      .single();

    expect(purgedModule).toBeNull();
    testModuleId = ''; // Foi purgado
  });

  test('error handling: attempt operations on non-existent resources', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    // Archive non-existent module
    const archiveResult = await archiveBaseModule(nonExistentId);
    expect(archiveResult.success).toBe(false);

    // Delete non-existent module
    const deleteResult = await deleteBaseModule(nonExistentId);
    expect(deleteResult.success).toBe(false);

    // Restore non-existent module
    const restoreResult = await restoreBaseModule(nonExistentId);
    expect(restoreResult.success).toBe(false);

    // Purge non-existent module
    const purgeResult = await purgeBaseModule(nonExistentId);
    expect(purgeResult.success).toBe(false);
  });
});
```

### 6. Testes de Performance

#### 6.1 Testes de Queries

```typescript
// src/app/actions/admin/__tests__/performance.test.ts
import { describe, test, expect, beforeEach } from '@jest/globals';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getBaseModules, getModuleImplementations, getTenantAssignments } from '../configurable-modules';

describe('Performance Tests', () => {
  let supabase: any;

  beforeEach(async () => {
    supabase = await createSupabaseServerClient();
  });

  test('getBaseModules should execute within acceptable time', async () => {
    const startTime = Date.now();
    
    const result = await getBaseModules({
      page: 1,
      limit: 50
    });
    
    const duration = Date.now() - startTime;
    
    expect(result.success).toBe(true);
    expect(duration).toBeLessThan(1000); // Máximo 1 segundo
  });

  test('getBaseModules with filters should execute within acceptable time', async () => {
    const startTime = Date.now();
    
    const result = await getBaseModules({
      search: 'test',
      category: 'analytics',
      includeArchived: true,
      includeDeleted: true,
      page: 1,
      limit: 50
    });
    
    const duration = Date.now() - startTime;
    
    expect(result.success).toBe(true);
    expect(duration).toBeLessThan(1500); // Máximo 1.5 segundos com filtros
  });

  test('getModuleImplementations should execute within acceptable time', async () => {
    const startTime = Date.now();
    
    const result = await getModuleImplementations({
      page: 1,
      limit: 50
    });
    
    const duration = Date.now() - startTime;
    
    expect(result.success).toBe(true);
    expect(duration).toBeLessThan(1000); // Máximo 1 segundo
  });

  test('getTenantAssignments with JOINs should execute within acceptable time', async () => {
    const startTime = Date.now();
    
    const result = await getTenantAssignments({
      includeArchived: false,
      includeDeleted: false,
      page: 1,
      limit: 50
    });
    
    const duration = Date.now() - startTime;
    
    expect(result.success).toBe(true);
    expect(duration).toBeLessThan(2000); // Máximo 2 segundos para JOINs complexos
  });

  test('mass operations should handle large datasets efficiently', async () => {
    // Criar múltiplos módulos para teste
    const moduleIds: string[] = [];
    
    for (let i = 0; i < 10; i++) {
      const { data: module } = await supabase
        .from('base_modules')
        .insert({
          name: `Perf Test Module ${i}`,
          slug: `perf-test-module-${i}`,
          description: `Performance test module ${i}`,
          category: 'test',
          icon: 'test-icon',
          route_pattern: `/perf-test-${i}`,
          created_by: 'test-user'
        })
        .select()
        .single();

      moduleIds.push(module.id);
    }

    // Teste de operação em massa
    const startTime = Date.now();
    
    const promises = moduleIds.map(id => archiveBaseModule(id));
    const results = await Promise.all(promises);
    
    const duration = Date.now() - startTime;
    
    // Verificar que todas as operações foram bem-sucedidas
    results.forEach(result => {
      expect(result.success).toBe(true);
    });
    
    // Verificar performance
    expect(duration).toBeLessThan(5000); // Máximo 5 segundos para 10 operações
    
    // Limpar dados de teste
    await supabase
      .from('base_modules')
      .delete()
      .in('id', moduleIds);
  });
});
```

### 7. Execução de Testes

#### 7.1 Scripts de Teste

```json
// package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest --testPathPattern=__tests__.*\\.test\\.ts",
    "test:integration": "jest --testPathPattern=__tests__.*\\.integration\\.ts",
    "test:e2e": "jest --testPathPattern=__tests__.*\\.e2e\\.ts",
    "test:performance": "jest --testPathPattern=__tests__.*\\.performance\\.ts",
    "test:phase8": "jest --testPathPattern=configurable-modules.*\\.test\\.ts"
  }
}
```

#### 7.2 Configuração de CI/CD

```yaml
# .github/workflows/test-phase8.yml
name: Phase 8 Tests

on:
  push:
    branches: [ main, develop ]
    paths:
      - 'src/app/actions/admin/configurable-modules.ts'
      - 'src/app/actions/admin/__tests__/**'
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run database migrations
      run: npm run db:migrate
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
    
    - name: Run unit tests
      run: npm run test:unit
      env:
        NODE_ENV: test
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
    
    - name: Run integration tests
      run: npm run test:integration
      env:
        NODE_ENV: test
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
    
    - name: Run performance tests
      run: npm run test:performance
      env:
        NODE_ENV: test
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
        flags: phase8
        name: phase8-coverage
```

### 8. Monitoramento e Métricas

#### 8.1 Métricas de Teste

```typescript
// src/test/metrics.ts
interface TestMetrics {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  coverage: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
  performance: {
    averageExecutionTime: number;
    slowestTest: string;
    fastestTest: string;
  };
}

export class TestMetricsCollector {
  private metrics: TestMetrics = {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    coverage: {
      statements: 0,
      branches: 0,
      functions: 0,
      lines: 0
    },
    performance: {
      averageExecutionTime: 0,
      slowestTest: '',
      fastestTest: ''
    }
  };

  collectMetrics(testResults: any) {
    this.metrics.totalTests = testResults.numTotalTests;
    this.metrics.passedTests = testResults.numPassedTests;
    this.metrics.failedTests = testResults.numFailedTests;
    
    if (testResults.coverageMap) {
      const coverage = testResults.coverageMap.getCoverageSummary();
      this.metrics.coverage = {
        statements: coverage.statements.pct,
        branches: coverage.branches.pct,
        functions: coverage.functions.pct,
        lines: coverage.lines.pct
      };
    }
  }

  generateReport(): string {
    return `
Phase 8 Test Report
==================

Total Tests: ${this.metrics.totalTests}
Passed: ${this.metrics.passedTests}
Failed: ${this.metrics.failedTests}
Success Rate: ${((this.metrics.passedTests / this.metrics.totalTests) * 100).toFixed(2)}%

Coverage:
- Statements: ${this.metrics.coverage.statements}%
- Branches: ${this.metrics.coverage.branches}%
- Functions: ${this.metrics.coverage.functions}%
- Lines: ${this.metrics.coverage.lines}%

Performance:
- Average Execution Time: ${this.metrics.performance.averageExecutionTime}ms
- Slowest Test: ${this.metrics.performance.slowestTest}
- Fastest Test: ${this.metrics.performance.fastestTest}
`;
  }
}
```

### 9. Conclusão

A estratégia de testes para Phase 8 garante:

- **Cobertura Completa**: Testes unitários, integração e E2E
- **Qualidade de Código**: Mínimo 80% de cobertura
- **Performance**: Limites claros de tempo de execução
- **Confiabilidade**: Testes de cascata e auditoria
- **Automação**: Integração com CI/CD

**Próximos Passos:**

1. Implementar todos os testes descritos
2. Configurar pipeline de CI/CD
3. Estabelecer métricas de monitoramento
4. Criar relatórios automatizados
5. Treinar equipe nos novos testes

---

**Preparado por**: Claude Code  
**Data**: 2025-01-14  
**Versão**: 1.0.0  
**Status**: ✅ Pronto para Implementação