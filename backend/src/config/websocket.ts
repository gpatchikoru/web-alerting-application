import { Application } from 'express-ws';
import { logger } from '../utils/logger';

interface WebSocketClient {
  id: string;
  ws: any;
  userId?: string;
  subscriptions: string[];
}

class WebSocketService {
  private clients: Map<string, WebSocketClient> = new Map();
  private static instance: WebSocketService;

  private constructor() {}

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  public setupWebSocket(app: Application): void {
    app.ws('/ws', (ws, req) => {
      const clientId = this.generateClientId();
      const client: WebSocketClient = {
        id: clientId,
        ws,
        subscriptions: []
      };

      this.clients.set(clientId, client);
      logger.info('WebSocket client connected', { clientId });

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connection',
        clientId,
        message: 'Connected to alerting application'
      }));

      // Handle incoming messages
      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message);
          this.handleMessage(clientId, data);
        } catch (error) {
          logger.error('Error parsing WebSocket message:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format'
          }));
        }
      });

      // Handle client disconnect
      ws.on('close', () => {
        this.clients.delete(clientId);
        logger.info('WebSocket client disconnected', { clientId });
      });

      // Handle errors
      ws.on('error', (error) => {
        logger.error('WebSocket error:', error);
        this.clients.delete(clientId);
      });
    });
  }

  private handleMessage(clientId: string, data: any): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (data.type) {
      case 'subscribe':
        this.subscribeClient(clientId, data.topics);
        break;
      case 'unsubscribe':
        this.unsubscribeClient(clientId, data.topics);
        break;
      case 'ping':
        client.ws.send(JSON.stringify({ type: 'pong' }));
        break;
      default:
        logger.warn('Unknown WebSocket message type', { type: data.type, clientId });
    }
  }

  private subscribeClient(clientId: string, topics: string[]): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    topics.forEach(topic => {
      if (!client.subscriptions.includes(topic)) {
        client.subscriptions.push(topic);
      }
    });

    client.ws.send(JSON.stringify({
      type: 'subscribed',
      topics
    }));

    logger.debug('Client subscribed to topics', { clientId, topics });
  }

  private unsubscribeClient(clientId: string, topics: string[]): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    topics.forEach(topic => {
      const index = client.subscriptions.indexOf(topic);
      if (index > -1) {
        client.subscriptions.splice(index, 1);
      }
    });

    client.ws.send(JSON.stringify({
      type: 'unsubscribed',
      topics
    }));

    logger.debug('Client unsubscribed from topics', { clientId, topics });
  }

  public broadcastToTopic(topic: string, message: any): void {
    let sentCount = 0;
    
    this.clients.forEach(client => {
      if (client.subscriptions.includes(topic)) {
        try {
          client.ws.send(JSON.stringify({
            type: 'update',
            topic,
            data: message,
            timestamp: new Date().toISOString()
          }));
          sentCount++;
        } catch (error) {
          logger.error('Error sending WebSocket message:', error);
          // Remove disconnected client
          this.clients.delete(client.id);
        }
      }
    });

    logger.debug('Broadcasted message to topic', { topic, sentCount, totalClients: this.clients.size });
  }

  public sendToClient(clientId: string, message: any): boolean {
    const client = this.clients.get(clientId);
    if (!client) {
      logger.warn('Client not found for direct message', { clientId });
      return false;
    }

    try {
      client.ws.send(JSON.stringify({
        ...message,
        timestamp: new Date().toISOString()
      }));
      return true;
    } catch (error) {
      logger.error('Error sending direct WebSocket message:', error);
      this.clients.delete(clientId);
      return false;
    }
  }

  public getConnectedClients(): number {
    return this.clients.size;
  }

  public getClientSubscriptions(clientId: string): string[] {
    const client = this.clients.get(clientId);
    return client ? client.subscriptions : [];
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const wsService = WebSocketService.getInstance();

export function setupWebSocket(app: Application): void {
  wsService.setupWebSocket(app);
  logger.info('WebSocket service initialized');
} 