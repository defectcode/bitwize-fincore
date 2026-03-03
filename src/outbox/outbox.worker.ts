import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { OutboxProcessor } from './outbox.processor'
import { backoffMs, OUTBOX_BATCH_SIZE, OUTBOX_LOCK_MS } from './outbox.constants'


@Injectable()
export class OutboxWorker implements OnModuleInit {
    private readonly logger = new Logger(OutboxWorker.name)
    private running = false

    constructor( private readonly prisma: PrismaService, private readonly processor: OutboxProcessor){}

    onModuleInit() {
        this.running = true
        this.loop().catch((e) => this.logger.error(e))
    }

    private async loop() {
        while(this.running) {
            try {
                await this.tick()
            } catch (error: any) {
                this.logger.error(error?.message || error)
            }
            await new Promise((r) => setTimeout(r, 500))
        } 
    }

    private async tick() {
        const now = new Date()
        const lockUntil = new Date(Date.now() + OUTBOX_LOCK_MS)

        const candidates = await this.prisma.outboxEvent.findMany({
            where: { 
                status: "PENDING",
                OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }]
            },
            orderBy: { createdAt: "asc" },
            take: OUTBOX_BATCH_SIZE
        })

        if (candidates.length === 0) return

        for (const event of candidates) {
            const claimed = await this.prisma.outboxEvent.updateMany({
                where: {
                    id: event.id,
                    status: "PENDING",
                    OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }],
                },
                data: {
                    status: "PENDING",
                    lockedUntil: lockUntil
                }
            })

            if (claimed.count !== 1) continue

            try {
                await this.processor.process(event)

                await this.prisma.outboxEvent.update({
                    where: { id: event.id },
                    data: {
                        status: "SENT",
                        lockedUntil: null,
                        sentAt: new Date(),
                        lastError: null
                    }
                })
            } catch(error: any) {
                const errorMsg = String(error?.message || error)
                const attempts = event.attempts + 1
                const nextTry = new Date(Date.now() + backoffMs(attempts))

                await this.prisma.outboxEvent.update({
                    where: { id: event.id },
                    data: {
                        status: "PENDING",
                        attempts,
                        lastError: errorMsg,
                        lockedUntil: nextTry
                    }
                })
                this.logger.warn(`Outbox failed id=${event.id} attemtps=${attempts} err=${errorMsg}`)
            }
        }
    }
}