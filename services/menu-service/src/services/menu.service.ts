import { MenuRepository } from '../repositories/menu.repository';
import type { MenuItem } from '@quickserve/shared-types';

export class MenuService {
  private readonly repository = new MenuRepository();

  async listMenu(): Promise<MenuItem[]> {
    return this.repository.findAllAvailable();
  }

  async getBySku(sku: string): Promise<MenuItem | null> {
    return this.repository.findBySku(sku);
  }
}
