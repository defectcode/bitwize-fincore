import { Module } from '@nestjs/common';
import { OutboxService } from './outbox.service';
import { OutboxController } from './outbox.controller';
import { OutboxDispatcher } from './outbox.dispatcher'
import { PrismaModule } from 'src/prisma/prisma.module'
import { OutboxWorker } from './outbox.worker'

@Module({
  imports: [PrismaModule],
  controllers: [OutboxController],
  providers: [OutboxService, OutboxDispatcher, OutboxWorker],
  exports: [OutboxService]
})
export class OutboxModule {}
