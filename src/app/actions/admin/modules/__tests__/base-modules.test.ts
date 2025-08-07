import { getBaseModules, createBaseModule } from '../base-modules';
import { CreateBaseModuleInput } from '../schemas';

// Mock das dependências
jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: jest.fn()
}));

jest.mock('../utils', () => ({
  verifyAdminAccess: jest.fn(),
  generateSlugFromName: jest.fn(),
  validateJsonSchema: jest.fn(),
  checkCircularDependencies: jest.fn()
}));

jest.mock('../system-config-utils', () => ({
  conditionalAuditLog: jest.fn(),
  conditionalDebugLog: jest.fn(),
  checkMaintenanceMode: jest.fn()
}));

jest.mock('../call-tracker', () => ({
  trackServerCall: jest.fn()
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn()
}));

const mockSupabaseClient = {
  from: jest.fn(),
  select: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  eq: jest.fn(),
  or: jest.fn(),
  is: jest.fn(),
  not: jest.fn(),
  range: jest.fn(),
  order: jest.fn(),
  single: jest.fn()
};

const { createSupabaseServerClient } = require('@/lib/supabase/server');
const { verifyAdminAccess, checkCircularDependencies } = require('../utils');
const { checkMaintenanceMode } = require('../system-config-utils');

describe('base-modules server actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    createSupabaseServerClient.mockResolvedValue(mockSupabaseClient);
    verifyAdminAccess.mockResolvedValue({
      isAuthenticated: true,
      isAdmin: true,
      user: { id: 'test-user' }
    });
    checkMaintenanceMode.mockResolvedValue({
      inMaintenance: false,
      message: null
    });
  });

  describe('getBaseModules', () => {
    it('deve retornar módulos com sucesso', async () => {
      const mockModules = [
        {
          id: '1',
          name: 'Test Module',
          slug: 'test-module',
          category: 'test',
          is_active: true
        }
      ];

      // Setup da cadeia de mocks do Supabase
      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.order.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.is.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.range.mockResolvedValue({
        data: mockModules,
        count: 1,
        error: null
      });

      const result = await getBaseModules();

      expect(result.success).toBe(true);
      expect(result.data?.modules).toEqual(mockModules);
      expect(result.data?.total).toBe(1);
      expect(result.data?.pages).toBe(1);
    });

    it('deve retornar erro quando usuário não é admin', async () => {
      verifyAdminAccess.mockResolvedValue({
        isAuthenticated: true,
        isAdmin: false,
        user: { id: 'test-user' }
      });

      const result = await getBaseModules();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Acesso negado. Apenas administradores podem visualizar módulos');
    });

    it('deve retornar erro quando usuário não está autenticado', async () => {
      verifyAdminAccess.mockResolvedValue({
        isAuthenticated: false,
        isAdmin: false,
        user: null
      });

      const result = await getBaseModules();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Usuário não autenticado');
    });

    it('deve aplicar filtros corretamente', async () => {
      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.order.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.or.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.is.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.range.mockResolvedValue({
        data: [],
        count: 0,
        error: null
      });

      await getBaseModules({
        search: 'test',
        category: 'analytics',
        includeArchived: true,
        page: 2,
        limit: 5
      });

      expect(mockSupabaseClient.or).toHaveBeenCalledWith('name.ilike.%test%,description.ilike.%test%,slug.ilike.%test%');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('category', 'analytics');
      expect(mockSupabaseClient.range).toHaveBeenCalledWith(5, 9); // page 2, limit 5
    });
  });

  describe('createBaseModule', () => {
    const validInput: CreateBaseModuleInput = {
      name: 'Test Module',
      slug: 'test-module',
      description: 'This is a test module',
      category: 'test',
      icon: 'Package',
      route_pattern: '/test',
      permissions_required: [],
      supports_multi_tenant: true,
      config_schema: {},
      dependencies: [],
      version: '1.0.0',
      tags: [],
      auto_create_standard: false,
      is_active: true
    };

    it('deve criar módulo com sucesso', async () => {
      checkCircularDependencies.mockResolvedValue(false);
      
      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' } // Not found - OK
      });
      
      mockSupabaseClient.insert.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.insert.mockResolvedValue({
        data: { ...validInput, id: 'new-id' },
        error: null
      });

      const result = await createBaseModule(validInput);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('new-id');
    });

    it('deve retornar erro quando sistema está em manutenção', async () => {
      checkMaintenanceMode.mockResolvedValue({
        inMaintenance: true,
        message: 'Sistema em manutenção'
      });

      const result = await createBaseModule(validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Sistema em manutenção');
    });

    it('deve retornar erro quando usuário não é admin', async () => {
      verifyAdminAccess.mockResolvedValue({
        isAuthenticated: true,
        isAdmin: false,
        user: { id: 'test-user' }
      });

      const result = await createBaseModule(validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Acesso negado. Apenas administradores podem criar módulos');
    });

    it('deve retornar erro quando slug já existe', async () => {
      checkCircularDependencies.mockResolvedValue(false);
      
      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValue({
        data: { id: 'existing-id', slug: 'test-module' },
        error: null
      });

      const result = await createBaseModule(validInput);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Slug já existe');
    });

    it('deve retornar erro quando há dependências circulares', async () => {
      checkCircularDependencies.mockResolvedValue(true);

      const inputWithDependencies = {
        ...validInput,
        dependencies: ['dep1', 'dep2']
      };

      const result = await createBaseModule(inputWithDependencies);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Dependências circulares detectadas');
    });

    it('deve lidar com erros de validação de entrada', async () => {
      const invalidInput = {
        ...validInput,
        name: 'A', // Muito curto
        slug: 'INVALID_SLUG' // Formato inválido
      };

      const result = await createBaseModule(invalidInput as CreateBaseModuleInput);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Dados inválidos');
    });
  });
});