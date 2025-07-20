import { BanBanService } from '../../services/banban-service';

describe('BanBanService Singleton', () => {
  it('should always return the same instance', () => {
    const instance1 = BanBanService.getInstance();
    const instance2 = BanBanService.getInstance();

    expect(instance1).toBe(instance2);
  });

  it('should have access to config', () => {
    const instance = BanBanService.getInstance();
    expect(instance.getConfig().clientId).toBe('banban');
  });
}); 
