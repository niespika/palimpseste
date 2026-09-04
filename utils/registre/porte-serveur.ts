import 'server-only'
// ============================================================================
// C7 · L5 — LA PORTE DES CRANS, LUE EN BASE POUR UN ÉLÈVE. La règle est à
// `porte.ts` ; ici, les lectures — TOLÉRANTES, et derrière `gabarit_actif`.
// ----------------------------------------------------------------------------
// Trois choses à lire, une fois, à la construction du cycle (`01-` §5) :
//   · le registre des réussites (`reussites-serveur.ts`) ;
//   · les objets DÉJÀ servis avant ce cycle — la semaine de méthode est la
//     première où un objet est servi (`assigne_at` < lundi du cycle) ;
//   · les sondes de montée déjà reçues par objet × cran, lues au journal des
//     décisions (`sondes_retenues[].sonde_montee`), pour borner à trois.
// ⛔ Porte fermée (`gabarit_actif` OFF) : `actif: false`, et la couche 4 ne
//    change rien — la banque du 31/08 se sert sous l'ancien régime.
// ============================================================================
import type { createAdminClient } from '@/utils/supabase/admin'
import { cranNumero } from '@/utils/cran'
import { lireLaPorteGabarit } from '@/utils/gabarit/porte'
import { lireLeRegistreDesReussites } from './reussites-serveur'
import { porteDeLObjet, type PorteDUnObjet } from './porte'
import type { LigneRegistre } from './reussites'

type Admin = ReturnType<typeof createAdminClient>

export interface PorteDesCrans {
  actif: boolean
  registre: LigneRegistre[]
  /** Les objets servis à l'élève AVANT ce cycle. */
  dejaServis: Set<string>
  /** `objet|cran` → nombre de sondes de montée déjà reçues. */
  sondesServies: Map<string, number>
  incidents: string[]
  /** La porte d'un objet, calculée à la demande et mémorisée. */
  de: (objet: string) => PorteDUnObjet
}

export async function lireLaPorteDesCrans(
  admin: Admin, eleveId: string, cycleLundi: string,
): Promise<PorteDesCrans> {
  const incidents: string[] = []
  const actif = await lireLaPorteGabarit(admin)
  const inerte: PorteDesCrans = {
    actif: false, registre: [], dejaServis: new Set(), sondesServies: new Map(), incidents,
    de: (objet) => ({ objet, ouverts: [], sondes: [], methode: false }),
  }
  if (!actif) return inerte

  const { registre, incidents: inc } = await lireLeRegistreDesReussites(admin, eleveId)
  incidents.push(...inc)

  // Les objets déjà servis avant ce cycle — ⭐ Louis, 04/09 : SUR LES SEULS
  //    EXERCICES DU GABARIT (un cas à `probleme`). L'ancienne banque ne compte
  //    pas : chaque élève vit sa semaine de méthode avec les exercices neufs,
  //    même s'il a déjà vu l'objet sous l'ancien régime.
  const dejaServis = new Set<string>()
  const { data: depots, error: eD } = await admin.from('exercices_depots')
    .select('assigne_at, exercices(exercices_types(code), exercices_cas(probleme))')
    .eq('eleve_id', eleveId).lt('assigne_at', `${cycleLundi}T00:00:00Z`)
  if (eD) incidents.push(`objets déjà servis illisibles (${eD.code}) : tous les objets passent en semaine de méthode`)
  const un = <T,>(x: unknown): T | null => (Array.isArray(x) ? (x[0] ?? null) : (x as T | null))
  for (const d of (depots ?? []) as unknown as Array<{ exercices: unknown }>) {
    const ex = un<{ exercices_types: unknown; exercices_cas: unknown }>(d.exercices)
    const cas = Array.isArray(ex?.exercices_cas) ? ex!.exercices_cas as Array<{ probleme?: unknown }> : []
    if (!cas.some((c) => typeof c?.probleme === 'string' && c.probleme)) continue
    const code = un<{ code: string }>(ex?.exercices_types)?.code
    if (code) dejaServis.add(code)
  }

  // Les sondes de montée déjà reçues, par objet × cran.
  const sondesServies = new Map<string, number>()
  const { data: decisions, error: eS } = await admin.from('routeur_decisions')
    .select('sondes_retenues, exercices(cran, exercices_types(code))').eq('eleve_id', eleveId)
  if (eS) incidents.push(`sondes déjà servies illisibles (${eS.code}) : la borne des sondes ne s'applique pas`)
  for (const d of (decisions ?? []) as unknown as Array<{ sondes_retenues: unknown; exercices: unknown }>) {
    const s = Array.isArray(d.sondes_retenues) ? d.sondes_retenues as Array<{ sonde_montee?: boolean }> : []
    if (!s.some((x) => x?.sonde_montee === true)) continue
    const ex = un<{ cran: unknown; exercices_types: unknown }>(d.exercices)
    const code = un<{ code: string }>(ex?.exercices_types)?.code
    const cran = cranNumero(ex?.cran as never)
    if (!code || cran == null) continue
    const k = `${code}|${cran}`
    sondesServies.set(k, (sondesServies.get(k) ?? 0) + 1)
  }

  const memo = new Map<string, PorteDUnObjet>()
  return {
    actif: true, registre, dejaServis, sondesServies, incidents,
    de: (objet) => {
      const deja = memo.get(objet)
      if (deja) return deja
      const parCran = new Map<number, number>()
      for (const [k, n] of sondesServies) {
        const [o, c] = k.split('|')
        if (o === objet) parCran.set(Number(c), n)
      }
      const p = porteDeLObjet(registre, objet, dejaServis.has(objet), parCran)
      memo.set(objet, p)
      return p
    },
  }
}
