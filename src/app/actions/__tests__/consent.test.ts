import "@testing-library/jest-dom";

// Mock Supabase
const mockSupabase = {
  auth: {
    getSession: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
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
};

jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: jest.fn(() => mockSupabase),
}));

describe('Consent Server Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Consent Management', () => {
    it('should record user consent', async () => {
      const mockRecordConsent = jest.fn().mockResolvedValue({
        success: true,
        data: {
          id: 'consent-123',
          type: 'privacy_policy',
          version: '1.0',
          granted: true,
          timestamp: new Date().toISOString(),
        },
      });

      const result = await mockRecordConsent({
        type: 'privacy_policy',
        version: '1.0',
        granted: true,
      });

      expect(result.success).toBe(true);
      expect(result.data.granted).toBe(true);
    });

    it('should get consent history', async () => {
      const mockGetConsentHistory = jest.fn().mockResolvedValue({
        success: true,
        data: [
          {
            id: 'consent-1',
            type: 'terms_of_service',
            version: '1.0',
            granted: true,
            timestamp: new Date().toISOString(),
          },
          {
            id: 'consent-2',
            type: 'marketing',
            version: '1.0',
            granted: false,
            timestamp: new Date().toISOString(),
          },
        ],
      });

      const result = await mockGetConsentHistory();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].type).toBe('terms_of_service');
    });

    it('should withdraw consent', async () => {
      const mockWithdrawConsent = jest.fn().mockResolvedValue({
        success: true,
        data: {
          id: 'consent-123',
          type: 'marketing',
          granted: false,
          withdrawn_at: new Date().toISOString(),
        },
      });

      const result = await mockWithdrawConsent({
        consentId: 'consent-123',
        reason: 'User request',
      });

      expect(result.success).toBe(true);
      expect(result.data.granted).toBe(false);
    });
  });
});
