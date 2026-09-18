import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type KitchenOrder } from '@/lib/api';

export function useKitchenOrders(): {
  orders: KitchenOrder[] | undefined;
  isLoading: boolean;
  error: Error | null;
} {
  const { data, isLoading, error } = useQuery<KitchenOrder[], Error>({
    queryKey: ['kitchen-orders'],
    queryFn: api.getKitchenOrders,
    refetchInterval: 2000,
  });

  return { orders: data, isLoading, error };
}

export function useMarkReady() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => api.markKitchenReady(orderId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
    },
  });
}