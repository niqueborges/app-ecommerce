import { Injectable } from '@nestjs/common';
import { PaymentRepositoryPort } from '../../../application/ports/payment.repository.port';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class PrismaPaymentRepository implements PaymentRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(orderId: string, amountInCents: number, paymentGatewayId: string, status: string) {
    return this.prisma.payment.create({
      data: {
        orderId,
        amountInCents,
        stripePaymentId: paymentGatewayId, // mapeado para a tabela legada
        status,
      },
    });
  }

  async updateStatusByGatewayId(gatewayId: string, status: string) {
    await this.prisma.payment.updateMany({
      where: { stripePaymentId: gatewayId },
      data: { status },
    });
  }
}
