// ============================================================================
// C7 · L1 — LE JUGE DU CRAN, côté serveur : l'appel, l'écriture du verdict sur le
// dépôt, sa relecture. La règle est à `juge-cran.ts`.
// ----------------------------------------------------------------------------
// ⚠️ `phase` NULL : le juge n'est aucun des trois étages, et la contrainte en
//    base n'admet que `p1`, `p2`, `retour` ou NULL (piège 19 ; même patron que
//    la transcription, `utils/passation/transcription.ts`). Le coût s'attribue
//    au module `exercices-chaine-juge`, avec le dépôt, l'élève et la version.
// ⚠️ ÉCRITURE SÉPARÉE ET TOLÉRANTE sur `exercices_depots.verdicts_cran`
//    (`c7_l1_juge_documents.sql`) : colonne absente ou illisible ⇒ le verdict
//    part en alerte et le retour est servi quand même. Rien ici ne lève.
// ============================================================================
import type { createAdminClient } from '@/utils/supabase/admin'
import { appeler, AppelInterrompu, SortieNonConforme } from './appel'
import type { ContexteDepot } from './contexte'
import type { Version } from './types'
import {
  assemblerLeJuge, controlerLeVerdict, fusionnerLesVerdicts, JUGE_AUX_CRANS, lireLesVerdicts,
  type EntreeJuge, type VerdictBrut, type VerdictCran,
} from './juge-cran'

type Admin = ReturnType<typeof createAdminClient>

export const MODULE_COUT_JUGE = 'exercices-chaine-juge'

export interface AttributionJuge {
  eleveId: string; classeId: string | null; depotId: string; version: Version
}

/** L'entrée du juge, dérivée du contexte du dépôt — ce que `lireContexte` a lu. */
export function entreeDuContexte(ctx: ContexteDepot, version: Version, production: string): EntreeJuge {
  return {
    cran: ctx.cran ?? 0,
    version,
    consigne: ctx.consigne,
    production,
    productionV1: version === 'vf' ? ctx.productionV1 : null,
    cas: ctx.casPourLeRetour.map((c) => ({
      ordre: c.ordre, materiau: c.materiau, versionCorrigee: c.versionCorrigee, defaut: c.defaut,
      reponseAttendue: c.reponseAttendue, passageFautif: c.passageFautif, zone: c.zone, choix: c.choix,
    })),
    texteSupport: ctx.texteSupport?.texte ?? null,
  }
}

/**
 * UN appel, UN verdict contrôlé — sans rien écrire. C'est ce que le banc rejoue
 * sur des dépôts existants, avec et sans documents.
 */
export async function jugerUneEntree(
  admin: Admin, a: { entree: EntreeJuge; modele: string; attribution: AttributionJuge },
): Promise<{ verdict: VerdictBrut | null; appels: number; alertes: string[] }> {
  const p = assemblerLeJuge(a.entree)
  try {
    const r = await appeler<VerdictBrut>({
      phase: null,
      modele: a.modele,
      systeme: p.systeme,
      prefixeCacheable: p.prefixeCacheable,
      message: p.message,
      forme: p.forme,
      maxTokensSortie: 700,
      attribution: {
        module: MODULE_COUT_JUGE, eleveId: a.attribution.eleveId, classeId: a.attribution.classeId,
        depotId: a.attribution.depotId, competence: null, version: a.attribution.version,
      },
      relancesMax: 1,
    })
    const c = controlerLeVerdict(r.valeur, { cran: a.entree.cran, production: a.entree.production })
    return { verdict: c.verdict, appels: r.appels, alertes: c.alertes }
  } catch (e) {
    if (e instanceof SortieNonConforme) {
      return { verdict: null, appels: e.appels, alertes: [`juge du cran : sortie non conforme après relance — ${e.motifs.join(' | ')}`] }
    }
    if (e instanceof AppelInterrompu) {
      return { verdict: null, appels: (e as { appels?: number }).appels ?? 0,
        alertes: [`juge du cran : appel interrompu — ${e.message}`] }
    }
    return { verdict: null, appels: 0, alertes: [`juge du cran : ${(e as Error).message}`] }
  }
}

/**
 * Le juge du cran, dans la chaîne : il tranche, et écrit son verdict sur le dépôt.
 * Jamais d'exception — un juge qui manque ne prive pas l'élève de son retour.
 */
export async function jugerLeCran(
  admin: Admin,
  a: { ctx: ContexteDepot; version: Version; modele: string; production: string; sansEcriture?: boolean },
): Promise<{ verdict: VerdictCran | null; appels: number; alertes: string[] }> {
  const { ctx } = a
  if (ctx.cran == null || !JUGE_AUX_CRANS.has(ctx.cran)) return { verdict: null, appels: 0, alertes: [] }
  const r = await jugerUneEntree(admin, {
    entree: entreeDuContexte(ctx, a.version, a.production), modele: a.modele,
    attribution: { eleveId: ctx.eleveId, classeId: ctx.classeId, depotId: ctx.depotId, version: a.version },
  })
  if (!r.verdict) return { verdict: null, appels: r.appels, alertes: r.alertes }
  const verdict: VerdictCran = {
    ...r.verdict, version: a.version, cran: ctx.cran, at: new Date().toISOString(), modele: a.modele,
  }
  const alertes = [...r.alertes]
  if (a.sansEcriture !== true) {
    const e = await ecrireLeVerdict(admin, ctx.depotId, verdict)
    if (e) alertes.push(`verdict du cran NON écrit sur le dépôt : ${e}`)
  }
  return { verdict, appels: r.appels, alertes }
}

/** Lit, fusionne, écrit — sans jamais lever. Rend le motif de l'échec, ou `null`. */
async function ecrireLeVerdict(admin: Admin, depotId: string, verdict: VerdictCran): Promise<string | null> {
  const { data, error } = await admin.from('exercices_depots')
    .select('verdicts_cran').eq('id', depotId).maybeSingle()
  if (error) return `${error.code} ${error.message}`
  const fusion = fusionnerLesVerdicts((data as { verdicts_cran?: unknown } | null)?.verdicts_cran, verdict)
  const { error: e2 } = await admin.from('exercices_depots')
    .update({ verdicts_cran: fusion, updated_at: new Date().toISOString() }).eq('id', depotId)
  return e2 ? `${e2.code} ${e2.message}` : null
}

/** Les verdicts déjà écrits sur un dépôt — `{}` sur toute erreur, colonne absente comprise. */
export async function lireLesVerdictsDuDepot(
  admin: Admin, depotId: string,
): Promise<Partial<Record<Version, VerdictCran>>> {
  const { data, error } = await admin.from('exercices_depots')
    .select('verdicts_cran').eq('id', depotId).maybeSingle()
  if (error) return {}
  return lireLesVerdicts((data as { verdicts_cran?: unknown } | null)?.verdicts_cran)
}
