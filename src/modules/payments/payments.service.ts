import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly stripe: Stripe;

  constructor(private readonly prisma: PrismaService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock');
  }

  async createPaymentIntent(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    if (order.status !== 'PENDING') {
      throw new BadRequestException('Pedido não está pendente de pagamento');
    }

    // Criar PaymentIntent no Stripe
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: order.totalInCents,
      currency: 'brl',
      metadata: { orderId: order.id },
    });

    await this.prisma.payment.create({
      data: {
        orderId: order.id,
        amountInCents: order.totalInCents,
        stripePaymentId: paymentIntent.id,
        status: 'PENDING',
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: order.totalInCents,
    };
  }

  async handleWebhookEvent(signature: string, payload: Buffer) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_mock';
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${(err as Error).message}`);
      throw new BadRequestException('Assinatura do webhook inválida');
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata['orderId'];

        if (orderId) {
          await this.prisma.order.update({
            where: { id: orderId },
            data: { status: 'PAID' },
          });

          await this.prisma.payment.updateMany({
            where: { stripePaymentId: paymentIntent.id },
            data: { status: 'SUCCEEDED' },
          });

          this.logger.log(`Pagamento confirmado com sucesso para o pedido ${orderId}`);
        }
        break;
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await this.prisma.payment.updateMany({
          where: { stripePaymentId: paymentIntent.id },
          data: { status: 'FAILED' },
        });
        break;
      }
    }

    return { received: true };
  }
}
