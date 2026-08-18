import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateOrderDto) {
    if (dto.idempotencyKey) {
      const existingOrder = await this.prisma.order.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
        include: { items: { include: { product: true } } },
      });
      if (existingOrder) {
        return existingOrder;
      }
    }

    // Execucao atomica com transacao Prisma para garantir estoque consistente
    return this.prisma.$transaction(async (tx) => {
      let totalInCents = 0;
      const orderItemsData = [];

      for (const item of dto.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product || !product.active) {
          throw new NotFoundException(`Produto ${item.productId} não disponível`);
        }

        if (product.stock < item.quantity) {
          throw new BadRequestException(
            `Estoque insuficiente para o produto "${product.name}". Disponível: ${product.stock}, Solicitado: ${item.quantity}`
          );
        }

        // Decrementar estoque
        await tx.product.update({
          where: { id: product.id },
          data: { stock: product.stock - item.quantity },
        });

        const itemTotal = product.priceInCents * item.quantity;
        totalInCents += itemTotal;

        orderItemsData.push({
          productId: product.id,
          quantity: item.quantity,
          priceInCents: product.priceInCents,
        });
      }

      // Criar Pedido
      const order = await tx.order.create({
        data: {
          userId,
          totalInCents,
          idempotencyKey: dto.idempotencyKey,
          status: 'PENDING',
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: { include: { product: true } },
        },
      });

      return order;
    });
  }

  async findMyOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: { include: { product: { select: { name: true, imageUrl: true } } } },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
