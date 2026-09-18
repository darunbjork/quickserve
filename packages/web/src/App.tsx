import type { CSSProperties, JSX } from 'react';
import { CustomerPage } from '@/pages/CustomerPage';
import { KitchenPage } from '@/pages/KitchenPage';

function Nav(): JSX.Element {
  const path = window.location.pathname;
  const linkStyle = (active: boolean): CSSProperties => ({
    color: active ? 'var(--iris-soft)' : 'var(--muted)',
    textDecoration: 'none',
    marginRight: '1.5rem',
    fontFamily: 'ui-monospace, monospace',
    fontSize: '0.875rem',
  });

  return (
    <nav style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
      <a href="/" style={linkStyle(path === '/')}>./order</a>
      <a href="/kitchen" style={linkStyle(path === '/kitchen')}>./kitchen</a>
    </nav>
  );
}

export function App(): JSX.Element {
  const path = window.location.pathname;

  return (
    <>
      <Nav />
      {path === '/kitchen' ? <KitchenPage /> : <CustomerPage />}
    </>
  );
}