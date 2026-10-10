// lib/task-dependencies/types.ts — shared types for the dependency rule engine

import type { PhaseType, TradeType } from '../blueprint-templates/types.js';

export type DependencyType =
  | 'finish_to_start'
  | 'start_to_start'
  | 'finish_to_finish'
  | 'start_to_finish';

/** Minimal task shape the engine needs (post-insert, so `id` is a real schedule_tasks UUID). */
export interface DepTask {
  id: string;
  title: string;
  trade_type: TradeType | string | null;
  phase: PhaseType | string | null;
  csi_division: string | null;
  sort_order: number | null;
}

export interface DepEdge {
  predecessor_id: string;
  successor_id: string;
  type: DependencyType;
}
