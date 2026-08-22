import 'server-only'
// ============================================================================
// C4 · L4 — DE LA PHOTO AU TEXTE. Deux passes, un désaccord, aucun jugement.
// ----------------------------------------------------------------------------
// « Un seul prompt transcrit les copies manuscrites, et il fait foi […] Le
//   fichier que l'application exécute en est une COPIE — il ne s'édite jamais de
//   son côté. »                                              — `06-` §4 ; piège 15
//
// Le prompt n'est donc PAS ici : il est DÉRIVÉ de sa source par
// `scripts/derive-instruments.py`, et `--verifie` dit IDENTIQUE ou DIVERGE.
// Rien de ce que ce module envoie n'a été tapé à la main.
//
// ⚠️ DEUX RÉGLAGES DU PROMPT SONT OUVERTS, et ce lot NE LES ARRÊTE PAS.
//    « Son ÉNONCÉ D'USAGE et sa RÈGLE D'ANONYMISATION se règlent AVANT LA
//    PREMIÈRE PASSATION » (manifeste C4-L4 ; `06-` §4). Ce sont des textes de
//    source, pas du code : « propose la rédaction, ne l'arrête pas seul »
//    (piège 17). Ils sont donc servis TELS QUELS, et `avertissementsDuPrompt()`
//    le dit à qui l'appelle — l'écran du professeur le montre avant l'ouverture
//    du dépôt, et le relevé de séance porte les deux propositions.
//
// ⚠️ UN SEUL SOUS-TRAITANT (`06-` §7). Cet appel passe par `utils/chaine/appel.ts`,
//    donc par `utils/ia-fournisseur.ts`, donc par le fournisseur d'intelligence
//    artificielle — et par lui seul. Aucun OCR tiers, aucun service d'images :
//    « tout sous-traitant nouveau demande une information complémentaire aux
//    familles avant tout usage ». (Le Groq de `utils/transcription.ts` transcrit
//    de l'AUDIO pour Fragments ; il n'entre pas ici.)
//
// ⚠️ LE COÛT SE JOURNALISE, ET SA `phase` EST NULLE (piège 19). La `phase` « dit
//    l'étage » — `p1`, `p2`, `retour` —, et la contrainte en base n'admet que
//    ces trois valeurs ou NULL (`c4_l1_existant.sql`, vérifié le 22/08). La
//    transcription est dans un exercice SANS ÊTRE un étage de la chaîne : on
//    écrit donc `phase` NULL avec le `depot_id` renseigné. Si un jour la
//    transcription mérite sa propre valeur d'étage, c'est une décision de
//    source, pas de séance — c'est au relevé.
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import { appeler, AppelInterrompu, SortieNonConforme } from '@/utils/chaine/appel'
import { PROMPT_TRANSCRIPTION } from '@/utils/chaine/derive/transcription'
import { lireConfigPassation } from './config'
import { pagesAvecFichier, rangsManquants, type Photo } from './photos'
import { BUCKET } from './chemins'
import {
  separerDoutes, desaccordDesPasses, blocs, type Doute,
} from './transcription-calcul'

type Admin = SupabaseClient

export interface Transcrite {
  /** Le texte de la copie — retours à la ligne et paragraphes INTACTS. */
  texte: string
  /** L'accord des deux passes, de 0 à 1. `null` si une seule passe a tourné. */
  confiance: number | null
  /** Ce que la machine a peiné à lire : ses doutes déclarés, et ses désaccords. */
  doutes: Doute[]
  /** Le nombre d'appels RÉELLEMENT dépensés — donc de lignes au journal. */
  appels: number
  /** Le nombre de blocs du texte rendu — la preuve du découpage, à la source. */
  nbBlocs: number
  /** Ce qui a coincé sans faire échouer la transcription. */
  alertes: string[]
}

export class TranscriptionImpossible extends Error {
  readonly appels: number
  constructor(message: string, appels = 0) {
    super(message)
    this.appels = appels
  }
}

/**
 * Le prompt, assemblé de ses trois parts DÉRIVÉES.
 *
 * Il n'est pas recomposé : les trois parts sont remises dans leur ordre
 * d'origine, et le résultat est le texte de la source. Le découpage sert à
 * NOMMER les deux parts ouvertes, pas à les changer.
 */
export function promptDeTranscription(): string {
  const p = PROMPT_TRANSCRIPTION
  // Tant qu'aucun des deux réglages n'est arrêté, le texte intégral EST le
  // prompt : on le sert tel quel, sans le recoller nous-mêmes.
  if (!p.enonce_usage_regle && !p.regle_anonymisation_reglee) return p.texte_integral
  // Le jour où l'un des deux sera réglé dans la source, `--ecris` le portera ici
  // et ce chemin rendra le texte intégral de la source NOUVELLE. Il n'existe pas
  // pour permettre à du code de réécrire un prompt.
  return p.texte_integral
}

/**
 * Ce qu'il faut dire au professeur AVANT la première passation, et qui n'est pas
 * un défaut du code : deux réglages de source non arrêtés.
 */
export function avertissementsDuPrompt(): string[] {
  const p = PROMPT_TRANSCRIPTION
  const out: string[] = []
  if (!p.enonce_usage_regle) {
    out.push('L\'ÉNONCÉ D\'USAGE du prompt de transcription n\'est pas encore arrêté : il annonce '
      + '« servira de copie test dans un corpus d\'évaluation », ce qui n\'est plus le cas. '
      + '`06-Palimpseste.md` §4 demande qu\'il soit réglé AVANT la première passation.')
  }
  if (p.regle_anonymisation && !p.regle_anonymisation_reglee) {
    out.push('La RÈGLE D\'ANONYMISATION (règle 9) est encore marquée « supprimer cette règle si '
      + 'inutile » : elle remplace le nom de l\'élève par [nom] en en-tête. À arrêter avant la '
      + 'première passation (`06-Palimpseste.md` §4).')
  }
  return out
}

/** Le rôle, court et invariant — il n'est pas caché : il ne pèse rien. */
const SYSTEME = 'Tu transcris des copies manuscrites d\'élèves de lycée, en français.'

/**
 * Transcrit une copie. DEUX PASSES, LANCÉES ENSEMBLE.
 *
 * ⚠️ EN PARALLÈLE, ET C'EST LA CONDITION DE LATENCE. « La transcription doit
 *    revenir en QUELQUES SECONDES par copie, pendant l'heure de cours »
 *    (`02-` §6.D). Deux passes en série doublent l'attente pour un chiffre —
 *    `confiance_ocr` — qui n'est même pas affiché comme tel (piège 56).
 *
 * ⚠️ LA PASSE RETENUE EST LA PREMIÈRE, et ce prompt-ci ne tranchait pas ce
 *    point : `06-` §4 dit que `confiance_ocr` EST le désaccord des deux passes,
 *    il ne dit pas laquelle des deux se conserve. Retenir la première est le
 *    seul choix qui n'introduise AUCUN jugement — « calculé en code, sans
 *    modèle de jugement » — : élire « la meilleure » demanderait un critère de
 *    qualité, donc un juge. Décision de séance, portée au relevé.
 *    De toute façon, « la mesure porte sur la version corrigée » par l'élève
 *    (`02-` §6.D) : ce que la machine rend est un point de départ, pas un verdict.
 */
export async function transcrire(
  admin: Admin,
  depot: { id: string; eleve_id: string; classe_id?: string | null },
  photos: readonly Photo[] | null,
): Promise<Transcrite> {
  const config = lireConfigPassation()
  const alertes: string[] = []

  const pages = pagesAvecFichier(photos)
  if (pages.length === 0) {
    throw new TranscriptionImpossible(
      'aucune page déposée — une copie sans photo ne se transcrit pas.')
  }
  const manquants = rangsManquants(photos)
  if (manquants.length) {
    alertes.push(`page(s) déclarée(s) manquante(s) : ${manquants.join(', ')} — `
      + 'la transcription ne porte que sur les pages déposées.')
  }

  const images = await telechargerPages(admin, pages)
  if (images.length === 0) {
    throw new TranscriptionImpossible(
      'les pages sont déclarées mais aucune n\'a pu être lue du stockage.')
  }
  if (images.length < pages.length) {
    alertes.push(`${pages.length - images.length} page(s) illisible(s) au stockage — `
      + 'la transcription est partielle, et le professeur doit le savoir.')
  }

  const prompt = promptDeTranscription()
  const demande = {
    // ⚠️ `phase` NULL : la transcription n'est aucun des trois étages, et la
    //    contrainte en base n'admet que `p1`, `p2`, `retour` ou NULL (piège 19).
    phase: null,
    modele: config.modeleTranscription,
    systeme: SYSTEME,
    // Le prompt est le PRÉFIXE STABLE : identique d'une copie à l'autre, donc
    // cachable — trente-cinq copies dans une salle relisent le même préfixe.
    prefixeCacheable: prompt,
    message: consigneDuTour(pages.length, manquants),
    images,
    forme: { type: 'texte_brut' as const, min: 1 },
    maxTokensSortie: 8000,
    attribution: {
      module: 'exercices',
      eleveId: depot.eleve_id,
      classeId: depot.classe_id ?? null,
      depotId: depot.id,
      competence: null,
      version: 'v1' as const,
    },
    // Une seule relance : « une relance n'est pas gratuite », et le format
    // attendu ici est du texte brut — un modèle qui le rate deux fois ne le
    // réussira pas au troisième essai.
    relancesMax: 1,
  }

  const nbPasses = Math.max(1, config.passes)
  if (nbPasses < 2) {
    alertes.push('une seule passe configurée — `confiance_ocr` est alors SANS OBJET '
      + '(« le désaccord entre deux passes », `06-` §4), et reste NULL.')
  }

  const passes = await Promise.allSettled(
    Array.from({ length: nbPasses }, () => appeler<string>({ ...demande })))

  const reussies: Array<{ texte: string; appels: number }> = []
  let appels = 0
  for (const p of passes) {
    if (p.status === 'fulfilled') {
      appels += p.value.appels
      reussies.push({ texte: p.value.valeur, appels: p.value.appels })
      continue
    }
    const e = p.reason
    if (e instanceof AppelInterrompu || e instanceof SortieNonConforme) appels += e.appels
    const motif = e instanceof Error ? e.message : String(e)
    alertes.push(`une passe de transcription a échoué — ${motif}`)
    console.error(`[passation] passe de transcription perdue — dépôt ${depot.id} : ${motif}`)
  }

  if (reussies.length === 0) {
    throw new TranscriptionImpossible(
      `les ${nbPasses} passes de transcription ont échoué — ${alertes.join(' | ')}`, appels)
  }

  const lues = reussies.map((r) => separerDoutes(r.texte))
  const retenue = lues[0]

  let confiance: number | null = null
  const doutes: Doute[] = [...retenue.doutes]
  if (lues.length >= 2) {
    const d = desaccordDesPasses(retenue.transcription, lues[1].transcription)
    confiance = d.confiance
    doutes.push(...d.zones)
    // Le découpage n'est pas comparé pour être noté : il est comparé pour être
    // DIT. Deux passes qui ne voient pas le même nombre de paragraphes sur la
    // même photo est exactement le genre de chose que le professeur doit savoir
    // (`06-` §4 : « une transcription qui fusionne deux paragraphes fabrique
    // une copie sans architecture »).
    const bAvant = blocs(retenue.transcription).length
    const bAutre = blocs(lues[1].transcription).length
    if (bAvant !== bAutre) {
      alertes.push(`les deux passes ne voient pas le même découpage — ${bAvant} bloc(s) contre `
        + `${bAutre}. La transcription retenue est la première ; l'élève relit et corrige.`)
    }
  } else if (nbPasses >= 2) {
    alertes.push('une seule passe a abouti — `confiance_ocr` reste NULL, '
      + 'et NULL n\'est pas « la machine a bien lu ».')
  }

  return {
    texte: retenue.transcription,
    confiance,
    doutes: doutes.filter((d) => d.extrait.trim() !== ''),
    appels,
    nbBlocs: blocs(retenue.transcription).length,
    alertes,
  }
}

/**
 * Ce qui change à chaque copie — et rien d'autre. La consigne ne redit AUCUNE
 * règle du prompt : « le corps de ses règles se conserve tel quel », et une
 * consigne qui répète une règle en fabrique une seconde version.
 */
function consigneDuTour(nbPages: number, manquants: readonly number[]): string {
  const bouts = [`Voici ${nbPages === 1 ? 'la page' : `les ${nbPages} pages`} de la copie, `
    + 'dans l\'ordre.']
  if (manquants.length) {
    bouts.push(`⚠️ L'élève a déclaré manquante(s) la ou les page(s) ${manquants.join(', ')} : `
      + 'elles ne te sont pas fournies. Transcris ce que tu as, sans combler le trou.')
  }
  return bouts.join('\n')
}

/**
 * Descend les pages du stockage et les encode.
 *
 * ⚠️ EN PARALLÈLE, comme les deux passes : à trente-cinq copies simultanées,
 *    quatre téléchargements en série par copie tiennent la salle en attente.
 */
async function telechargerPages(
  admin: Admin, pages: readonly Photo[],
): Promise<Array<{ base64: string; mime: 'image/jpeg' }>> {
  const rendus = await Promise.all(pages.map(async (p) => {
    const { data, error } = await admin.storage.from(BUCKET).download(p.chemin!)
    if (error || !data) {
      console.error(`[passation] page ${p.ordre} illisible au stockage (${p.chemin}) — `
        + `${error?.message ?? 'aucune donnée'}`)
      return null
    }
    const buffer = Buffer.from(await data.arrayBuffer())
    // `utils/imageProcessing.ts` compresse tout en JPEG côté client, EXIF purgé
    // à la compression (`06-` §7, point 4) : le type est connu, pas deviné.
    return { base64: buffer.toString('base64'), mime: 'image/jpeg' as const }
  }))
  return rendus.filter((r): r is { base64: string; mime: 'image/jpeg' } => r !== null)
}
