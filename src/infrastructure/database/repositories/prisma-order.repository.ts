import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { OrderRepositoryPort } from '../../../application/ports/order.repository.port';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PrismaOrderRepository implements OrderRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });
  }

  async findByIdempotencyKey(key: string) {
    return this.prisma.order.findUnique({
      where: { idempotencyKey: key },
      include: { items: { include: { product: true } } },
    });
  }

  async create(
    userId: string,
    totalInCents: number,
    idempotencyKey: string | undefined,
    items: unknown[],
    tx?: unknown
  ) {
    const prismaClient = (tx as Prisma.TransactionClient) || this.prisma;
    return prismaClient.order.create({
      data: {
        userId,
        totalInCents,
        idempotencyKey,
        status: 'PENDING',
        items: {
          create: items as Prisma.OrderItemCreateWithoutOrderInput[],
        },
      },
      include: {
        items: { include: { product: true } },
      },
    });
  }

  async findByUserId(userId: string) {
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
