import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { CreatePaymentIntentUseCase } from '../../application/use-cases/create-payment-intent.use-case';
import { HandlePaymentWebhookUseCase } from '../../application/use-cases/handle-payment-webhook.use-case';
import { StripeAdapter } from '../../infrastructure/adapters/stripe.adapter';
import { PrismaPaymentRepository } from '../../infrastructure/database/repositories/prisma-payment.repository';
import { PrismaOrderRepository } from '../../infrastructure/database/repositories/prisma-order.repository';

@Module({
  controllers: [PaymentsController],
  providers: [
    CreatePaymentIntentUseCase,
    HandlePaymentWebhookUseCase,
    {
      provide: 'PaymentGatewayPort',
      useClass: StripeAdapter,
    },
    {
      provide: 'PaymentRepositoryPort',
      useClass: PrismaPaymentRepository,
    },
    {
      provide: 'OrderRepositoryPort',
      useClass: PrismaOrderRepository,
    },
  ],
})
export class PaymentsModule {}
