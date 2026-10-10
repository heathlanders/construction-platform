// vitest.config.ts — test runner config for API integration tests
// Tests run against real PostgreSQL/PgBouncer (no mocking the DB — see testing strategy)

import { defineConfig } from 'vitest/config';
import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Load root .env so DATABASE_URL, DATABASE_POOL_URL, JWT_SECRET, REDIS_URL etc.
// are available in test processes — vitest does not auto-load .env files
dotenvConfig({ path: resolve(__dirname, '../.env') });

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    // Global test setup — DB connection validation
    setupFiles: ['./src/test/setup.ts'],
    // DB tests can be slow — give them room
    testTimeout: 30_000,
    // Run tests serially by default to avoid connection pool exhaustion
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});
