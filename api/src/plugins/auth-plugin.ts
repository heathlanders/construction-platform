// auth-plugin.ts — re-exports auth preHandlers for use in route definitions
// Routes use: { preHandler: [authenticate] } or { preHandler: [authenticate, requireRole('OWNER')] }
//
// The actual JWT validation logic lives in middleware/auth.ts.
// This file is the stable import point for route files — insulates routes from
// knowing exactly where auth lives.

export { requireAuth as authenticate, requireRole } from '../middleware/auth.js';
