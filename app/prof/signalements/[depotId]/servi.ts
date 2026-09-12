// ============================================================================
// CE QUI EST SERVI À L'ÉLÈVE, ET D'OÙ ÇA VIENT — la dérivation du formulaire.
// ----------------------------------------------------------------------------
// ⭐⭐ Louis, 11/09 : « je dois pouvoir corriger ce que l'élève a vu, pas des
//    trucs qu'il n'a pas vus ». Le formulaire ne part donc PAS de la fiche de
//    l'instance : il part de la VUE (ce que le chargeur a composé pour ce dépôt),
//    et pour chaque chose servie il dit sa SOURCE — l'instance, qui s'édite
//    ici ; le gabarit ou le pilote, qui viennent de la banque ; le matériau,
//    partagé entre exercices.
//
// ⚠️ MESURÉ le 11/09 : 159 des 183 matériaux du bac à sable (174/243 en prod)
//    servent au moins DEUX exercices. Corriger un matériau ici corrigerait des
//    exercices que le professeur n'a pas sous les yeux : il reste en lecture.
// ============================================================================

import type { VueDuDeroule } from '@/utils/deroule/vue'
import type { Jeton } from '@/utils/deroule/balisage'
import type { EditionDeLInstance } from '@/app/prof/conception/[id]/charger-edition'

export type Source = 'instance' | 'gabarit' | 'pilote' | 'materiau' | 'doctrine'

export interface CasServiPourCorrection {
  ordre: number
  /** La consigne telle que servie, en texte. */
  consigneServie: string
  consigneSource: Source
  /** La consigne STOCKÉE sur l'instance (= servie quand la source est l'instance). */
  consigneStockee: string
  /** Les candidats servis à cet élève (crans à choix), dans l'ordre servi ; vide sinon. */
  candidatsServis: string[]
  candidatsSource: Source | null
  /** La banque de distracteurs stockée (une par ligne) et la réponse attendue — éditables quand la source est l'instance. */
  distracteursStockes: string
  reponseAttendue: string | null
  /** Le matériau servi, en texte ; `null` quand aucun. */
  materiau: string | null
  /** Les pièces d'un texte à trou, quand il y en a. */
  pieces: Array<{ nom: string; texte: string }> | null
  /** Ce qui est préservé sans être montré (le formulaire les renvoie tels quels). */
  defaut: string | null
  pourquoiJuste: string | null
}

export interface ServiPourCorrection {
  id: string
  lieu: string
  optinSeJuger: boolean
  optinConfiance: boolean
  sansCran: boolean
  paire: boolean
  gabaritActif: boolean
  pilote: boolean
  clesDuGabarit: string[]
  sujet: string | null
  texteSupport: string | null
  guideServi: string | null
  guideSource: Source
  /** Le guide stocké sur l'instance, éditable quand la doctrine du cran en sert un. */
  guideStocke: string | null
  guideEditable: boolean
  cas: CasServiPourCorrection[]
}

const texteDesJetons = (j: Jeton[]): string =>
  j.map((x) => (x.type === 'saut' ? '\n' : x.texte)).join('')

export function deriverCeQuiEstServi(
  vue: VueDuDeroule, edition: EditionDeLInstance,
): ServiPourCorrection {
  const pilote = !!vue.piloteArgument
  const gabaritActif = vue.gabarit.actif
  const source: Source = pilote ? 'pilote' : gabaritActif ? 'gabarit' : 'instance'
  const guideEditable = !pilote && !gabaritActif && edition.guideExige !== 'null'

  const cas: CasServiPourCorrection[] = vue.cas.map((c, i) => {
    const stocke = edition.cas[i]
    const candidats = c.credence && !c.credence.empechement ? c.credence.candidats : []
    return {
      ordre: c.ordre,
      consigneServie: texteDesJetons(c.consigne),
      consigneSource: source,
      consigneStockee: stocke?.consigne ?? '',
      candidatsServis: candidats,
      candidatsSource: candidats.length > 0 ? (gabaritActif ? 'gabarit' : 'instance') : null,
      distracteursStockes: stocke?.distracteurs ?? '',
      reponseAttendue: stocke?.reponseAttendue ?? null,
      materiau: c.materiau && c.materiau.length > 0 ? c.materiau.map((s) => s.texte).join('') : null,
      pieces: c.pieces ? c.pieces.pieces.map((p) => ({ nom: p.nom, texte: p.texte })) : null,
      defaut: stocke?.defaut ?? null,
      pourquoiJuste: stocke?.pourquoiJuste ?? null,
    }
  })

  // ⚠️ Une vue peut porter MOINS de cas que l'instance (pilote : aucun). Les cas
  //    stockés non servis sont quand même renvoyés au formulaire — cachés — pour
  //    que l'enregistrement ne les efface pas (`editerInstance` exige n cas).
  for (const stocke of edition.cas) {
    if (cas.some((c) => c.ordre === stocke.ordre)) continue
    cas.push({
      ordre: stocke.ordre, consigneServie: '', consigneSource: source,
      consigneStockee: stocke.consigne, candidatsServis: [], candidatsSource: null,
      distracteursStockes: stocke.distracteurs, reponseAttendue: stocke.reponseAttendue,
      materiau: null, pieces: null, defaut: stocke.defaut, pourquoiJuste: stocke.pourquoiJuste,
    })
  }
  cas.sort((a, b) => a.ordre - b.ordre)

  return {
    id: edition.id, lieu: edition.lieu,
    optinSeJuger: edition.optinSeJuger, optinConfiance: edition.optinConfiance,
    sansCran: edition.sansCran, paire: edition.paire,
    gabaritActif, pilote, clesDuGabarit: edition.clesDuGabarit,
    sujet: vue.sujet,
    texteSupport: vue.texteSupport ? texteDuSupport(vue.texteSupport) : null,
    guideServi: vue.guide,
    guideSource: vue.guide === null ? 'instance' : source,
    guideStocke: edition.guide,
    guideEditable,
    cas,
  }
}

function texteDuSupport(t: unknown): string | null {
  if (typeof t === 'string') return t
  if (t && typeof t === 'object') {
    const o = t as Record<string, unknown>
    for (const k of ['texte', 'extrait', 'contenu']) if (typeof o[k] === 'string') return o[k] as string
  }
  return null
}
