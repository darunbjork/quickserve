export interface MenuItem {
  id: string;
  name: string;
  description: string;
  basePrice: number; // * Stored in lowest denomination (e.g., cents) to avoid floating-point math errors
  isAvailable: boolean;
}

export interface StockUpdate {
  productId: string;
  quantityDelta: number; // * e.g., -1 for a sale, +1 for a return/cancellation
}