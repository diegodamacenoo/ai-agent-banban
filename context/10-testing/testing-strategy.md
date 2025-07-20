# Testing Strategy Guide

## Testing Architecture

### **Test Types & Coverage**
```typescript
// Unit Tests - 70% coverage target
- Utilities and pure functions
- Individual components (isolated)
- Server action business logic
- Validation schemas

// Integration Tests - 20% coverage target  
- Component + Server Actions
- Multi-tenant data isolation
- Module system workflows
- Authentication flows

// E2E Tests - 10% coverage target
- Critical user journeys
- Multi-tenant scenarios
- Module installation flows
```

## Unit Testing Patterns

### **Server Action Testing**
```typescript
// __tests__/actions/modules.test.ts
import { createBaseModule } from '@/app/actions/admin/modules';
import { createMockUser, mockSupabase } from '@/lib/test-utils';

describe('createBaseModule', () => {
  beforeEach(() => {
    mockSupabase.reset();
  });

  it('creates module with admin user', async () => {
    // Arrange
    const mockUser = createMockUser({ role: 'admin' });
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
    
    const moduleData = {
      name: 'Test Module',
      slug: 'test-module',
      category: 'analytics',
    };
    
    // Act
    const result = await createBaseModule(moduleData);
    
    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      slug: 'test-module',
      created_by: mockUser.id,
    });
  });

  it('rejects non-admin user', async () => {
    // Arrange
    const mockUser = createMockUser({ role: 'user' });
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
    
    // Act
    const result = await createBaseModule({});
    
    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBe('Admin access required');
  });
});
```

### **Component Testing**
```typescript
// __tests__/components/ModuleCard.test.tsx
import { render, screen } from '@testing-library/react';
import { ModuleCard } from '@/components/ModuleCard';
import { createMockModule } from '@/lib/test-utils';

describe('ModuleCard', () => {
  it('renders module information', () => {
    const module = createMockModule({
      name: 'Performance Analytics',
      category: 'analytics',
      is_active: true,
    });
    
    render(<ModuleCard module={module} />);
    
    expect(screen.getByText('Performance Analytics')).toBeInTheDocument();
    expect(screen.getByText('analytics')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /active/i })).toBeInTheDocument();
  });

  it('handles inactive module state', () => {
    const module = createMockModule({ is_active: false });
    
    render(<ModuleCard module={module} />);
    
    expect(screen.getByRole('button', { name: /inactive/i })).toBeInTheDocument();
  });
});
```

### **Validation Schema Testing**
```typescript
// __tests__/schemas/modules.test.ts
import { CreateBaseModuleSchema } from '@/app/actions/admin/modules/schemas';

describe('CreateBaseModuleSchema', () => {
  it('validates correct module data', () => {
    const validData = {
      name: 'Test Module',
      slug: 'test-module',
      category: 'analytics',
      supports_multi_tenant: true,
    };
    
    const result = CreateBaseModuleSchema.safeParse(validData);
    
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject(validData);
  });

  it('rejects invalid slug format', () => {
    const invalidData = {
      name: 'Test Module',
      slug: 'Test Module!', // Invalid characters
      category: 'analytics',
    };
    
    const result = CreateBaseModuleSchema.safeParse(invalidData);
    
    expect(result.success).toBe(false);
    expect(result.error?.errors[0].path).toEqual(['slug']);
  });
});
```

## Integration Testing

### **Multi-Tenant Isolation Tests**
```typescript
// __tests__/integration/multi-tenant.test.ts
import { testWithTenant } from '@/lib/test-utils';

describe('Multi-tenant isolation', () => {
  testWithTenant('tenant-a', 'tenant-b', async (tenantA, tenantB) => {
    // Create data for tenant A
    const moduleA = await createModuleForTenant(tenantA.id, {
      name: 'Tenant A Module',
    });
    
    // Create data for tenant B  
    const moduleB = await createModuleForTenant(tenantB.id, {
      name: 'Tenant B Module',
    });
    
    // Verify tenant A only sees their data
    const tenantAData = await getModulesForTenant(tenantA.id);
    expect(tenantAData).toHaveLength(1);
    expect(tenantAData[0].name).toBe('Tenant A Module');
    
    // Verify tenant B only sees their data
    const tenantBData = await getModulesForTenant(tenantB.id);
    expect(tenantBData).toHaveLength(1);
    expect(tenantBData[0].name).toBe('Tenant B Module');
  });
});
```

### **Module System Integration**
```typescript
// __tests__/integration/module-system.test.ts
describe('Module system workflow', () => {
  it('complete module lifecycle', async () => {
    // 1. Create base module
    const baseModule = await createBaseModule({
      name: 'Test Analytics',
      slug: 'test-analytics',
      category: 'analytics',
    });
    
    // 2. Create implementation
    const implementation = await createImplementation({
      base_module_id: baseModule.id,
      implementation_key: 'default',
      component_path: '/widgets/test-analytics.tsx',
    });
    
    // 3. Assign to tenant
    const assignment = await assignModuleToTenant({
      tenant_id: testTenant.id,
      base_module_id: baseModule.id,
      implementation_id: implementation.id,
    });
    
    // 4. Verify module is available for tenant
    const availableModules = await getAvailableModules(testTenant.id);
    expect(availableModules).toContainEqual(
      expect.objectContaining({ slug: 'test-analytics' })
    );
  });
});
```

## Test Utilities

### **Mock Factory**
```typescript
// lib/test-utils/mock-factory.ts
export function createMockUser(overrides = {}) {
  return {
    id: 'user-123',
    email: 'test@example.com',
    role: 'user',
    organization_id: 'org-123',
    is_admin: false,
    ...overrides,
  };
}

export function createMockModule(overrides = {}) {
  return {
    id: 'module-123',
    slug: 'test-module',
    name: 'Test Module',
    category: 'analytics',
    is_active: true,
    supports_multi_tenant: true,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockTenant(overrides = {}) {
  return {
    id: 'tenant-123',
    name: 'Test Organization',
    slug: 'test-org',
    settings: {},
    ...overrides,
  };
}
```

### **Supabase Mock**
```typescript
// lib/test-utils/supabase-mock.ts
export const mockSupabase = {
  auth: {
    getUser: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
      })),
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(),
      })),
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
    delete: jest.fn(() => ({
      eq: jest.fn(),
    })),
  })),
  reset: jest.fn(() => {
    // Reset all mocks
    Object.values(mockSupabase).forEach(mock => {
      if (typeof mock === 'object') {
        Object.values(mock).forEach(nestedMock => {
          if (jest.isMockFunction(nestedMock)) {
            nestedMock.mockClear();
          }
        });
      }
    });
  }),
};
```

### **Tenant Test Helper**
```typescript
// lib/test-utils/tenant-helper.ts
export function testWithTenant(
  tenantAName: string,
  tenantBName: string,
  testFn: (tenantA: any, tenantB: any) => Promise<void>
) {
  return async () => {
    // Setup isolated test tenants
    const tenantA = await createTestTenant(tenantAName);
    const tenantB = await createTestTenant(tenantBName);
    
    try {
      await testFn(tenantA, tenantB);
    } finally {
      // Cleanup
      await cleanupTestTenant(tenantA.id);
      await cleanupTestTenant(tenantB.id);
    }
  };
}
```

## Performance Testing

### **Load Testing Patterns**
```typescript
// __tests__/performance/module-loading.test.ts
describe('Module loading performance', () => {
  it('loads 100 modules efficiently', async () => {
    const start = performance.now();
    
    // Create 100 modules
    const modules = await Promise.all(
      Array(100).fill(0).map((_, i) => 
        createBaseModule({
          name: `Module ${i}`,
          slug: `module-${i}`,
          category: 'analytics',
        })
      )
    );
    
    const loadTime = performance.now() - start;
    
    // Should load within reasonable time
    expect(loadTime).toBeLessThan(5000); // 5 seconds
    expect(modules).toHaveLength(100);
  });
});
```

## E2E Testing

### **Critical User Journeys**
```typescript
// e2e/module-management.spec.ts
import { test, expect } from '@playwright/test';

test('Admin can create and assign module', async ({ page }) => {
  // Login as admin
  await page.goto('/login');
  await page.fill('[data-testid=email]', 'admin@example.com');
  await page.fill('[data-testid=password]', 'password');
  await page.click('[data-testid=login]');
  
  // Navigate to admin modules
  await page.goto('/admin/modules');
  
  // Create new module
  await page.click('[data-testid=create-module]');
  await page.fill('[data-testid=module-name]', 'E2E Test Module');
  await page.fill('[data-testid=module-slug]', 'e2e-test-module');
  await page.selectOption('[data-testid=category]', 'analytics');
  await page.click('[data-testid=save-module]');
  
  // Verify module appears in list
  await expect(page.locator('text=E2E Test Module')).toBeVisible();
  
  // Assign to tenant
  await page.click('[data-testid=assign-module]');
  await page.selectOption('[data-testid=tenant]', 'test-tenant');
  await page.click('[data-testid=confirm-assignment]');
  
  // Verify assignment success
  await expect(page.locator('text=Module assigned successfully')).toBeVisible();
});
```

## Test Configuration

### **Jest Setup**
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/e2e/',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
```

### **Test Environment Setup**
```javascript
// jest.setup.js
import '@testing-library/jest-dom';
import { mockSupabase } from './lib/test-utils/supabase-mock';

// Mock Supabase globally
jest.mock('@/lib/supabase/client', () => ({
  createClientClient: () => mockSupabase,
}));

jest.mock('@/lib/supabase/server', () => ({
  createServerClient: () => mockSupabase,
}));

// Global test helpers
global.createMockUser = require('./lib/test-utils/mock-factory').createMockUser;
global.createMockModule = require('./lib/test-utils/mock-factory').createMockModule;
```