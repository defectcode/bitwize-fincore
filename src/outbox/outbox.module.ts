import { Module } from '@nestjs/common';
import { OutboxService } from './outbox.service';
import { OutboxController } from './outbox.controller';
import { OutboxDispatcher } from './outbox.dispatcher'
import { PrismaModule } from 'src/prisma/prisma.module'
import { OutboxWorker } from './outbox.worker'
import { OutboxProcessor } from './outbox.processor'

@Module({
	imports: [PrismaModule],
	controllers: [OutboxController],
	providers: [OutboxService, OutboxDispatcher, OutboxWorker, OutboxProcessor],
	exports: [OutboxService, OutboxProcessor]
})
export class OutboxModule {}
