// ============================================================================
// CE QUE LE FORMULAIRE « Corriger l'instance » REÇOIT — chargé UNE fois, servi
// à DEUX écrans : `/prof/conception/[id]` et `/prof/signalements/[depotId]`.
// ----------------------------------------------------------------------------
// ⭐ 11/09 — « Corriger une instance se fait à l'écran — c'est aussi LE SEUL
//    CHEMIN » (`07-` §1.1). Le second écran ne redouble pas le formulaire : il
//    le réemploie, et il en reçoit les données par CE module, pour que les deux
//    ne divergent jamais sur ce qu'ils montrent et ce qu'ils écrivent.
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import { chargerDoctrineDepuisBase } from '@/utils/fabrique/doctrine'
import { lireLaBanque } from '@/utils/deroule/credence'
import { cranNumero } from '@/utils/cran'
import { lireLeGabaritDuDepot } from '@/utils/gabarit/lecture'

type Ligne = Record<string, unknown>
const txt = (x: unknown): string => (typeof x === 'string' ? x : '')
const oui = (x: unknown): boolean => x === true
const tab = (x: unknown): unknown[] => (Array.isArray(x) ? x : [])
const lig = (x: unknown): Ligne => (typeof x === 'object' && x !== null ? x as Ligne : {})
const jointure = (x: unknown, k: string): Ligne => {
  const v = lig(x)[k]
  return lig(Array.isArray(v) ? v[0] : v)
}

export interface EditionDeLInstance {
  id: string
  paire: boolean
  lieu: string
  guide: string | null
  guideExige: string
  cranCommande: { defaut: boolean; distracteurs: boolean; reponseAttendue: boolean }
  optinSeJuger: boolean
  optinConfiance: boolean
  sansCran: boolean
  consigneSeule: string
  cas: Array<{ ordre: number; consigne: string; defaut: string | null; distracteurs: string
    reponseAttendue: string | null; pourquoiJuste: string | null; materiau: string | null }>
  /** Pour l'en-tête : le type, le cran, son code de doctrine, le statut. */
  entete: { typeLibelle: string; objet: string; cran: number | null; codeCran: string | null
    statut: string; idImport: string; bloque: boolean; blocages: string[] }
  /**
   * ⭐ Les clés du GABARIT portées par les distracteurs (crans 1·2·5·6·8 au
   *    gabarit) : ce que l'élève lit vient alors de `exercices_problemes`
   *    (énoncés) et `exercices_pieces`, PAS de cette instance. Le formulaire le
   *    dit, plutôt que de laisser corriger un champ que l'écran ne sert pas.
   */
  clesDuGabarit: string[]
}

export async function chargerLEditionDeLInstance(
  admin: SupabaseClient, id: string,
): Promise<EditionDeLInstance | null> {
  const d = await chargerDoctrineDepuisBase(admin as never)
  const { data: ex } = await admin.from('exercices')
    .select('*, exercices_types(code, libelle, grain), exercices_cas(*, exercices_materiaux(contenu, defaut, famille, version_corrigee))')
    .eq('id', id).maybeSingle()
  if (!ex) return null
  const e = ex as unknown as Ligne
  const objet = txt(jointure(e, 'exercices_types').code)
  const cran = cranNumero(e.cran)
  const c = cran === null ? undefined : d.crans[cran]
  const casTries = tab(e.exercices_cas).map(lig)
    .sort((a, b) => Number(a.ordre) - Number(b.ordre))
  const consignes = Array.isArray(e.consigne_instanciee)
    ? e.consigne_instanciee.map(txt)
    : [txt(e.consigne_instanciee)]

  // ⭐ Le MÊME lecteur que l'écran élève dit si l'instance est au gabarit, et
  //    quelles clés il traduit — jamais une heuristique sur la forme des chaînes.
  const gabarit = await lireLeGabaritDuDepot(admin, id, cran,
    casTries.map((cs) => ({ ordre: Number(cs.ordre), distracteurs: cs.distracteurs })))
  const clesDuGabarit = gabarit.actif ? [...new Set(gabarit.clesParCas.values())] : []

  return {
    id,
    paire: oui(e.paire_diagnostic),
    lieu: txt(e.lieu),
    guide: e.guide === null ? null : txt(e.guide),
    guideExige: c?.guide ?? 'null',
    cranCommande: {
      defaut: c?.defaut === 'présent',
      distracteurs: c?.distracteurs === 'présent',
      reponseAttendue: c?.reponseAttendue === 'présent',
    },
    optinSeJuger: oui(e.optin_se_juger),
    optinConfiance: oui(e.optin_confiance_remise),
    sansCran: cran === null,
    consigneSeule: consignes[0] ?? '',
    cas: casTries.map((cs, i) => {
      const mat = jointure(cs, 'exercices_materiaux')
      return {
        ordre: Number(cs.ordre),
        consigne: consignes[i] ?? '',
        defaut: cs.defaut === null ? null : txt(cs.defaut),
        // ⭐ La MÊME lecture que l'écran élève (`lireLaBanque`) : sur la forme
        //    d'objet de l'import, `txt()` rendait un textarea VIDE, et enregistrer
        //    DÉTRUISAIT les distracteurs (vu le 24/08).
        distracteurs: Array.isArray(cs.distracteurs) ? lireLaBanque(cs.distracteurs).join('\n') : '',
        reponseAttendue: cs.reponse_attendue === null ? null : txt(cs.reponse_attendue),
        pourquoiJuste: cs.pourquoi_juste === null ? null : txt(cs.pourquoi_juste),
        materiau: mat.defaut
          ? `${mat.famille ? `[${txt(mat.famille)}] ` : ''}${txt(mat.defaut)}`
          : null,
      }
    }),
    entete: {
      typeLibelle: txt(jointure(e, 'exercices_types').libelle) || objet,
      objet, cran, codeCran: c?.code ?? null,
      statut: txt(e.statut), idImport: txt(e.id_import), bloque: oui(e.bloque),
      blocages: tab(e.blocages).map(txt),
    },
    clesDuGabarit,
  }
}
