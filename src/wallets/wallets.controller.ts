import { Controller, Get, Param, Query } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { GetWalletLedgerQueryDto } from './get-wallet-ledger-query.dto'

@Controller('wallets')
export class WalletsController {
	constructor(private readonly walletsService: WalletsService) {}

	@Get("/:walletId")
	getWalletById(@Param("walletId") walletId: string) {
		return this.walletsService.getWalletById(walletId)
	}

	@Get("/:walletId/ledger")
	getWalletLedger(@Param("walletId") walletId: string, @Query() query: GetWalletLedgerQueryDto) {
		return this.walletsService.getWalletLedger(walletId, query)
	}

}
