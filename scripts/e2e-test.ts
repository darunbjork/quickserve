const BASE_URL: string = process.env.E2E_BASE_URL ?? 'http://localhost';
const POLL_INTERVAL_MS = 1000;
const MAX_WAIT_MS = 30_000;
const TEST_SKU = 'BURGER-01';
const TEST_QUANTITY = 2;

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

interface MenuItem {
  id: string;
  sku: string;
  name: string;
  description: string;
  basePrice: number;
  isAvailable: boolean;
}

interface OrderItem {
  menuItemId: string;
  name: string;
  unitPrice: string;
  quantity: number;
  subtotal: string;
}

interface Order {
  id: string;
  customerId: string;
  status: string;
  totalAmount: string;
  currency: string;
  items: OrderItem[];
}

interface Notification {
  id: string;
  orderId: string;
  customerId: string;
  type: string;
  message: string;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`assertion failed: ${message}`);
}

async function getJson<T>(path: string): Promise<ApiEnvelope<T>> {
  const res = await fetch(`${BASE_URL}${path}`);
  const body = (await res.json()) as ApiEnvelope<T>;
  if (!res.ok || !body.success) {
    throw new Error(`GET ${path} -> ${res.status}: ${JSON.stringify(body)}`);
  }
  return body;
}

async function postJson<T>(path: string, payload: unknown): Promise<ApiEnvelope<T>> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = (await res.json()) as ApiEnvelope<T>;
  if (!res.ok || !body.success) {
    throw new Error(`POST ${path} -> ${res.status}: ${JSON.stringify(body)}`);
  }
  return body;
}

async function sleep(ms: number): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function waitForOrderStatus(orderId: string, target: readonly string[]): Promise<Order> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < MAX_WAIT_MS) {
    const res = await getJson<Order>(`/api/orders/${orderId}`);
    const order = res.data;
    if (order && target.includes(order.status)) return order;
    await sleep(POLL_INTERVAL_MS);
  }
  throw new Error(
    `order ${orderId} did not reach [${target.join(', ')}] within ${MAX_WAIT_MS}ms`,
  );
}

async function waitForNotification(orderId: string): Promise<Notification> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < MAX_WAIT_MS) {
    const res = await getJson<Notification[]>(`/api/notifications/${orderId}`);
    const first = res.data?.[0];
    if (first) return first;
    await sleep(POLL_INTERVAL_MS);
  }
  throw new Error(`no notification for order ${orderId} within ${MAX_WAIT_MS}ms`);
}

async function run(): Promise<void> {
  console.log(`E2E: QuickServe order flow @ ${BASE_URL}\n`);

  console.log('[1/5] GET /api/menu');
  const menu = await getJson<MenuItem[]>('/api/menu');
  const burger = menu.data?.find((item) => item.sku === TEST_SKU);
  assert(burger, `menu must contain sku=${TEST_SKU}`);
  console.log(
    `      ${menu.data?.length ?? 0} items; ${TEST_SKU} = "${burger.name}" @ ${burger.basePrice} ore`,
  );

  console.log('[2/5] POST /api/orders');
  const placed = await postJson<Order>('/api/orders', {
    items: [{ productId: TEST_SKU, quantity: TEST_QUANTITY }],
  });
  const order = placed.data;
  assert(order, 'response must include an order');
  assert(order.status === 'CREATED', `expected CREATED, got ${order.status}`);
  const expectedTotal = burger.basePrice * TEST_QUANTITY;
  assert(
    order.totalAmount === String(expectedTotal),
    `totalAmount expected ${expectedTotal}, got ${order.totalAmount}`,
  );
  assert(order.items.length === 1, `expected 1 line item, got ${order.items.length}`);
  console.log(`      order ${order.id} created; total ${order.totalAmount} ore`);

  console.log('[3/5] poll /api/orders/:id -> PREPARING');
  const preparing = await waitForOrderStatus(order.id, ['PREPARING', 'READY']);
  console.log(`      status = ${preparing.status}`);

  console.log('[4/5] poll /api/orders/:id -> READY');
  const ready = await waitForOrderStatus(order.id, ['READY']);
  console.log(`      status = ${ready.status}`);

  console.log('[5/5] GET /api/notifications/:id');
  const notification = await waitForNotification(order.id);
  assert(notification.orderId === order.id, 'notification.orderId must match order');
  assert(
    notification.type === 'ORDER_READY',
    `notification.type expected ORDER_READY, got ${notification.type}`,
  );
  console.log(`      ${notification.type} - "${notification.message}"`);

  console.log('\nE2E PASSED');
}

run().catch((err: unknown) => {
  console.error('\nE2E FAILED');
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});