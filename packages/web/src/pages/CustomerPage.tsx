import { useState, type CSSProperties, type JSX } from 'react';
import { useMenu } from '@/hooks/use-menu';
import { useOrder, usePlaceOrder } from '@/hooks/use-order';
import { formatOre } from '@/lib/api';

const btnPrimary: CSSProperties = {
  background: 'var(--iris)',
  color: 'white',
  border: 0,
  borderRadius: '999px',
  padding: '0.5rem 1rem',
  fontWeight: 600,
  cursor: 'pointer',
};

const btnSecondary: CSSProperties = {
  background: 'transparent',
  color: 'var(--text)',
  border: '1px solid var(--border)',
  borderRadius: '999px',
  width: '2rem',
  height: '2rem',
  fontSize: '1rem',
  cursor: 'pointer',
};

export function CustomerPage(): JSX.Element {
  const { items, isLoading, error } = useMenu();
  const [cart, setCart] = useState<Record<string, number>>({});
  const [orderId, setOrderId] = useState<string | null>(null);
  const placeOrder = usePlaceOrder();
  const order = useOrder(orderId);

  if (isLoading) {
    return (
      <div className="page">
        <p>Loading menu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <p style={{ color: '#f87171' }}>Menu unavailable: {error.message}</p>
      </div>
    );
  }

  if (!items) return <div className="page" />;

  const add = (sku: string): void =>
    setCart((current) => ({ ...current, [sku]: (current[sku] ?? 0) + 1 }));

  const remove = (sku: string): void =>
    setCart((current) => {
      const next = { ...current };
      const quantity = (next[sku] ?? 0) - 1;
      if (quantity <= 0) delete next[sku];
      else next[sku] = quantity;
      return next;
    });

  const cartEntries = Object.entries(cart);
  const totalOre = cartEntries.reduce((sum, [sku, quantity]) => {
    const item = items.find((menuItem) => menuItem.sku === sku);
    return sum + (item ? item.basePrice * quantity : 0);
  }, 0);

  const onPlaceOrder = async (): Promise<void> => {
    if (cartEntries.length === 0) return;
    const result = await placeOrder.mutateAsync(
      cartEntries.map(([productId, quantity]) => ({ productId, quantity })),
    );
    setOrderId(result.id);
    setCart({});
  };

  const placed = order.data;

  return (
    <div className="page">
      <h1>QuickServe</h1>
      <p className="subtitle">Order something</p>

      {placed && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.75rem',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--muted)',
                  fontFamily: 'ui-monospace, monospace',
                }}
              >
                {placed.id}
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                {formatOre(placed.totalAmount)}
              </div>
            </div>
            <span className={`status-badge status-${placed.status}`}>
              {placed.status}
            </span>
          </div>

          <ul
            style={{
              listStyle: 'none',
              color: 'var(--muted)',
              fontSize: '0.875rem',
            }}
          >
            {placed.items.map((item) => (
              <li key={`${item.menuItemId}-${item.name}`}>
                {item.quantity} x {item.name}
              </li>
            ))}
          </ul>

          {placed.status === 'READY' && (
            <p style={{ marginTop: '1rem', color: 'var(--iris-soft)' }}>
              Your order is ready. Pick it up at the counter.
            </p>
          )}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '1rem',
        }}
      >
        {items.map((item) => {
          const inCart = cart[item.sku] ?? 0;
          return (
            <div key={item.sku} className="card">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem',
                }}
              >
                <div style={{ fontWeight: 600 }}>{item.name}</div>
                <div
                  style={{
                    color: 'var(--ember)',
                    fontFamily: 'ui-monospace, monospace',
                  }}
                >
                  {formatOre(item.basePrice)}
                </div>
              </div>

              <p
                style={{
                  color: 'var(--muted)',
                  fontSize: '0.875rem',
                  marginBottom: '1rem',
                }}
              >
                {item.description}
              </p>

              {inCart === 0 ? (
                <button onClick={() => add(item.sku)} style={btnPrimary}>
                  Add to cart
                </button>
              ) : (
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                >
                  <button onClick={() => remove(item.sku)} style={btnSecondary}>
                    -
                  </button>
                  <span style={{ fontFamily: 'ui-monospace, monospace' }}>
                    {inCart}
                  </span>
                  <button onClick={() => add(item.sku)} style={btnSecondary}>
                    +
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {cartEntries.length > 0 && (
        <div
          className="card"
          style={{ marginTop: '2rem', position: 'sticky', bottom: '1rem' }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                {cartEntries.reduce((sum, [, quantity]) => sum + quantity, 0)} items
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                {formatOre(totalOre)}
              </div>
            </div>
            <button
              onClick={() => void onPlaceOrder()}
              disabled={placeOrder.isPending}
              style={btnPrimary}
            >
              {placeOrder.isPending ? 'Placing...' : 'Place order'}
            </button>
          </div>

          {placeOrder.error && (
            <p style={{ color: '#f87171', fontSize: '0.875rem' }}>
              {placeOrder.error.message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}