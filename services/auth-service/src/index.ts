import express from 'express';
import { config } from './config/index.js';
import { logger } from '@quickserve/shared-utils';
import { createOidcProvider } from './oidc/provider.js';
import { createInteractionRouter } from './routes/interactions.js';
import { userRouter } from './routes/users.js';

const app = express();
app.use(express.json());

// Health check routes
app.get('/health/live', (_req, res) => res.status(200).send('OK'));
app.get('/health/ready', (_req, res) => res.status(200).send('OK'));

// User management REST API
app.use('/api/users', userRouter);

// Initialize OIDC Provider instance
const oidcProvider = createOidcProvider();

// Interaction routes for authentication/consent flows
app.use('/oauth/interaction', createInteractionRouter(oidcProvider));

// WHY: Mount oidc-provider middleware at /oauth.
// Handles /.well-known/openid-configuration, /.well-known/jwks.json, /oauth/token, /oauth/auth
app.use('/oauth', oidcProvider.callback());

const server = app.listen(config.PORT, () => {
  logger.info(`Auth Service running on port ${config.PORT}`);
});

const shutdown = () => {
  logger.info('SIGTERM received: shutting down Auth Service');
  server.close(() => {
    logger.info('Auth Service closed');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);