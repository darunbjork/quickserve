const BASE = '/api';

interface Envelope<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  const body = (await res.json()) as Envelope<T>;

  if (!res.ok || !body.success || body.data === undefined) {
    const msg = body.error?.message ?? `request failed: ${res.status}`;
    throw new Error(msg);
  }

  return body.data;
}

export interface MenuItem {
  id: string;
  sku: string;
  name: string;
  description: string;
  basePrice: number;
  isAvailable: boolean;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  unitPrice: string;
  quantity: number;
  subtotal: string;
}

export type OrderStatus =
  | 'CREATED'
  | 'PREPARING'
  | 'READY'
  | 'COMPLETED'
  | 'CANCELLED';

export interface Order {
  id: string;
  customerId: string;
  status: OrderStatus;
  totalAmount: string;
  currency: string;
  items: OrderItem[];
}

export interface PlaceOrderLine {
  productId: string;
  quantity: number;
}

export const api = {
  getMenu: (): Promise<MenuItem[]> => request<MenuItem[]>('/menu'),

  placeOrder: (items: PlaceOrderLine[]): Promise<Order> =>
    request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify({ items }),
    }),

  getOrder: (id: string): Promise<Order> => request<Order>(`/orders/${id}`),
};

export function formatOre(ore: number | string): string {
  const n = typeof ore === 'string' ? parseInt(ore, 10) : ore;
  if (!Number.isFinite(n)) return `${ore}`;
  return `${(n / 100).toFixed(2)} SEK`;
}