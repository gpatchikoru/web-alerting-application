import { Kafka, Producer, Consumer } from 'kafkajs';
import { logger } from '../utils/logger';
import { KafkaEvent, InventoryEvent, AlertEvent } from '../types';

class KafkaService {
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;
  private static instance: KafkaService;

  private constructor() {
    this.kafka = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID || 'alerting-app',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });

    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({ 
      groupId: process.env.KAFKA_GROUP_ID || 'alerting-consumer-group' 
    });
  }

  public static getInstance(): KafkaService {
    if (!KafkaService.instance) {
      KafkaService.instance = new KafkaService();
    }
    return KafkaService.instance;
  }

  public async connect(): Promise<void> {
    try {
      await this.producer.connect();
      await this.consumer.connect();
      logger.info('Kafka producer and consumer connected');
    } catch (error) {
      logger.error('Failed to connect to Kafka:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.producer.disconnect();
      await this.consumer.disconnect();
      logger.info('Kafka producer and consumer disconnected');
    } catch (error) {
      logger.error('Failed to disconnect from Kafka:', error);
      throw error;
    }
  }

  public async sendMessage(topic: string, message: KafkaEvent): Promise<void> {
    try {
      await this.producer.send({
        topic,
        messages: [
          {
            key: message.id,
            value: JSON.stringify(message),
            timestamp: Date.now().toString()
          }
        ]
      });
      logger.debug('Message sent to Kafka', { topic, messageId: message.id });
    } catch (error) {
      logger.error('Failed to send message to Kafka:', error);
      throw error;
    }
  }

  public async subscribeToTopic(
    topic: string, 
    handler: (message: any) => Promise<void>
  ): Promise<void> {
    try {
      await this.consumer.subscribe({ topic, fromBeginning: false });
      
      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            logger.debug('Received Kafka message', { topic, partition, offset: message.offset });
            await handler(message);
          } catch (error) {
            logger.error('Error processing Kafka message:', error);
          }
        }
      });

      logger.info(`Subscribed to Kafka topic: ${topic}`);
    } catch (error) {
      logger.error(`Failed to subscribe to Kafka topic ${topic}:`, error);
      throw error;
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      // Try to connect and send a test message
      await this.producer.send({
        topic: 'health-check',
        messages: [{ key: 'health', value: 'ping' }]
      });
      return true;
    } catch (error) {
      logger.error('Kafka health check failed:', error);
      return false;
    }
  }

  // Convenience methods for specific event types
  public async sendInventoryEvent(event: InventoryEvent): Promise<void> {
    const topic = process.env.KAFKA_TOPIC_INVENTORY_UPDATE || 'inventory-updates';
    await this.sendMessage(topic, event);
  }

  public async sendAlertEvent(event: AlertEvent): Promise<void> {
    const topic = process.env.KAFKA_TOPIC_ALERTS || 'alerts';
    await this.sendMessage(topic, event);
  }

  public async sendAuditLog(event: KafkaEvent): Promise<void> {
    const topic = process.env.KAFKA_TOPIC_AUDIT_LOGS || 'audit-logs';
    await this.sendMessage(topic, event);
  }
}

export const kafkaService = KafkaService.getInstance();

export async function setupKafka(): Promise<void> {
  try {
    await kafkaService.connect();
    
    // Subscribe to inventory updates for alert processing
    const inventoryTopic = process.env.KAFKA_TOPIC_INVENTORY_UPDATE || 'inventory-updates';
    await kafkaService.subscribeToTopic(inventoryTopic, async (message) => {
      try {
        const event: InventoryEvent = JSON.parse(message.value?.toString() || '{}');
        logger.info('Processing inventory event', { eventType: event.type, itemId: event.data.id });
        
        // Process the inventory event (this will be handled by the alert consumer service)
        // For now, we just log it
        await processInventoryEvent(event);
      } catch (error) {
        logger.error('Error processing inventory event:', error);
      }
    });

    logger.info('Kafka setup completed successfully');
  } catch (error) {
    logger.error('Failed to setup Kafka:', error);
    throw error;
  }
}

async function processInventoryEvent(event: InventoryEvent): Promise<void> {
  // This function will be implemented to process inventory events
  // and generate alerts when needed
  logger.debug('Processing inventory event', { 
    type: event.type, 
    itemId: event.data.id,
    itemName: event.data.name 
  });
}

// Kafka client configuration
const kafka = new Kafka({
  clientId: 'web-alerting-app',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  retry: {
    initialRetryTime: 100,
    retries: 8
  }
});

// Create Kafka producer
export async function createKafkaProducer(): Promise<Producer> {
  try {
    const producer = kafka.producer();
    await producer.connect();
    logger.info('Kafka producer connected successfully');
    return producer;
  } catch (error) {
    logger.error('Failed to create Kafka producer:', error);
    throw error;
  }
}

// Create Kafka consumer
export async function createKafkaConsumer(): Promise<Consumer> {
  try {
    const consumer = kafka.consumer({ 
      groupId: 'web-alerting-consumer-group',
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
      rebalanceTimeout: 60000
    });
    
    await consumer.connect();
    logger.info('Kafka consumer connected successfully');
    return consumer;
  } catch (error) {
    logger.error('Failed to create Kafka consumer:', error);
    throw error;
  }
}

// Send inventory event to Kafka
export async function sendInventoryEvent(producer: Producer, event: any): Promise<void> {
  try {
    await producer.send({
      topic: process.env.KAFKA_TOPIC_INVENTORY_UPDATE || 'inventory-updates',
      messages: [
        {
          key: event.id,
          value: JSON.stringify(event)
        }
      ]
    });
    logger.debug('Inventory event sent to Kafka', { eventId: event.id });
  } catch (error) {
    logger.error('Failed to send inventory event to Kafka:', error);
    throw error;
  }
}

// Send alert event to Kafka
export async function sendAlertEvent(producer: Producer, event: any): Promise<void> {
  try {
    await producer.send({
      topic: process.env.KAFKA_TOPIC_ALERTS || 'alerts',
      messages: [
        {
          key: event.id,
          value: JSON.stringify(event)
        }
      ]
    });
    logger.debug('Alert event sent to Kafka', { eventId: event.id });
  } catch (error) {
    logger.error('Failed to send alert event to Kafka:', error);
    throw error;
  }
}

// Disconnect Kafka connections
export async function disconnectKafka(producer?: Producer, consumer?: Consumer): Promise<void> {
  try {
    if (producer) {
      await producer.disconnect();
      logger.info('Kafka producer disconnected');
    }
    if (consumer) {
      await consumer.disconnect();
      logger.info('Kafka consumer disconnected');
    }
  } catch (error) {
    logger.error('Failed to disconnect Kafka:', error);
    throw error;
  }
} 