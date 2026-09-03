import 'server-only'
// ============================================================================
// C4 · L5 — UN APPEL DE LA CHAÎNE : caché, journalisé, sans outil, revalidé.
// ----------------------------------------------------------------------------
// Quatre exigences se rencontrent dans cette fonction, et une seule est visible
// à l'œil nu :
//
//  · « La MISE EN CACHE DU PRÉFIXE COMMUN est une exigence, pas une astuce :
//    assemble les prompts pour que le préfixe stable se cache — les compteurs
//    `cache lu` / `cache écrit` du journal disent si elle travaille » (piège 50).
//    → le prompt DÉRIVÉ (identique d'une copie à l'autre) part en `prefixe` ; la
//      copie de l'élève, qui change à chaque fois, part en `message`.
//
//  · « Le COÛT se journalise PAR APPEL, dans `api_couts`, qui EXISTE — un lot le
//    réutilise, il n'en crée pas un second » (piège 48). La `phase` dit l'étage ;
//    le nombre d'appels se lit au nombre de lignes.
//
//  · « AUCUN OUTIL ATTACHÉ à ces appels » (`01-` §12) : aucun `tools` n'est
//    jamais passé — c'est vrai par construction, `AppelIA` n'en a pas de champ.
//
//  · « Une sortie NON CONFORME au schéma est REJETÉE ET RELANCÉE, jamais
//    interprétée » (`01-` §12) : la relance est ici, et elle est bornée.
//
// ⚠️ Les DEUX TEMPS DE CODE de la chaîne ne passent jamais par ici : « ce ne sont
//    pas des appels », et ils ne journalisent rien (`07-` §1.2 ; piège 6).
// ============================================================================

import { fournisseurPour, type UsageIA } from '@/utils/ia-fournisseur'
import { PLAFOND_SORTIE_DEFAUT, motifDeTroncature, plafondApresTroncature } from './plafond-sortie'
import { enregistrerCoutApi, coutSelonModele, normaliserUsage } from '@/utils/cout-api'
import { validerSortie, direRefus, type Forme } from './schema'
import type { Phase, Version } from './types'

export interface DemandeAppel {
  /**
   * L'étage. `null` est LICITE et n'est pas un oubli : « la `phase` dit l'étage
   * […] NULL hors exercices » (`07-` §1.2), et la contrainte en base n'admet que
   * `p1`, `p2`, `retour` ou NULL. La TRANSCRIPTION (C4-L4) est dans un exercice
   * sans être un étage de la chaîne : elle écrit `phase` NULL avec son
   * `depot_id` renseigné — « un coût non attribuable reste une ligne valide ».
   */
  phase: Phase | null
  modele: string
  /** Le rôle, court et invariant. Il n'est pas caché : il ne pèse rien. */
  systeme: string
  /**
   * LE PRÉFIXE STABLE — le prompt dérivé de la fiche, ou le gabarit dérivé du
   * §4. Identique d'une copie à l'autre, donc cachable ; c'est lui qui remplit
   * les compteurs `cache lu` / `cache écrit`.
   */
  prefixeCacheable: string
  /** Ce qui change à chaque copie : les blocs de matériau balisés, et la demande. */
  message: string
  /**
   * C4-L4 — les photos d'une copie manuscrite, quand l'appel en porte.
   * ⚠️ Elles ne vont JAMAIS dans le préfixe cacheable : elles changent à chaque
   *    copie, et les cacher ferait payer une écriture pour zéro relecture.
   */
  images?: { base64: string; mime: 'image/jpeg' | 'image/png' | 'image/webp' }[]
  forme: Forme
  maxTokensSortie?: number
  /** L'attribution du coût. Tout est facultatif : un coût non attribuable reste valide. */
  attribution: {
    module: string
    eleveId?: string | null
    classeId?: string | null
    depotId?: string | null
    competence?: string | null
    version?: Version | null
  }
  /** Le plafond de relances sur sortie non conforme. Une relance n'est pas gratuite. */
  relancesMax?: number
}

export interface ResultatAppel<T> {
  valeur: T
  /** Le nombre d'appels RÉELLEMENT dépensés — donc de lignes écrites au journal. */
  appels: number
  usage: UsageIA
  modele: string
}

export class SortieNonConforme extends Error {
  readonly motifs: string[]
  /** Les appels RÉELLEMENT dépensés avant l'abandon — l'appelant les compte. */
  readonly appels: number
  constructor(motifs: string[], appels: number) {
    super(`Sortie non conforme au schéma après relance : ${motifs.join(' | ')}`)
    this.motifs = motifs
    this.appels = appels
  }
}

/** Un appel qui n'a pas abouti au transport — 429, coupure, délai dépassé. */
export class AppelInterrompu extends Error {
  readonly appels: number
  constructor(message: string, appels: number) {
    super(message)
    this.appels = appels
  }
}

const USAGE_NUL: UsageIA = { entree: 0, sortie: 0, cacheLecture: 0, cacheEcriture5m: 0, cacheEcriture1h: 0 }

// ⭐ La règle du plafond vit dans un module PUR — `plafond-sortie.ts` —, parce
//    que ce fichier-ci est `server-only` et que rien de ce qu'il contient n'est
//    éprouvé par `npm test`. Le motif complet est à l'en-tête de ce module.

/**
 * Un appel, et son journal. Rend la valeur VALIDÉE — jamais une sortie brute.
 *
 * Le journal est écrit APRÈS chaque appel, y compris quand la sortie est
 * rejetée : un appel rejeté a coûté, et un coût qu'on ne journalise pas est un
 * coût qu'on ne verra jamais.
 */
export async function appeler<T>(d: DemandeAppel): Promise<ResultatAppel<T>> {
  const fournisseur = fournisseurPour(d.modele)
  const relancesMax = d.relancesMax ?? 1
  const motifs: string[] = []
  let appels = 0
  let cumul: UsageIA = { ...USAGE_NUL }

  // ⭐⭐ LE PLAFOND DE SORTIE, ET IL SE RELÈVE QUAND LE MODÈLE A ÉTÉ COUPÉ.
  //
  // ⛔⛔ CE QUE LE PLAFOND FIGÉ COÛTAIT, MESURÉ EN PRODUCTION LE 31/08.
  //    `max_tokens` valait 2 000 à l'appel ET à la relance. Quand P1 dépassait,
  //    la sortie tronquée était rejetée par le schéma, la relance repartait avec
  //    le MÊME plafond, retombait dessus — et la compétence disparaissait des
  //    mesures **sans que rien ne le dise**, le job restant `abouti`.
  //    Sur le dépôt `c1431dc5` : deux appels `p1 / structure` à exactement
  //    2 000 jetons, zéro appel `p2`, et `structure` absente du retour d'un
  //    élève qui l'avait pourtant travaillée. Sur `22322ca8`, la même troncature
  //    est passée de justesse à 1 906 : le défaut est INTERMITTENT, donc il ne
  //    se voit pas en relisant les journaux d'un bon jour.
  //
  // ⭐ LA RÈGLE : une troncature double le plafond pour la relance, jusqu'à
  //    `PLAFOND_SORTIE_MAX`. On ne part PAS d'emblée au plafond haut — la
  //    sortie se facture au jeton, et 2 000 suffisent à la quasi-totalité des
  //    appels (médiane mesurée : 750, p90 : 1 192). *On paie le plafond haut
  //    seulement là où il est nécessaire, et on ne perd plus rien nulle part.*
  const plafondInitial = d.maxTokensSortie ?? PLAFOND_SORTIE_DEFAUT
  let plafond = plafondInitial
  let derniereTronquee = false

  for (let essai = 0; essai <= relancesMax; essai++) {
    const message = essai === 0 ? d.message : `${d.message}\n\n${rappelDeSchema(motifs, d.forme)}`
    let texte: string
    let usage: UsageIA
    try {
      const r = await fournisseur.repondre(d.modele, {
        systeme: d.systeme,
        prefixe: d.prefixeCacheable,
        suffixeDynamique: '',
        historique: [],
        message,
        maxTokensSortie: plafond,
        images: d.images,
      })
      texte = r.texte
      usage = r.usage
      derniereTronquee = r.tronquee === true
    } catch (e) {
      // Un appel qui lève A COÛTÉ, et son usage est perdu au transport. On ne
      // peut pas le journaliser (aucun compteur ne revient) — mais on refuse de
      // le taire : sans cette trace, la ligne manquante d'`api_couts` fait
      // sous-compter le plafond par dépôt, qui se lit AU NOMBRE DE LIGNES.
      appels += 1
      const motif = e instanceof Error ? e.message : String(e)
      console.error(`[chaine] APPEL INTERROMPU AU TRANSPORT — phase=${d.phase} modele=${d.modele} `
        + `depot=${d.attribution.depotId ?? '?'} competence=${d.attribution.competence ?? '?'} : ${motif}. `
        + "Le coût de cet appel n'est pas journalisé : le fournisseur n'a rendu aucun usage.")
      throw new AppelInterrompu(motif, appels)
    }
    appels += 1
    cumul = cumuler(cumul, usage)
    await journaliser(d, usage)

    const verdict = validerSortie<T>(texte, d.forme)
    if (verdict.ok) return { valeur: verdict.valeur, appels, usage: cumul, modele: d.modele }
    motifs.push(direRefus(verdict.refus))

    // ⭐ La troncature se DIT dans le motif — sans quoi l'alerte du bilan
    //    annoncerait « sortie non conforme » sur un modèle qui n'avait rien fait
    //    de mal, et personne ne chercherait du côté du plafond.
    if (derniereTronquee) {
      const avant = plafond
      plafond = plafondApresTroncature(plafond, plafondInitial)
      motifs.push(motifDeTroncature(avant, plafond))
      console.error(`[chaine] SORTIE TRONQUÉE — phase=${d.phase} modele=${d.modele} `
        + `depot=${d.attribution.depotId ?? '?'} competence=${d.attribution.competence ?? '?'} : `
        + `coupée à ${avant} jetons, relance à ${plafond}.`)
    }
  }
  throw new SortieNonConforme(motifs, appels)
}

/** La relance dit CE QUI a été refusé — elle ne réinterprète jamais la sortie. */
function rappelDeSchema(motifs: readonly string[], forme: Forme): string {
  // ⚠️ Sur une sortie BRUTE, la relance ne peut pas réclamer du JSON : le format
  //    de réponse est celui du prompt, dont le corps est verrouillé (C4-L4).
  //    Elle rappelle donc le format DU PROMPT, sans en réécrire une ligne.
  const consigne = forme.type === 'texte_brut'
    ? 'Réponds de nouveau en suivant EXACTEMENT la section « Format de réponse » ci-dessus.'
    : forme.type === 'objet_ouvert'
      ? 'Rends UNIQUEMENT le JSON demandé, sans texte autour, avec TOUTES les clés du format déclaré.'
      : 'Rends UNIQUEMENT le JSON demandé, sans texte autour, sans clé supplémentaire.'
  return [
    'TA RÉPONSE PRÉCÉDENTE A ÉTÉ REJETÉE — elle ne respecte pas le format demandé :',
    motifs[motifs.length - 1],
    consigne,
  ].join('\n')
}

function cumuler(a: UsageIA, b: UsageIA): UsageIA {
  return {
    entree: a.entree + b.entree,
    sortie: a.sortie + b.sortie,
    cacheLecture: a.cacheLecture + b.cacheLecture,
    cacheEcriture5m: a.cacheEcriture5m + b.cacheEcriture5m,
    cacheEcriture1h: a.cacheEcriture1h + b.cacheEcriture1h,
  }
}

async function journaliser(d: DemandeAppel, usage: UsageIA): Promise<void> {
  const cout = coutSelonModele(d.modele, usage)
  if (!(cout > 0)) {
    // ⚠️ `enregistrerCoutApi` sort sur un coût nul — c'est le contrat du journal
    //    transverse, écrit par quatorze autres sites, et ce lot ne le change pas.
    //    Conséquence à connaître : « le nombre d'appels d'un étage se lit au
    //    nombre de lignes » (§1.2) devient faux pour cet appel-là. On le dit.
    console.error(`[chaine] appel à COÛT NUL — aucune ligne d'api_couts : phase=${d.phase} `
      + `modele=${d.modele} depot=${d.attribution.depotId ?? '?'}. Le fournisseur n'a pas rendu `
      + "d'usage exploitable ; le plafond d'appels par dépôt sous-comptera d'autant.")
  }
  await enregistrerCoutApi(d.attribution.module, cout, {
    eleveId: d.attribution.eleveId ?? null,
    classeId: d.attribution.classeId ?? null,
    modele: d.modele,
    tokens: normaliserUsage(usage),
    phase: d.phase,
    depotId: d.attribution.depotId ?? null,
    competence: d.attribution.competence ?? null,
    version: d.attribution.version ?? null,
  })
}
