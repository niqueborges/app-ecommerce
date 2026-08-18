import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { PaymentGatewayPort } from '../../application/ports/payment-gateway.port';

@Injectable()
export class StripeAdapter implements PaymentGatewayPort {
  private readonly logger = new Logger(StripeAdapter.name);
  private readonly stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
      apiVersion: '2025-02-24.acacia',
      maxNetworkRetries: 3, // Resiliência: Tenta até 3 vezes caso a API do Stripe falhe
      timeout: 10000, // Resiliência: Timeout de 10s para chamadas ao Stripe
    });
  }

  async createPaymentIntent(amountInCents: number, metadata: Record<string, string>) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'brl',
        metadata,
      });

      return {
        clientSecret: paymentIntent.client_secret as string,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      this.logger.error(`Erro ao criar Payment Intent no Stripe: ${(error as Error).message}`);
      throw new Error('Falha na comunicação com gateway de pagamento');
    }
  }

  verifyWebhookSignature(payload: Buffer, signature: string) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_mock';

    try {
      const event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);

      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      return {
        isValid: true,
        eventType: event.type,
        paymentIntentId: paymentIntent.id,
        orderId: paymentIntent.metadata?.['orderId'],
      };
    } catch (err) {
      this.logger.error(`Verificação de assinatura falhou: ${(err as Error).message}`);
      return { isValid: false };
    }
  }
}
