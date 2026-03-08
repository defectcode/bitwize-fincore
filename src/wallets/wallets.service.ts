import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service'
import { GetWalletLedgerQueryDto } from './get-wallet-ledger-query.dto'

@Injectable()
export class WalletsService {
    constructor(private readonly prisma: PrismaService) {}

    async getWalletById(walletId: string) {
        const wallet = await this.prisma.wallet.findUnique({
            where: { id: walletId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        fullName: true
                    }
                },
                cards: {
                    select: {
                        id: true,
                        balance: true,
                        currency: true,
                        createdAt: true
                    }
                }
            }
        })

        if(!wallet) throw new NotFoundException("Wallet not found")
        
        return wallet
    }

    async getWalletLedger(walletId: string, query: GetWalletLedgerQueryDto) {
        const wallet = await this.prisma.wallet.findUnique({
            where: { id: walletId },
            select: {
                id: true,
                balance: true,
                currency: true,
                status: true,
                createdAt: true,
                updatedAt: true
            }
        })

        if(!wallet) throw new NotFoundException("Wallet not found")

        const whereClause = { walletId, ...(query.type ? { type: query.type } : {} ) }

        const [entries, total] = await Promise.all([
            this.prisma.ledgerEntry.findMany({
                where: whereClause,
                orderBy: { createdAt: "desc"},
                take: query.limit ?? 20,
                skip: query.offset ?? 0
            }),
            
            this.prisma.ledgerEntry.count({
                where: whereClause
            })
        ])

        return {
            wallet,
            pagination: {
                total,
                limit: query.limit ?? 20,
                offset: query.offset ?? 0
            },
            entries
        }
    }
}
