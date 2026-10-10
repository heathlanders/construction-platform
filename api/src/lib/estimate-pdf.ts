// lib/estimate-pdf.ts — pure proposal-PDF renderer for an estimate.
//
// Presentation only: reads already-priced estimate + line rows and lays out a branded, customer-facing
// proposal with pdfkit (pure-JS, built-in Helvetica — no native/system deps). No money math beyond
// display formatting (the pricing engine is the single source of truth). Every line's assumptions[] are
// rendered for defensibility (T-63 spirit). Returns a Buffer; the route uploads it to live storage.

import PDFDocument from 'pdfkit';

export interface ProposalEstimate {
  id: string;
  name: string;
  trade: string | null;
  building_type: string | null;
  status: string;
  material_cents: number;
  labor_cents: number;
  equipment_cents: number;
  subtotal_cents: number;
  markup_cents: number;
  total_cents: number;
  overhead_pct: number | string;
  profit_pct: number | string;
  tax_pct: number | string;
  contingency_pct: number | string;
}

export interface ProposalLine {
  description: string;
  trade: string | null;
  unit: string | null;
  quantity: number | string;
  material_cents: number;
  labor_cents: number;
  equipment_cents: number;
  extended_cents: number;
  assumptions: unknown; // jsonb string[] (or already-parsed array)
}

export interface RenderProposalInput {
  tenantName: string;
  projectName?: string | null;
  estimate: ProposalEstimate;
  lineItems: ProposalLine[];
  includeCostBreakdown: boolean;
  /** ISO date string for the proposal date; caller passes to keep the renderer pure. */
  generatedOn: string;
}

function fmt(cents: number): string {
  return `$${(Number(cents) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function pct(v: number | string): string {
  return `${Number(v).toFixed(2)}%`;
}

function asAssumptions(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === 'string') {
    try { const p = JSON.parse(v); return Array.isArray(p) ? p.map(String) : []; } catch { return []; }
  }
  return [];
}

const MARGIN = 50;
const INK = '#1a1a1a';
const MUTED = '#6b7280';
const RULE = '#d1d5db';

/**
 * Render a customer-facing proposal PDF. Deterministic given its input (no clocks/IO) — the caller
 * passes generatedOn so the renderer stays pure and unit-testable.
 */
export function renderProposalPdf(input: RenderProposalInput): Promise<Buffer> {
  const { tenantName, projectName, estimate, lineItems, includeCostBreakdown, generatedOn } = input;
  const doc = new PDFDocument({ size: 'LETTER', margin: MARGIN, info: { Title: `Proposal — ${estimate.name}` } });
  const chunks: Buffer[] = [];
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  const W = doc.page.width - MARGIN * 2;
  const rule = () => { doc.moveTo(MARGIN, doc.y).lineTo(MARGIN + W, doc.y).lineWidth(0.5).strokeColor(RULE).stroke(); doc.moveDown(0.6); };

  // ── Letterhead ─────────────────────────────────────────────────────────────
  doc.fillColor(INK).font('Helvetica-Bold').fontSize(22).text(tenantName, { align: 'left' });
  doc.fillColor(MUTED).font('Helvetica').fontSize(10).text('Project Proposal', { align: 'left' });
  doc.moveDown(0.5);
  doc.fillColor(MUTED).fontSize(9).text(`Date: ${generatedOn}`, { align: 'right' });
  doc.moveDown(0.4);
  rule();

  // ── Title block ──────────────────────────────────────────────────────────────
  doc.fillColor(INK).font('Helvetica-Bold').fontSize(15).text(estimate.name);
  doc.font('Helvetica').fontSize(10).fillColor(MUTED);
  if (projectName) doc.text(`Project: ${projectName}`);
  const meta = [estimate.trade, estimate.building_type].filter(Boolean).join(' · ');
  if (meta) doc.text(meta);
  doc.moveDown(0.8);

  // ── Scope of work ────────────────────────────────────────────────────────────
  doc.fillColor(INK).font('Helvetica-Bold').fontSize(12).text('Scope of Work');
  doc.moveDown(0.3);
  if (lineItems.length === 0) {
    doc.font('Helvetica-Oblique').fontSize(10).fillColor(MUTED).text('No line items.');
  }

  // Column layout
  const breakdown = includeCostBreakdown;
  const cols = breakdown
    ? { desc: MARGIN, qty: MARGIN + 250, mat: MARGIN + 315, lab: MARGIN + 385, eq: MARGIN + 445, ext: MARGIN + W - 70 }
    : { desc: MARGIN, qty: MARGIN + W - 190, unit: MARGIN + W - 120, ext: MARGIN + W - 70 };

  // header row
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(MUTED);
  const hy = doc.y;
  doc.text('DESCRIPTION', cols.desc, hy, { width: 240 });
  if (breakdown) {
    doc.text('QTY', cols.qty, hy, { width: 55, align: 'right' });
    doc.text('MATERIAL', cols.mat, hy, { width: 60, align: 'right' });
    doc.text('LABOR', cols.lab, hy, { width: 55, align: 'right' });
    doc.text('EQUIP', cols.eq, hy, { width: 50, align: 'right' });
    doc.text('AMOUNT', cols.ext, hy, { width: 70, align: 'right' });
  } else {
    doc.text('QTY', cols.qty, hy, { width: 55, align: 'right' });
    doc.text('UNIT', cols.unit!, hy, { width: 45, align: 'right' });
    doc.text('AMOUNT', cols.ext, hy, { width: 70, align: 'right' });
  }
  doc.moveDown(0.4);
  rule();

  // rows
  for (const l of lineItems) {
    if (doc.y > doc.page.height - 120) doc.addPage();
    const y = doc.y;
    const qty = Number(l.quantity);
    doc.font('Helvetica').fontSize(9.5).fillColor(INK);
    doc.text(l.description, cols.desc, y, { width: 235 });
    const rowH = doc.y - y;
    if (breakdown) {
      doc.text(qty.toLocaleString('en-US'), cols.qty, y, { width: 55, align: 'right' });
      doc.text(fmt(l.material_cents), cols.mat, y, { width: 60, align: 'right' });
      doc.text(fmt(l.labor_cents), cols.lab, y, { width: 55, align: 'right' });
      doc.text(fmt(l.equipment_cents), cols.eq, y, { width: 50, align: 'right' });
      doc.font('Helvetica-Bold').text(fmt(l.extended_cents), cols.ext, y, { width: 70, align: 'right' });
    } else {
      doc.text(qty.toLocaleString('en-US'), cols.qty, y, { width: 55, align: 'right' });
      doc.text(l.unit ?? '', cols.unit!, y, { width: 45, align: 'right' });
      doc.font('Helvetica-Bold').text(fmt(l.extended_cents), cols.ext, y, { width: 70, align: 'right' });
    }
    doc.y = y + Math.max(rowH, 12);
    doc.moveDown(0.15);
  }
  doc.moveDown(0.3);
  rule();

  // ── Totals ───────────────────────────────────────────────────────────────────
  const totalRow = (label: string, value: string, bold = false, size = 10) => {
    const y = doc.y;
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(size).fillColor(bold ? INK : MUTED);
    doc.text(label, MARGIN + W - 260, y, { width: 180, align: 'right' });
    doc.font('Helvetica-Bold').fillColor(INK).text(value, MARGIN + W - 75, y, { width: 75, align: 'right' });
    doc.moveDown(0.35);
  };
  if (breakdown) {
    totalRow('Material', fmt(estimate.material_cents));
    totalRow('Labor', fmt(estimate.labor_cents));
    totalRow('Equipment', fmt(estimate.equipment_cents));
    totalRow('Subtotal', fmt(estimate.subtotal_cents), true);
    const markupParts: string[] = [];
    if (Number(estimate.overhead_pct) > 0) markupParts.push(`OH ${pct(estimate.overhead_pct)}`);
    if (Number(estimate.profit_pct) > 0) markupParts.push(`Profit ${pct(estimate.profit_pct)}`);
    if (Number(estimate.tax_pct) > 0) markupParts.push(`Tax ${pct(estimate.tax_pct)}`);
    if (Number(estimate.contingency_pct) > 0) markupParts.push(`Contingency ${pct(estimate.contingency_pct)}`);
    totalRow(`Markups${markupParts.length ? ` (${markupParts.join(', ')})` : ''}`, fmt(estimate.markup_cents));
  }
  doc.moveDown(0.2);
  totalRow('TOTAL', fmt(estimate.total_cents), true, 13);
  doc.moveDown(0.6);

  // ── Assumptions ──────────────────────────────────────────────────────────────
  const allAssumptions = Array.from(new Set(lineItems.flatMap((l) => asAssumptions(l.assumptions))));
  if (allAssumptions.length > 0) {
    if (doc.y > doc.page.height - 160) doc.addPage();
    doc.fillColor(INK).font('Helvetica-Bold').fontSize(11).text('Assumptions & Basis of Estimate');
    doc.moveDown(0.3);
    doc.font('Helvetica').fontSize(9).fillColor(MUTED);
    for (const a of allAssumptions) {
      doc.text(`•  ${a}`, { width: W, indent: 4 });
    }
    doc.moveDown(0.6);
  }

  // ── Terms footer ─────────────────────────────────────────────────────────────
  if (doc.y > doc.page.height - 110) doc.addPage();
  rule();
  doc.font('Helvetica').fontSize(8).fillColor(MUTED);
  doc.text(
    'This proposal is valid for 30 days from the date above. Pricing is based on the scope and assumptions ' +
    'stated herein; changes to scope, site conditions, or material costs may require revision. This document ' +
    'is a proposal, not a contract, and does not constitute a binding agreement until accepted in writing by both parties.',
    { width: W, align: 'left' },
  );

  doc.end();
  return done;
}
