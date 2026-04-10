import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

let prismaModuleSingleton: PrismaClient | undefined;

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

function getPrismaSingleton(): PrismaClient {
  if (process.env.NODE_ENV !== "production" && globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }
  if (prismaModuleSingleton) {
    return prismaModuleSingleton;
  }
  const client = createPrismaClient();
  prismaModuleSingleton = client;
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }
  return client;
}

/** Lazy client so importing this module does not require DATABASE_URL (e.g. `next build`). */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrismaSingleton();
    const value = Reflect.get(client as object, prop, receiver);
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
}) as PrismaClient;
