export interface PaymentRepositoryPort {
  create(
    orderId: string,
    amountInCents: number,
    paymentGatewayId: string,
    status: string
  ): Promise<unknown>;
  updateStatusByGatewayId(gatewayId: string, status: string): Promise<void>;
}
