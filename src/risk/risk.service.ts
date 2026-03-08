import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service'

@Injectable()
export class RiskService {

    constructor(private readonly prisma: PrismaService) {}

    async validateAuthorizeRisk( params: { merchantId: string; walletCountry?: string | null } ) {
        const { merchantId, walletCountry } = params

        await this.validateBlockedMerchant(merchantId)

        if (walletCountry) await this.validateBlockedMerchant(walletCountry)
    }
    private async validateBlockedMerchant(merchantId: string) {
        const blocked = await this.prisma.blockedMerchant.findUnique({
            where: { merchantId }
        })

        if(blocked?.active) {
            throw new ConflictException("Merchant is blocked")
        }
    }

    private async validateBlockedCountry(countryCode: string) {
        const blocked = await this.prisma.blockedCountry.findUnique({
            where: { countryCode: countryCode.toUpperCase() }
        })

        if (blocked?.active) {
            throw new ConflictException("Country is blocked")
        }
    }

    async blockMerchant(merchantId: string, reason?: string) {
        return this.prisma.blockedMerchant.upsert({
            where: { merchantId },
            update: {
                active: true,
                reason: reason ?? null,
            },
            create: {
                merchantId,
                reason: reason ?? null,
                active: true
            }
        })
    }

    async unblockMerchant(merchantId: string) {
        return this.prisma.blockedMerchant.update({
            where: { merchantId },
            data: { active: false }
        })
    }

    async blockCountry(countryCode: string, reason?: string) {
        const code = countryCode.toUpperCase()

        return this.prisma.blockedCountry.upsert({
            where: { countryCode: code },
            update: {
                active: true,
                reason: reason ?? null
            },
            create: {
               countryCode: code,
               reason: reason ?? null,
               active: true 
            }
        })
    }

    async unblockCountry(countryCode: string) {
        return this.prisma.blockedCountry.update({
            where: { countryCode: countryCode.toUpperCase() },
            data: { active: true }
        })
    }

    async getBlockedMerchants() {
        return this.prisma.blockedCountry.findMany({
            orderBy: { createdAt: "desc" }
        })
    }

    async getBlockedCountries() {
        return this.prisma.blockedCountry.findMany({
            orderBy: { createdAt: "desc" }
        })
    }


}
