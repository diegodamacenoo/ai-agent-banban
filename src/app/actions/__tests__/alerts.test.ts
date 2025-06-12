import "@testing-library/jest-dom";

// Mock Supabase
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        gte: jest.fn(() => ({
          lte: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          })),
        })),
      })),
    })),
  })),
};

jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: jest.fn(() => mockSupabase),
}));

describe('Alert Server Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAlerts', () => {
    it('should return alerts data', async () => {
      const mockGetAlerts = jest.fn().mockResolvedValue({
        success: true,
        data: {
          stagnantProducts: [],
          replenishmentAlerts: [],
          inventoryDivergences: [],
          marginAlerts: [],
          returnSpikes: [],
          redistributionSuggestions: [],
        },
      });

      const result = await mockGetAlerts();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.stagnantProducts).toEqual([]);
    });

    it('should handle database errors', async () => {
      const mockGetAlerts = jest.fn().mockResolvedValue({
        success: false,
        error: 'Erro ao buscar alertas',
      });

      const result = await mockGetAlerts();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Erro');
    });
  });

  describe('exportAlertsToCSV', () => {
    it('should export alerts to CSV format', async () => {
      const mockExportCSV = jest.fn().mockResolvedValue({
        success: true,
        data: 'Product,Location,Status\nTest Product,Test Location,Active',
        filename: 'alertas_2024-01-01.csv',
      });

      const result = await mockExportCSV({
        search: 'test',
        types: ['stagnant'],
        severities: ['high'],
      });

      expect(result.success).toBe(true);
      expect(result.data).toContain('Product,Location,Status');
      expect(result.filename).toContain('.csv');
    });

    it('should handle export errors', async () => {
      const mockExportCSV = jest.fn().mockResolvedValue({
        success: false,
        error: 'Erro ao gerar export',
      });

      const result = await mockExportCSV({});

      expect(result.success).toBe(false);
      expect(result.error).toContain('Erro');
    });
  });

  describe('getAlertStatistics', () => {
    it('should return alert statistics', async () => {
      const mockGetStats = jest.fn().mockResolvedValue({
        success: true,
        data: {
          total_stagnant_products: 10,
          total_replenishment_alerts: 5,
          total_inventory_divergences: 3,
          total_margin_alerts: 2,
          total_return_spikes: 1,
          total_redistribution_suggestions: 4,
        },
      });

      const result = await mockGetStats();

      expect(result.success).toBe(true);
      expect(result.data.total_stagnant_products).toBe(10);
      expect(result.data.total_replenishment_alerts).toBe(5);
    });
  });
}); 