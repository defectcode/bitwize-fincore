import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq'
import { getRedisConnection } from './redis.connection'

@Injectable()
export class QueueService implements OnModuleDestroy {
    private readonly queue = new Queue("tx-auth", {
        connection: getRedisConnection(),
        defaultJobOptions: {
            attempts: 5,
            backoff: { type: "exponential", delay: 2000},
            removeOnComplete: 1000,
            removeOnFail: 5000
        },
    })

    async addAuthorizationJob(authorizationId: string) {
        return this.queue.add(
            "process-auth",
            { authorizationId },
            { jobId: authorizationId }
        )
    }

    async onModuleDestroy() {
        await this.queue.close()
    }
}
