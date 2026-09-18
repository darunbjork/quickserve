import { useMutation, useQuery } from '@tanstack/react-query';
import { api, type Order, type OrderStatus, type PlaceOrderLine } from '@/lib/api';

const TERMINAL: readonly OrderStatus[] = ['READY', 'COMPLETED', 'CANCELLED'];

export function usePlaceOrder() {
  return useMutation<Order, Error, PlaceOrderLine[]>({
    mutationFn: (items) => api.placeOrder(items),
  });
}

export function useOrder(id: string | null) {
  return useQuery<Order, Error>({
    queryKey: ['order', id],
    queryFn: () => api.getOrder(id as string),
    enabled: id !== null,
    refetchInterval: (query) => {
      const current = query.state.data;
      if (!current) return 2000;
      return TERMINAL.includes(current.status) ? false : 2000;
    },
  });
}