// blueprint-pdf/project-name.ts — derive a project NAME from extracted build-address parts.
//
// Format: "Lot <N> - <street>, <city>" e.g. "Lot 25 - 437 Maple St, Madison".
// Partial fallback: missing pieces are dropped. Returns null when nothing usable
// (caller keeps the existing project name). Shared by the analyze worker, the
// blueprint import route, and the backfill script — one source of truth.

function titleCaseCity(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

export function composeProjectName(parts: {
  lot_number: string | null;
  street_address: string | null;
  city: string | null;
}): string | null {
  const street = parts.street_address?.trim() || null;       // already Title-Cased by extractor
  const city = parts.city?.trim() ? titleCaseCity(parts.city) : null;
  const lot = parts.lot_number?.trim() || null;

  const streetCity = [street, city].filter(Boolean).join(', ');
  const core = lot
    ? streetCity
      ? `Lot ${lot} - ${streetCity}`
      : `Lot ${lot}`
    : streetCity;

  const name = core.trim();
  return name ? name.slice(0, 255) : null;
}
