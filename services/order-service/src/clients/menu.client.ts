import { config } from '../config';
import { logger } from '@quickserve/shared-utils';
import type { MenuItem } from '@quickserve/shared-types';

export interface MenuLookup {
  sku: string;
  name: string;
  unitPrice: number;
}

export class MenuClient {
  public static async lookupBySku(sku: string): Promise<MenuLookup | null> {
    try {
      const res = await fetch(`${config.MENU_SERVICE_URL}/${encodeURIComponent(sku)}`);
      if (res.status === 404) return null;
      if (!res.ok) {
        logger.warn({ sku, status: res.status }, 'menu-service lookup failed');
        return null;
      }

      const body = (await res.json()) as { success: boolean; data?: MenuItem };
      if (!body.success || !body.data) return null;

      return {
        sku: body.data.sku,
        name: body.data.name,
        unitPrice: body.data.basePrice,
      };
    } catch (err) {
      logger.warn({ err, sku }, 'menu-service unreachable during order enrichment');
      return null;
    }
  }
}
