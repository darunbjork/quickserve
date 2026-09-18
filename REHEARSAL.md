# Pre-exam rehearsal

## T-minus 90 minutes

- `docker compose up -d --build` from a clean clone — confirm it works
- `curl http://localhost/api/health` returns ok
- `curl http://localhost/api/menu` returns items
- Open http://localhost/ and http://localhost/kitchen in a browser
- RabbitMQ management UI at http://localhost:15672 (guest/guest or your creds)
- `DEFENSE.md` open on a second screen

## Demo script — 3 minutes

1. Show `docker compose ps` — all services up, web-build exited 0.
2. Show `curl http://localhost/api/menu` — menu items.
3. Open http://localhost/ — the customer page loads the menu.
4. Add two items, click Place order — the order card appears with CREATED.
5. Tab to http://localhost/kitchen — the order shows in the queue.
6. Click Mark ready — the card disappears from the kitchen queue.
7. Tab back to / — status is READY with the pickup message.
8. Show `curl http://localhost/api/notifications/:orderId` — one record.
9. Open RabbitMQ management UI — show the `quickserve.events` exchange.

## Oral defense — 10–15 min

Read from `DEFENSE.md`. Five sections, 60–90 seconds each. Do not improvise
the first sentence of each; do improvise the follow-ups.

## If something is broken

- **Backend down:** `docker compose restart gateway-1 gateway-2 nginx`
- **Frontend blank at `/`:** `docker compose up -d --build web-build && docker compose restart nginx`
- **Kitchen queue empty after placing order:** `docker compose logs --tail=30 kds-service`. If no `received domain event` line, the queue binding is stale — `docker compose exec rabbitmq rabbitmqctl purge_queue kds.orders.queue && docker compose restart kds-service`
- **All else fails:** run the local E2E script. If that passes, the backend is fine and the issue is browser-side.
