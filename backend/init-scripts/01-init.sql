-- Database initialization script for Alerting Application
-- This script creates all necessary tables and indexes

-- Create inventory_items table
CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    current_count INTEGER NOT NULL DEFAULT 0,
    low_stock_threshold INTEGER NOT NULL DEFAULT 5,
    item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('medicine', 'kitchen')),
    category VARCHAR(100) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    location VARCHAR(255),
    notes TEXT,
    
    -- Medicine-specific fields
    dosage_form VARCHAR(100),
    strength VARCHAR(100),
    expiry_date DATE,
    manufacturer VARCHAR(255),
    prescription_required BOOLEAN DEFAULT FALSE,
    side_effects TEXT[],
    instructions TEXT,
    brand VARCHAR(255),
    
    -- Kitchen-specific fields
    nutritional_info JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY,
    type VARCHAR(100) NOT NULL,
    severity VARCHAR(50) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'dismissed')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Item reference
    item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    item_type VARCHAR(50) NOT NULL,
    
    -- Alert details
    current_count INTEGER,
    threshold INTEGER,
    expiry_date DATE,
    
    -- Action tracking
    acknowledged_by VARCHAR(255),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_by VARCHAR(255),
    resolved_at TIMESTAMP WITH TIME ZONE,
    dismissed_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create users table (for future authentication)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    alert_id UUID REFERENCES alerts(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create alert_subscriptions table
CREATE TABLE IF NOT EXISTS alert_subscriptions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    alert_types TEXT[] NOT NULL,
    notification_methods TEXT[] NOT NULL DEFAULT ARRAY['web', 'email'],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_items_type ON inventory_items(item_type);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_items_current_count ON inventory_items(current_count);
CREATE INDEX IF NOT EXISTS idx_inventory_items_expiry_date ON inventory_items(expiry_date);
CREATE INDEX IF NOT EXISTS idx_inventory_items_created_at ON inventory_items(created_at);

CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(type);
CREATE INDEX IF NOT EXISTS idx_alerts_item_id ON alerts(item_id);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_alert_subscriptions_user_id ON alert_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_subscriptions_is_active ON alert_subscriptions(is_active);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_inventory_items_updated_at 
    BEFORE UPDATE ON inventory_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alerts_updated_at 
    BEFORE UPDATE ON alerts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alert_subscriptions_updated_at 
    BEFORE UPDATE ON alert_subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO inventory_items (
    id, name, description, current_count, low_stock_threshold, 
    item_type, category, unit, location, notes, 
    dosage_form, strength, expiry_date, manufacturer, prescription_required
) VALUES 
    (
        gen_random_uuid(), 
        'Paracetamol 500mg', 
        'Pain relief tablets', 
        15, 
        10, 
        'medicine', 
        'Pain Relief', 
        'tablets', 
        'Medicine Cabinet', 
        'Take as needed for pain',
        'tablet',
        '500mg',
        '2024-12-31',
        'Generic Pharma',
        FALSE
    ),
    (
        gen_random_uuid(), 
        'Ibuprofen 400mg', 
        'Anti-inflammatory pain relief', 
        5, 
        10, 
        'medicine', 
        'Pain Relief', 
        'tablets', 
        'Medicine Cabinet', 
        'Take with food',
        'tablet',
        '400mg',
        '2024-11-30',
        'HealthCorp',
        FALSE
    ),
    (
        gen_random_uuid(), 
        'Rice', 
        'Long grain white rice', 
        2, 
        5, 
        'kitchen', 
        'Grains', 
        'kg', 
        'Pantry', 
        'Staple food item',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL
    ),
    (
        gen_random_uuid(), 
        'Cooking Oil', 
        'Vegetable cooking oil', 
        1, 
        2, 
        'kitchen', 
        'Cooking Essentials', 
        'liters', 
        'Kitchen Cabinet', 
        'For cooking and frying',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL
    )
ON CONFLICT DO NOTHING;

-- Insert sample alerts
INSERT INTO alerts (
    id, type, severity, status, title, message, 
    item_id, item_name, item_type, current_count, threshold
) 
SELECT 
    gen_random_uuid(),
    'low_stock',
    CASE 
        WHEN current_count = 0 THEN 'critical'
        WHEN current_count <= low_stock_threshold THEN 'high'
        ELSE 'medium'
    END,
    'active',
    CASE 
        WHEN current_count = 0 THEN 'Out of Stock: ' || name
        WHEN current_count <= low_stock_threshold THEN 'Low Stock Alert: ' || name
        ELSE 'Stock Warning: ' || name
    END,
    CASE 
        WHEN current_count = 0 THEN 'Item is completely out of stock and needs immediate restocking.'
        WHEN current_count <= low_stock_threshold THEN 'Item is running low on stock and should be restocked soon.'
        ELSE 'Item stock is below recommended threshold.'
    END,
    id,
    name,
    item_type,
    current_count,
    low_stock_threshold
FROM inventory_items 
WHERE current_count <= low_stock_threshold
ON CONFLICT DO NOTHING;

-- Insert sample user
INSERT INTO users (
    id, username, email, password_hash, first_name, last_name, role
) VALUES (
    gen_random_uuid(),
    'admin',
    'admin@example.com',
    '$2b$10$example.hash.for.testing',
    'Admin',
    'User',
    'admin'
) ON CONFLICT DO NOTHING; 