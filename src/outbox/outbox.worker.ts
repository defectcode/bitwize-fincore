import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { OutboxProcessor } from './outbox.processor'
import { getBackoffMs, OUTBOX_BATCH_SIZE, OUTBOX_LOCK_MS, OUTBOX_LOOP_DELAY_MS } from './outbox.constants'


@Injectable()
export class OutboxWorker implements OnModuleInit, OnModuleDestroy {

    private readonly logger = new Logger(OutboxWorker.name)

    private isRunning = false
    private shouldStop = false

    constructor( private readonly prisma: PrismaService, private readonly processor: OutboxProcessor) {}

    onModuleInit() {
        this.logger.log("Outbox worker started")
        this.startLoop().catch((error) => {
            this.logger.error("Outbox worker crashed ", error?.stack || String(error))
        })
    }

    onModuleDestroy() {
        this.shouldStop = true
        this.logger.log("Outbox worker stopping")
    }

    private async startLoop() {
        if (this.isRunning) return

        this.isRunning = true

        while(!this.shouldStop) {
            try {
                await this.processBatch()
            } catch (error: any) {
                this.logger.error(`Outbox loop error: ${error?.message || error}`)
            }

            await this.sleep(OUTBOX_LOOP_DELAY_MS)
        }
        this.isRunning = false
    }

    private async processBatch() {
        const now = new Date()

        const candidates = await this.prisma.outboxEvent.findMany({
            where: {
                status: "PENDING",
                OR: [
                    { lockedUntil: null },
                    { lockedUntil: { lt: now } }
                ],
            },
            orderBy: { createdAt: "asc" },
            take: OUTBOX_BATCH_SIZE
        })

        if(candidates.length === 0) return

        for (const candidate of candidates) {
            const claimed = await this.claimEvent(candidate.id)

            if (!claimed) {
                continue
            }

            try {
                await this.prisma.outboxEvent.update({
                    where: { id: claimed.id },
                    data: {
                        status: "SENT",
                        sentAt: new Date(),
                        lockedUntil: null,
                        lastError: null
                    }
                })
                
                this.logger.log(`Outbox event sent: ${claimed.id}`)
            } catch (error: any) {
                const nextAttempts = claimed.attempts + 1
                const retryAt = new Date(Date.now() + getBackoffMs(nextAttempts))

                await this.prisma.outboxEvent.update({
                    where: { id: claimed.id },
                    data: {
                        status: "PENDING",
                        attempts: nextAttempts,
                        lastError: error?.message || "Unknown outbox processing error",
                        lockedUntil: retryAt
                    }
                })

                this.logger.warn(
                    `Outbox event failed: ${claimed.id}, attempts=${nextAttempts}, retryAt=${retryAt.toISOString()}`
                )
            }
        }
    }

    private async claimEvent(eventId: string) {
        const lockUntil = new Date(Date.now() + OUTBOX_LOCK_MS)

        const now = new Date()

        const updated = await this.prisma.outboxEvent.updateMany({
            where: {
                id: eventId,
                status: "PENDING",
                OR: [
                    { lockedUntil: null },
                    { lockedUntil: { lt: now } },
                ],
            },
            data: {
                status: "SENDING",
                lockedUntil: lockUntil
            }
        })

        if(updated.count !== 1) return null

        return this.prisma.outboxEvent.findUnique({
            where: { id: eventId }
        })
    }

    private sleep(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms))
    }
}