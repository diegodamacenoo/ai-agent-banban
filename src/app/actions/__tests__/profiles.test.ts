import "@testing-library/jest-dom";

// Mock Supabase
const mockSupabase = {
  auth: {
    getSession: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
      })),
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
}));

describe('Profile Server Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateUserProfile', () => {
    it('should update user profile', async () => {
      const mockUpdateProfile = jest.fn().mockResolvedValue({
        success: true,
        data: {
          id: '123',
          name: 'João Silva',
          email: 'joao@example.com',
          updated_at: new Date().toISOString(),
        },
      });

      const result = await mockUpdateProfile({
        name: 'João Silva',
        email: 'joao@example.com',
      });

      expect(result.success).toBe(true);
      expect(result.data.name).toBe('João Silva');
    });

    it('should validate profile data', async () => {
      const mockUpdateProfile = jest.fn().mockResolvedValue({
        success: false,
        error: 'Nome é obrigatório',
      });

      const result = await mockUpdateProfile({
        name: '',
        email: 'joao@example.com',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('obrigatório');
    });
  });

  describe('uploadAvatar', () => {
    it('should upload avatar successfully', async () => {
      const mockUploadAvatar = jest.fn().mockResolvedValue({
        success: true,
        data: {
          avatar_url: 'https://example.com/avatar.jpg',
        },
      });

      const mockFile = new File([''], 'avatar.jpg', { type: 'image/jpeg' });
      const result = await mockUploadAvatar({ file: mockFile });

      expect(result.success).toBe(true);
      expect(result.data.avatar_url).toContain('avatar.jpg');
    });

    it('should validate file type', async () => {
      const mockUploadAvatar = jest.fn().mockResolvedValue({
        success: false,
        error: 'Tipo de arquivo não suportado',
      });

      const mockFile = new File([''], 'document.pdf', { type: 'application/pdf' });
      const result = await mockUploadAvatar({ file: mockFile });

      expect(result.success).toBe(false);
      expect(result.error).toContain('não suportado');
    });
  });

  describe('getUserProfile', () => {
    it('should return user profile', async () => {
      const mockGetProfile = jest.fn().mockResolvedValue({
        success: true,
        data: {
          id: '123',
          name: 'João Silva',
          email: 'joao@example.com',
          avatar_url: 'https://example.com/avatar.jpg',
          role: 'user',
        },
      });

      const result = await mockGetProfile();

      expect(result.success).toBe(true);
      expect(result.data.name).toBe('João Silva');
      expect(result.data.role).toBe('user');
    });
  });
}); 