import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { OutboxService } from "../outbox/outbox.service";
import { AuthorizeDto } from "./dto/authorize.dto";
import { Prisma } from "@prisma/client";

@Injectable()
export class TransactionsService {
	constructor( private readonly prisma: PrismaService, private readonly outbox: OutboxService ) {}

	async authorize(dto: AuthorizeDto) {
		const {cardId, amount, idempotencyKey, merchantId, currency} = dto
		try {
			const created = await this.prisma.$transaction(async (tx) => {
				const card = await tx.card.findUnique({ where: { id: cardId } })
				if (!card) throw new Error("Card not found")

				if (card.balance < amount) throw new Error('Insufficient funds')

				await tx.card.update({
					where: { id: cardId },
					data: { balance: { decrement: amount } }
				})

				const auth = await tx.authorization.create({
					data: {
						idempotencyKey: idempotencyKey,
						cardId: cardId,
						merchantId: merchantId, 
						amount: amount.toString(),
						currency: currency,
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