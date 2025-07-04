import { InventoryService } from '../services/inventoryService';
import { Pool } from 'pg';

// Mock the database pool
jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    query: jest.fn()
  }))
}));

describe('InventoryService', () => {
  let inventoryService: InventoryService;
  let mockPool: jest.Mocked<Pool>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPool = new Pool() as jest.Mocked<Pool>;
    inventoryService = new InventoryService(mockPool);
  });

  describe('getAllItems', () => {
    it('should return all items with pagination', async () => {
      const mockItems = [
        {
          id: '1',
          name: 'Test Item',
          description: 'Test Description',
          current_count: 10,
          low_stock_threshold: 5,
          item_type: 'medicine',
          category: 'Test Category',
          unit: 'tablets',
          location: 'Test Location',
          notes: 'Test Notes',
          dosage_form: 'tablet',
          strength: '500mg',
          expiry_date: '2024-12-31',
          manufacturer: 'Test Manufacturer',
          prescription_required: false,
          side_effects: ['nausea'],
          instructions: 'Take as needed',
          brand: 'Test Brand',
          nutritional_info: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ];

      mockPool.query
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: mockItems });

      const result = await inventoryService.getAllItems(1, 10);

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.items[0].name).toBe('Test Item');
    });

    it('should filter by type', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      await inventoryService.getAllItems(1, 10, 'medicine');

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('item_type = $1'),
        expect.arrayContaining(['medicine'])
      );
    });
  });

  describe('getItemById', () => {
    it('should return item by id', async () => {
      const mockItem = {
        id: '1',
        name: 'Test Item',
        current_count: 10,
        low_stock_threshold: 5,
        item_type: 'medicine',
        category: 'Test Category',
        unit: 'tablets',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockItem] });

      const result = await inventoryService.getItemById('1');

      expect(result).toBeDefined();
      expect(result?.name).toBe('Test Item');
    });

    it('should return null for non-existent item', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const result = await inventoryService.getItemById('999');

      expect(result).toBeNull();
    });
  });

  describe('createItem', () => {
    it('should create a new item', async () => {
      const createData = {
        name: 'New Item',
        description: 'New Description',
        currentCount: 10,
        lowStockThreshold: 5,
        itemType: 'medicine' as const,
        category: 'Test Category',
        unit: 'tablets'
      };

      const mockCreatedItem = {
        id: '1',
        name: 'New Item',
        description: 'New Description',
        current_count: 10,
        low_stock_threshold: 5,
        item_type: 'medicine',
        category: 'Test Category',
        unit: 'tablets',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockCreatedItem] });

      const result = await inventoryService.createItem(createData);

      expect(result.name).toBe('New Item');
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO inventory_items'),
        expect.arrayContaining(['New Item'])
      );
    });
  });

  describe('updateItem', () => {
    it('should update an existing item', async () => {
      const updateData = {
        name: 'Updated Item',
        currentCount: 15
      };

      const mockUpdatedItem = {
        id: '1',
        name: 'Updated Item',
        current_count: 15,
        low_stock_threshold: 5,
        item_type: 'medicine',
        category: 'Test Category',
        unit: 'tablets',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockUpdatedItem] });

      const result = await inventoryService.updateItem('1', updateData);

      expect(result?.name).toBe('Updated Item');
      expect(result?.currentCount).toBe(15);
    });

    it('should return null for non-existent item', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const result = await inventoryService.updateItem('999', { name: 'Test' });

      expect(result).toBeNull();
    });
  });

  describe('deleteItem', () => {
    it('should delete an existing item', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: '1' }] });

      const result = await inventoryService.deleteItem('1');

      expect(result).toBe(true);
      expect(mockPool.query).toHaveBeenCalledWith(
        'DELETE FROM inventory_items WHERE id = $1 RETURNING id',
        ['1']
      );
    });

    it('should return false for non-existent item', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const result = await inventoryService.deleteItem('999');

      expect(result).toBe(false);
    });
  });

  describe('getLowStockItems', () => {
    it('should return items with low stock', async () => {
      const mockLowStockItems = [
        {
          id: '1',
          name: 'Low Stock Item',
          current_count: 2,
          low_stock_threshold: 5,
          item_type: 'medicine',
          category: 'Test Category',
          unit: 'tablets',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ];

      mockPool.query.mockResolvedValueOnce({ rows: mockLowStockItems });

      const result = await inventoryService.getLowStockItems();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Low Stock Item');
      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT * FROM inventory_items WHERE current_count <= low_stock_threshold ORDER BY current_count ASC',
        []
      );
    });
  });

  describe('getExpiredItems', () => {
    it('should return expired medicine items', async () => {
      const mockExpiredItems = [
        {
          id: '1',
          name: 'Expired Medicine',
          current_count: 10,
          low_stock_threshold: 5,
          item_type: 'medicine',
          category: 'Test Category',
          unit: 'tablets',
          expiry_date: '2023-12-31',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ];

      mockPool.query.mockResolvedValueOnce({ rows: mockExpiredItems });

      const result = await inventoryService.getExpiredItems();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Expired Medicine');
      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT * FROM inventory_items WHERE item_type = $1 AND expiry_date < $2 ORDER BY expiry_date ASC',
        ['medicine', expect.any(String)]
      );
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('Database error'));

      await expect(inventoryService.getAllItems()).rejects.toThrow('Failed to get inventory items');
    });
  });
}); 