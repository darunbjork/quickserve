import type { CSSProperties, JSX } from 'react';
import { useKitchenOrders, useMarkReady } from '@/hooks/use-kitchen';

const btnPrimary: CSSProperties = {
  background: 'var(--ember)',
  color: 'var(--void)',
  border: 0,
  borderRadius: '999px',
  padding: '0.5rem 1rem',
  fontWeight: 700,
  cursor: 'pointer',
};

const btnDisabled: CSSProperties = {
  ...btnPrimary,
  opacity: 0.4,
  cursor: 'not-allowed',
};

export function KitchenPage(): JSX.Element {
  const { orders, isLoading, error } = useKitchenOrders();
  const markReady = useMarkReady();

  if (isLoading) {
    return (
      <div className="page">
        <p>Loading kitchen queue...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <p style={{ color: '#f87171' }}>Kitchen unavailable: {error.message}</p>
      </div>
    );
  }

  const list = orders ?? [];

  return (
    <div className="page">
      <h1>Kitchen</h1>
      <p className="subtitle">
        {list.length === 0
          ? 'No orders in the queue'
          : `${list.length} order${list.length === 1 ? '' : 's'} in the queue`}
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1rem',
        }}
      >
        {list.map((order) => (
          <div key={order.orderId} className="card">
            <div
              style={{
                fontFamily: 'ui-monospace, monospace',
                fontSize: '0.75rem',
                color: 'var(--muted)',
                marginBottom: '0.5rem',
                wordBreak: 'break-all',
              }}
            >
              {order.orderId}
            </div>
            <div style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
              {order.customerId}
            </div>
            <button
              onClick={() => markReady.mutate(order.orderId)}
              disabled={markReady.isPending}
              style={markReady.isPending ? btnDisabled : btnPrimary}
            >
              {markReady.isPending ? 'Working...' : 'Mark ready'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}