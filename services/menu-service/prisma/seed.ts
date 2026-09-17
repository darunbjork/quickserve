// @ts-nocheck
import { PrismaClient } from '../src/generated/prisma-client/index.js';
import { PrismaPg } from '@prisma/adapter-pg';

const url =
  process.env.MENU_DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5435/menu_db';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url }),
});

const items = [
  { sku: 'BURGER-01', name: 'Classic Burger', description: 'Beef patty, cheddar, lettuce, tomato', basePrice: 8900 },
  { sku: 'FRIES-01', name: 'Fries', description: 'Crispy golden fries, lightly salted', basePrice: 3500 },
  { sku: 'DRINK-01', name: 'Soft Drink', description: 'Coca-Cola / Fanta / Sprite, 33cl', basePrice: 2500 },
  { sku: 'DESSERT-01', name: 'Ice Cream', description: 'Vanilla soft-serve in a cone', basePrice: 2900 },
  { sku: 'COMBO-01', name: 'Burger Combo', description: 'Classic Burger + Fries + Soft Drink', basePrice: 12900 },
];

async function main(): Promise<void> {
  for (const item of items) {
    await prisma.menuItem.upsert({
      where: { sku: item.sku },
      update: item,
      create: item,
    });
  }
  console.log(`[seed] upserted ${items.length} menu items`);
}

main()
  .catch((err) => {
    console.error('[seed] failed', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
