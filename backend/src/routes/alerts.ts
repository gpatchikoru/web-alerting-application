import { Router, Request, Response } from 'express';
import { AlertService } from '../services/alertService';
import { Producer } from 'kafkajs';
import { logger } from '../utils/logger';

export function createAlertRoutes(
  alertService: AlertService,
  kafkaProducer: Producer,
  broadcast: (data: any) => void
) {
  const router = Router();

  // Get all alerts
  router.get('/', async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 10, status, severity, type } = req.query;
      const result = await alertService.getAllAlerts(
        Number(page),
        Number(limit),
        status as string,
        type as string
      );
      
      res.json({
        success: true,
        data: result.alerts,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: result.total,
          hasNext: result.alerts.length === Number(limit)
        }
      });
    } catch (error) {
      logger.error('Error fetching alerts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch alerts'
      });
    }
  });

  // Get active alerts
  router.get('/active', async (req: Request, res: Response) => {
    try {
      const alerts = await alertService.getActiveAlerts();
      
      res.json({
        success: true,
        data: alerts
      });
    } catch (error) {
      logger.error('Error fetching active alerts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch active alerts'
      });
    }
  });

  // Get single alert
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const alert = await alertService.getAlertById(id);
      
      if (!alert) {
        return res.status(404).json({
          success: false,
          error: 'Alert not found'
        });
      }
      
      res.json({
        success: true,
        data: alert
      });
    } catch (error) {
      logger.error('Error fetching alert:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch alert'
      });
    }
  });

  // Create new alert
  router.post('/', async (req: Request, res: Response) => {
    try {
      const newAlert = await alertService.createAlert(req.body);
      
      // Send Kafka event
      await kafkaProducer.send({
        topic: 'alert-events',
        messages: [{
          key: newAlert.id,
          value: JSON.stringify({
            type: 'alert_created',
            alertId: newAlert.id,
            data: newAlert,
            timestamp: new Date().toISOString()
          })
        }]
      });

      // Broadcast to WebSocket clients
      broadcast({
        type: 'alert_created',
        data: newAlert,
        timestamp: new Date().toISOString()
      });
      
      res.status(201).json({
        success: true,
        data: newAlert
      });
    } catch (error) {
      logger.error('Error creating alert:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create alert'
      });
    }
  });

  // Update alert
  router.put('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updatedAlert = await alertService.updateAlert(id, req.body);
      
      if (!updatedAlert) {
        return res.status(404).json({
          success: false,
          error: 'Alert not found'
        });
      }
      
      // Send Kafka event
      await kafkaProducer.send({
        topic: 'alert-events',
        messages: [{
          key: updatedAlert.id,
          value: JSON.stringify({
            type: 'alert_updated',
            alertId: updatedAlert.id,
            data: updatedAlert,
            timestamp: new Date().toISOString()
          })
        }]
      });

      // Broadcast to WebSocket clients
      broadcast({
        type: 'alert_updated',
        data: updatedAlert,
        timestamp: new Date().toISOString()
      });
      
      res.json({
        success: true,
        data: updatedAlert
      });
    } catch (error) {
      logger.error('Error updating alert:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update alert'
      });
    }
  });

  // Mark alert as resolved
  router.patch('/:id/resolve', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { resolvedBy = 'system' } = req.body;
      const resolvedAlert = await alertService.resolveAlert(id, resolvedBy);
      
      if (!resolvedAlert) {
        return res.status(404).json({
          success: false,
          error: 'Alert not found'
        });
      }
      
      // Send Kafka event
      await kafkaProducer.send({
        topic: 'alert-events',
        messages: [{
          key: resolvedAlert.id,
          value: JSON.stringify({
            type: 'alert_resolved',
            alertId: resolvedAlert.id,
            data: resolvedAlert,
            timestamp: new Date().toISOString()
          })
        }]
      });

      // Broadcast to WebSocket clients
      broadcast({
        type: 'alert_resolved',
        data: resolvedAlert,
        timestamp: new Date().toISOString()
      });
      
      res.json({
        success: true,
        data: resolvedAlert
      });
    } catch (error) {
      logger.error('Error resolving alert:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to resolve alert'
      });
    }
  });

  // Delete alert
  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = await alertService.deleteAlert(id);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Alert not found'
        });
      }
      
      // Send Kafka event
      await kafkaProducer.send({
        topic: 'alert-events',
        messages: [{
          key: id,
          value: JSON.stringify({
            type: 'alert_deleted',
            alertId: id,
            timestamp: new Date().toISOString()
          })
        }]
      });

      // Broadcast to WebSocket clients
      broadcast({
        type: 'alert_deleted',
        data: { id },
        timestamp: new Date().toISOString()
      });
      
      res.json({
        success: true,
        message: 'Alert deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting alert:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete alert'
      });
    }
  });

  return router;
} 