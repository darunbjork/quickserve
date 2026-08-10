export enum OrderStatus {
  CART = 'CART',
  PLACED = 'PLACED',
  ACCEPTED = 'ACCEPTED',
  IN_KITCHEN = 'IN_KITCHEN',
  READY = 'READY',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface OrderItem {
  productId: string;
  quantity: number;
  customizations?: Record<string, string>;
}