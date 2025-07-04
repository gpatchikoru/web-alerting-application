import { AlertService } from '../services/alertService';
import { Pool } from 'pg';

// Mock the database pool
jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    query: jest.fn()
  }))
}));

describe('AlertService', () => {
  let alertService: AlertService;
  let mockPool: jest.Mocked<Pool>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPool = new Pool() as jest.Mocked<Pool>;
    alertService = new AlertService(mockPool);
  });

  describe('getAllAlerts', () => {
    it('should return all alerts with pagination', async () => {
      const mockAlerts = [
        {
          id: '1',
          type: 'low_stock',
          severity: 'high',
          status: 'active',
          title: 'Low Stock Alert',
          message: 'Item is running low',
          item_id: 'item-1',
          item_name: 'Test Item',
          item_type: 'medicine',
          current_count: 2,
          threshold: 5,
          expiry_date: null,
          acknowledged_by: null,
          acknowledged_at: null,
          resolved_by: null,
          resolved_at: null,
          dismissed_at: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ];

      mockPool.query
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: mockAlerts });

      const result = await alertService.getAllAlerts(1, 10);

      expect(result.alerts).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.alerts[0].title).toBe('Low Stock Alert');
    });

    it('should filter by status', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      await alertService.getAllAlerts(1, 10, 'active');

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('status = $1'),
        expect.arrayContaining(['active'])
      );
    });
  });

  describe('getAlertById', () => {
    it('should return alert by id', async () => {
      const mockAlert = {
        id: '1',
        type: 'low_stock',
        severity: 'high',
        status: 'active',
        title: 'Test Alert',
        message: 'Test Message',
        item_id: 'item-1',
        item_name: 'Test Item',
        item_type: 'medicine',
        current_count: 2,
        threshold: 5,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockAlert] });

      const result = await alertService.getAlertById('1');

      expect(result).toBeDefined();
      expect(result?.title).toBe('Test Alert');
    });

    it('should return null for non-existent alert', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const result = await alertService.getAlertById('999');

      expect(result).toBeNull();
    });
  });

  describe('createAlert', () => {
    it('should create a new alert', async () => {
      const createData = {
        type: 'low_stock',
        severity: 'high',
        status: 'active',
        title: 'New Alert',
        message: 'New Alert Message',
        itemId: 'item-1',
        itemName: 'Test Item',
        itemType: 'medicine',
        currentCount: 2,
        threshold: 5
      };

      const mockCreatedAlert = {
        id: '1',
        type: 'low_stock',
        severity: 'high',
        status: 'active',
        title: 'New Alert',
        message: 'New Alert Message',
        item_id: 'item-1',
        item_name: 'Test Item',
        item_type: 'medicine',
        current_count: 2,
        threshold: 5,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockCreatedAlert] });

      const result = await alertService.createAlert(createData);

      expect(result.title).toBe('New Alert');
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO alerts'),
        expect.arrayContaining(['New Alert'])
      );
    });
  });

  describe('acknowledgeAlert', () => {
    it('should acknowledge an alert', async () => {
      const mockAcknowledgedAlert = {
        id: '1',
        type: 'low_stock',
        severity: 'high',
        status: 'acknowledged',
        title: 'Test Alert',
        message: 'Test Message',
        item_id: 'item-1',
        item_name: 'Test Item',
        item_type: 'medicine',
        acknowledged_by: 'user-1',
        acknowledged_at: '2024-01-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockAcknowledgedAlert] });

      const result = await alertService.acknowledgeAlert('1', 'user-1');

      expect(result?.status).toBe('acknowledged');
      expect(result?.acknowledgedBy).toBe('user-1');
    });

    it('should return null for non-existent alert', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const result = await alertService.acknowledgeAlert('999', 'user-1');

      expect(result).toBeNull();
    });
  });

  describe('resolveAlert', () => {
    it('should resolve an alert', async () => {
      const mockResolvedAlert = {
        id: '1',
        type: 'low_stock',
        severity: 'high',
        status: 'resolved',
        title: 'Test Alert',
        message: 'Test Message',
        item_id: 'item-1',
        item_name: 'Test Item',
        item_type: 'medicine',
        resolved_by: 'user-1',
        resolved_at: '2024-01-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockResolvedAlert] });

      const result = await alertService.resolveAlert('1', 'user-1');

      expect(result?.status).toBe('resolved');
      expect(result?.resolvedBy).toBe('user-1');
    });
  });

  describe('dismissAlert', () => {
    it('should dismiss an alert', async () => {
      const mockDismissedAlert = {
        id: '1',
        type: 'low_stock',
        severity: 'high',
        status: 'dismissed',
        title: 'Test Alert',
        message: 'Test Message',
        item_id: 'item-1',
        item_name: 'Test Item',
        item_type: 'medicine',
        dismissed_at: '2024-01-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockDismissedAlert] });

      const result = await alertService.dismissAlert('1');

      expect(result?.status).toBe('dismissed');
    });
  });

  describe('getActiveAlerts', () => {
    it('should return active and acknowledged alerts', async () => {
      const mockActiveAlerts = [
        {
          id: '1',
          type: 'low_stock',
          severity: 'high',
          status: 'active',
          title: 'Active Alert',
          message: 'Active Message',
          item_id: 'item-1',
          item_name: 'Test Item',
          item_type: 'medicine',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ];

      mockPool.query.mockResolvedValueOnce({ rows: mockActiveAlerts });

      const result = await alertService.getActiveAlerts();

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('active');
      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT * FROM alerts WHERE status IN ($1, $2) ORDER BY created_at DESC',
        ['active', 'acknowledged']
      );
    });
  });

  describe('getCriticalAlerts', () => {
    it('should return critical alerts', async () => {
      const mockCriticalAlerts = [
        {
          id: '1',
          type: 'low_stock',
          severity: 'critical',
          status: 'active',
          title: 'Critical Alert',
          message: 'Critical Message',
          item_id: 'item-1',
          item_name: 'Test Item',
          item_type: 'medicine',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ];

      mockPool.query.mockResolvedValueOnce({ rows: mockCriticalAlerts });

      const result = await alertService.getCriticalAlerts();

      expect(result).toHaveLength(1);
      expect(result[0].severity).toBe('critical');
      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT * FROM alerts WHERE severity = $1 AND status IN ($2, $3) ORDER BY created_at ASC',
        ['critical', 'active', 'acknowledged']
      );
    });
  });

  describe('getAlertsByItemId', () => {
    it('should return alerts for a specific item', async () => {
      const mockItemAlerts = [
        {
          id: '1',
          type: 'low_stock',
          severity: 'high',
          status: 'active',
          title: 'Item Alert',
          message: 'Item Message',
          item_id: 'item-1',
          item_name: 'Test Item',
          item_type: 'medicine',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ];

      mockPool.query.mockResolvedValueOnce({ rows: mockItemAlerts });

      const result = await alertService.getAlertsByItemId('item-1');

      expect(result).toHaveLength(1);
      expect(result[0].itemId).toBe('item-1');
      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT * FROM alerts WHERE item_id = $1 ORDER BY created_at DESC',
        ['item-1']
      );
    });
  });

  describe('deleteAlert', () => {
    it('should delete an existing alert', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: '1' }] });

      const result = await alertService.deleteAlert('1');

      expect(result).toBe(true);
      expect(mockPool.query).toHaveBeenCalledWith(
        'DELETE FROM alerts WHERE id = $1 RETURNING id',
        ['1']
      );
    });

    it('should return false for non-existent alert', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const result = await alertService.deleteAlert('999');

      expect(result).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('Database error'));

      await expect(alertService.getAllAlerts()).rejects.toThrow('Failed to get alerts');
    });
  });
}); 