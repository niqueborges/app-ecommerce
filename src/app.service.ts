import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth(): { status: string; timestamp: string; service: string; uptime: number } {
    return {
      status: 'ok',
      service: 'lucas-artisan-ecommerce-api',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
