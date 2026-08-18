import { Controller, Post, Get, Body, UseGuards, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { CreateOrderUseCase } from '../../application/use-cases/create-order.use-case';
import { FindMyOrdersUseCase } from '../../application/use-cases/find-my-orders.use-case';

@ApiTags('Orders')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly createOrderUseCase: CreateOrderUseCase,
    private readonly findMyOrdersUseCase: FindMyOrdersUseCase
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar pedido com trava atômica de estoque e Idempotency-Key' })
  @ApiHeader({ name: 'idempotency-key', required: false })
  @ApiResponse({ status: 201, description: 'Pedido criado com sucesso' })
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateOrderDto,
    @Headers('idempotency-key') idempotencyKey?: string
  ) {
    return this.createOrderUseCase.execute(user.userId, {
      ...dto,
      idempotencyKey: idempotencyKey || dto.idempotencyKey,
    });
  }

  @Get('my-orders')
  @ApiOperation({ summary: 'Listar histórico de pedidos do cliente' })
  findMyOrders(@CurrentUser() user: CurrentUserPayload) {
    return this.findMyOrdersUseCase.execute(user.userId);
  }
}
