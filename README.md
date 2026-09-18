# QuickServe — Fast-Food Order System (Chas Academy exam)

Distributed, event-driven fast-food ordering system. Demo runs from a cold
clone in one command.

## Start

    docker compose up -d --build

Then wait ~30 seconds and open http://localhost/.

- **Customer page:** http://localhost/ — browse menu, place order, watch status
- **Kitchen board:** http://localhost/kitchen — order queue, mark ready
- **API root:** http://localhost/api/health

Stop and reset all data:

    docker compose down -v

## Public entry

Everything goes through **nginx on port 80**. API surface lives under `/api/`.
The frontend SPA is served by the same nginx at `/` and `/kitchen`.

## Flow

1. Customer places an order at `/`. Frontend POSTs to `/api/orders`.
2. order-service persists the order and publishes `order.created` to RabbitMQ.
3. kitchen-service consumes the event, transitions CREATED → PREPARING → READY.
4. notification-service consumes `order.ready` and records the customer notice.
5. Customer polls `/api/orders/:id` and sees status change.

No service calls another over HTTP on the critical path.

## Services

| Service | Role | Internal port |
|---|---|---|
| `product-service` | Products + menu | 3002 |
| `order-service` | Place + query orders | 3003 |
| `kitchen-service` | Consumes `order.created`, publishes `order.ready` | 3004 |
| `notification-service` | Consumes `order.ready`, records notice | 3007 |
| `gateway-1`, `gateway-2` | HTTP proxy, JWT, rate limiting | 3000 |
| `web` | Vite + React 19 customer + kitchen UI | (built) |
| `nginx` | Public entry, static + proxy | 80 |
| `postgres`, `rabbitmq` | Infra | 5432 / 5672 |

Auth, loyalty, and payment services exist but are opt-in:
`docker compose --profile full up -d`. They are not on the demo path.

## Tests

**Unit:** order state machine (15 cases).
**E2E:** full happy path — place order → CREATED → PREPARING → READY → notification.

    pnpm turbo test
    npx ts-node --compiler-options '{"module":"CommonJS","moduleResolution":"Node"}' scripts/e2e-test.ts

Both run automatically on every push to `main` via GitHub Actions.

## What’s in scope

Event-driven order flow, kitchen state machine, notifications, single-command
startup, automated tests in CI. Payment, refund, and cancellation are
explicit non-goals for this exam.