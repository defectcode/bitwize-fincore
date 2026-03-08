import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { AuthorizeDto } from './dto/authorize.dto'
import { CaptureDto } from './dto/capture.dto'
import { ReverseDto } from './dto/reverse.dto'
import { TransactionLimitsService } from './transactions-limits.service'
import { RiskService } from 'src/risk/risk.service'


@Injectable()
export class TransactionsService {
	constructor(
		private readonly prisma: PrismaService, 
		private readonly limitsService: TransactionLimitsService ,
		private readonly riskService: RiskService
	) {}

	async authorize(dto: AuthorizeDto) {
  		const { cardId, amount, idempotencyKey, merchantId, currency } = dto;

		const created = await this.prisma.$transaction(async (tx) => {
			const existing = await tx.authorization.findUnique({
				where: { idempotencyKey },
			});

			if (existing) return existing;

			const card = await tx.card.findUnique({
				where: { id: cardId },
				include: { wallet: true },
			});

			if (!card) throw new NotFoundException("Card not found");

			if (card.wallet.status !== "ACTIVE") throw new ConflictException("Wallet is not active");

			if (card.currency !== currency || card.wallet.currency !== currency) throw new ConflictException("Currency mismatch");

			await this.riskService.validateAuthorizeRisk({
				merchantId,
				walletCountry: card.wallet.country
			})

			const debitedWallet = await tx.wallet.updateMany({
				where: {
					id: card.walletId,
					balance: { gte: amount },
					status: "ACTIVE",
				},
				data: { balance: { decrement: amount } },
			});

			if (debitedWallet.count === 0) throw new ConflictException("Insufficient funds");

			await tx.card.update({
				where: { id: card.id },
				data: { balance: { decrement: amount } },
			});

			const auth = await tx.authorization.create({
				data: {
					idempotencyKey,
					cardId,
					merchantId,
					amount,
					currency,
					status: "APPROVED",
				},
			});

			await tx.ledgerEntry.create({
				data: {
					walletId: card.walletId,
					authorizationId: auth.id,
					type: "DEBIT",
					amount,
					currency,
					description: "Authorization debit",
				},
			});

			await tx.outboxEvent.create({
				data: {
					eventType: "AUTH_APPROVED",
					aggregateId: auth.id,
					payload: {
						authorizationId: auth.id,
						cardId: auth.cardId,
						walletId: card.walletId,
						amount: auth.amount,
						currency: auth.currency,
					},
					status: "PENDING",
				},
			});
			return auth;
		});
		return created;	
	}

	async capture(authId: string, dto: CaptureDto) {
    	const { idempotencyKey } = dto;

		const created = await this.prisma.$transaction(async (tx) => {
			const existingCapture = await tx.capture.findUnique({
				where: { idempotencyKey },
			});

			if (existingCapture) return existingCapture;

			const auth = await tx.authorization.findUnique({
				where: { id: authId }
			});

			if (!auth) {
				throw new NotFoundException("Authorization not found");
			}

			if (auth.status === "CAPTURED") {
				const existingByAuth = await tx.capture.findUnique({
					where: { authorizationId: auth.id },
				});

				if (existingByAuth) {
					return existingByAuth;
				}

				throw new ConflictException("Authorization already captured");
			}

			if (auth.status === "REVERSED") {
				throw new ConflictException("Authorization already reversed");
			}

			if (auth.status === "DECLINED") {
				throw new ConflictException("Authorization declined");
			}

			if (auth.status !== "APPROVED") {
				throw new ConflictException("Authorization is not approved");
			}

			const card = await tx.card.findUnique({
				where: { id: auth.cardId },
				include: { wallet: true },
			});

			if (!card) throw new NotFoundException("Card not found");

			const capture = await tx.capture.create({
				data: {
					authorizationId: auth.id,
					idempotencyKey,
					amount: auth.amount,
				},
			});

			await tx.authorization.update({
				where: { id: auth.id },
				data: { status: "CAPTURED" },
			});

			await tx.outboxEvent.create({
				data: {
					eventType: "AUTH_CAPTURED",
					aggregateId: auth.id,
					payload: {
						authorizationId: auth.id,
						captureId: capture.id,
						cardId: auth.cardId,
						walletId: card.walletId,
						amount: auth.amount,
						currency: auth.currency,
					},
					status: "PENDING",
				},
			});
			return capture;
		});
		return created;
	}

	async reverse(authId: string, dto: ReverseDto) {
		const { idempotencyKey } = dto

		const created = await this.prisma.$transaction(async (tx) => {
			const existingReversal = await tx.reversal.findUnique({
				where: { idempotencyKey }
			})

			if(existingReversal) return existingReversal

			const auth = await tx.authorization.findUnique({
				where: { id: authId }
			})

			if(!auth) throw new NotFoundException("Authorization not found")
			
			if (auth.status === "REVERSED") {
				const existingByAuth = await tx.reversal.findUnique({
					where: { authorizationId: auth.id }
				})
				
				if (existingByAuth) return existingByAuth

				throw new ConflictException("Authorization already reversed")
			}

			if (auth.status === "CAPTURED") {
				throw new ConflictException("Captured authorization cannot be reversed")
			}

			if (auth.status === "DECLINED") {
				throw new ConflictException("Declined authorization cannot be reversed")
			}

			if (auth.status !== "APPROVED") {
				throw new ConflictException("Authorization is not approved")
			}

			const card = await tx.card.findUnique({
				where: { id: auth.id },
				include: { wallet: true }
			})

			if (!card) throw new NotFoundException("Card not found")

			await tx.wallet.update({
				where: { id: card.walletId },
				data: { balance: { increment: auth.amount } }
			})

			await tx.card.update({
				where: { id: card.id },
				data: { balance: { increment: auth.amount } }
			})

			const reversal = await tx.reversal.create({
				data: {
					authorizationId: auth.id,
					idempotencyKey,
					amount: auth.amount
				}
			})

			await tx.authorization.update({
				where: { id: auth.id },
				data: { status: "REVERSED" }
			})

			await tx.ledgerEntry.create({
				data: {
					walletId: card.walletId,
					authorizationId: auth.id,
					type: "CREDIT",
					amount: auth.amount,
					currency: auth.currency,
					description: "Authorization reversal credit"
				}
			})

			await tx.outboxEvent.create({
				data: {
					eventType: "AUTH_REVERSED",
					aggregateId: auth.id,
					payload: {
						aithorizationId: auth.id,
						reversalId: reversal.id,
						cardId: auth.cardId,
						walletId: card.walletId,
						amount: auth.amount,
						currency: auth.currency
					},
					status: "PENDING"
				}
			})
			return reversal
		})
		return created
	}

	async getTransactionById(transactionId: string) {
		const transaction = await this.prisma.authorization.findUnique({
			where: { id: transactionId },
			include: {
				card: {
					include: {
						wallet: {
							select: {
								id: true,
								balance: true,
								currency: true,
								status: true,
								userId: true
							}
						}
					}
				},
				capture: true,
				reversal: true,
				ledgerEntries: { orderBy: { createdAt: "desc" } }
			}
		})
		if (!transaction) throw new NotFoundException("Transaction not found")

		return transaction 
	}
}