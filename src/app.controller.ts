import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Health')
@Controller('health')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Verificar integridade da API do E-commerce' })
  @ApiResponse({
    status: 200,
    description: 'API operando normalmente',
  })
  getHealth() {
    return this.appService.getHealth();
  }
}
