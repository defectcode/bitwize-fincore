import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { Worker } from 'bullmq'
import { getRedisConnection } from './redis.connection'


@Injectable()
export class TransactionsWorker implements OnModuleInit, OnModuleDestroy {
    private worker!: Worker

    onModuleInit() {
        this.worker = new Worker(
            "tx-auth",
            async (job) => {
                console.log("Processing job:", job.data)
                return true
            },
            {
                connection: getRedisConnection(),
                concurrency: 10
            }
        )
    }

    async onModuleDestroy() {
        await this.worker.close()
    }
}