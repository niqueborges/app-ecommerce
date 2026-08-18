import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsService } from './notifications.service';
import { OrderEmailProcessor } from './processors/order-email.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'notifications',
    }),
  ],
  providers: [NotificationsService, OrderEmailProcessor],
  exports: [NotificationsService],
})
export class NotificationsModule {}
