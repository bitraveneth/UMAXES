import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaSchemaVersion: number | undefined;
};

/** Bump when models are added so HMR does not keep a stale PrismaClient. */
const PRISMA_SCHEMA_VERSION = 10;

function withVerifyFullSsl(connectionString: string) {
  try {
    const url = new URL(connectionString);
    const mode = url.searchParams.get("sslmode");
    if (mode === "prefer" || mode === "require" || mode === "verify-ca") {
      url.searchParams.set("sslmode", "verify-full");
    } else if (!mode) {
      url.searchParams.set("sslmode", "verify-full");
    }
    return url.toString();
  } catch {
    return connectionString
      .replace(/sslmode=(prefer|require|verify-ca)/i, "sslmode=verify-full")
      .replace(/([?&])sslmode=(prefer|require|verify-ca)/i, "$1sslmode=verify-full");
  }
}

function createPrismaClient() {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    throw new Error("DATABASE_URL is not set");
  }

  const connectionString = withVerifyFullSsl(raw);
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

function clientHasModel(
  client: PrismaClient,
  key: "shipmentLine" | "staffProfile",
) {
  return typeof (client as unknown as Record<string, { findMany?: unknown }>)[key]
    ?.findMany === "function";
}

function getClient() {
  const cached = globalForPrisma.prisma;
  const versionOk = globalForPrisma.prismaSchemaVersion === PRISMA_SCHEMA_VERSION;
  const modelsOk =
    cached != null &&
    clientHasModel(cached, "shipmentLine") &&
    clientHasModel(cached, "staffProfile");

  if (cached && versionOk && modelsOk) {
    return cached;
  }

  const client = createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
    globalForPrisma.prismaSchemaVersion = PRISMA_SCHEMA_VERSION;
  }
  return client;
}

export const prisma = getClient();
