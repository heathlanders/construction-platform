// error-handler.ts — global Fastify error handler
// Catches TierEnforcementError → 402, ZodError → 422, unknown → 500
// Registered before all routes so no individual handler needs to catch these.

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import * as Sentry from '@sentry/node';
import { TierEnforcementError } from '../services/tier-enforcement.js';

/**
 * Register the global error handler on the Fastify instance.
 * Call this in index.ts before registering any routes.
 */
export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler(
    (error: Error, _req: FastifyRequest, reply: FastifyReply) => {
      // 402 — tier limit reached or addon required
      if (error instanceof TierEnforcementError) {
        return reply.status(402).send(error.toResponse());
      }

      // 422 — Zod schema validation failure
      if (error instanceof ZodError) {
        return reply.status(422).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            fields: error.errors.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
        });
      }

      // 400 — Fastify built-in validation errors (JSON schema)
      if ('statusCode' in error && (error as { statusCode: number }).statusCode === 400) {
        return reply.status(400).send({
          error: { code: 'BAD_REQUEST', message: error.message },
        });
      }

      // 500 — unexpected errors — log, capture in Sentry, return generic message
      app.log.error(error);
      Sentry.withScope((scope) => {
        const tenantId = (_req as any).jwt?.tenant_id;
        if (tenantId) scope.setTag('tenant_id', tenantId);
        scope.setTag('route', _req.url);
        Sentry.captureException(error);
      });
      return reply.status(500).send({
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      });
    }
  );
}
