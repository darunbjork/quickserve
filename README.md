```markdown
# Quickserve — Local Development

This README documents how to run the entire microservices platform locally, verify the system end‑to‑end, and troubleshoot common issues encountered during setup.

---

## Prerequisites

- Docker & Docker Compose (v2) installed
- Node.js 20+ and npm (for local builds and the E2E test)
- PostgreSQL client tools (optional, for manual DB inspection)

---

## Quick Start (Full Stack)

1. **Clone the repository** and navigate to the root:

```bash
cd quickserve
```

2. **Install dependencies** (monorepo root):

```bash
npm install
```

3. **Build and start all services** (this builds the `auth-service` image and starts all containers):

```bash
docker compose up -d --build
```

Wait for all containers to become healthy (you can monitor with `docker compose ps`).

4. **Run database migrations** for each service that uses a database:

```bash
# Auth service
docker compose exec auth-service sh -c "cd services/auth-service && npx prisma migrate dev --name init"

# Order service
docker compose exec order-service sh -c "cd services/order-service && npx prisma migrate dev --name init"
```

5. **Seed the test OAuth client** (required for the E2E test and client_credentials grant):

```bash
docker compose exec auth-db psql -U postgres -d auth_db -c "
INSERT INTO oidc_models (id, type, payload, \"createdAt\", \"updatedAt\")
VALUES (
  'test-client',
  'Client',
  '{\"client_id\":\"test-client\",\"client_secret\":\"test-secret\",\"grant_types\":[\"client_credentials\"],\"response_types\":[],\"redirect_uris\":[],\"token_endpoint_auth_method\":\"client_secret_basic\"}',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;
"
```

6. **Run the end‑to‑end integration test** to verify the full asynchronous flow:

```bash
npx ts-node scripts/e2e-test.ts
```

**Expected output**:

```
🚀 Starting QuickServe Microservices E2E Integration Test...

1️⃣ Obtaining access token via client_credentials...
   ✅ Access token obtained successfully.

2️⃣ Establishing WebSocket connection to KDS Service...
   ✅ Connected to KDS WebSocket stream.

3️⃣ Submitting new order to Order Service...
   ✅ Order created with ID: ... (Total: 225 SEK)

4️⃣ Awaiting WebSocket event propagation from RabbitMQ to KDS...
   📥 KDS Received Event: order.created
   ✅ Order ID matches: ...

🎉 E2E INTEGRATION TEST PASSED SUCCESSFULLY!
```

If the test passes, your system is fully functional.

---

## Service Endpoints

| Service              | Internal URL                       | Public URL (via Nginx)            |
|----------------------|------------------------------------|-----------------------------------|
| Auth Service (OIDC)  | `http://auth-service:3001/oauth`   | `http://localhost/api/auth`      |
| Order Service        | `http://order-service:3003`        | `http://localhost/api/orders`    |
| KDS WebSocket        | `ws://kds-service:3004/ws/kds`     | `ws://localhost/ws/kds`          |
| Nginx (public edge)  | N/A                                | `http://localhost`               |

- **OIDC discovery**: `http://localhost/api/auth/.well-known/openid-configuration`
- **JWKS endpoint**: `http://localhost/api/auth/jwks` (or `http://localhost:3001/oauth/jwks` directly)

---

## Troubleshooting Common Issues

### 1. Order‑service fails to start with `Cannot find module '/usr/src/app/services/order-service/dist/index.js'`

**Cause:** The compiled output is in `dist/src/index.js` (because `tsconfig.json` sets `rootDir: "./src"`).  
**Fix:** In `services/order-service/package.json`, change the `start` script from `"node dist/index.js"` to `"node dist/src/index.js"`. Then restart the service.

```bash
docker compose restart order-service
```

---

### 2. TypeScript errors in order‑service: `Module '@prisma/client' has no exported member 'OrderStatus'`

**Cause:** The build script runs `tsc` before `prisma generate`.  
**Fix:** In `services/order-service/package.json`, change the `build` script to:

```json
"build": "prisma generate && tsc"
```

Then restart the service.

---

### 3. Token endpoint returns `invalid_client_metadata` for `client_credentials`

**Cause:** The `clientCredentials` feature is not enabled in `provider.ts`, or the client is not seeded.  
**Fix:**
- Enable `clientCredentials: { enabled: true }` in the `features` block of `services/auth-service/src/oidc/provider.ts`.
- Rebuild and restart `auth-service`:

```bash
docker compose build auth-service
docker compose up -d auth-service
```

- Seed the `test-client` into the `oidc_models` table (as shown in step 5 above).

---

### 4. E2E test fails with 504 Gateway Timeout on order creation

**Cause:** The gateway cannot reach `order-service` (service not running or misconfigured).  
**Fix:** Verify that `order-service` is running and healthy:

```bash
docker compose ps order-service
docker compose logs order-service --tail 20
```

If the `start` script path is wrong, fix it as described in issue #1.  
Also ensure the gateway’s `ORDER_SERVICE_URL` environment variable points to `http://order-service:3003` (default).

---

### 5. WebSocket connection to KDS returns 404

**Cause:** Nginx not configured to proxy WebSocket upgrade requests.  
**Fix:** Ensure `nginx/conf.d/quickserve.conf` contains the following location block:

```nginx
location /ws/kds {
    proxy_pass http://quickserve-kds:3004;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "Upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_read_timeout 86400s;
}
```

Then restart Nginx:

```bash
docker compose restart nginx
```

---

### 6. Prisma migrations fail with `The datasource.url property is required`

**Cause:** Prisma 7 expects the connection URL to be provided via a `prisma.config.ts` file, not in the schema.  
**Fix:** Ensure each service has a valid `prisma.config.ts` that exports the `url` from `process.env`, and that the environment variable is correctly set in `docker-compose.yml`.

---

### 7. Healthchecks for auth‑service fail because `wget` is not installed

**Solution:** Replace the healthcheck in `docker-compose.yml` with a Node.js one‑liner:

```yaml
test: ["CMD-SHELL", "node -e \"fetch('http://localhost:3001/health/ready').then(r => r.ok ? process.exit(0) : process.exit(1))\""]
```

---

### 8. Gateway JWT verification fails with `invalid signature`

**Cause:** The JWKS endpoint is not reachable or the issuer (`iss`) claim doesn't match `JWT_ISSUER`.  
**Fix:**
- Ensure `JWKS_URI` in `gateway` environment points to `http://auth-service:3001/oauth/jwks`.
- Ensure `JWT_ISSUER` matches the issuer in the token (which is `http://localhost:3001/oauth` in development).

---

## Development Workflow

- **Build the monorepo**:

```bash
npm run build
```

- **Run a single service in watch mode** (e.g., `gateway`):

```bash
npm run dev --workspace=gateway
```

- **Run the E2E test** (after starting the stack):

```bash
npx ts-node scripts/e2e-test.ts
```

- **View logs** of a specific container:

```bash
docker compose logs <service-name> --tail 50
```

---

## Cleanup

To stop all containers and remove volumes (including database data):

```bash
docker compose down -v
```

To also remove installed node_modules, run:

```bash
rm -rf node_modules packages/*/node_modules services/*/node_modules
rm -rf package-lock.json packages/*/package-lock.json services/*/package-lock.json
```

Then reinstall with `npm install`.

---

## Contributing & Next Steps

- **Production readiness**: Replace development JWKS with proper RSA keys, enable TLS, and set up monitoring.
- **Missing services**: The platform currently includes `auth`, `order`, and `kds` services. Future steps can add `menu`, `kitchen`, `loyalty`, `payment`, and `notification` services.
- **Outbox pattern**: For production, implement an outbox table to guarantee event delivery.

For any questions or issues not covered here, refer to the logs and the architectural decision records in `ARCHITECTURE.md`.

---

**Generated for developers working with the QuickServe monorepo.**