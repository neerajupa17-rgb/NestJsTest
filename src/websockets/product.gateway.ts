import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { Product } from '../products/entities/product.entity';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/products',
})
export class ProductGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('ProductGateway');

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  emitProductCreated(product: Product) {
    this.logger.log(`Emitting product created event: ${product.id}`);
    this.server.emit('product:created', {
      event: 'product:created',
      data: product,
      timestamp: new Date().toISOString(),
    });
  }
}

