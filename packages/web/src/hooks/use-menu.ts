import { useQuery } from '@tanstack/react-query';
import { api, type MenuItem } from '@/lib/api';

export function useMenu(): {
  items: MenuItem[] | undefined;
  isLoading: boolean;
  error: Error | null;
} {
  const { data, isLoading, error } = useQuery<MenuItem[], Error>({
    queryKey: ['menu'],
    queryFn: api.getMenu,
  });

  return { items: data, isLoading, error };
}