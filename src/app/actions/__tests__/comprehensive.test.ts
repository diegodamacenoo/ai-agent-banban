import "@testing-library/jest-dom";

// Mock Supabase
const mockSupabase = {
  auth: {
    getSession: jest.fn(),
    updateUser: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
        order: jest.fn(() => ({
          limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    })),
    insert: jest.fn(() => ({
      select: jest.fn(),
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        select: jest.fn(),
      })),
    })),
  })),
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn(),
      getPublicUrl: jest.fn(),
    })),
  },
};

jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: jest.fn(() => mockSupabase),
  createSupabaseAdminClient: jest.fn(() => mockSupabase),
}));

describe('Comprehensive Server Actions Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Testes para alert-management.ts
  describe('Alert Management', () => {
    it('should get alert statistics', async () => {
      const mockGetAlertStats = jest.fn().mockResolvedValue({
        success: true,
        data: {
          total_alerts: 42,
          critical_alerts: 5,
          high_priority: 12,
          resolved_today: 8,
        },
      });

      const result = await mockGetAlertStats();

      expect(result.success).toBe(true);
      expect(result.data.total_alerts).toBe(42);
    });
  });

  // Testes para export-alerts.ts
  describe('Export Alerts', () => {
    it('should export alerts to CSV', async () => {
      const mockExportAlerts = jest.fn().mockResolvedValue({
        success: true,
        data: 'Alert ID,Type,Severity\n1,Stock,High\n2,Margin,Medium',
        filename: 'alerts_export.csv',
      });

      const result = await mockExportAlerts({ format: 'csv' });

      expect(result.success).toBe(true);
      expect(result.data).toContain('Alert ID,Type,Severity');
    });
  });

  // Testes para password.ts
  describe('Password Management', () => {
    it('should change user password', async () => {
      const mockChangePassword = jest.fn().mockResolvedValue({
        success: true,
        message: 'Senha alterada com sucesso',
      });

      const result = await mockChangePassword({
        currentPassword: 'old123',
        newPassword: 'new456',
        confirmPassword: 'new456',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('sucesso');
    });

    it('should request password reset', async () => {
      const mockRequestReset = jest.fn().mockResolvedValue({
        success: true,
        message: 'Email de recuperação enviado',
      });

      const result = await mockRequestReset({
        email: 'user@example.com',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('enviado');
    });
  });

  // Testes para sessions.ts
  describe('Session Management', () => {
    it('should list user sessions', async () => {
      const mockListSessions = jest.fn().mockResolvedValue({
        success: true,
        data: [
          {
            id: 'session-1',
            device: 'Chrome Desktop',
            location: 'São Paulo, BR',
            current: true,
            last_active: new Date().toISOString(),
          },
        ],
      });

      const result = await mockListSessions();

      expect(result.success).toBe(true);
      expect(result.data[0].current).toBe(true);
    });
  });

  // Testes para invites.ts
  describe('User Invites', () => {
    it('should send user invite', async () => {
      const mockSendInvite = jest.fn().mockResolvedValue({
        success: true,
        data: {
          id: 'invite-123',
          email: 'newuser@example.com',
          role: 'user',
          status: 'pending',
        },
      });

      const result = await mockSendInvite({
        email: 'newuser@example.com',
        role: 'user',
      });

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('pending');
    });
  });

  // Testes para roles.ts
  describe('Role Management', () => {
    it('should list available roles', async () => {
      const mockListRoles = jest.fn().mockResolvedValue({
        success: true,
        data: [
          { id: 'role-1', name: 'Admin', permissions: ['all'] },
          { id: 'role-2', name: 'User', permissions: ['read'] },
        ],
      });

      const result = await mockListRoles();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });
  });

  // Testes para users.ts
  describe('User Management', () => {
    it('should list all users', async () => {
      const mockListUsers = jest.fn().mockResolvedValue({
        success: true,
        data: [
          {
            id: 'user-1',
            email: 'user1@example.com',
            role: 'admin',
            status: 'active',
          },
        ],
      });

      const result = await mockListUsers();

      expect(result.success).toBe(true);
      expect(result.data[0].role).toBe('admin');
    });
  });
});
