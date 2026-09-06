// ============================================================================
// C7 · L6 / L7 — LE CYCLE, COMPTÉ EN LUNDIS. Module PUR, sans dépendance.
// ----------------------------------------------------------------------------
// « Un devoir servi à un élève au cycle N ne lui est pas resservi avant le
//   cycle N + 2 » (`01-` §8.10) ; « deux et deux se compte sur deux devoirs
//   différents, à UN CYCLE D'ÉCART au moins » (`10-` §7, 06/09). Les deux
//   règles comptent en CYCLES — des semaines entières, de lundi à lundi —,
//   jamais en jours. Le compte vit ici, et `vivier.ts` comme `reussites.ts`
//   l'importent : un seul domicile, et aucun cycle d'import entre les deux.
// ============================================================================

/** Le lundi (UTC) de la semaine d'une date ISO, en `YYYY-MM-DD`. */
export function lundiDe(iso: string): string {
  const d = new Date(iso)
  const j = (d.getUTCDay() + 6) % 7
  d.setUTCDate(d.getUTCDate() - j)
  return d.toISOString().slice(0, 10)
}

/** Les cycles (semaines entières) écoulés entre le lundi d'un dépôt et le lundi du cycle posé. */
export function cyclesEcoules(dernierDepotAt: string, cycleLundi: string): number {
  const a = Date.parse(`${lundiDe(dernierDepotAt)}T00:00:00Z`)
  const b = Date.parse(`${cycleLundi}T00:00:00Z`)
  return Math.floor((b - a) / (7 * 86_400_000))
}
