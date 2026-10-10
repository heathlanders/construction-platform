-- PostgreSQL initialization script for local development
-- Run automatically on first docker compose up
--
-- The container superuser is 'postgres' (used by Prisma migrations only).
-- 'platform_user' is a NON-superuser created here — used by the app at runtime
-- via PgBouncer so that RLS policies are enforced (T-52, NOBYPASSRLS).

-- Enable required extensions (requires superuser — runs as postgres)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create the application runtime user — intentionally NOT a superuser.
-- NOSUPERUSER + NOBYPASSRLS ensures RLS policies are always enforced.
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'platform_user') THEN
    CREATE USER platform_user WITH
      PASSWORD 'changeme'
      NOSUPERUSER
      NOCREATEDB
      NOCREATEROLE
      NOINHERIT
      LOGIN
      NOBYPASSRLS;
  END IF;
END
$$;

-- Create app_role (no login, available for future fine-grained grants)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_role') THEN
    CREATE ROLE app_role NOLOGIN;
  END IF;
END
$$;

-- Grant connection and schema access
GRANT CONNECT ON DATABASE platform_dev TO platform_user;
GRANT USAGE, CREATE ON SCHEMA public TO platform_user;

-- Default privileges: tables/sequences/types created by postgres (migrations)
-- are automatically accessible to platform_user.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO platform_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO platform_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE ON TYPES TO platform_user;

-- Set default search path
ALTER DATABASE platform_dev SET search_path TO public;
