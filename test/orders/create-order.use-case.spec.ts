import { CreateOrderUseCase } from '../../src/application/use-cases/create-order.use-case';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { OrderRepositoryPort } from '../../src/application/ports/order.repository.port';
import { ProductRepositoryPort } from '../../src/application/ports/product.repository.port';
import { PrismaService } from '../../src/database/prisma.service';

describe('CreateOrderUseCase', () => {
  let useCase: CreateOrderUseCase;
  let orderRepositoryMock: MockProxy<OrderRepositoryPort>;
  let productRepositoryMock: MockProxy<ProductRepositoryPort>;
  let prismaServiceMock: MockProxy<PrismaService>;

  beforeEach(() => {
    orderRepositoryMock = mock<OrderRepositoryPort>();
    productRepositoryMock = mock<ProductRepositoryPort>();
    prismaServiceMock = mock<PrismaService>();

    // Mock do Prisma transaction (basta retornar a execucao da callback de forma sincronizada ou assincronizada simples)
    prismaServiceMock.$transaction.mockImplementation(async (callback: unknown) => {
      if (typeof callback === 'function') {
        return callback(prismaServiceMock as unknown);
      }
    });

    useCase = new CreateOrderUseCase(
      orderRepositoryMock,
      productRepositoryMock,
      prismaServiceMock
    );
  });

  it('deve retornar pedido existente se idempotencyKey for passada e o pedido já existir', async () => {
    const existingOrder = { id: 'order-1', idempotencyKey: 'key-1' };
    orderRepositoryMock.findByIdempotencyKey.mockResolvedValue(existingOrder);

    const result = await useCase.execute('user-1', {
      items: [{ productId: 'prod-1', quantity: 2 }],
      idempotencyKey: 'key-1',
    });

    expect(result).toEqual(existingOrder);
    expect(productRepositoryMock.findByIds).not.toHaveBeenCalled();
  });

  it('deve lançar NotFoundException se o produto não existir ou estiver inativo', async () => {
    orderRepositoryMock.findByIdempotencyKey.mockResolvedValue(null);
    productRepositoryMock.findByIds.mockResolvedValue([]); // Nenhum produto retornado

    await expect(
      useCase.execute('user-1', {
        items: [{ productId: 'prod-1', quantity: 2 }],
      })
    ).rejects.toThrow(NotFoundException);
  });

  it('deve lançar BadRequestException se a quantidade for maior que o estoque', async () => {
    orderRepositoryMock.findByIdempotencyKey.mockResolvedValue(null);
    productRepositoryMock.findByIds.mockResolvedValue([
      { id: 'prod-1', active: true, stock: 1, priceInCents: 1000, name: 'Produto Teste' },
    ]);

    await expect(
      useCase.execute('user-1', {
        items: [{ productId: 'prod-1', quantity: 2 }],
      })
    ).rejects.toThrow(BadRequestException);
  });

  it('deve criar o pedido com sucesso e atualizar o estoque', async () => {
    orderRepositoryMock.findByIdempotencyKey.mockResolvedValue(null);
    productRepositoryMock.findByIds.mockResolvedValue([
      { id: 'prod-1', active: true, stock: 10, priceInCents: 1000, name: 'Produto Teste' },
    ]);
    const mockCreatedOrder = { id: 'order-1', totalInCents: 2000 };
    orderRepositoryMock.create.mockResolvedValue(mockCreatedOrder);

    const result = await useCase.execute('user-1', {
      items: [{ productId: 'prod-1', quantity: 2 }],
    });

    expect(result).toEqual(mockCreatedOrder);
    expect(productRepositoryMock.updateStock).toHaveBeenCalledWith('prod-1', 2, prismaServiceMock);
    expect(orderRepositoryMock.create).toHaveBeenCalledWith(
      'user-1',
      2000,
      undefined,
      [{ productId: 'prod-1', quantity: 2, priceInCents: 1000 }],
      prismaServiceMock
    );
  });
});
