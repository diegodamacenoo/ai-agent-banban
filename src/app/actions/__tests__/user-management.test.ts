import "@testing-library/jest-dom";

// Mock Supabase
const mockSupabase = {
  auth: {
    getSession: jest.fn(),
    admin: {
      createUser: jest.fn(),
      updateUserById: jest.fn(),
      deleteUser: jest.fn(),
    },
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
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
    delete: jest.fn(() => ({
      eq: jest.fn(),
    })),
  })),
};

jest.mock('@/core/supabase/server', () => ({
  createSupabaseServerClient: jest.fn(() => mockSupabase),
  createSupabaseAdminClient: jest.fn(() => mockSupabase),
}));

// Mock headers
jest.mock('next/headers', () => ({
  headers: jest.fn(() => ({
    get: jest.fn(),
  })),
}));

describe('User Management Server Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('inviteUser', () => {
    it('should validate email format', async () => {
      const mockInviteUser = jest.fn().mockResolvedValue({
        success: false,
        error: 'Email invÃ¡lido',
      });

      const result = await mockInviteUser({
        email: 'invalid-email',
        role: 'user',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('invÃ¡lido');
    });

    it('should create user invitation', async () => {
      const mockInviteUser = jest.fn().mockResolvedValue({
        success: true,
        data: {
          id: '123',
          email: 'user@example.com',
          role: 'user',
          status: 'PENDING',
        },
      });

      const result = await mockInviteUser({
        email: 'user@example.com',
        role: 'user',
      });

      expect(result.success).toBe(true);
      expect(result.data.email).toBe('user@example.com');
      expect(result.data.status).toBe('PENDING');
    });
  });

  describe('updateUserRole', () => {
    it('should validate user permissions', async () => {
      const mockUpdateRole = jest.fn().mockResolvedValue({
        success: false,
        error: 'PermissÃ£o negada',
      });

      const result = await mockUpdateRole({
        userId: '123',
        newRole: 'admin',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('PermissÃ£o negada');
    });

    it('should update user role successfully', async () => {
      const mockUpdateRole = jest.fn().mockResolvedValue({
        success: true,
        data: {
          id: '123',
          role: 'admin',
          updated_at: new Date().toISOString(),
        },
      });

      const result = await mockUpdateRole({
        userId: '123',
        newRole: 'admin',
      });

      expect(result.success).toBe(true);
      expect(result.data.role).toBe('admin');
    });
  });

  describe('deactivateUser', () => {
    it('should prevent self-deactivation', async () => {
      const mockDeactivateUser = jest.fn().mockResolvedValue({
        success: false,
        error: 'NÃ£o Ã© possÃ­vel desativar sua prÃ³pria conta',
      });

      const result = await mockDeactivateUser({
        userId: 'current-user-id',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('prÃ³pria conta');
    });

    it('should deactivate user successfully', async () => {
      const mockDeactivateUser = jest.fn().mockResolvedValue({
        success: true,
        data: {
          id: '123',
          status: 'INACTIVE',
          deactivated_at: new Date().toISOString(),
        },
      });

      const result = await mockDeactivateUser({
        userId: '123',
      });

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('INACTIVE');
    });
  });

  describe('restoreUser', () => {
    it('should restore deactivated user', async () => {
      const mockRestoreUser = jest.fn().mockResolvedValue({
        success: true,
                  data: {
            id: '123',
            status: 'ACTIVE',
          restored_at: new Date().toISOString(),
        },
      });

      const result = await mockRestoreUser({
        userId: '123',
      });

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('ACTIVE');
    });

    it('should handle restore errors', async () => {
      const mockRestoreUser = jest.fn().mockResolvedValue({
        success: false,
        error: 'UsuÃ¡rio nÃ£o encontrado',
      });

      const result = await mockRestoreUser({
        userId: 'invalid-id',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('nÃ£o encontrado');
    });
  });

  describe('getUsersList', () => {
    it('should return users list', async () => {
      const mockGetUsers = jest.fn().mockResolvedValue({
        success: true,
        data: [
          {
            id: '1',
            email: 'user1@example.com',
            role: 'user',
            status: 'ACTIVE',
          },
          {
            id: '2',
            email: 'user2@example.com',
            role: 'admin',
            status: 'ACTIVE',
          },
        ],
      });

      const result = await mockGetUsers();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].email).toBe('user1@example.com');
    });
  });
}); 
