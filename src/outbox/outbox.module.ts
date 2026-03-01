import { Module } from '@nestjs/common';
import { OutboxService } from './outbox.service';
import { OutboxController } from './outbox.controller';
import { OutboxDispatcher } from './outbox.dispatcher'
import { PrismaModule } from 'src/prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [OutboxController],
  providers: [OutboxService, OutboxDispatcher],
  exports: [OutboxService]
})
export class OutboxModule {}
