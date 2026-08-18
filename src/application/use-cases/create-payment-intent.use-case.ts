import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { PaymentGatewayPort } from '../ports/payment-gateway.port';
import { PaymentRepositoryPort } from '../ports/payment.repository.port';
import { OrderRepositoryPort } from '../ports/order.repository.port';

@Injectable()
export class CreatePaymentIntentUseCase {
  constructor(
    @Inject('PaymentGatewayPort')
    private readonly paymentGateway: PaymentGatewayPort,
    @Inject('PaymentRepositoryPort')
    private readonly paymentRepository: PaymentRepositoryPort,
    @Inject('OrderRepositoryPort')
    private readonly orderRepository: OrderRepositoryPort
  ) {}

  async execute(orderId: string) {
    const order = (await this.orderRepository.findById(orderId)) as unknown as {
      status: string;
      totalInCents: number;
      id: string;
    };

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    if (order.status !== 'PENDING') {
      throw new BadRequestException('Pedido não está pendente de pagamento');
    }

    const { clientSecret, paymentIntentId } = await this.paymentGateway.createPaymentIntent(
      order.totalInCents,
      { orderId: order.id }
    );

    await this.paymentRepository.create(order.id, order.totalInCents, paymentIntentId, 'PENDING');

    return {
      clientSecret,
      paymentIntentId,
      amount: order.totalInCents,
    };
  }
}
