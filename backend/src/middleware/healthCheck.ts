import { Request, Response } from 'express';
import { db } from '../config/database';
import { kafkaService } from '../config/kafka';
import { logger } from '../utils/logger';

export async function healthCheck(req: Request, res: Response): Promise<void> {
  const startTime = Date.now();
  
  try {
    // Check database health
    const dbHealth = await db.healthCheck();
    
    // Check Kafka health
    const kafkaHealth = await kafkaService.healthCheck();
    
    const responseTime = Date.now() - startTime;
    
    const healthStatus = {
      status: dbHealth && kafkaHealth ? 'healthy' : 'degraded',
      timestamp: new Date(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      responseTime,
      checks: {
        database: {
          status: dbHealth ? 'up' : 'down',
          responseTime: responseTime
        },
        kafka: {
          status: kafkaHealth ? 'up' : 'down',
          responseTime: responseTime
        }
      }
    };

    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json(healthStatus);
    
    logger.debug('Health check completed', { 
      status: healthStatus.status, 
      responseTime 
    });
    
  } catch (error) {
    logger.error('Health check failed:', error);
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      responseTime: Date.now() - startTime,
      error: 'Health check failed',
      checks: {
        database: { status: 'down' },
        kafka: { status: 'down' }
      }
    });
  }
}

export async function readinessCheck(req: Request, res: Response): Promise<void> {
  try {
    // Check if the application is ready to receive traffic
    const dbHealth = await db.healthCheck();
    const kafkaHealth = await kafkaService.healthCheck();
    
    if (dbHealth && kafkaHealth) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date()
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date(),
        checks: {
          database: dbHealth ? 'ready' : 'not ready',
          kafka: kafkaHealth ? 'ready' : 'not ready'
        }
      });
    }
  } catch (error) {
    logger.error('Readiness check failed:', error);
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date(),
      error: 'Readiness check failed'
    });
  }
} 