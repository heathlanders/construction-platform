// Pure layer-merge helpers for the jurisdiction cascade. No I/O.

import type {
  ResolvedTradeCode,
  TradeCodeOverride,
  SequenceOp,
  InspectionStepDef,
} from './types.js';

// Append an amendment note without dropping inherited notes. Most-general → most-local order.
export function appendNote(existing: string | null, addition: string | undefined): string | null {
  const add = addition?.trim();
  if (!add) return existing;
  if (!existing || existing.trim().length === 0) return add;
  if (existing.includes(add)) return existing; // idempotent — avoid dup on re-resolve
  return `${existing} ${add}`;
}

// Apply a layer's sequence_ops onto the inherited steps. Operations apply in array order.
export function applySequenceOps(
  steps: InspectionStepDef[],
  ops: SequenceOp[] | undefined,
): InspectionStepDef[] {
  if (!ops || ops.length === 0) return steps;
  let result = steps.map((s) => ({ ...s }));
  for (const op of ops) {
    switch (op.op) {
      case 'add':
        result.push({ ...op.step });
        break;
      case 'remove':
        result = result.filter((s) => s.inspection_type !== op.inspection_type);
        break;
      case 'modify':
        result = result.map((s) =>
          s.inspection_type === op.inspection_type ? { ...s, ...op.patch } : s,
        );
        break;
      case 'replace_all':
        result = op.steps.map((s) => ({ ...s }));
        break;
    }
  }
  return result;
}

// Sort by sequence_order (stable) and renumber contiguously 1..N so downstream consumers
// (milestone insert, blueprint injection) get a clean ordering after add/remove ops.
export function renumber(steps: InspectionStepDef[]): InspectionStepDef[] {
  const sorted = [...steps].sort((a, b) => a.sequence_order - b.sequence_order);
  return sorted.map((s, i) => ({ ...s, sequence_order: i + 1 }));
}

// Fold one trade override onto an accumulator. Returns a new object (no mutation).
export function applyTradeOverride(
  acc: ResolvedTradeCode,
  ov: TradeCodeOverride | undefined,
): ResolvedTradeCode {
  if (!ov) return acc;
  return {
    code_type: ov.code_type ?? acc.code_type,
    code_edition: ov.code_edition ?? acc.code_edition,
    nec_edition: ov.nec_edition ?? acc.nec_edition,
    jurisdiction_notes: appendNote(acc.jurisdiction_notes, ov.amendments_notes),
    steps: applySequenceOps(acc.steps, ov.sequence_ops),
  };
}
