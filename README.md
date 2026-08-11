# Quickserve — Local Development

This README documents how to run the services locally, verify the gateway proxying, and common troubleshooting steps.

Prerequisites
- Docker & Docker Compose (v2) installed
- Node.js + npm (used for local installs and builds)

Quick start (dev)
1. From the repository root run:

```bash
# build and start core services used during development
docker compose up -d --build auth-service gateway-1 gateway-2 nginx
```

2. Recreate gateways (if you change envs or proxy config):

```bash
docker compose up -d --force-recreate gateway-1 gateway-2
```

Verify proxy and OIDC discovery
- Direct auth-service (container mapped port):

```bash
curl http://localhost:3001/oauth/.well-known/openid-configuration
```

- Through gateway + nginx (public):

```bash
curl http://localhost/api/auth/.well-known/openid-configuration
```

If you receive `Cannot GET /.well-known/openid-configuration` then the gateway target needs to include the `/oauth` suffix. The repository already sets `AUTH_SERVICE_URL` to `http://auth-service:3001/oauth` in `docker-compose.yml` and the gateway reads `AUTH_SERVICE_URL` from environment to construct proxy targets.

Gateway troubleshooting
- Check gateway logs:

```bash
docker compose logs gateway-1 --tail 80
```

- Test reachability from inside a gateway container (curl may not be installed):

```bash
# uses node - available in node image; prints status and body
docker compose exec gateway-1 sh -c 'node -e "require(\"http\").get(\"http://auth-service:3001/oauth/.well-known/openid-configuration\", r => { console.log(r.statusCode); let s=\"\"; r.on(\"data\", d=> s+=d); r.on(\"end\", ()=> console.log(s)); });"'
```

Healthcheck notes
- The `auth-service` healthcheck in this repo used `wget` originally which is not installed in the `node:20-slim` / `node:20-alpine` images. This is expected and can be changed to a Node one-liner or removed for local development:

```yaml
healthcheck:
  test: ["CMD-SHELL", "node -e \"require('http').get('http://localhost:3001/health/ready', r=>{process.exit(r.statusCode===200?0:1)})\""]
```

TypeScript / tooling
- To build the monorepo:

```bash
npm run build
```

- `npm test` is configured to run `turbo run test`. If you use `turbo` in CI, ensure a `packageManager` field exists in root `package.json` (for example `npm@11`).

Notes for maintainers
- Gateway proxy paths are configured in `gateway/src/routes/proxy.ts` and read the env values validated by `gateway/src/config/index.ts`.
- `AUTH_SERVICE_URL` in compose is set to `http://auth-service:3001/oauth` so that requests to `/api/auth` are correctly proxied to `auth-service`'s `/oauth` routes.

Next steps
- Replace the gateway's JWT stub middleware with proper RS256 verification using the JWKS endpoint at `/oauth/jwks` (auth-service). If you want, I can implement the middleware using `jose` and `jwks-rsa`.

---
Generated for developers working with this workspace.
