# Oral Defense — QuickServe

Five answers, rehearsed. Each is 60–90 seconds spoken.

## 1. Architecture

nginx is the single public entry. It listens on port 80 and routes `/api/*`
to the two gateway replicas, which proxy to the four internal services —
product-service, order-service, kitchen-service (internally named
`kds-service`), and notification-service. Those services never talk to each
other over HTTP on the critical path; they publish and consume events through
RabbitMQ on a topic exchange called `quickserve.events`. Each service owns its
own PostgreSQL schema. The event envelope and every payload type live in
`@quickserve/shared-types`, so a producer and a consumer cannot drift apart
without TypeScript failing the build.

## 2. Why RabbitMQ on the order path

Placing an order must not block on the kitchen. When a customer hits
`POST /api/orders`, order-service writes the row and publishes `order.created`.
It returns 201 to the client immediately. kitchen-service consumes the event,
transitions the order, and publishes `order.ready`. notification-service
consumes that and writes a notification. If kitchen-service is down, the
message waits in the durable queue and the customer still gets their order
accepted. This is the exam brief's requirement: asynchronous internal
communication. No service calls another over HTTP on the critical path.

## 3. Traffic path for POST /api/orders

Client → nginx on port 80 → gateway on 3000 → order-service on 3003.
Order-service validates the payload, looks up prices from menu-service,
writes the order and its line items to PostgreSQL, and publishes
`order.created` to RabbitMQ. The HTTP response returns 201 with the order ID.
Asynchronously: RabbitMQ delivers `order.created` to kitchen-service, which
publishes `order.preparing` after a short timer and `order.ready` when done.
order-service subscribes to both and updates its own order status row. The
customer polls `GET /api/orders/:id` and sees the status change from CREATED
to PREPARING to READY.

## 4. Failure scenario — kitchen down

If kitchen-service is stopped, `order.created` sits in the durable
`kds.orders.queue`. RabbitMQ holds it. The order remains in state CREATED.
When kitchen-service restarts, it drains the queue and processes the backlog.
The customer polling `GET /api/orders/:id` sees "processing" the whole time —
the API never errors. The message is only acked after the kitchen has
successfully published `order.ready`, so a mid-processing crash also
redelivers rather than losing the event.

## 5. Tradeoffs and what I'd do with more time

Three honest tradeoffs. First, one PostgreSQL instance with a schema per
service instead of a database per service — correct for the exam scope, a
single point of failure in production. Second, the CI audit step is set to
`--audit-level=critical` with `continue-on-error: true` because the remaining
HIGH-severity advisory (`mysql2`, transitive under Prisma) has no fix at
Prisma 7.9 without a breaking downgrade. Third, notification-service records
notifications to a table rather than sending email — the event path is real,
the delivery provider is deferred. With more time I'd split the databases,
add a dead-letter queue with an error-service that consumes failures, and
add Redis caching to `/api/menu`.