import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

export const proxyRouter = Router();

// * WHY: Using `http-proxy-middleware` keeps the gateway thin. We map path prefixes to internal Docker DNS names.
// ! Nginx handles the public layer load balancing; this purely maps business domains to backend microservices.
const services = {
  '/api/auth': 'http://auth-service:3001',
  '/api/menu': 'http://menu-service:3002',
  '/api/orders': 'http://order-service:3003',
  '/api/kitchen': 'http://kitchen-service:3004',
  '/api/loyalty': 'http://loyalty-service:3005',
  '/api/payment': 'http://payment-service:3006',
};

Object.entries(services).forEach(([path, target]) => {
  proxyRouter.use(
    path,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: {
        [`^${path}`]: '', // Strips the /api/service prefix before hitting the internal service
      },
      onProxyReq: (proxyReq, req: any) => {
        // Ensure our generated correlation ID is passed to the internal service
        if (req.correlationId) {
          proxyReq.setHeader('x-correlation-id', req.correlationId);
        }
        // If authenticated, we could pass the user ID downstream as a header here
        // to avoid requiring downstream services to re-validate the JWT
        if (req.user) {
          proxyReq.setHeader('x-user-id', req.user.sub);
          proxyReq.setHeader('x-user-role', req.user.role);
        }
      },
    })
  );
});