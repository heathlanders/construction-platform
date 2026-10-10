// intake/requirements.ts — the client-facing "everything needed to get it done" checklist.
//
// Baseline items are DERIVED (taxonomy permit_trade/category + module location + common answers), so
// every trade gets them for free; a module only adds what is specific to its work. The jurisdiction
// engine supplies the permit office's contact but NOT permit likelihood — that's the module's
// permit_rule (default 'depends'). Wording always defers to the contractor to confirm.

import { tradeDef } from '../trades/taxonomy.js';
import type {
  Derived, PermitLikelihood, ReqCtx, RequirementItem, SpecValues, TradeIntakeModule,
} from './types.js';

const PERMIT_TEXT: Record<PermitLikelihood, { title: { en: string; es: string }; body: { en: string; es: string } }> = {
  likely: {
    title: { en: 'A permit is likely needed', es: 'Probablemente se necesita un permiso' },
    body: { en: 'Work like this usually needs a permit from your city or county. Your contractor will confirm and handle it.',
      es: 'Un trabajo así normalmente requiere un permiso de su ciudad o condado. Su contratista lo confirmará y lo tramitará.' },
  },
  depends: {
    title: { en: 'A permit may be needed', es: 'Puede que se necesite un permiso' },
    body: { en: 'Whether a permit is needed depends on your local rules and the final size. Your contractor will confirm.',
      es: 'Si se necesita un permiso depende de las reglas locales y del tamaño final. Su contratista lo confirmará.' },
  },
  unlikely: {
    title: { en: 'A permit is usually not needed', es: 'Normalmente no se necesita permiso' },
    body: { en: 'Most areas do not require a permit for this, but your contractor will double-check local rules.',
      es: 'En la mayoría de lugares no se requiere permiso para esto, pero su contratista revisará las reglas locales.' },
  },
};

export function baselineRequirements(
  module: TradeIntakeModule, values: SpecValues, derived: Derived, ctx: ReqCtx,
): RequirementItem[] {
  const def = tradeDef(module.trade_key);
  const items: RequirementItem[] = [];
  const base = { source: 'baseline' } as const;

  if (def?.permit_trade) {
    const likelihood = module.permit_rule?.(values, derived) ?? 'depends';
    const t = PERMIT_TEXT[likelihood];
    const office = ctx.ahj?.name
      ? { en: ` Local permit office: ${ctx.ahj.name}${ctx.ahj.phone ? ` (${ctx.ahj.phone})` : ''}.`,
          es: ` Oficina local de permisos: ${ctx.ahj.name}${ctx.ahj.phone ? ` (${ctx.ahj.phone})` : ''}.` }
      : { en: '', es: '' };
    items.push({
      ...base, id: 'permit', level: likelihood === 'likely' ? 'required' : likelihood === 'depends' ? 'likely' : 'info',
      owner: 'contractor', title: t.title, body: { en: t.body.en + office.en, es: t.body.es + office.es },
    });
  }

  if (module.disturbs_ground ?? def?.category === 'sitework') {
    items.push({
      ...base, id: 'call_811', level: 'required', owner: 'contractor',
      title: { en: 'Underground utilities marked (811)', es: 'Marcado de servicios subterráneos (811)' },
      body: { en: 'Before any digging, buried gas, power and water lines must be marked by calling 811. It is free.',
        es: 'Antes de excavar, se deben marcar las líneas de gas, electricidad y agua llamando al 811. Es gratis.' },
    });
  }

  const exterior = module.location !== 'interior';
  if (exterior && (ctx.common.hoa === 'yes' || ctx.common.hoa === 'unsure')) {
    items.push({
      ...base, id: 'hoa_approval', level: ctx.common.hoa === 'yes' ? 'required' : 'likely', owner: 'client',
      title: { en: 'HOA approval', es: 'Aprobación de la HOA' },
      body: { en: 'Check with your homeowners association — many require approval for outdoor changes before work starts.',
        es: 'Consulte con su asociación de propietarios; muchas exigen aprobación para cambios exteriores antes de empezar.' },
    });
  }

  if (ctx.common.property_type === 'condo' || ctx.common.property_type === 'townhome') {
    items.push({
      ...base, id: 'association_approval', level: 'likely', owner: 'client',
      title: { en: 'Building or association approval', es: 'Aprobación del edificio o la asociación' },
      body: { en: 'Shared buildings often need management approval for contractor work.',
        es: 'Los edificios compartidos suelen requerir aprobación de la administración para obras.' },
    });
  }

  if (ctx.common.ownership === 'rent') {
    items.push({
      ...base, id: 'owner_authorization', level: 'required', owner: 'client',
      title: { en: "Property owner's permission", es: 'Permiso del dueño de la propiedad' },
      body: { en: 'Because you rent, the property owner must approve the work in writing.',
        es: 'Como usted renta, el dueño de la propiedad debe aprobar el trabajo por escrito.' },
    });
  }

  items.push(
    {
      ...base, id: 'site_access', level: 'info', owner: 'client',
      title: { en: 'Site access', es: 'Acceso al lugar' },
      body: { en: 'Crews need clear access to the work area; plan for pets, vehicles and gates on work days.',
        es: 'El equipo necesita acceso libre al área de trabajo; considere mascotas, vehículos y portones esos días.' },
    },
    {
      ...base, id: 'contract_deposit', level: 'info', owner: 'client',
      title: { en: 'Contract and deposit', es: 'Contrato y depósito' },
      body: { en: 'Your contractor will send a written proposal. Work is scheduled after you approve it and any deposit is paid.',
        es: 'Su contratista le enviará una propuesta por escrito. El trabajo se programa cuando la apruebe y pague el depósito.' },
    },
    {
      ...base, id: 'concept_only', level: 'info', owner: 'client',
      title: { en: 'Pictures are concepts', es: 'Las imágenes son conceptos' },
      body: { en: 'Generated pictures show the idea, not exact sizes. Your contractor will verify measurements on site.',
        es: 'Las imágenes generadas muestran la idea, no medidas exactas. Su contratista verificará las medidas en el lugar.' },
    },
  );
  return items;
}

/** Baseline + module extras, de-duplicated by id (module wins). */
export function buildRequirements(module: TradeIntakeModule, values: SpecValues, derived: Derived, ctx: ReqCtx): RequirementItem[] {
  const extras = (module.requirements?.(values, derived, ctx) ?? []).map((r) => ({ ...r, source: module.trade_key }));
  const byId = new Map<string, RequirementItem>();
  for (const r of [...baselineRequirements(module, values, derived, ctx), ...extras]) byId.set(r.id, r);
  return [...byId.values()];
}
