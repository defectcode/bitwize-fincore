import { Global, Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { QueueController } from './queue.controller';
import { TransactionsWorker } from './transactions.worker'

@Global()
@Module({
  providers: [QueueService, TransactionsWorker],
  exports: [QueueService]
})
export class QueueModule {}
