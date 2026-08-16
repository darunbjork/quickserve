import WebSocket from 'ws';

const BASE_URL = 'http://localhost';
const WS_URL = 'ws://localhost/ws/kds';

interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface OrderResponse {
  success: boolean;
  data: {
    id: string;
    customerId: string;
    status: string;
    totalAmount: number;
    items: Array<{
      id: string;
      menuItemId: string;
      name: string;
      unitPrice: number;
      quantity: number;
      subtotal: number;
    }>;
  };
}

async function runE2ETest() {
  console.log('🚀 Starting QuickServe Microservices E2E Integration Test...\n');

  try {
    console.log('1️⃣ Obtaining access token via client_credentials...');
    const tokenRes = await fetch(`${BASE_URL}/api/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from('test-client:test-secret').toString('base64'),
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        scope: 'openid',
      }),
    });

    if (!tokenRes.ok) {
      const errorText = await tokenRes.text();
      throw new Error(`Token request failed (${tokenRes.status}): ${errorText}`);
    }

    const authData = (await tokenRes.json()) as AuthResponse;
    const token = authData.access_token;
    console.log('   ✅ Access token obtained successfully.');

    console.log('\n2️⃣ Establishing WebSocket connection to KDS Service...');
    const ws = new WebSocket(WS_URL);

    const wsPromise = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('Timed out waiting for KDS WebSocket event (10s)'));
      }, 10000);

      ws.on('open', () => {
        console.log('   ✅ Connected to KDS WebSocket stream.');
      });

      ws.on('message', (rawMsg) => {
        try {
          const message = JSON.parse(rawMsg.toString());
          console.log(`   📥 KDS Received Event: ${message.event}`);

          if (message.event === 'order.created') {
            console.log(`   ✅ Order ID matches: ${message.data.orderId}`);
            clearTimeout(timeout);
            ws.close();
            resolve();
          }
        } catch (err) {
        }
      });

      ws.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    await new Promise((r) => setTimeout(r, 1000));

    console.log('\n3️⃣ Submitting new order to Order Service...');
    const orderRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        items: [
          { menuItemId: 'prod_burger_01', name: 'Classic Burger', unitPrice: 95, quantity: 2 },
          { menuItemId: 'prod_fries_01', name: 'French Fries', unitPrice: 35, quantity: 1 },
        ],
      }),
    });

    if (!orderRes.ok) {
      const errorText = await orderRes.text();
      throw new Error(`Order creation failed (${orderRes.status}): ${errorText}`);
    }

    const orderData = (await orderRes.json()) as OrderResponse;
    console.log(`   ✅ Order created with ID: ${orderData.data.id} (Total: ${orderData.data.totalAmount} SEK)`);

    console.log('\n4️⃣ Awaiting WebSocket event propagation from RabbitMQ to KDS...');
    await wsPromise;

    console.log('\n🎉 E2E INTEGRATION TEST PASSED SUCCESSFULLY!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ E2E INTEGRATION TEST FAILED:', error);
    process.exit(1);
  }
}

runE2ETest();