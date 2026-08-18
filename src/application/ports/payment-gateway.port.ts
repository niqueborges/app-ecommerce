export interface PaymentGatewayPort {
  createPaymentIntent(
    amountInCents: number,
    metadata: Record<string, string>
  ): Promise<{ clientSecret: string; paymentIntentId: string }>;
  verifyWebhookSignature(
    payload: Buffer,
    signature: string
  ): { isValid: boolean; eventType?: string; paymentIntentId?: string; orderId?: string };
}
