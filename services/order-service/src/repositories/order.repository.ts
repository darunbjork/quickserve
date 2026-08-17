import { prisma } from '../db/prisma';
import { OrderStatus, PaymentStatus, Prisma } from '../generated/prisma-client';

export interface CreateOrderItemInput {
  menuItemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

export interface CreateOrderInput {
  customerId: string;
  items: CreateOrderItemInput[];
}

export class OrderRepository {
  public async create(data: CreateOrderInput, totalAmount: number) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          customerId: data.customerId,
          totalAmount: new Prisma.Decimal(totalAmount),
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          items: {
            create: data.items.map((item) => ({
              menuItemId: item.menuItemId,
              name: item.name,
              unitPrice: new Prisma.Decimal(item.unitPrice),
              quantity: item.quantity,
              subtotal: new Prisma.Decimal(item.unitPrice * item.quantity),
            })),
          },
        },
        include: {
          items: true,
        },
      });

      return order;
    });
  }

  public async findById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
  }

  public async findByCustomerId(customerId: string) {
    return prisma.order.findMany({
      where: { customerId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  public async updateStatus(id: string, status: OrderStatus) {
    return prisma.order.update({
      where: { id },
      data: { status },
      include: { items: true },
    });
  }
}