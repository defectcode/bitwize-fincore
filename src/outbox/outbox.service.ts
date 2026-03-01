import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'
import { OutboxStatus } from '@prisma/client'

@Injectable()
export class OutboxService {
    
    constructor(private readonly prisma: PrismaService) {}

    async createEventTx(tx: PrismaService, data: { eventType: string, aggregateId: string, payload: any }) {
        return tx.outboxEvent.create({
            data: {
                eventType: data.eventType,
                aggregateId: data.aggregateId,
                payload: data.payload,
                status: OutboxStatus.PENDING
            }
        })
    }
}
