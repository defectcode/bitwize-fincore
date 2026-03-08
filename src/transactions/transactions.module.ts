import { Global, Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { OutboxModule } from 'src/outbox/outbox.module'
import { TransactionLimitsService } from './transactions-limits.service'

@Global()
@Module({
  imports: [OutboxModule],
  controllers: [TransactionsController],
  providers: [TransactionsService, TransactionLimitsService],
  exports: [TransactionsService]
})
export class TransactionsModule {}
