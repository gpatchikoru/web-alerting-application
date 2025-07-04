import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { Alert, CreateAlertRequest, UpdateAlertRequest } from '../types';
import { db } from '../config/database';

export class AlertService {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  async getAllAlerts(page: number = 1, limit: number = 50, status?: string, type?: string): Promise<{ alerts: Alert[], total: number }> {
    try {
      let query = 'SELECT * FROM alerts WHERE 1=1';
      const params: any[] = [];
      let paramCount = 0;

      if (status) {
        paramCount++;
        query += ` AND status = $${paramCount}`;
        params.push(status);
      }

      if (type) {
        paramCount++;
        query += ` AND type = $${paramCount}`;
        params.push(type);
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
      const alerts = result.rows.map(this.mapRowToAlert);

      return { alerts, total };
    } catch (error) {
      logger.error('Error getting all alerts:', error);
      throw new Error('Failed to get alerts');
    }
  }

  async getAlertById(id: string): Promise<Alert | null> {
    try {
      const result = await this.db.query(
        'SELECT * FROM alerts WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToAlert(result.rows[0]);
    } catch (error) {
      logger.error('Error getting alert by ID:', error);
      throw new Error('Failed to get alert');
    }
  }

  async getActiveAlerts(): Promise<Alert[]> {
    try {
      const result = await this.db.query(
        'SELECT * FROM alerts WHERE status IN ($1, $2) ORDER BY created_at DESC',
        ['active', 'acknowledged']
      );

      return result.rows.map(this.mapRowToAlert);
    } catch (error) {
      logger.error('Error getting active alerts:', error);
      throw new Error('Failed to get active alerts');
    }
  }

  async createAlert(data: CreateAlertRequest): Promise<Alert> {
    try {
      const id = uuidv4();
      const now = new Date().toISOString();

      const result = await this.db.query(
        `INSERT INTO alerts (
          id, type, severity, status, title, message, item_id, item_name, 
          item_type, current_count, threshold, expiry_date, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
        RETURNING *`,
        [
          id, data.type, data.severity, data.status, data.title, data.message,
          data.itemId, data.itemName, data.itemType, data.currentCount,
          data.threshold, data.expiryDate, now
        ]
      );

      const alert = this.mapRowToAlert(result.rows[0]);
      logger.info(`Created alert: ${alert.title} (${alert.id})`);
      
      return alert;
    } catch (error) {
      logger.error('Error creating alert:', error);
      throw new Error('Failed to create alert');
    }
  }

  async updateAlert(id: string, data: UpdateAlertRequest): Promise<Alert | null> {
    try {
      const now = new Date().toISOString();
      
      // Build dynamic update query
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramCount = 0;

      if (data.type !== undefined) {
        paramCount++;
        updateFields.push(`type = $${paramCount}`);
        values.push(data.type);
      }

      if (data.severity !== undefined) {
        paramCount++;
        updateFields.push(`severity = $${paramCount}`);
        values.push(data.severity);
      }

      if (data.status !== undefined) {
        paramCount++;
        updateFields.push(`status = $${paramCount}`);
        values.push(data.status);
      }

      if (data.title !== undefined) {
        paramCount++;
        updateFields.push(`title = $${paramCount}`);
        values.push(data.title);
      }

      if (data.message !== undefined) {
        paramCount++;
        updateFields.push(`message = $${paramCount}`);
        values.push(data.message);
      }

      if (data.currentCount !== undefined) {
        paramCount++;
        updateFields.push(`current_count = $${paramCount}`);
        values.push(data.currentCount);
      }

      if (data.threshold !== undefined) {
        paramCount++;
        updateFields.push(`threshold = $${paramCount}`);
        values.push(data.threshold);
      }

      if (data.expiryDate !== undefined) {
        paramCount++;
        updateFields.push(`expiry_date = $${paramCount}`);
        values.push(data.expiryDate);
      }

      // Add updated_at
      paramCount++;
      updateFields.push(`updated_at = $${paramCount}`);
      values.push(now);

      // Add id parameter
      paramCount++;
      values.push(id);

      const query = `
        UPDATE alerts 
        SET ${updateFields.join(', ')} 
        WHERE id = $${paramCount} 
        RETURNING *
      `;

      const result = await this.db.query(query, values);

      if (result.rows.length === 0) {
        return null;
      }

      const alert = this.mapRowToAlert(result.rows[0]);
      logger.info(`Updated alert: ${alert.title} (${alert.id})`);
      
      return alert;
    } catch (error) {
      logger.error('Error updating alert:', error);
      throw new Error('Failed to update alert');
    }
  }

  async acknowledgeAlert(id: string, acknowledgedBy: string): Promise<Alert | null> {
    try {
      const now = new Date().toISOString();

      const result = await this.db.query(
        `UPDATE alerts 
         SET status = $1, acknowledged_by = $2, acknowledged_at = $3, updated_at = $4 
         WHERE id = $5 
         RETURNING *`,
        ['acknowledged', acknowledgedBy, now, now, id]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const alert = this.mapRowToAlert(result.rows[0]);
      logger.info(`Alert acknowledged: ${alert.title} (${alert.id}) by ${acknowledgedBy}`);
      
      return alert;
    } catch (error) {
      logger.error('Error acknowledging alert:', error);
      throw new Error('Failed to acknowledge alert');
    }
  }

  async resolveAlert(id: string, resolvedBy: string): Promise<Alert | null> {
    try {
      const now = new Date().toISOString();

      const result = await this.db.query(
        `UPDATE alerts 
         SET status = $1, resolved_by = $2, resolved_at = $3, updated_at = $4 
         WHERE id = $5 
         RETURNING *`,
        ['resolved', resolvedBy, now, now, id]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const alert = this.mapRowToAlert(result.rows[0]);
      logger.info(`Alert resolved: ${alert.title} (${alert.id}) by ${resolvedBy}`);
      
      return alert;
    } catch (error) {
      logger.error('Error resolving alert:', error);
      throw new Error('Failed to resolve alert');
    }
  }

  async dismissAlert(id: string): Promise<Alert | null> {
    try {
      const now = new Date().toISOString();

      const result = await this.db.query(
        `UPDATE alerts 
         SET status = $1, dismissed_at = $2, updated_at = $3 
         WHERE id = $4 
         RETURNING *`,
        ['dismissed', now, now, id]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const alert = this.mapRowToAlert(result.rows[0]);
      logger.info(`Alert dismissed: ${alert.title} (${alert.id})`);
      
      return alert;
    } catch (error) {
      logger.error('Error dismissing alert:', error);
      throw new Error('Failed to dismiss alert');
    }
  }

  async deleteAlert(id: string): Promise<boolean> {
    try {
      const result = await this.db.query(
        'DELETE FROM alerts WHERE id = $1 RETURNING id',
        [id]
      );

      const deleted = result.rows.length > 0;
      if (deleted) {
        logger.info(`Deleted alert: ${id}`);
      }

      return deleted;
    } catch (error) {
      logger.error('Error deleting alert:', error);
      throw new Error('Failed to delete alert');
    }
  }

  async getAlertsByItemId(itemId: string): Promise<Alert[]> {
    try {
      const result = await this.db.query(
        'SELECT * FROM alerts WHERE item_id = $1 ORDER BY created_at DESC',
        [itemId]
      );

      return result.rows.map(this.mapRowToAlert);
    } catch (error) {
      logger.error('Error getting alerts by item ID:', error);
      throw new Error('Failed to get alerts by item ID');
    }
  }

  async getCriticalAlerts(): Promise<Alert[]> {
    try {
      const result = await this.db.query(
        'SELECT * FROM alerts WHERE severity = $1 AND status IN ($2, $3) ORDER BY created_at ASC',
        ['critical', 'active', 'acknowledged']
      );

      return result.rows.map(this.mapRowToAlert);
    } catch (error) {
      logger.error('Error getting critical alerts:', error);
      throw new Error('Failed to get critical alerts');
    }
  }

  private mapRowToAlert(row: any): Alert {
    return {
      id: row.id,
      type: row.type,
      severity: row.severity,
      status: row.status,
      title: row.title,
      message: row.message,
      itemId: row.item_id,
      itemName: row.item_name,
      itemType: row.item_type,
      currentCount: row.current_count,
      threshold: row.threshold,
      expiryDate: row.expiry_date,
      acknowledgedBy: row.acknowledged_by,
      acknowledgedAt: row.acknowledged_at,
      resolvedBy: row.resolved_by,
      resolvedAt: row.resolved_at,
      dismissedAt: row.dismissed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
} 