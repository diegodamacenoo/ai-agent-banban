import { renderHook, act } from '@testing-library/react';
import { useOptimisticBaseModules } from '../hooks/useOptimisticBaseModules';
import { BaseModule } from '../types';

// Mock do useToast
jest.mock('@/shared/ui/toast', () => ({
  useToast: () => ({
    toast: {
      error: jest.fn(),
      success: jest.fn()
    }
  })
}));

describe('useOptimisticBaseModules', () => {
  const mockBaseModules: BaseModule[] = [
    {
      id: '1',
      slug: 'test-module',
      name: 'Test Module',
      description: 'Test description',
      category: 'test',
      icon: 'Package',
      route_pattern: '/test',
      permissions_required: [],
      supports_multi_tenant: true,
      config_schema: {},
      dependencies: [],
      version: '1.0.0',
      tags: [],
      is_active: true,
      archived_at: null,
      deleted_at: null,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
      created_by: 'test-user'
    }
  ];

  it('deve inicializar com módulos base fornecidos', () => {
    const { result } = renderHook(() => 
      useOptimisticBaseModules({ 
        initialBaseModules: mockBaseModules,
        onError: jest.fn()
      })
    );

    expect(result.current.baseModules).toEqual(mockBaseModules);
    expect(result.current.hasOptimisticOperations).toBe(false);
  });

  it('deve aplicar criação otimística', () => {
    const { result } = renderHook(() => 
      useOptimisticBaseModules({ 
        initialBaseModules: mockBaseModules,
        onError: jest.fn()
      })
    );

    const newModule: BaseModule = {
      ...mockBaseModules[0],
      id: '2',
      name: 'New Module',
      slug: 'new-module'
    };

    act(() => {
      const operationId = result.current.optimisticCreate(newModule);
      expect(operationId).toBeDefined();
      expect(operationId).toContain('create-2-');
    });

    expect(result.current.baseModules).toHaveLength(2);
    expect(result.current.baseModules[1]).toEqual(newModule);
    expect(result.current.hasOptimisticOperations).toBe(true);
  });

  it('deve aplicar atualização otimística', () => {
    const { result } = renderHook(() => 
      useOptimisticBaseModules({ 
        initialBaseModules: mockBaseModules,
        onError: jest.fn()
      })
    );

    const updatedModule: BaseModule = {
      ...mockBaseModules[0],
      name: 'Updated Module'
    };

    act(() => {
      const operationId = result.current.optimisticUpdate(updatedModule);
      expect(operationId).toBeDefined();
    });

    expect(result.current.baseModules[0].name).toBe('Updated Module');
    expect(result.current.hasOptimisticOperations).toBe(true);
  });

  it('deve aplicar delete otimístico (soft delete)', () => {
    const { result } = renderHook(() => 
      useOptimisticBaseModules({ 
        initialBaseModules: mockBaseModules,
        onError: jest.fn()
      })
    );

    act(() => {
      const operationId = result.current.optimisticDelete('1');
      expect(operationId).toBeDefined();
    });

    expect(result.current.baseModules[0].deleted_at).toBeDefined();
    expect(result.current.hasOptimisticOperations).toBe(true);
  });

  it('deve aplicar archive otimístico', () => {
    const { result } = renderHook(() => 
      useOptimisticBaseModules({ 
        initialBaseModules: mockBaseModules,
        onError: jest.fn()
      })
    );

    act(() => {
      const operationId = result.current.optimisticArchive('1');
      expect(operationId).toBeDefined();
    });

    expect(result.current.baseModules[0].archived_at).toBeDefined();
    expect(result.current.hasOptimisticOperations).toBe(true);
  });

  it('deve confirmar operação com sucesso', () => {
    const { result } = renderHook(() => 
      useOptimisticBaseModules({ 
        initialBaseModules: mockBaseModules,
        onError: jest.fn()
      })
    );

    let operationId: string;

    act(() => {
      operationId = result.current.optimisticUpdate({
        ...mockBaseModules[0],
        name: 'Updated Module'
      });
    });

    act(() => {
      result.current.confirmOperation(operationId, {
        ...mockBaseModules[0],
        name: 'Server Updated Module'
      });
    });

    expect(result.current.baseModules[0].name).toBe('Server Updated Module');
    expect(result.current.hasOptimisticOperations).toBe(false);
  });

  it('deve reverter operação em caso de erro', () => {
    const mockOnError = jest.fn();
    const { result } = renderHook(() => 
      useOptimisticBaseModules({ 
        initialBaseModules: mockBaseModules,
        onError: mockOnError
      })
    );

    let operationId: string;

    act(() => {
      operationId = result.current.optimisticUpdate({
        ...mockBaseModules[0],
        name: 'Updated Module'
      });
    });

    act(() => {
      result.current.revertOperation(operationId, 'Erro de teste');
    });

    expect(result.current.baseModules[0].name).toBe('Test Module'); // Revertido
    expect(result.current.hasOptimisticOperations).toBe(false);
    expect(mockOnError).toHaveBeenCalledWith('Erro de teste', expect.any(Object));
  });

  it('deve sincronizar com servidor', () => {
    const { result } = renderHook(() => 
      useOptimisticBaseModules({ 
        initialBaseModules: mockBaseModules,
        onError: jest.fn()
      })
    );

    const newServerModules: BaseModule[] = [
      {
        ...mockBaseModules[0],
        name: 'Server Module'
      }
    ];

    act(() => {
      result.current.syncWithServer(newServerModules);
    });

    expect(result.current.baseModules).toEqual(newServerModules);
    expect(result.current.hasOptimisticOperations).toBe(false);
  });
});