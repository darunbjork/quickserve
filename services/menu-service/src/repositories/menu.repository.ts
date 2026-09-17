import { prisma } from '../db/prisma';
import type { MenuItem } from '@quickserve/shared-types';

export class MenuRepository {
  async findAllAvailable(): Promise<MenuItem[]> {
    const rows = await prisma.menuItem.findMany({
      where: { isAvailable: true },
      orderBy: { name: 'asc' },
    });
    return rows.map(this.toDto);
  }

  async findBySku(sku: string): Promise<MenuItem | null> {
    const row = await prisma.menuItem.findUnique({ where: { sku } });
    return row ? this.toDto(row) : null;
  }

  private toDto(row: {
    id: string;
    sku: string;
    name: string;
    description: string;
    basePrice: number;
    isAvailable: boolean;
  }): MenuItem {
    return {
      id: row.id,
      sku: row.sku,
      name: row.name,
      description: row.description,
      basePrice: row.basePrice,
      isAvailable: row.isAvailable,
    };
  }
}
