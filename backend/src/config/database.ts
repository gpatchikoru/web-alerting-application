import { Pool, PoolClient } from 'pg';
import { logger } from '../utils/logger';

class Database {
  private pool: Pool;
  private static instance: Database;

  private constructor() {
    this.pool = new Pool({
      host: process.env['POSTGRES_HOST'] || 'localhost',
      port: parseInt(process.env['POSTGRES_PORT'] || '5432'),
      database: process.env['POSTGRES_DB'] || 'alerting_app',
      user: process.env['POSTGRES_USER'] || 'postgres',
      password: process.env['POSTGRES_PASSWORD'] || 'password123',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      logger.error('Unexpected error on idle client', err);
      process.exit(-1);
    });
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  public async query(text: string, params?: any[]): Promise<any> {
    const start = Date.now();
    try {
      const res = await this.pool.query(text, params);
      const duration = Date.now() - start;
      logger.debug('Executed query', { text, duration, rows: res.rowCount });
      return res;
    } catch (error) {
      logger.error('Database query error', { text, error });
      throw error;
    }
  }

  public async close(): Promise<void> {
    await this.pool.end();
  }

  public async healthCheck(): Promise<boolean> {
    try {
      await this.pool.query('SELECT 1');
      return true;
    } catch (error) {
      logger.error('Database health check failed:', error);
      return false;
    }
  }
}

export const db = Database.getInstance();

export async function connectDatabase(): Promise<void> {
  try {
    // Test connection
    await db.healthCheck();
    
    // Create tables if they don't exist
    await createTables();
    
    logger.info('Database connected and tables initialized');
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    throw error;
  }
}

async function createTables(): Promise<void> {
  const createInventoryTable = `
    CREATE TABLE IF NOT EXISTS inventory_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      current_count INTEGER NOT NULL DEFAULT 0,
      low_stock_threshold INTEGER NOT NULL DEFAULT 5,
      item_type VARCHAR(50) NOT NULL,
      category VARCHAR(100) NOT NULL,
      unit VARCHAR(50) NOT NULL,
      location VARCHAR(255),
      notes TEXT,
      dosage_form VARCHAR(50),
      strength VARCHAR(100),
      expiry_date TIMESTAMP,
      manufacturer VARCHAR(255),
      prescription_required BOOLEAN DEFAULT false,
      side_effects TEXT[],
      instructions TEXT,
      brand VARCHAR(255),
      nutritional_info JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createAlertsTable = `
    CREATE TABLE IF NOT EXISTS alerts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      type VARCHAR(50) NOT NULL,
      severity VARCHAR(20) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'active',
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
      item_name VARCHAR(255) NOT NULL,
      item_type VARCHAR(50) NOT NULL,
      current_count INTEGER,
      threshold INTEGER,
      expiry_date TIMESTAMP,
      acknowledged_by VARCHAR(255),
      acknowledged_at TIMESTAMP,
      resolved_by VARCHAR(255),
      resolved_at TIMESTAMP,
      metadata JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'user',
      preferences JSONB DEFAULT '{}',
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createNotificationsTable = `
    CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      is_read BOOLEAN DEFAULT false,
      read_at TIMESTAMP,
      metadata JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createAuditLogsTable = `
    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      action VARCHAR(100) NOT NULL,
      resource_type VARCHAR(50) NOT NULL,
      resource_id UUID,
      old_values JSONB,
      new_values JSONB,
      ip_address INET,
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Create indexes
  const createIndexes = `
    CREATE INDEX IF NOT EXISTS idx_inventory_items_type ON inventory_items(item_type);
    CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category);
    CREATE INDEX IF NOT EXISTS idx_inventory_items_expiry ON inventory_items(expiry_date);
    CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
    CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(type);
    CREATE INDEX IF NOT EXISTS idx_alerts_item_id ON alerts(item_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
  `;

  try {
    await db.query(createInventoryTable);
    await db.query(createAlertsTable);
    await db.query(createUsersTable);
    await db.query(createNotificationsTable);
    await db.query(createAuditLogsTable);
    await db.query(createIndexes);
    
    logger.info('Database tables created successfully');
  } catch (error) {
    logger.error('Failed to create database tables:', error);
    throw error;
  }
} 