// Base entity interface
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Inventory item types
export enum ItemType {
  MEDICINE = 'medicine',
  KITCHEN = 'kitchen'
}

export enum MedicineDosageForm {
  TABLET = 'tablet',
  CAPSULE = 'capsule',
  LIQUID = 'liquid',
  INJECTION = 'injection',
  CREAM = 'cream',
  DROPS = 'drops',
  INHALER = 'inhaler',
  OTHER = 'other'
}

export enum KitchenCategory {
  GRAINS = 'grains',
  SPICES = 'spices',
  DAIRY = 'dairy',
  VEGETABLES = 'vegetables',
  FRUITS = 'fruits',
  MEAT = 'meat',
  BEVERAGES = 'beverages',
  SNACKS = 'snacks',
  CONDIMENTS = 'condiments',
  OTHER = 'other'
}

// Base inventory item interface
export interface InventoryItem extends BaseEntity {
  name: string;
  description?: string;
  currentCount: number;
  lowStockThreshold: number;
  itemType: ItemType;
  category: string;
  unit: string;
  location?: string;
  notes?: string;
  dosageForm?: MedicineDosageForm;
  strength?: string;
  expiryDate?: Date;
  manufacturer?: string;
  prescriptionRequired?: boolean;
  sideEffects?: string;
  instructions?: string;
  brand?: string;
  nutritionalInfo?: string;
}

// Request interfaces for inventory
export interface CreateInventoryItemRequest {
  name: string;
  description?: string;
  currentCount: number;
  lowStockThreshold: number;
  itemType: ItemType;
  category: string;
  unit: string;
  location?: string;
  notes?: string;
  dosageForm?: MedicineDosageForm;
  strength?: string;
  expiryDate?: Date;
  manufacturer?: string;
  prescriptionRequired?: boolean;
  sideEffects?: string;
  instructions?: string;
  brand?: string;
  nutritionalInfo?: string;
}

export interface UpdateInventoryItemRequest {
  name?: string;
  description?: string;
  currentCount?: number;
  lowStockThreshold?: number;
  itemType?: ItemType;
  category?: string;
  unit?: string;
  location?: string;
  notes?: string;
  dosageForm?: MedicineDosageForm;
  strength?: string;
  expiryDate?: Date;
  manufacturer?: string;
  prescriptionRequired?: boolean;
  sideEffects?: string;
  instructions?: string;
  brand?: string;
  nutritionalInfo?: string;
}

// Alert types
export enum AlertType {
  LOW_STOCK = 'low_stock',
  EXPIRY_WARNING = 'expiry_warning',
  OUT_OF_STOCK = 'out_of_stock',
  EXPIRED = 'expired'
}

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum AlertStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed'
}

export interface Alert extends BaseEntity {
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  message: string;
  itemId: string;
  itemName: string;
  itemType: ItemType;
  currentCount?: number;
  threshold?: number;
  expiryDate?: Date;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedBy?: string;
  resolvedAt?: Date;
  dismissedAt?: Date;
  metadata?: Record<string, any>;
}

// Request interfaces for alerts
export interface CreateAlertRequest {
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  message: string;
  itemId: string;
  itemName: string;
  itemType: ItemType;
  currentCount?: number;
  threshold?: number;
  expiryDate?: Date;
}

export interface UpdateAlertRequest {
  type?: AlertType;
  severity?: AlertSeverity;
  status?: AlertStatus;
  title?: string;
  message?: string;
  currentCount?: number;
  threshold?: number;
  expiryDate?: Date;
}

// Kafka event types
export enum EventType {
  INVENTORY_CREATED = 'inventory.created',
  INVENTORY_UPDATED = 'inventory.updated',
  INVENTORY_DELETED = 'inventory.deleted',
  STOCK_ADJUSTED = 'stock.adjusted',
  ALERT_CREATED = 'alert.created',
  ALERT_UPDATED = 'alert.updated',
  ALERT_RESOLVED = 'alert.resolved'
}

export interface KafkaEvent<T = any> {
  id: string;
  type: EventType;
  timestamp: Date;
  data: T;
  metadata?: {
    userId?: string;
    source?: string;
    correlationId?: string;
  };
}

export interface InventoryEvent extends KafkaEvent<InventoryItem> {
  type: EventType.INVENTORY_CREATED | EventType.INVENTORY_UPDATED | EventType.INVENTORY_DELETED;
}

export interface StockAdjustmentEvent extends KafkaEvent<{
  itemId: string;
  previousCount: number;
  newCount: number;
  adjustment: number;
  reason?: string;
}> {
  type: EventType.STOCK_ADJUSTED;
}

export interface AlertEvent extends KafkaEvent<Alert> {
  type: EventType.ALERT_CREATED | EventType.ALERT_UPDATED | EventType.ALERT_RESOLVED;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
} 