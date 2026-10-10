// intake/index.ts — public surface of the trade-generic intake framework (Design Studio, T-65).

export type * from './types.js';
export { FIELD_HANDLERS, areaMetrics, handlerFor, isAiField, seededRng } from './fields.js';
export {
  allFields, applyPatch, evalCond, isFieldVisible, IntakeVersionError, loadSpec, missingRequired,
  newSpec, sanitizeValues, scopeSpecEnvelope, validateFieldValue, withDefaults,
} from './spec.js';
export { aiFieldsFor, aiSystemPrompt, compileAiSchema, describeFieldsForAi, validateAiReply } from './ai-schema.js';
export type { AiGuideResult, AiMode, AiSuggestion } from './ai-schema.js';
export { compilePrompt, isSafeFragment, PROMPT_MAX_LEN } from './prompt.js';
export { areaComparison, describeArea, describeLength } from './scale.js';
export type { ScaleRef } from './scale.js';
export { baselineRequirements, buildRequirements } from './requirements.js';
export { COMMON_INTAKE_VERSION, commonSteps } from './common-steps.js';
export { DEFAULT_RANGE_POLICY, hasUnverifiedQuantities, priceScope } from './pricing.js';
export type { ScopePricing } from './pricing.js';
export { localizeSteps, summarizeSpec } from './summary.js';
export type { SummaryLine } from './summary.js';
export { generateMany, generateValues } from './sample.js';
export { lintModule, lintRegistry } from './lint.js';
export { getIntakeModule, INTAKE_REGISTRY, listIntakeModules, offerableTrades } from './registry.js';
