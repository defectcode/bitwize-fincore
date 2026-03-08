import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { RiskService } from './risk.service';
import { BlockeCountryDto } from './dto/block-country.dto'

@Controller('/risk')
export class RiskController {
  	constructor(private readonly riskService: RiskService) {}


	@Get("/blocked-merchants")
	getBlockedMerchants() {
		return this.riskService.getBlockedMerchants()
	}

	@Get("/blocked-countries")
	getBlockedCountries() {
		return this.riskService.getBlockedCountries()
	}

	@Post("/blocked-merchants/:merchantId/unblock")
	unblockMerchant(@Param("merchantId") merchantId: string) {
		return this.riskService.unblockMerchant(merchantId)
	}

	@Post("/blocked-countries")
	blockCountry(@Body() dto: BlockeCountryDto) {
		return this.riskService.blockCountry(dto.countryCode, dto.reason)
	}

	@Patch("/blocked-countries/:countryCode/unblock")
	unblockCountry(@Param("countryCode") countryCode: string) {
		return this.riskService.unblockCountry(countryCode)
	}

}
