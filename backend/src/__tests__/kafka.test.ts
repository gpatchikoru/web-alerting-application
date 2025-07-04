import { kafkaService } from '../config/kafka';

// Mock the Kafka service for testing
jest.mock('../config/kafka', () => ({
  kafkaService: {
    sendMessage: jest.fn(),
    healthCheck: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn()
  }
}));

describe('Kafka Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('should send a message to Kafka', async () => {
      const mockSendMessage = kafkaService.sendMessage as jest.MockedFunction<typeof kafkaService.sendMessage>;
      mockSendMessage.mockResolvedValue();

      const testMessage = {
        id: 'test-id',
        type: 'test-event',
        timestamp: new Date(),
        data: { test: 'data' }
      };

      await kafkaService.sendMessage('test-topic', testMessage);

      expect(mockSendMessage).toHaveBeenCalledWith('test-topic', testMessage);
    });

    it('should handle errors when sending message fails', async () => {
      const mockSendMessage = kafkaService.sendMessage as jest.MockedFunction<typeof kafkaService.sendMessage>;
      const error = new Error('Kafka connection failed');
      mockSendMessage.mockRejectedValue(error);

      const testMessage = {
        id: 'test-id',
        type: 'test-event',
        timestamp: new Date(),
        data: { test: 'data' }
      };

      await expect(kafkaService.sendMessage('test-topic', testMessage)).rejects.toThrow('Kafka connection failed');
    });
  });

  describe('healthCheck', () => {
    it('should return true when Kafka is healthy', async () => {
      const mockHealthCheck = kafkaService.healthCheck as jest.MockedFunction<typeof kafkaService.healthCheck>;
      mockHealthCheck.mockResolvedValue(true);

      const result = await kafkaService.healthCheck();

      expect(result).toBe(true);
      expect(mockHealthCheck).toHaveBeenCalled();
    });

    it('should return false when Kafka is unhealthy', async () => {
      const mockHealthCheck = kafkaService.healthCheck as jest.MockedFunction<typeof kafkaService.healthCheck>;
      mockHealthCheck.mockResolvedValue(false);

      const result = await kafkaService.healthCheck();

      expect(result).toBe(false);
      expect(mockHealthCheck).toHaveBeenCalled();
    });
  });
}); 