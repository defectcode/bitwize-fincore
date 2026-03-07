import { Injectable } from "@nestjs/common";
import { OutboxEvent } from "@prisma/client";

@Injectable()
export class OutboxProcessor {
  async process(event: OutboxEvent) {
    switch (event.eventType) {
      case "AUTH_APPROVED":
        return;

      case "AUTH_CAPTURED":
        return;

      case "AUTH_REVERSED":
        return;

      default:
        throw new Error(`Unknown eventType: ${event.eventType}`);
    }
  }
}