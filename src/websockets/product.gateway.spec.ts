import { Test, TestingModule } from '@nestjs/testing';
import { ProductGateway } from './product.gateway';
import { Product } from '../products/entities/product.entity';

describe('ProductGateway', () => {
  let gateway: ProductGateway;
  let mockServer: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductGateway],
    }).compile();

    gateway = module.get<ProductGateway>(ProductGateway);

    // Mock WebSocket server
    mockServer = {
      emit: jest.fn(),
    };

    gateway.server = mockServer as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('emitProductCreated', () => {
    it('should emit product created event', () => {
      const product: Product = {
        id: 'product-id',
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        stock: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      gateway.emitProductCreated(product);

      expect(mockServer.emit).toHaveBeenCalledWith('product:created', {
        event: 'product:created',
        data: product,
        timestamp: expect.any(String),
      });
    });
  });

  describe('connection lifecycle', () => {
    it('should handle connection', () => {
      const mockSocket = {
        id: 'socket-id',
      } as any;

      gateway.handleConnection(mockSocket);

      // Just verify it doesn't throw
      expect(mockSocket.id).toBe('socket-id');
    });

    it('should handle disconnection', () => {
      const mockSocket = {
        id: 'socket-id',
      } as any;

      gateway.handleDisconnect(mockSocket);

      // Just verify it doesn't throw
      expect(mockSocket.id).toBe('socket-id');
    });
  });
});

