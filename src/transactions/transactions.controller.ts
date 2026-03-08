import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { AuthorizeDto } from './dto/authorize.dto'
import { ReverseDto } from './dto/reverse.dto'
import { CaptureDto } from './dto/capture.dto'

@Controller('transactions')
export class TransactionsController {
  	constructor(private readonly txService: TransactionsService) {}

	@Post("/authorize")
	authorize(@Body() dto: AuthorizeDto) {
		return this.txService.authorize(dto)
	}

	@Post("/:authId/capture")
	capture(@Param("authId") authId: string, @Body() dto: CaptureDto) {
		return this.txService.capture(authId, dto)
	}

	@Post("/:authId/reverse")
	reverse(@Param("auth") authId: string, @Body() dto: ReverseDto) {
		return this.txService.reverse(authId, dto)
	}

	@Get("/:transactionId")
	getTransactionId(@Param("transactionId") transactionId: string) {
		return this.txService.getTransactionById(transactionId)
	}
}
