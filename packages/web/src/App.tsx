import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';

interface HealthResponse {
  status: string;
  service: string;
  timestamp: string;
}

export function App(): ReactElement {
  const { data, isError, isLoading } = useQuery<HealthResponse>({
    queryKey: ['health'],
    queryFn: async () => {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error(`health ${res.status}`);
      return (await res.json()) as HealthResponse;
    },
  });

  return (
    <div className="page">
      <h1>QuickServe</h1>
      <p className="subtitle">Backend status check</p>
      <div className="card">
        {isLoading && <p>Checking...</p>}
        {isError && <p style={{ color: '#f87171' }}>Backend unreachable</p>}
        {data && (
          <pre style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.875rem' }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}