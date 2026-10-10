// routes/v1/reports.ts — Business reporting (profitability, job costing)
// Roles: OWNER, ACCOUNTANT only

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { withTenantContext } from '../../lib/tenant-context.js';
import { authenticate, requireRole } from '../../plugins/auth-plugin.js';

export async function reportsRoutes(app: FastifyInstance): Promise<void> {
  // GET /reports/profitability — cross-project P&L
  app.get('/reports/profitability', { preHandler: [authenticate, requireRole('OWNER', 'ACCOUNTANT')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { tenant_id } = req.jwt;

      const rows = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(`
          SELECT
            p.id,
            p.name,
            p.status,
            COALESCE(c.contract_value_cents, 0)    AS contract_value_cents,
            COALESCE(c.approved_co_cents, 0)        AS approved_co_cents,
            COALESCE(b.budget_cents, 0)             AS budget_cents,
            COALESCE(b.actual_cents, 0)             AS actual_cents,
            COALESCE(b.projected_final_cents, 0)    AS projected_final_cents,
            COALESCE(inv.billed_cents, 0)           AS billed_cents
          FROM projects p
          LEFT JOIN (
            SELECT project_id,
              SUM(original_value_cents)     AS contract_value_cents,
              SUM(approved_co_value_cents)  AS approved_co_cents
            FROM contracts
            WHERE deleted_at IS NULL
            GROUP BY project_id
          ) c ON c.project_id = p.id
          LEFT JOIN (
            SELECT project_id,
              SUM(budget_cents)             AS budget_cents,
              SUM(actual_cents)             AS actual_cents,
              SUM(projected_final_cents)    AS projected_final_cents
            FROM budget_line_items
            WHERE deleted_at IS NULL
            GROUP BY project_id
          ) b ON b.project_id = p.id
          LEFT JOIN (
            SELECT project_id,
              SUM(amount_cents) AS billed_cents
            FROM invoices
            WHERE deleted_at IS NULL AND status != 'void'
            GROUP BY project_id
          ) inv ON inv.project_id = p.id
          WHERE p.deleted_at IS NULL
          ORDER BY p.updated_at DESC
          LIMIT 100
        `);
        return rows;
      });

      const projects = rows.map((r: Record<string, string>) => {
        const contractValue = parseInt(r.contract_value_cents ?? '0');
        const approvedCO = parseInt(r.approved_co_cents ?? '0');
        const contractTotal = contractValue + approvedCO;
        const cost = parseInt(r.actual_cents ?? '0');
        const projected = parseInt(r.projected_final_cents ?? '0');
        const budget = parseInt(r.budget_cents ?? '0');

        // Margin = (contract - cost) / contract × 100
        const margin_pct = contractTotal > 0
          ? Math.round(((contractTotal - cost) / contractTotal) * 100)
          : null;

        return {
          id: r.id,
          name: r.name,
          status: r.status,
          contract_value_cents: contractValue,
          approved_co_cents: approvedCO,
          contract_total_cents: contractTotal,
          budget_cents: budget,
          actual_cents: cost,
          projected_final_cents: projected > 0 ? projected : cost,
          billed_cents: parseInt(r.billed_cents ?? '0'),
          margin_pct,
          variance_cents: budget - cost,
        };
      });

      return reply.status(200).send({ projects });
    }
  );
}
