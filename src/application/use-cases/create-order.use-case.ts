import { Injectable, BadRequestException, NotFoundException, Inject } from '@nestjs/common';
import { OrderRepositoryPort } from '../ports/order.repository.port';
import { ProductRepositoryPort } from '../ports/product.repository.port';
import { CreateOrderDto } from '../../modules/orders/dto/create-order.dto';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CreateOrderUseCase {
  constructor(
    @Inject('OrderRepositoryPort')
    private readonly orderRepository: OrderRepositoryPort,
    @Inject('ProductRepositoryPort')
    private readonly productRepository: ProductRepositoryPort,
    private readonly prisma: PrismaService
  ) {}

  async execute(userId: string, dto: CreateOrderDto) {
    if (dto.idempotencyKey) {
      const existingOrder = await this.orderRepository.findByIdempotencyKey(dto.idempotencyKey);
      if (existingOrder) {
        return existingOrder;
      }
    }

    const productIds = dto.items.map((item) => item.productId);
    const products = await this.productRepository.findByIds(productIds);

    const productMap = new Map(products.map((p) => [p.id, p]));

    let totalInCents = 0;
    const orderItemsData = [];

    for (const item of dto.items) {
      const product = productMap.get(item.productId);

      if (!product || !product.active) {
        throw new NotFoundException(`Produto ${item.productId} não disponível`);
      }

      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Estoque insuficiente para o produto "${product.name}". Disponível: ${product.stock}, Solicitado: ${item.quantity}`
        );
      }

      const itemTotal = product.priceInCents * item.quantity;
      totalInCents += itemTotal;

      orderItemsData.push({
        productId: product.id,
        quantity: item.quantity,
        priceInCents: product.priceInCents,
      });
    }

    return this.prisma.$transaction(async (tx) => {
      for (const item of dto.items) {
        await this.productRepository.updateStock(item.productId, item.quantity, tx);
      }

      return this.orderRepository.create(
        userId,
        totalInCents,
        dto.idempotencyKey,
        orderItemsData,
        tx
      );
    });
  }
}
