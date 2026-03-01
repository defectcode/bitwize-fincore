import { Body, Controller, Post } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { AuthorizeDto } from './dto/authorize.dto'

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly txService: TransactionsService) {}

  @Post("/authorize")
  authorize(@Body() dto: AuthorizeDto) {
    return this.txService.authorize(dto)
  }
}
