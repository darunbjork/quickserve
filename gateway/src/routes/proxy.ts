import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

export const proxyRouter = Router();

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
        [`^${path}`]: '', 
      },
      onProxyReq: (proxyReq, req: any) => {
        if (req.correlationId) {
          proxyReq.setHeader('x-correlation-id', req.correlationId);
        }
       
        if (req.user) {
          proxyReq.setHeader('x-user-id', req.user.sub);
          proxyReq.setHeader('x-user-role', req.user.role);
        }
      },
    })
  );
});