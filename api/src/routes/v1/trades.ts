// routes/v1/trades.ts — Read-only canonical trade taxonomy (T-64).
// Serves the platform trade list (lib/trades/taxonomy.ts) for web/mobile pickers
// (vendor trade selection, manual-task trade selection, estimating filters).
// Static reference data — no DB, no withTenantContext, not audited.

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { authenticate } from '../../plugins/auth-plugin.js';
import { TRADE_TAXONOMY, tradeDef } from '../../lib/trades/taxonomy.js';
import { packFor, packKnowledge, hazardPayload } from '../../lib/trades/packs/runtime.js';

const MAX_HAZARD_KEYS = 20;
const langOf = (q: unknown): 'en' | 'es' => ((q as { lang?: string })?.lang ?? '').toLowerCase().startsWith('es') ? 'es' : 'en';

export async function tradeRoutes(app: FastifyInstance): Promise<void> {

  // ─── GET /trades ──────────────────────────────────────────────────────────
  // Full taxonomy, optionally filtered. ?category=interior  ?permit_trade=electrical
  app.get('/trades', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { category, permit_trade } = req.query as { category?: string; permit_trade?: string };
      let trades = TRADE_TAXONOMY as readonly (typeof TRADE_TAXONOMY)[number][];
      if (category) trades = trades.filter((t) => t.category === category);
      if (permit_trade) trades = trades.filter((t) => t.permit_trade === permit_trade);
      return reply.status(200).send({
        trades: trades.map((t) => ({
          key:           t.key,
          label:         t.label,
          label_es:      t.label_es,
          category:      t.category,
          csi_division:  t.csi_division,
          default_phase: t.default_phase,
          permit_trade:  t.permit_trade,
          legacy:        !!t.legacy,
          umbrella:      !!t.umbrella,
          aliases:       t.aliases ?? [],
        })),
      });
    }
  );

  // ─── GET /trades/hazards?keys=a,b&lang=es ────────────────────────────────
  // JSA suggestions (Doc 23 §5): every pack hazard for the given trades, highest severity first.
  // Spanish safety text that has not been human-translated comes back null + es_pending (T-08).
  app.get('/trades/hazards', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const raw = String((req.query as { keys?: string }).keys ?? '');
      const keys = [...new Set(raw.split(',').map((k) => k.trim()).filter(Boolean))];
      if (keys.length === 0 || keys.length > MAX_HAZARD_KEYS) {
        return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: `keys: 1–${MAX_HAZARD_KEYS} trade keys, comma-separated`, field: 'keys' } });
      }
      const lang = langOf(req.query);
      const seen = new Set<string>();
      const hazards = [];
      for (const k of keys) {
        const pack = packFor(k);
        if (!pack || seen.has(pack.key)) continue;
        seen.add(pack.key);
        for (const h of pack.hazards ?? []) hazards.push(hazardPayload(pack, h.id, lang)!);
      }
      hazards.sort((a, b) => b.severity - a.severity || a.hazard_id.localeCompare(b.hazard_id));
      return reply.status(200).send({ hazards });
    }
  );

  // ─── GET /trades/:key/knowledge?lang=es ──────────────────────────────────
  // Static per-trade knowledge (QA checklist, hazards, inspection checklists, glossary). ETag = pack_version.
  app.get('/trades/:key/knowledge', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { key } = req.params as { key: string };
      const def = tradeDef(key);
      const pack = def ? packFor(def.key) : null;
      if (!def || !pack) {
        return reply.status(404).send({ error: { code: 'NOT_FOUND', message: `Unknown trade: ${key}` } });
      }
      const lang = langOf(req.query);
      const etag = `"${pack.key}@${pack.pack_version}:${lang}"`;
      if (req.headers['if-none-match'] === etag) return reply.status(304).send();
      reply.header('etag', etag).header('cache-control', 'private, max-age=300');
      return reply.status(200).send({ knowledge: packKnowledge(pack, lang) });
    }
  );

  // ─── GET /trades/:key ─────────────────────────────────────────────────────
  // Resolve one trade by key OR alias (e.g. /trades/striping → pavement_marking).
  app.get('/trades/:key', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { key } = req.params as { key: string };
      const def = tradeDef(key);
      if (!def) {
        return reply.status(404).send({ error: { code: 'NOT_FOUND', message: `Unknown trade: ${key}` } });
      }
      return reply.status(200).send({ trade: { ...def, legacy: !!def.legacy, umbrella: !!def.umbrella, aliases: def.aliases ?? [] } });
    }
  );
}
