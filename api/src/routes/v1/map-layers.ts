// routes/v1/map-layers.ts — Project Map layer endpoints (Doc 20 Phase 5).
//
// GET /assets/map — asset positions for the map. v1 derives position from each asset's ACTIVE
//   project assignment → the project's geocoded coords (spec §6; geocoding free-text home_location
//   is a fast-follow). Business+ (T-56, mirrors all /v1/assets*).
// GET /crew/map — DEGRADED crew layer (spec §6 recommendation): projects with someone currently
//   clocked in (open time_punches), marker on project coords + count. Precise worker GPS is the
//   OQ-17-additive fast-follow (punch lat/lng capture). No tier gate (time tracking has none).
//
// Both are slim read-only payloads for the map — never full records. Read = any authed org user
// (RLS scopes to tenant).

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { withTenantContext } from '../../lib/tenant-context.js';
import { authenticate } from '../../plugins/auth-plugin.js';
import { assertTier, TierEnforcementError } from '../../services/tier-enforcement.js';

export async function mapLayerRoutes(app: FastifyInstance): Promise<void> {

  // ─── GET /assets/map (Business+ — T-56) ───────────────────────────────────
  app.get('/assets/map', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { tenant_id } = req.jwt;
      try {
        await assertTier(tenant_id, 'BUSINESS');
      } catch (e) {
        if (e instanceof TierEnforcementError) {
          return reply.status(402).send({ error: { code: e.code, message: e.message, upgrade_to: e.upgradeToTier } });
        }
        throw e;
      }

      const assets = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(
          `SELECT ca.id, ca.asset_number, ca.name, ca.asset_category, ca.status,
                  p.id AS project_id, p.name AS project_name,
                  p.latitude, p.longitude
           FROM company_assets ca
           JOIN asset_project_assignments apa
             ON apa.asset_id = ca.id AND apa.returned_at IS NULL
           JOIN projects p
             ON p.id = apa.project_id AND p.deleted_at IS NULL
            AND p.latitude IS NOT NULL AND p.longitude IS NOT NULL
           WHERE ca.deleted_at IS NULL
           ORDER BY ca.asset_number ASC
           LIMIT 5000`,
        );
        return rows.map((r) => ({
          id: r.id,
          asset_number: r.asset_number,
          name: r.name,
          asset_category: r.asset_category,
          status: r.status,
          project_id: r.project_id,
          project_name: r.project_name,
          latitude: Number(r.latitude),
          longitude: Number(r.longitude),
        }));
      });

      return reply.status(200).send({ assets });
    }
  );

  // ─── GET /crew/map (crew layer — no tier gate) ────────────────────────────
  // Two granularities in one call:
  //   sites   — DEGRADED: projects with open punches, per-project counts (marker on project
  //             coords). A punch with no project (optional since T-61) can't be placed → excluded.
  //   workers — PRECISE (Phase 6a / OQ-17 additive): open punches that captured device GPS at
  //             clock-in. Project optional here — a GPS punch places itself.
  app.get('/crew/map', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { tenant_id } = req.jwt;

      const result = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(
          `SELECT p.id AS project_id, p.name AS project_name,
                  p.latitude, p.longitude,
                  COUNT(*)::int AS clocked_in_count,
                  ARRAY_AGG(u.first_name || ' ' || u.last_name ORDER BY tp.clock_in_at) AS workers
           FROM time_punches tp
           JOIN users u ON u.id = tp.user_id
           JOIN projects p
             ON p.id = tp.project_id AND p.deleted_at IS NULL
            AND p.latitude IS NOT NULL AND p.longitude IS NOT NULL
           WHERE tp.clock_out_at IS NULL AND tp.deleted_at IS NULL
           GROUP BY p.id, p.name, p.latitude, p.longitude
           ORDER BY clocked_in_count DESC
           LIMIT 1000`,
        );
        const { rows: precise } = await client.query(
          `SELECT tp.id AS punch_id, u.first_name || ' ' || u.last_name AS worker,
                  tp.clock_in_at, tp.clock_in_lat, tp.clock_in_lng,
                  p.id AS project_id, p.name AS project_name
           FROM time_punches tp
           JOIN users u ON u.id = tp.user_id
           LEFT JOIN projects p ON p.id = tp.project_id AND p.deleted_at IS NULL
           WHERE tp.clock_out_at IS NULL AND tp.deleted_at IS NULL
             AND tp.clock_in_lat IS NOT NULL AND tp.clock_in_lng IS NOT NULL
           ORDER BY tp.clock_in_at ASC
           LIMIT 1000`,
        );
        return {
          sites: rows.map((r) => ({
            project_id: r.project_id,
            project_name: r.project_name,
            latitude: Number(r.latitude),
            longitude: Number(r.longitude),
            clocked_in_count: r.clocked_in_count,
            workers: r.workers as string[],
          })),
          workers: precise.map((r) => ({
            punch_id: r.punch_id,
            worker: r.worker,
            clock_in_at: r.clock_in_at,
            latitude: Number(r.clock_in_lat),
            longitude: Number(r.clock_in_lng),
            project_id: r.project_id ?? null,
            project_name: r.project_name ?? null,
          })),
        };
      });

      return reply.status(200).send(result);
    }
  );
}
