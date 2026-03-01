`Bitwize FinCore`

`Bitwize FinCore` is a simplified financial core system built with NestJS.
It simulates real-world card transaction authorization with atomic balance updates, idempotency control, and event-driven architecture.

The project demonstrates how backend financial systems should be designed to handle transactional consistency and concurrency safely.

Overview

This project models a simplified fintech authorization flow.

It includes:

- Transaction authorization
- Atomic balance debit
- Idempotent request handling
- Concurrency-safe operations
- Event publishing using the Outbox Pattern
- Redis-based background processing

The focus is on clean architecture and production-style backend logic.

Main Endpoint
POST /transactions/authorize

Request example:

{
"cardId": "uuid",
"merchantId": "uuid",
"amount": 100,
"currency": "USD",
"idempotencyKey": "unique-key"
}
