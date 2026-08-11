# Nginx 502 Debug Note

## Issue
The health check request to `http://localhost/health/live` returned a `502 Bad Gateway` because Nginx was forwarding traffic to the gateway containers, but those containers were not actually serving the application on port `3000`.

## Root Cause
The gateway services in Docker Compose were starting a TypeScript watch process (`npm run dev --workspace=gateway`) instead of running the built application server. As a result, Nginx had no healthy upstream to connect to.

## Solution
The gateway services were updated to build and start the application properly:

- run the gateway build step
- start the compiled Node server with `npm run start --workspace=gateway`

This allowed Nginx to proxy requests successfully and the health endpoint returned `200 OK`.
