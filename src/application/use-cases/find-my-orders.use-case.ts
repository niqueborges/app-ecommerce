import { Injectable, Inject } from '@nestjs/common';
import { OrderRepositoryPort } from '../ports/order.repository.port';

@Injectable()
export class FindMyOrdersUseCase {
  constructor(
    @Inject('OrderRepositoryPort')
    private readonly orderRepository: OrderRepositoryPort
  ) {}

  async execute(userId: string) {
    return this.orderRepository.findByUserId(userId);
  }
}
