import "dotenv/config";
import {
  PrismaClient,
  AuthStatus,
  OutboxStatus,
  WalletStatus,
  LedgerEntryType,
  type User,
  type Wallet,
  type Card,
  type Authorization,
} from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  console.log("Seeding data...");

  const users: User[] = [];
  const wallets: Wallet[] = [];
  const cards: Card[] = [];
  const authorizations: Authorization[] = [];

  for (let i = 0; i < 100; i++) {
    const user = await prisma.user.create({
      data: {
        email: `user${i}@bitwize.dev`,
        fullName: `User ${i}`,
      },
    });

    users.push(user);
  }

  console.log(`Users created: ${users.length}`);

  for (let i = 0; i < 100; i++) {
    const user = users[randomInt(0, users.length - 1)];

    const wallet = await prisma.wallet.create({
      data: {
        userId: user.id,
        balance: randomInt(10000, 500000),
        currency: "USD",
        status: WalletStatus.ACTIVE,
      },
    });

    wallets.push(wallet);
  }

  console.log(`Wallets created: ${wallets.length}`);

  for (let i = 0; i < 100; i++) {
    const wallet = wallets[randomInt(0, wallets.length - 1)];

    const card = await prisma.card.create({
      data: {
        walletId: wallet.id,
        balance: wallet.balance,
        currency: wallet.currency,
      },
    });

    cards.push(card);
  }

  console.log(`Cards created: ${cards.length}`);

  for (let i = 0; i < 100; i++) {
    const card = cards[randomInt(0, cards.length - 1)];
    const amount = randomInt(100, 5000);

    const auth = await prisma.authorization.create({
      data: {
        idempotencyKey: `seed-auth-${i}-${randomUUID()}`,
        cardId: card.id,
        merchantId: randomUUID(),
        amount,
        currency: card.currency,
        status: AuthStatus.APPROVED,
      },
    });

    authorizations.push(auth);

    await prisma.ledgerEntry.create({
      data: {
        walletId: card.walletId,
        authorizationId: auth.id,
        type: LedgerEntryType.DEBIT,
        amount,
        currency: card.currency,
        description: "Seed authorization debit",
      },
    });

    await prisma.outboxEvent.create({
      data: {
        eventType: "AUTH_APPROVED",
        aggregateId: auth.id,
        payload: { authorizationId: auth.id },
        status: OutboxStatus.PENDING,
      },
    });
  }

  console.log(`Authorizations created: ${authorizations.length}`);
  console.log("Ledger entries and outbox events created");
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