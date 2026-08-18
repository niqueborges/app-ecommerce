import { Injectable, BadRequestException, Logger, Inject } from '@nestjs/common';
import { PaymentGatewayPort } from '../ports/payment-gateway.port';
import { PaymentRepositoryPort } from '../ports/payment.repository.port';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class HandlePaymentWebhookUseCase {
  private readonly logger = new Logger(HandlePaymentWebhookUseCase.name);

  constructor(
    @Inject('PaymentGatewayPort')
    private readonly paymentGateway: PaymentGatewayPort,
    @Inject('PaymentRepositoryPort')
    private readonly paymentRepository: PaymentRepositoryPort,
    private readonly prisma: PrismaService // Temporario para atualizar Order status, ideal ter um OrderRepositoryPort updateStatus
  ) {}

  async execute(signature: string, payload: Buffer) {
    const verification = this.paymentGateway.verifyWebhookSignature(payload, signature);

    if (!verification.isValid) {
      throw new BadRequestException('Assinatura do webhook inválida');
    }

    const { eventType, paymentIntentId, orderId } = verification;

    if (eventType === 'payment_intent.succeeded' && paymentIntentId && orderId) {
      // Atualizar status do pedido
      await this.prisma.order.update({
        where: { id: orderId },
        data: { status: 'PAID' },
      });

      // Atualizar status do pagamento
      await this.paymentRepository.updateStatusByGatewayId(paymentIntentId, 'SUCCEEDED');

      this.logger.log(`Pagamento confirmado com sucesso para o pedido ${orderId}`);
    } else if (eventType === 'payment_intent.payment_failed' && paymentIntentId) {
      await this.paymentRepository.updateStatusByGatewayId(paymentIntentId, 'FAILED');
    }

    return { received: true };
  }
}
