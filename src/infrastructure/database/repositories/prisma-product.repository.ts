import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ProductRepositoryPort } from '../../../application/ports/product.repository.port';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class PrismaProductRepository implements ProductRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findByIds(ids: string[], tx?: unknown) {
    const prismaClient = (tx as Prisma.TransactionClient) || this.prisma;
    return prismaClient.product.findMany({
      where: { id: { in: ids } },
    });
  }

  async updateStock(id: string, quantityToSubtract: number, tx?: unknown) {
    const prismaClient = (tx as Prisma.TransactionClient) || this.prisma;
    await prismaClient.product.update({
      where: { id },
      data: { stock: { decrement: quantityToSubtract } },
    });
  }
}
