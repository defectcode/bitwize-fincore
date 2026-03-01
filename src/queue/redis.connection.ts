import { ConnectionOptions } from 'bullmq'


export function getRedisConnection(): ConnectionOptions {
    return {
        host: "127.0.0.1",
        port: 6379
    }
}