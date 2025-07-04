import { Router, Request, Response } from 'express';
import { InventoryService } from '../services/inventoryService';
import { Producer } from 'kafkajs';
import { logger } from '../utils/logger';

export function createInventoryRoutes(
  inventoryService: InventoryService,
  kafkaProducer: Producer,
  broadcast: (data: any) => void
) {
  const router = Router();

  // Get all inventory items
  router.get('/', async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 10, type, category } = req.query;
      const result = await inventoryService.getAllItems(
        Number(page),
        Number(limit),
        type as string,
        category as string
      );
      
      res.json({
        success: true,
        data: result.items,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: result.total,
          hasNext: result.items.length === Number(limit)
        }
      });
    } catch (error) {
      logger.error('Error fetching inventory items:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch inventory items'
      });
    }
  });

  // Get medicines only
  router.get('/medicines', async (req: Request, res: Response) => {
    try {
      const result = await inventoryService.getMedicines();
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error fetching medicines:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch medicines'
      });
    }
  });

  // Get kitchen items only
  router.get('/kitchen', async (req: Request, res: Response) => {
    try {
      const result = await inventoryService.getKitchenItems();
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error fetching kitchen items:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch kitchen items'
      });
    }
  });

  // Get single inventory item
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const item = await inventoryService.getItemById(id);
      
      if (!item) {
        return res.status(404).json({
          success: false,
          error: 'Inventory item not found'
        });
      }
      
      res.json({
        success: true,
        data: item
      });
    } catch (error) {
      logger.error('Error fetching inventory item:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch inventory item'
      });
    }
  });

  // Create new inventory item
  router.post('/', async (req: Request, res: Response) => {
    try {
      const newItem = await inventoryService.createItem(req.body);
      
      // Send Kafka event
      await kafkaProducer.send({
        topic: 'inventory-events',
        messages: [{
          key: newItem.id,
          value: JSON.stringify({
            type: 'inventory_created',
            itemId: newItem.id,
            data: newItem,
            timestamp: new Date().toISOString()
          })
        }]
      });

      // Broadcast to WebSocket clients
      broadcast({
        type: 'inventory_created',
        data: newItem,
        timestamp: new Date().toISOString()
      });
      
      res.status(201).json({
        success: true,
        data: newItem
      });
    } catch (error) {
      logger.error('Error creating inventory item:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create inventory item'
      });
    }
  });

  // Update inventory item
  router.put('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updatedItem = await inventoryService.updateItem(id, req.body);
      
      if (!updatedItem) {
        return res.status(404).json({
          success: false,
          error: 'Inventory item not found'
        });
      }
      
      // Send Kafka event
      await kafkaProducer.send({
        topic: 'inventory-events',
        messages: [{
          key: updatedItem.id,
          value: JSON.stringify({
            type: 'inventory_updated',
            itemId: updatedItem.id,
            data: updatedItem,
            timestamp: new Date().toISOString()
          })
        }]
      });

      // Broadcast to WebSocket clients
      broadcast({
        type: 'inventory_updated',
        data: updatedItem,
        timestamp: new Date().toISOString()
      });
      
      res.json({
        success: true,
        data: updatedItem
      });
    } catch (error) {
      logger.error('Error updating inventory item:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update inventory item'
      });
    }
  });

  // Delete inventory item
  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = await inventoryService.deleteItem(id);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Inventory item not found'
        });
      }
      
      // Send Kafka event
      await kafkaProducer.send({
        topic: 'inventory-events',
        messages: [{
          key: id,
          value: JSON.stringify({
            type: 'inventory_deleted',
            itemId: id,
            timestamp: new Date().toISOString()
          })
        }]
      });

      // Broadcast to WebSocket clients
      broadcast({
        type: 'inventory_deleted',
        data: { id },
        timestamp: new Date().toISOString()
      });
      
      res.json({
        success: true,
        message: 'Inventory item deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting inventory item:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete inventory item'
      });
    }
  });

  return router;
} 