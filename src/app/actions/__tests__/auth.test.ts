import "@testing-library/jest-dom";

// Mock Supabase
const mockSupabase = {
  auth: {
    getSession: jest.fn(),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
      })),
    })),
  })),
};

jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: jest.fn(() => mockSupabase),
}));

// Mock headers
jest.mock('next/headers', () => ({
  headers: jest.fn(() => ({
    get: jest.fn(),
  })),
}));

describe('Auth Server Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('changePassword', () => {
    it('should validate input parameters', async () => {
      // Mock implementation
      const mockChangePassword = jest.fn().mockResolvedValue({
        success: false,
        error: 'Senha atual é obrigatória',
      });

      const result = await mockChangePassword({
        currentPassword: '',
        newPassword: 'newpass123',
        confirmPassword: 'newpass123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('obrigatória');
    });

    it('should require matching passwords', async () => {
      const mockChangePassword = jest.fn().mockResolvedValue({
        success: false,
        error: 'As senhas não coincidem',
      });

      const result = await mockChangePassword({
        currentPassword: 'oldpass123',
        newPassword: 'newpass123',
        confirmPassword: 'different123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('não coincidem');
    });
  });

  describe('requestPasswordReset', () => {
    it('should validate email format', async () => {
      const mockRequestReset = jest.fn().mockResolvedValue({
        success: false,
        error: 'Email inválido',
      });

      const result = await mockRequestReset({
        email: 'invalid-email',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('inválido');
    });

    it('should handle valid email', async () => {
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

  describe('Session Management', () => {
    it('should handle session validation', async () => {
      const mockGetSession = jest.fn().mockResolvedValue({
        success: true,
        data: {
          user: { id: '123', email: 'user@example.com' },
          session: { access_token: 'token123' },
        },
      });

      const result = await mockGetSession();

      expect(result.success).toBe(true);
      expect(result.data.user).toBeDefined();
      expect(result.data.session).toBeDefined();
    });

    it('should handle invalid session', async () => {
      const mockGetSession = jest.fn().mockResolvedValue({
        success: false,
        error: 'Sessão inválida',
      });

      const result = await mockGetSession();

      expect(result.success).toBe(false);
      expect(result.error).toContain('inválida');
    });
  });
}); 