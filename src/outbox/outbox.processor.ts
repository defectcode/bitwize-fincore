import { Injectable, Logger } from "@nestjs/common";
import { OutboxEvent } from "@prisma/client";

@Injectable()
export class OutboxProcessor {
  private readonly logger = new Logger(OutboxProcessor.name);

  async process(event: OutboxEvent): Promise<void> {
    switch (event.eventType) {
      case "AUTH_APPROVED":
        this.logger.log(`Processed AUTH_APPROVED for aggregateId=${event.aggregateId}`);
        return;

      case "AUTH_CAPTURED":
        this.logger.log(`Processed AUTH_CAPTURED for aggregateId=${event.aggregateId}`);
        return;

      case "AUTH_REVERSED":
        this.logger.log(`Processed AUTH_REVERSED for aggregateId=${event.aggregateId}`);
        return;

      default:
        throw new Error(`Unknown outbox event type: ${event.eventType}`);
    }
  }
}