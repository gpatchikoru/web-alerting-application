import dotenv from 'dotenv';
import { logger } from '../utils/logger';
import { connectDatabase } from '../config/database';
import { setupKafka } from '../config/kafka';
import { AlertType, AlertSeverity, EventType, InventoryEvent } from '../../../shared-types/src';

// Load environment variables
dotenv.config();

class AlertConsumer {
  private isRunning = false;

  async start(): Promise<void> {
    try {
      logger.info('Starting Alert Consumer Service...');

      // Connect to database
      await connectDatabase();
      logger.info('Database connected');

      // Setup Kafka
      await setupKafka();
      logger.info('Kafka setup completed');

      this.isRunning = true;
      logger.info('Alert Consumer Service started successfully');

      // Keep the service running
      this.keepAlive();

    } catch (error) {
      logger.error('Failed to start Alert Consumer Service:', error);
      process.exit(1);
    }
  }

  private keepAlive(): void {
    // Send heartbeat every 30 seconds
    setInterval(() => {
      if (this.isRunning) {
        logger.debug('Alert Consumer heartbeat');
      }
    }, 30000);

    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      this.shutdown();
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      this.shutdown();
    });
  }

  private async shutdown(): Promise<void> {
    this.isRunning = false;
    logger.info('Alert Consumer Service stopped');
    process.exit(0);
  }

  async processInventoryEvent(event: InventoryEvent): Promise<void> {
    try {
      logger.info('Processing inventory event', { 
        type: event.type, 
        itemId: event.data.id,
        itemName: event.data.name 
      });

      const item = event.data;

      // Check for low stock alerts
      if (item.currentCount <= item.lowStockThreshold) {
        await this.createLowStockAlert(item);
      }

      // Check for expiry alerts (for medicines)
      if (item.itemType === 'medicine' && item.expiryDate) {
        const daysUntilExpiry = this.calculateDaysUntilExpiry(item.expiryDate);
        if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
          await this.createExpiryAlert(item, daysUntilExpiry);
        } else if (daysUntilExpiry <= 0) {
          await this.createExpiredAlert(item);
        }
      }

      // Check for out of stock
      if (item.currentCount === 0) {
        await this.createOutOfStockAlert(item);
      }

    } catch (error) {
      logger.error('Error processing inventory event:', error);
    }
  }

  private async createLowStockAlert(item: any): Promise<void> {
    const severity = item.currentCount === 0 ? AlertSeverity.CRITICAL : 
                    item.currentCount <= 2 ? AlertSeverity.HIGH : 
                    AlertSeverity.MEDIUM;

    const alert = {
      type: AlertType.LOW_STOCK,
      severity,
      status: 'active',
      title: `Low Stock Alert: ${item.name}`,
      message: `${item.name} is running low. Current count: ${item.currentCount} ${item.unit}`,
      itemId: item.id,
      itemName: item.name,
      itemType: item.itemType,
      currentCount: item.currentCount,
      threshold: item.lowStockThreshold,
      metadata: {
        unit: item.unit,
        location: item.location
      }
    };

    await this.saveAlert(alert);
    logger.info('Low stock alert created', { itemId: item.id, severity });
  }

  private async createExpiryAlert(item: any, daysUntilExpiry: number): Promise<void> {
    const severity = daysUntilExpiry <= 7 ? AlertSeverity.HIGH : 
                    daysUntilExpiry <= 14 ? AlertSeverity.MEDIUM : 
                    AlertSeverity.LOW;

    const alert = {
      type: AlertType.EXPIRY_WARNING,
      severity,
      status: 'active',
      title: `Expiry Warning: ${item.name}`,
      message: `${item.name} will expire in ${daysUntilExpiry} days`,
      itemId: item.id,
      itemName: item.name,
      itemType: item.itemType,
      expiryDate: item.expiryDate,
      metadata: {
        daysUntilExpiry,
        dosageForm: item.dosageForm,
        strength: item.strength
      }
    };

    await this.saveAlert(alert);
    logger.info('Expiry alert created', { itemId: item.id, daysUntilExpiry });
  }

  private async createExpiredAlert(item: any): Promise<void> {
    const alert = {
      type: AlertType.EXPIRED,
      severity: AlertSeverity.CRITICAL,
      status: 'active',
      title: `Expired Item: ${item.name}`,
      message: `${item.name} has expired and should be disposed of`,
      itemId: item.id,
      itemName: item.name,
      itemType: item.itemType,
      expiryDate: item.expiryDate,
      metadata: {
        dosageForm: item.dosageForm,
        strength: item.strength
      }
    };

    await this.saveAlert(alert);
    logger.info('Expired alert created', { itemId: item.id });
  }

  private async createOutOfStockAlert(item: any): Promise<void> {
    const alert = {
      type: AlertType.OUT_OF_STOCK,
      severity: AlertSeverity.CRITICAL,
      status: 'active',
      title: `Out of Stock: ${item.name}`,
      message: `${item.name} is completely out of stock`,
      itemId: item.id,
      itemName: item.name,
      itemType: item.itemType,
      currentCount: 0,
      metadata: {
        unit: item.unit,
        location: item.location
      }
    };

    await this.saveAlert(alert);
    logger.info('Out of stock alert created', { itemId: item.id });
  }

  private async saveAlert(alertData: any): Promise<void> {
    try {
      const { db } = await import('../config/database');
      
      const result = await db.query(
        `INSERT INTO alerts (
          type, severity, status, title, message, item_id, item_name, 
          item_type, current_count, threshold, expiry_date, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
          alertData.type, alertData.severity, alertData.status, alertData.title,
          alertData.message, alertData.itemId, alertData.itemName, alertData.itemType,
          alertData.currentCount, alertData.threshold, alertData.expiryDate,
          JSON.stringify(alertData.metadata)
        ]
      );

      const savedAlert = result.rows[0];
      logger.info('Alert saved to database', { alertId: savedAlert.id });

      // Send Kafka event for the new alert
      const { kafkaService } = await import('../config/kafka');
      await kafkaService.sendAlertEvent({
        id: savedAlert.id,
        type: EventType.ALERT_CREATED,
        timestamp: new Date(),
        data: savedAlert
      });

    } catch (error) {
      logger.error('Error saving alert to database:', error);
      throw error;
    }
  }

  private calculateDaysUntilExpiry(expiryDate: Date): number {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
}

// Start the consumer service
const consumer = new AlertConsumer();
consumer.start().catch((error) => {
  logger.error('Failed to start consumer:', error);
  process.exit(1);
}); 