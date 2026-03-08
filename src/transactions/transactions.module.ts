import { Global, Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { OutboxModule } from 'src/outbox/outbox.module'
import { TransactionLimitsService } from './transactions-limits.service'
import { RiskModule } from 'src/risk/risk.module'

@Global()
@Module({
  imports: [OutboxModule, RiskModule],
  controllers: [TransactionsController],
  providers: [TransactionsService, TransactionLimitsService],
  exports: [TransactionsService]
})
export class TransactionsModule {}
