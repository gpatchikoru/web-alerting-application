import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

// Import configurations
import { connectDatabase } from './config/database';
import { createKafkaProducer, createKafkaConsumer } from './config/kafka';
import { logger } from './utils/logger';

// Import services
import { InventoryService } from './services/inventoryService';
import { AlertService } from './services/alertService';
import { AuthService } from './services/authService';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { healthCheck } from './middleware/healthCheck';
import { AuthMiddleware } from './middleware/auth';

// Import routes
import { createInventoryRoutes } from './routes/inventory';
import { createAlertRoutes } from './routes/alerts';
import { createAuthRoutes } from './routes/auth';
import { createHealthRoutes } from './routes/health';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 4000;

// Initialize WebSocket server
const wss = new WebSocketServer({ server });

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  logger.info('WebSocket client connected');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      logger.info('WebSocket message received:', data);

      // Handle different message types
      switch (data.type) {
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
          break;
        case 'subscribe':
          // Handle topic subscriptions
          ws.send(JSON.stringify({ 
            type: 'subscribed', 
            topics: data.topics,
            timestamp: new Date().toISOString() 
          }));
          break;
        case 'unsubscribe':
          // Handle topic unsubscriptions
          ws.send(JSON.stringify({ 
            type: 'unsubscribed', 
            topics: data.topics,
            timestamp: new Date().toISOString() 
          }));
          break;
        default:
          logger.warn('Unknown WebSocket message type:', data.type);
      }
    } catch (error) {
      logger.error('Error processing WebSocket message:', error);
    }
  });

  ws.on('close', () => {
    logger.info('WebSocket client disconnected');
  });

  ws.on('error', (error) => {
    logger.error('WebSocket error:', error);
  });
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.use('/health', healthCheck);

// Initialize database connection
let db: any;
let inventoryService: InventoryService;
let alertService: AlertService;
let authService: AuthService;
let authMiddleware: AuthMiddleware;

async function initializeServices() {
  try {
    // Connect to database
    db = await connectDatabase();
    logger.info('Database connected successfully');

    // Initialize services
    inventoryService = new InventoryService(db);
    alertService = new AlertService(db);
    authService = new AuthService(db);
    authMiddleware = new AuthMiddleware(authService);

    // Initialize Kafka
    const kafkaProducer = await createKafkaProducer();
    const kafkaConsumer = await createKafkaConsumer();

    // Start Kafka consumer
    await kafkaConsumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const data = JSON.parse(message.value?.toString() || '{}');
          logger.info(`Kafka message received on topic ${topic}:`, data);

          // Process different event types
          switch (data.type) {
            case 'inventory_updated':
              // Handle inventory updates
              await handleInventoryUpdate(data);
              break;
            case 'alert_created':
              // Handle new alerts
              await handleAlertCreated(data);
              break;
            default:
              logger.warn('Unknown Kafka event type:', data.type);
          }
        } catch (error) {
          logger.error('Error processing Kafka message:', error);
        }
      },
    });

    logger.info('Kafka consumer started');

    // Broadcast function for WebSocket
    const broadcast = (data: any) => {
      wss.clients.forEach((client) => {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(JSON.stringify(data));
        }
      });
    };

    // Set up routes
    app.use('/api/inventory', createInventoryRoutes(inventoryService, kafkaProducer, broadcast));
    app.use('/api/alerts', createAlertRoutes(alertService, kafkaProducer, broadcast));
    app.use('/api/auth', createAuthRoutes(authService, authMiddleware));
    app.use('/health', createHealthRoutes(db, kafkaProducer));

    // Error handling middleware (must be last)
    app.use(errorHandler);

    logger.info('All services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize services:', error);
    process.exit(1);
  }
}

// Handle inventory updates
async function handleInventoryUpdate(data: any) {
  try {
    // Check if item needs low stock alert
    const item = await inventoryService.getItemById(data.itemId);
    if (item && item.currentCount <= item.lowStockThreshold) {
      const alertData = {
        type: 'low_stock',
        severity: item.currentCount === 0 ? 'critical' : 'high',
        status: 'active',
        title: `${item.currentCount === 0 ? 'Out of Stock' : 'Low Stock Alert'}: ${item.name}`,
        message: item.currentCount === 0 
          ? `${item.name} is completely out of stock and needs immediate restocking.`
          : `${item.name} is running low on stock (${item.currentCount} ${item.unit} remaining).`,
        itemId: item.id,
        itemName: item.name,
        itemType: item.itemType,
        currentCount: item.currentCount,
        threshold: item.lowStockThreshold
      };

      const alert = await alertService.createAlert(alertData);
      
      // Broadcast alert to WebSocket clients
      wss.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({
            type: 'alert',
            data: alert,
            timestamp: new Date().toISOString()
          }));
        }
      });

      logger.info(`Created low stock alert for item: ${item.name}`);
    }
  } catch (error) {
    logger.error('Error handling inventory update:', error);
  }
}

// Handle alert creation
async function handleAlertCreated(data: any) {
  try {
    // Broadcast new alert to WebSocket clients
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({
          type: 'alert',
          data: data.alert,
          timestamp: new Date().toISOString()
        }));
      }
    });

    logger.info('Broadcasted new alert to WebSocket clients');
  } catch (error) {
    logger.error('Error handling alert creation:', error);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  // Close WebSocket server
  wss.close();
  
  // Close database connection
  if (db) {
    await db.end();
  }
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  
  // Close WebSocket server
  wss.close();
  
  // Close database connection
  if (db) {
    await db.end();
  }
  
  process.exit(0);
});

// Start server
async function startServer() {
  await initializeServices();
  
  server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Health check available at http://localhost:${PORT}/health`);
    logger.info(`WebSocket server available at ws://localhost:${PORT}/ws`);
  });
}

startServer().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
}); 