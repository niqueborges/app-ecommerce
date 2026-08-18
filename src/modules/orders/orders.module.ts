import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { CreateOrderUseCase } from '../../application/use-cases/create-order.use-case';
import { FindMyOrdersUseCase } from '../../application/use-cases/find-my-orders.use-case';
import { PrismaOrderRepository } from '../../infrastructure/database/repositories/prisma-order.repository';
import { PrismaProductRepository } from '../../infrastructure/database/repositories/prisma-product.repository';

@Module({
  controllers: [OrdersController],
  providers: [
    CreateOrderUseCase,
    FindMyOrdersUseCase,
    {
      provide: 'OrderRepositoryPort',
      useClass: PrismaOrderRepository,
    },
    {
      provide: 'ProductRepositoryPort',
      useClass: PrismaProductRepository,
    },
  ],
  exports: [CreateOrderUseCase],
})
export class OrdersModule {}
