// prisma.ts — PrismaClient singleton for non-tenant-scoped queries only
// T-42: Prisma is ONLY for non-tenant queries (migrations, health checks, billing)
// All tenant-scoped queries MUST use withTenantContext() + raw pg client (T-50)

import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// Singleton — reuse across hot reloads in development
export const prisma =
  global.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    datasources: {
      db: {
        // Direct DB URL — never PgBouncer (Prisma manages its own connection pool)
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}
