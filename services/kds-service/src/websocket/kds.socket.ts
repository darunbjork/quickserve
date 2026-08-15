import { Server as HTTPServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { logger } from '@quickserve/shared-utils';

interface ExtWebSocket extends WebSocket {
  isAlive: boolean;
}

export class KdsSocketServer {
  private static wss: WebSocketServer | null = null;

  public static initialize(server: HTTPServer): void {
    this.wss = new WebSocketServer({ server, path: '/ws/kds' });

    logger.info('WebSocket Server initialized at path /ws/kds');

    this.wss.on('connection', (ws: WebSocket) => {
      const extWs = ws as ExtWebSocket;
      extWs.isAlive = true;

      logger.info('New KDS Display connected via WebSocket');

      extWs.on('pong', () => {
        extWs.isAlive = true;
      });

      extWs.on('message', (data) => {
        logger.debug({ data: data.toString() }, 'Received message from KDS display client');
      });

      extWs.on('close', () => {
        logger.info('KDS Display WebSocket disconnected');
      });
    });

    const interval = setInterval(() => {
      if (!this.wss) return;
      this.wss.clients.forEach((ws) => {
        const extWs = ws as ExtWebSocket;
        if (extWs.isAlive === false) {
          return extWs.terminate();
        }
        extWs.isAlive = false;
        extWs.ping();
      });
    }, 30000);

    this.wss.on('close', () => {
      clearInterval(interval);
    });
  }

  public static broadcast(event: string, payload: Record<string, unknown>): void {
    if (!this.wss) {
      logger.warn('WebSocket Server not initialized; unable to broadcast event');
      return;
    }

    const message = JSON.stringify({ event, data: payload, timestamp: new Date().toISOString() });
    let recipientCount = 0;

    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
        recipientCount++;
      }
    });

    logger.info({ event, recipientCount }, 'Broadcasted event to connected KDS displays');
  }
}