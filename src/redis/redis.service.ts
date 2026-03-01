import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis'

@Injectable()
export class RedisService implements OnModuleDestroy {
    private readonly client: Redis

    constructor() {
        this.client = new Redis({
            host: "127.0.0.1",
            port: 6379
        })

        this.client.on("connect", () => {
            console.log("Redis connected")
        })
    }

    getClient() {
        return this.client
    }

    async onModuleDestroy() {
        await this.client.quit()
    }
}
