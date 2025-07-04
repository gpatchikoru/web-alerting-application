import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { Producer } from 'kafkajs';
import { logger } from '../utils/logger';

export function createHealthRoutes(db: Pool, kafkaProducer: Producer) {
  const router = Router();

  // Basic health check
  router.get('/', async (req: Request, res: Response) => {
    try {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0'
      };

      res.json({
        success: true,
        data: health
      });
    } catch (error) {
      logger.error('Health check error:', error);
      res.status(500).json({
        success: false,
        error: 'Health check failed'
      });
    }
  });

  // Detailed health check with database and Kafka
  router.get('/detailed', async (req: Request, res: Response) => {
    try {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
        services: {
          database: 'unknown',
          kafka: 'unknown'
        }
      };

      // Check database connection
      try {
        await db.query('SELECT 1');
        health.services.database = 'healthy';
      } catch (error) {
        health.services.database = 'unhealthy';
        health.status = 'degraded';
        logger.error('Database health check failed:', error);
      }

      // Check Kafka connection
      try {
        await kafkaProducer.send({
          topic: 'health-check',
          messages: [{
            key: 'health-check',
            value: JSON.stringify({
              timestamp: new Date().toISOString(),
              service: 'backend-api'
            })
          }]
        });
        health.services.kafka = 'healthy';
      } catch (error) {
        health.services.kafka = 'unhealthy';
        health.status = 'degraded';
        logger.error('Kafka health check failed:', error);
      }

      const statusCode = health.status === 'healthy' ? 200 : 503;

      res.status(statusCode).json({
        success: health.status === 'healthy',
        data: health
      });
    } catch (error) {
      logger.error('Detailed health check error:', error);
      res.status(500).json({
        success: false,
        error: 'Health check failed'
      });
    }
  });

  // Database health check
  router.get('/database', async (req: Request, res: Response) => {
    try {
      const startTime = Date.now();
      await db.query('SELECT 1');
      const responseTime = Date.now() - startTime;

      res.json({
        success: true,
        data: {
          status: 'healthy',
          responseTime: `${responseTime}ms`,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Database health check failed:', error);
      res.status(503).json({
        success: false,
        error: 'Database connection failed',
        data: {
          status: 'unhealthy',
          timestamp: new Date().toISOString()
        }
      });
    }
  });

  // Kafka health check
  router.get('/kafka', async (req: Request, res: Response) => {
    try {
      const startTime = Date.now();
      await kafkaProducer.send({
        topic: 'health-check',
        messages: [{
          key: 'health-check',
          value: JSON.stringify({
            timestamp: new Date().toISOString(),
            service: 'backend-api'
          })
        }]
      });
      const responseTime = Date.now() - startTime;

      res.json({
        success: true,
        data: {
          status: 'healthy',
          responseTime: `${responseTime}ms`,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Kafka health check failed:', error);
      res.status(503).json({
        success: false,
        error: 'Kafka connection failed',
        data: {
          status: 'unhealthy',
          timestamp: new Date().toISOString()
        }
      });
    }
  });

  return router;
} 