import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { OutboxService } from "../outbox/outbox.service";
import { AuthorizeDto } from "./dto/authorize.dto";
import { Prisma } from "@prisma/client";
import { CaptureDto } from './dto/capture.dto'
import { ReverseDto } from './dto/reverse.dto'

@Injectable()
export class TransactionsService {
	constructor( private readonly prisma: PrismaService, private readonly outbox: OutboxService ) {}

	private parseAmount(amount: string): number {
		const n = Number(amount)
		if (!Number.isInteger(n) || n <= 0) {
			throw new Error("Invalid amount stored")
		}
		return n
	}
 
	async capture(authId: string, dto: CaptureDto) {
		const created = await this.prisma.$transaction(async (tx) => {
			const existingCapture = await tx.capture.findUnique({
				where: { idempotencyKey: dto.idempotencyKey }
			})
			if(existingCapture) return existingCapture

			const auth = await tx.authorization.findUnique({ where: { id: authId } })

			if (!auth) throw new Error("Authorization not found")
			
			if (auth.status === "CAPTURED") {
				const cap = await tx.capture.findUnique({ where: { authorizationId: auth.id } })

				if (cap) return cap
				throw new Error("Captured state without capture record")
			}

			if (auth.status === "REVERSED") throw new Error("Authorization reversed")
			if (auth.status === "DECLINED") throw new Error("Authorization declined")

			const capture = await tx.capture.create({
				data: {
					authorizationId: auth.id,
					idempotencyKey: dto.idempotencyKey,
					amount: auth.amount
				}
			})

			await tx.authorization.update({
				where: { id: auth.id },
				data: { status: "CAPTURED" }
			})

			await tx.outboxEvent.create({
				data: {
					eventType: "AUTH_CAPTURED",
					aggregateId: auth.id,
					payload: { authorizationId: auth.id, captureId: capture.id },
					status: "PENDING"
				}
			})
			return capture
		})
		return created
	}

	async reverse(authId: string, dto: ReverseDto) {
		const created = await this.prisma.$transaction(async (tx) => {
			const existingReverse = await tx.reversal.findUnique({ where: { idempotencyKey: dto.idempotencyKey} })

			if (existingReverse) return existingReverse

			const auth = await tx.authorization.findUnique({ where: { id: authId} })
			if (!auth) throw new Error("Authorization not found")

			if (auth.status === "REVERSED") {
				const rev = await tx.reversal.findUnique({ where: { authorizationId: auth.id } })
				if (rev) return rev
				throw new Error("Reversed state without reversal record")
			}

			if (auth.status === "CAPTURED") throw new Error("Authorization captured")
			if (auth.status === "DECLINED") throw new Error("Authorization declined")

			const amt = this.parseAmount(auth.amount)

			await tx.card.update({
				where: { id: auth.cardId },
				data: { balance: { increment: amt }}
			})

			const reversal = await tx.reversal.create({
				data: {
					authorizationId: auth.id,
					idempotencyKey: dto.idempotencyKey,
					amount: auth.amount
				}
			})

			await tx.authorization.update({
				where: { id: auth.id },
				data: { status: "REVERSED" }
			})

			await tx.outboxEvent.create({
				data: {
					eventType: "AUTH_REVERSED",
					aggregateId: auth.id,
					payload: { authrizationId: auth.id, reversalId: reversal.id },
					status: "PENDING"
				}
			})
			return reversal
		})
		return created
	}


	async authorize(dto: AuthorizeDto) {
		const {cardId, amount, idempotencyKey, merchantId, currency} = dto
		try {
			const created = await this.prisma.$transaction(async (tx) => {
				const card = await tx.card.findUnique({ where: { id: cardId } })
				if (!card) throw new Error("Card not found")

				const existing = await tx.authorization.findUnique({
					where: { idempotencyKey }
				})
				if (existing) return existing

				const debited = await tx.card.updateMany({
					where: {
						id: cardId,
						balance: { gte: amount }
					},
					data: {
						balance: { decrement: amount }
					}
				})

				if (debited.count === 0) {
					const exists = await tx.card.findUnique({
						where: { id: cardId },
						select: { id: true }
					})
					
					if(!exists) throw new Error("Card not found")
					throw new Error("Insufficient funds")
				}

				const auth = await tx.authorization.create({
					data: {
						idempotencyKey,
						cardId,
						merchantId, 
						amount: amount.toString(),
						currency,
						status: "APPROVED",
					},
				});

				await tx.outboxEvent.create({
				data: {
					eventType: "AUTH_APPROVED",
					aggregateId: auth.id,
					payload: { authorizationId: auth.id },
					status: "PENDING",
				},
				});
				return auth;
			});

			return { ...created, amount: created.amount.toString() }
		} catch (error: any) {
			if (
				error instanceof Prisma.PrismaClientKnownRequestError &&
				error.code === "P2002" &&
				Array.isArray((error.meta as any)?.target) &&
				(error.meta as any).target.includes("idempotencyKey")
			) {
				const existing = await this.prisma.authorization.findUnique({
					where: { idempotencyKey: idempotencyKey },
				});

				if (existing) {
					return existing;
				}
			}
		throw error;
		}
	}
}