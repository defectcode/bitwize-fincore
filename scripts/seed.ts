import {
  PrismaClient,
  AuthStatus,
  OutboxStatus,
  type Authorization,
  type Card,
  type OutboxEvent,
} from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  console.log("Seeding data...");

  const cards: Card[] = [];
  const authorizations: Authorization[] = [];
  const outboxEvents: OutboxEvent[] = [];

  // 1) Cards
  for (let i = 0; i < 100; i++) {
    const card = await prisma.card.create({
      data: {
        balance: randomInt(1000, 10000),
        currency: "USD",
      },
    });
    cards.push(card);
  }
  console.log("Cards created:", cards.length);

  // 2) Authorizations
  for (let i = 0; i < 100; i++) {
    const card = cards[randomInt(0, cards.length - 1)];
    const amount = randomInt(10, 500);

    const auth = await prisma.authorization.create({
      data: {
        idempotencyKey: `seed-auth-${i}-${randomUUID()}`,
        cardId: card.id,
        merchantId: randomUUID(),
        amount: amount.toString(),
        currency: "USD",
        status: AuthStatus.APPROVED,
      },
    });

    authorizations.push(auth);
  }
  console.log("Authorizations created:", authorizations.length);

  // 3) OutboxEvents
  for (let i = 0; i < 100; i++) {
    const auth = authorizations[randomInt(0, authorizations.length - 1)];

    const evt = await prisma.outboxEvent.create({
      data: {
        eventType: "AUTH_APPROVED",
        aggregateId: auth.id,
        payload: { authorizationId: auth.id },
        status: OutboxStatus.PENDING,
      },
    });

    outboxEvents.push(evt);
  }
  console.log("OutboxEvents created:", outboxEvents.length);

  console.log("Seeding finished");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });