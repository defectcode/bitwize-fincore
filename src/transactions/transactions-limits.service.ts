import { PrismaService } from 'src/prisma/prisma.service'
import { RedisService } from 'src/redis/redis.service'
import { DAILY_WALLET_DEBIT_LIMIT, MAX_TRANSACTION_AMOUNT, MAX_WALLET_REQUESTS_PER_MINUTE } from './transactions.constants'
import { ConflictException } from '@nestjs/common'
import { TooManyRequestsException } from 'src/common/exceptions/too-many-requests.exception'


export class TransactionLimitsService {
    constructor( private readonly prisma: PrismaService, private readonly redisService: RedisService ) {}

    async validateAuthorizeLimits(walletId: string, amount: number) {
        this.validateMaxTransactionAmount(amount)
        await this.validateDailyWalletLimit(walletId, amount)
        await this.validateWalletRateLimit(walletId)
    }

    private validateMaxTransactionAmount(amount: number) {
        if (amount > MAX_TRANSACTION_AMOUNT) {
            throw new ConflictException("Transaction anount exceeds allowed limit")
        }
    }

    private async validateDailyWalletLimit(walletId: string, amount: number) {
        const now = new Date()

        const startOfDay = new Date(now)
        startOfDay.setHours(0, 0, 0, 0)

        const result = await this.prisma.ledgerEntry.aggregate({
            where: {
                walletId,
                type: "DEBIT",
                createdAt: { gte: startOfDay },
            },
            _sum: {
                amount: true
            }
        })

        const spendTotay = result._sum.amount ?? 0

        if(spendTotay + amount > DAILY_WALLET_DEBIT_LIMIT) {
            throw new ConflictException("Delay wallet debit limit exceeded")
        }
    }

    private async validateWalletRateLimit(walletId: string) {
        const redis = this.redisService.getClient()
        const key = `rate:wallet:${walletId}`

        const current = await redis.incr(key)

        if (current === 1)  await redis.expire(key, 60)

        if (current > MAX_WALLET_REQUESTS_PER_MINUTE) {
            throw new TooManyRequestsException("To many transaction requests")
        }
    }

}