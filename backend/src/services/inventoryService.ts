import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { InventoryItem, CreateInventoryItemRequest, UpdateInventoryItemRequest } from '../../../shared-types';

export class InventoryService {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  async getAllItems(page: number = 1, limit: number = 50, type?: string, category?: string): Promise<{ items: InventoryItem[], total: number }> {
    try {
      let query = 'SELECT * FROM inventory_items WHERE 1=1';
      const params: any[] = [];
      let paramCount = 0;

      if (type) {
        paramCount++;
        query += ` AND item_type = $${paramCount}`;
        params.push(type);
      }

      if (category) {
        paramCount++;
        query += ` AND category = $${paramCount}`;
        params.push(category);
      }

      // Get total count
      const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
      const countResult = await this.db.query(countQuery, params);
      const total = parseInt(countResult.rows[0].count);

      // Get paginated results
      paramCount++;
      query += ` ORDER BY created_at DESC LIMIT $${paramCount}`;
      params.push(limit);

      paramCount++;
      query += ` OFFSET $${paramCount}`;
      params.push((page - 1) * limit);

      const result = await this.db.query(query, params);
      const items = result.rows.map(this.mapRowToInventoryItem);

      return { items, total };
    } catch (error) {
      logger.error('Error getting all inventory items:', error);
      throw new Error('Failed to get inventory items');
    }
  }

  async getItemById(id: string): Promise<InventoryItem | null> {
    try {
      const result = await this.db.query(
        'SELECT * FROM inventory_items WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToInventoryItem(result.rows[0]);
    } catch (error) {
      logger.error('Error getting inventory item by ID:', error);
      throw new Error('Failed to get inventory item');
    }
  }

  async getMedicines(): Promise<InventoryItem[]> {
    try {
      const result = await this.db.query(
        'SELECT * FROM inventory_items WHERE item_type = $1 ORDER BY created_at DESC',
        ['medicine']
      );

      return result.rows.map(this.mapRowToInventoryItem);
    } catch (error) {
      logger.error('Error getting medicines:', error);
      throw new Error('Failed to get medicines');
    }
  }

  async getKitchenItems(): Promise<InventoryItem[]> {
    try {
      const result = await this.db.query(
        'SELECT * FROM inventory_items WHERE item_type = $1 ORDER BY created_at DESC',
        ['kitchen']
      );

      return result.rows.map(this.mapRowToInventoryItem);
    } catch (error) {
      logger.error('Error getting kitchen items:', error);
      throw new Error('Failed to get kitchen items');
    }
  }

  async createItem(data: CreateInventoryItemRequest): Promise<InventoryItem> {
    try {
      const id = uuidv4();
      const now = new Date().toISOString();

      const result = await this.db.query(
        `INSERT INTO inventory_items (
          id, name, description, current_count, low_stock_threshold, 
          item_type, category, unit, location, notes, dosage_form, 
          strength, expiry_date, manufacturer, prescription_required, 
          side_effects, instructions, brand, nutritional_info, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21) 
        RETURNING *`,
        [
          id, data.name, data.description, data.currentCount, data.lowStockThreshold,
          data.itemType, data.category, data.unit, data.location, data.notes,
          data.dosageForm, data.strength, data.expiryDate, data.manufacturer,
          data.prescriptionRequired, data.sideEffects, data.instructions, data.brand,
          data.nutritionalInfo, now, now
        ]
      );

      const item = this.mapRowToInventoryItem(result.rows[0]);
      logger.info(`Created inventory item: ${item.name} (${item.id})`);
      
      return item;
    } catch (error) {
      logger.error('Error creating inventory item:', error);
      throw new Error('Failed to create inventory item');
    }
  }

  async updateItem(id: string, data: UpdateInventoryItemRequest): Promise<InventoryItem | null> {
    try {
      const now = new Date().toISOString();
      
      // Build dynamic update query
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramCount = 0;

      if (data.name !== undefined) {
        paramCount++;
        updateFields.push(`name = $${paramCount}`);
        values.push(data.name);
      }

      if (data.description !== undefined) {
        paramCount++;
        updateFields.push(`description = $${paramCount}`);
        values.push(data.description);
      }

      if (data.currentCount !== undefined) {
        paramCount++;
        updateFields.push(`current_count = $${paramCount}`);
        values.push(data.currentCount);
      }

      if (data.lowStockThreshold !== undefined) {
        paramCount++;
        updateFields.push(`low_stock_threshold = $${paramCount}`);
        values.push(data.lowStockThreshold);
      }

      if (data.itemType !== undefined) {
        paramCount++;
        updateFields.push(`item_type = $${paramCount}`);
        values.push(data.itemType);
      }

      if (data.category !== undefined) {
        paramCount++;
        updateFields.push(`category = $${paramCount}`);
        values.push(data.category);
      }

      if (data.unit !== undefined) {
        paramCount++;
        updateFields.push(`unit = $${paramCount}`);
        values.push(data.unit);
      }

      if (data.location !== undefined) {
        paramCount++;
        updateFields.push(`location = $${paramCount}`);
        values.push(data.location);
      }

      if (data.notes !== undefined) {
        paramCount++;
        updateFields.push(`notes = $${paramCount}`);
        values.push(data.notes);
      }

      if (data.dosageForm !== undefined) {
        paramCount++;
        updateFields.push(`dosage_form = $${paramCount}`);
        values.push(data.dosageForm);
      }

      if (data.strength !== undefined) {
        paramCount++;
        updateFields.push(`strength = $${paramCount}`);
        values.push(data.strength);
      }

      if (data.expiryDate !== undefined) {
        paramCount++;
        updateFields.push(`expiry_date = $${paramCount}`);
        values.push(data.expiryDate);
      }

      if (data.manufacturer !== undefined) {
        paramCount++;
        updateFields.push(`manufacturer = $${paramCount}`);
        values.push(data.manufacturer);
      }

      if (data.prescriptionRequired !== undefined) {
        paramCount++;
        updateFields.push(`prescription_required = $${paramCount}`);
        values.push(data.prescriptionRequired);
      }

      if (data.sideEffects !== undefined) {
        paramCount++;
        updateFields.push(`side_effects = $${paramCount}`);
        values.push(data.sideEffects);
      }

      if (data.instructions !== undefined) {
        paramCount++;
        updateFields.push(`instructions = $${paramCount}`);
        values.push(data.instructions);
      }

      if (data.brand !== undefined) {
        paramCount++;
        updateFields.push(`brand = $${paramCount}`);
        values.push(data.brand);
      }

      if (data.nutritionalInfo !== undefined) {
        paramCount++;
        updateFields.push(`nutritional_info = $${paramCount}`);
        values.push(data.nutritionalInfo);
      }

      // Add updated_at
      paramCount++;
      updateFields.push(`updated_at = $${paramCount}`);
      values.push(now);

      // Add id parameter
      paramCount++;
      values.push(id);

      const query = `
        UPDATE inventory_items 
        SET ${updateFields.join(', ')} 
        WHERE id = $${paramCount} 
        RETURNING *
      `;

      const result = await this.db.query(query, values);

      if (result.rows.length === 0) {
        return null;
      }

      const item = this.mapRowToInventoryItem(result.rows[0]);
      logger.info(`Updated inventory item: ${item.name} (${item.id})`);
      
      return item;
    } catch (error) {
      logger.error('Error updating inventory item:', error);
      throw new Error('Failed to update inventory item');
    }
  }

  async deleteItem(id: string): Promise<boolean> {
    try {
      const result = await this.db.query(
        'DELETE FROM inventory_items WHERE id = $1 RETURNING id',
        [id]
      );

      const deleted = result.rows.length > 0;
      if (deleted) {
        logger.info(`Deleted inventory item: ${id}`);
      }

      return deleted;
    } catch (error) {
      logger.error('Error deleting inventory item:', error);
      throw new Error('Failed to delete inventory item');
    }
  }

  async getLowStockItems(): Promise<InventoryItem[]> {
    try {
      const result = await this.db.query(
        'SELECT * FROM inventory_items WHERE current_count <= low_stock_threshold ORDER BY current_count ASC',
        []
      );

      return result.rows.map(this.mapRowToInventoryItem);
    } catch (error) {
      logger.error('Error getting low stock items:', error);
      throw new Error('Failed to get low stock items');
    }
  }

  async getExpiredItems(): Promise<InventoryItem[]> {
    try {
      const result = await this.db.query(
        'SELECT * FROM inventory_items WHERE item_type = $1 AND expiry_date < $2 ORDER BY expiry_date ASC',
        ['medicine', new Date().toISOString()]
      );

      return result.rows.map(this.mapRowToInventoryItem);
    } catch (error) {
      logger.error('Error getting expired items:', error);
      throw new Error('Failed to get expired items');
    }
  }

  private mapRowToInventoryItem(row: any): InventoryItem {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      currentCount: row.current_count,
      lowStockThreshold: row.low_stock_threshold,
      itemType: row.item_type,
      category: row.category,
      unit: row.unit,
      location: row.location,
      notes: row.notes,
      dosageForm: row.dosage_form,
      strength: row.strength,
      expiryDate: row.expiry_date,
      manufacturer: row.manufacturer,
      prescriptionRequired: row.prescription_required,
      sideEffects: row.side_effects,
      instructions: row.instructions,
      brand: row.brand,
      nutritionalInfo: row.nutritional_info,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
} 