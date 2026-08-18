import { Controller, Post, Param, Req, Headers, UseGuards, RawBodyRequest } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreatePaymentIntentUseCase } from '../../application/use-cases/create-payment-intent.use-case';
import { HandlePaymentWebhookUseCase } from '../../application/use-cases/handle-payment-webhook.use-case';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly createPaymentIntentUseCase: CreatePaymentIntentUseCase,
    private readonly handlePaymentWebhookUseCase: HandlePaymentWebhookUseCase
  ) {}

  @Post('create-intent/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Criar Stripe PaymentIntent para um pedido' })
  @ApiResponse({ status: 201, description: 'Client secret do Stripe gerado' })
  createIntent(@Param('orderId') orderId: string) {
    return this.createPaymentIntentUseCase.execute(orderId);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Endpoint de Webhook do Stripe (Assinatura criptografada)' })
  handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>
  ) {
    return this.handlePaymentWebhookUseCase.execute(signature, req.rawBody || Buffer.from(''));
  }
}
