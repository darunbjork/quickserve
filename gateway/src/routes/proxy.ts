import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { config } from '../config';
import { authenticateJwt } from '../middleware/auth'; 

export const proxyRouter = Router();

proxyRouter.use(
  '/api/auth',
  createProxyMiddleware({
    target: config.AUTH_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/auth': '/oauth' },
    logLevel: 'debug',
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

proxyRouter.use(
  '/api/users',
  createProxyMiddleware({
    target: config.AUTH_SERVICE_URL,
    changeOrigin: true,
    logLevel: 'debug',
    onProxyReq: (proxyReq, req: any) => {
      if (req.correlationId) {
        proxyReq.setHeader('x-correlation-id', req.correlationId);
      }
    },
  })
);

proxyRouter.use(
  '/api/orders',
  authenticateJwt,
  createProxyMiddleware({
    target: config.ORDER_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/orders': '' },
    onProxyReq: (proxyReq, req: any) => {
      if (req.correlationId) {
        proxyReq.setHeader('x-correlation-id', req.correlationId);
      }
      if (req.headers['x-user-id']) {
        proxyReq.setHeader('x-user-id', req.headers['x-user-id']);
        proxyReq.setHeader('x-user-role', req.headers['x-user-role']);
      }
    },
  })
);

const services = {
  '/api/menu': config.MENU_SERVICE_URL,
  '/api/kitchen': config.KITCHEN_SERVICE_URL,
  '/api/loyalty': config.LOYALTY_SERVICE_URL,
  '/api/payment': config.PAYMENT_SERVICE_URL,
};

Object.entries(services).forEach(([path, target]) => {
  proxyRouter.use(
    path,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: { [`^${path}`]: '' },
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