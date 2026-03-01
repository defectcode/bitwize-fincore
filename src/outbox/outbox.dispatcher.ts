import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { OutboxStatus } from '@prisma/client'
import { PrismaService } from 'src/prisma/prisma.service'
import { QueueService } from 'src/queue/queue.service'


@Injectable()
export class OutboxDispatcher implements OnModuleInit, OnModuleDestroy {
    private timer: NodeJS.Timeout | null = null

    constructor(
        private readonly prisma: PrismaService,
        private readonly txQueue: QueueService
    ) {}

    onModuleInit() {
        this.timer = setInterval(() => {
            this.tick().catch((e) => console.log("Outbox tick error", e?.message))
        })
    }

    async onModuleDestroy() {
        if (this.timer) clearInterval(this.timer)
    }

    private async tick() {
        const now = new Date()
        const lockMs = 15_000
        const lockedUntil = new Date(now.getTime() + lockMs)

        const batchSize = 50

        for (let i = 0; i < batchSize; i++) {
            const event = await this.prisma.$transaction(async (tx) => {
                const found = await tx.outboxEvent.findFirst({
                    where: {
                        status: OutboxStatus.PENDING,
                        OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }]
                    },
                    orderBy: { createdAt: "asc"}
                })

                if (!found) return null

                const locked = await tx.outboxEvent.updateMany({
                    where: {
                        id: found.id,
                        status: OutboxStatus.PENDING,
                        OR: [{ lockedUntil: null}, { lockedUntil: { lt: now }}],
                    },
                    data: {
                        status: OutboxStatus.SENDING,
                        lockedUntil,
                        attempts: { increment: 1 }
                    }
                })

                if (locked.count === 0) return null

                return tx.outboxEvent.findUnique({ where: { id: found.id } })
            })
            
            if(!event) break

            try {
                if (event.eventType === "AUTH_APPROVED") {
                    const authorizationId = String((event.payload as any).authorizationId)
                    await this.txQueue.addAuthorizationJob(authorizationId)
                    
                }

                await this.prisma.outboxEvent.update({
                    where: { id: event.id },
                    data: {
                        status: OutboxStatus.SENT,
                        sentAt: new Date(),
                        lockedUntil: null,
                        lastError: null
                    }
                })
            } catch(error: any) {
                await this.prisma.outboxEvent.update({
                    where: { id: event.id },
                    data: {
                        status: OutboxStatus.FAILED,
                        lockedUntil: null,
                        lastError: error?.message?.slice(0, 500) || "UNKNOWN_ERROR"
                    }
                })

            }
        }
    }
}