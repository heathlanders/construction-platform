// lib/blueprint-templates/index.ts — template registry

import { residentialSfTasks } from './residential-sf.js';
import { residentialMfTasks } from './residential-mf.js';
import { commercialTasks } from './commercial.js';
import { industrialTasks } from './industrial.js';
import { poleBarnTasks } from './pole-barn.js';
import type { BuildingType, TemplateTask } from './types.js';

export { PHASE_ORDER, PHASE_LABELS, BUILDING_TYPES } from './types.js';
export type { BuildingType, TemplateTask, TradeType, PhaseType } from './types.js';

export const BUILDING_TYPE_LABELS: Record<BuildingType, string> = {
  residential_sf: 'Residential — Single Family',
  residential_mf: 'Residential — Multi-Family',
  commercial:     'Commercial',
  industrial:     'Industrial',
  pole_barn:      'Pole Barn (Post-Frame)',
};

const TEMPLATES: Record<BuildingType, TemplateTask[]> = {
  residential_sf: residentialSfTasks,
  residential_mf: residentialMfTasks,
  commercial:     commercialTasks,
  industrial:     industrialTasks,
  pole_barn:      poleBarnTasks,
};

export function getTemplate(buildingType: BuildingType): TemplateTask[] {
  return TEMPLATES[buildingType] ?? [];
}

export function isValidBuildingType(value: string): value is BuildingType {
  return value in TEMPLATES;
}

/** Group template tasks by phase for display */
export function groupByPhase(tasks: TemplateTask[]): Record<string, TemplateTask[]> {
  return tasks.reduce<Record<string, TemplateTask[]>>((acc, task) => {
    (acc[task.phase] ??= []).push(task);
    return acc;
  }, {});
}

/** Group template tasks by trade for display */
export function groupByTrade(tasks: TemplateTask[]): Record<string, TemplateTask[]> {
  return tasks.reduce<Record<string, TemplateTask[]>>((acc, task) => {
    (acc[task.trade_type] ??= []).push(task);
    return acc;
  }, {});
}
