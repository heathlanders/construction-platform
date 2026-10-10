import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output bundles everything needed to run in a single directory.
  // Required for the production Docker image (web/Dockerfile).
  output: 'standalone',
  env: {
    API_URL: process.env.API_URL ?? 'http://localhost:3000',
  },
};

export default withSentryConfig(nextConfig, {
  // Suppress source map upload warnings in local dev (no SENTRY_AUTH_TOKEN)
  silent: true,
  // Only upload source maps when SENTRY_AUTH_TOKEN is set (CI/prod)
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
});
