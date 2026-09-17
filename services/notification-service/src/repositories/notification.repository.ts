import { prisma } from '../db/prisma';

export interface NotificationDto {
  id: string;
  orderId: string;
  customerId: string;
  type: string;
  message: string;
  createdAt: string;
}

export interface CreateNotificationInput {
  orderId: string;
  customerId: string;
  type: string;
  message: string;
}

export class NotificationRepository {
  async upsert(input: CreateNotificationInput): Promise<NotificationDto> {
    const row = await prisma.notification.upsert({
      where: {
        orderId_type: {
          orderId: input.orderId,
          type: input.type,
        },
      },
      update: {},
      create: input,
    });
    return this.toDto(row);
  }

  async findByOrderId(orderId: string): Promise<NotificationDto[]> {
    const rows = await prisma.notification.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(this.toDto);
  }

  private toDto(row: {
    id: string;
    orderId: string;
    customerId: string;
    type: string;
    message: string;
    createdAt: Date;
  }): NotificationDto {
    return {
      id: row.id,
      orderId: row.orderId,
      customerId: row.customerId,
      type: row.type,
      message: row.message,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
