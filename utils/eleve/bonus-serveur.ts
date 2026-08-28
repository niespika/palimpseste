import 'server-only'
// ============================================================================
// C6 · L3 — LE PUSH : une SUGGESTION sur le tableau de bord, JAMAIS une
// assignation.
// ----------------------------------------------------------------------------
// `01-routeur.md` §5 : « Un second canal, le PUSH. Le quota ci-dessus se consomme
// à la demande de l'élève. Le push ne le remplace pas, IL L'AMORCE : une
// compétence SANS MESURE DEPUIS LA PÉRIODE DU PLANCHER DE MESURE (§9), chez un
// élève À C OU MOINS, apparaît en SUGGESTION sur son tableau de bord. C'EST UNE
// SUGGESTION, JAMAIS UNE ASSIGNATION — l'élève la prend PAR LE MÊME PULL, ou
// l'ignore. »
//
// ⛔⛔ CE FICHIER N'ÉCRIT RIEN, ET C'EST TOUTE LA DÉFINITION DU PUSH. Il n'y a
//    qu'UN écrivain dans ce lot, et c'est le pull (`utils/moteur/bonus-serveur.ts`).
//    Le push est une LECTURE qui produit une phrase et un lien. « Une suggestion
//    qui assigne est exactement le défaut que la source nomme. »
//
// ⛔ IL NE PERSISTE AUCUN ÉTAT DE SUGGESTION. La source ne dit ni à quelle
//    fréquence elle se renouvelle, ni ce qui se passe quand l'élève l'ignore :
//    **le plus sobre est retenu** — elle SE RECALCULE À CHAQUE LECTURE et
//    disparaît dès que sa condition tombe. Une colonne de plus serait une
//    migration, et « une trace n'est pas un état ».
//
// ⛔ ET LA TUILE PORTE UN LIEN, DONC ELLE LIT SA PORTE — ICI, dans le module
//    partagé, jamais au site d'appel : « une garde qu'on peut oublier en écrivant
//    un second écran n'est pas une garde » (`07-` §5, précisé par `C5-L4`).
//    « Un lien vers un écran fermé est une promesse cassée. »
//
// ⚠️ CE QUE LA BASE FERA DE CE PUSH, ET IL FAUT LE SAVOIR AVANT DE LE JUGER
//    MUET : au 28/08, le bac à sable porte **102 niveaux dont la lettre est
//    NULLE**, quand la production en porte **149 réelles**. « Une compétence sans
//    lettre n'est ni ciblable ni sondable » (`01-` §3) — le push sera donc
//    silencieux en recette et parlant en production, exactement l'inverse de ce
//    qu'on attend d'un écran neuf.
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import { lireLaPorte } from '@/utils/deroule/acces'
import { lireLesMesures, lireLesNiveaux, lireLOptOut } from '@/utils/routeur/donnees'
import { mesuresQuiComptent } from '@/utils/routeur/mesure'
import { lundiDuCycle } from '@/utils/deroule/echeance'
import { toISODate } from '@/utils/calendrier-grille'
import {
  suggestionsDuPush, type MesurePourLePush, type NiveauPourLePush, type SuggestionDuPush,
} from '@/utils/routeur/bonus'
import { NOM_COMPETENCE } from '@/utils/competences-classe'

type Admin = SupabaseClient

export interface SignalDuPush {
  /** Vrai quand la tuile naît. Faux = elle n'existe pas — jamais une tuile vide. */
  aSuggerer: boolean
  /** Les compétences qui appellent, dans l'ordre du manque le plus ancien. */
  suggestions: SuggestionDuPush[]
  /**
   * ⭐ La compétence en tête, EN LANGUE ÉLÈVE — jamais son identifiant nu.
   * `null` quand il n'y a rien à suggérer.
   */
  competenceDite: string | null
  /** ⚠️ Une lecture ratée se dit : elle n'est pas « rien à suggérer ». */
  incidents: string[]
}

const MUET: SignalDuPush = {
  aSuggerer: false, suggestions: [], competenceDite: null, incidents: [],
}

/**
 * ⭐ LE PUSH D'UN ÉLÈVE, POUR SON TABLEAU DE BORD.
 *
 * ⛔ LE PROFIL EST UNIFIÉ PAR ÉLÈVE — il n'a AUCUN `classe_id` (`07-` §1.3).
 *    Cette lecture ne prend donc pas de classe en contexte, et l'appelant ne
 *    l'appelle qu'UNE FOIS, même pour un bi-classe. ⚠️ `classeIds` ne sert qu'à
 *    l'opt-out, qui est une propriété DE LA CLASSE : « une compétence désactivée
 *    par TOUTES les classes de l'élève sort du ciblage ».
 *
 * ⚠️ LA BORNE DE RECETTE ÉCARTE, ET IL FAUT SAVOIR CE QU'ON PROUVE.
 *    `mesuresQuiComptent` retire tout ce qui précède `statut_recette_pose_le` :
 *    une compétence dont toutes les mesures sont PRÉ-RECETTE est donc suggérée,
 *    et c'est juste — pour le dispositif, elle n'a rien mesuré.
 */
export async function signalDuPush(
  admin: Admin, eleveId: string, classeIds: readonly string[], cycleLundi: string, fuseau: string,
): Promise<SignalDuPush> {
  const incidents: string[] = []

  // ⛔ LA PORTE, LUE ICI. Une tuile qui mènerait à `/eleve/semaine` fermée
  //    promettrait une porte close.
  if (!(await lireLaPorte(admin)).exercicesActifs) return MUET

  let niveaux: Awaited<ReturnType<typeof lireLesNiveaux>>
  let mesures: Awaited<ReturnType<typeof lireLesMesures>>
  let optOut: Set<string>
  try {
    ;[niveaux, mesures, optOut] = await Promise.all([
      lireLesNiveaux(admin as never, eleveId),
      lireLesMesures(admin as never, eleveId),
      lireLOptOut(admin as never, classeIds as string[]) as Promise<Set<string>>,
    ])
  } catch (e) {
    // ⚠️ « Une lecture ratée n'est pas "rien à suggérer". » On se tait à l'écran
    //    — une suggestion fausse coûterait plus qu'une suggestion manquée —,
    //    mais on le DIT dans les incidents plutôt que de rendre un silence pur.
    return { ...MUET, incidents: [`ton profil : ${(e as Error).message}`] }
  }

  // ⚠️⚠️ LE CYCLE D'UNE MESURE SE LIT DANS LE FUSEAU DE L'ÉCOLE, jamais en UTC :
  //    « un dépôt du dimanche 20 h 30 à Toronto est le lundi 00 h 30 UTC », et lu
  //    en UTC il basculerait d'une semaine — ce qui décalerait le décompte des
  //    trois cycles du plancher.
  const cycleDe = (instantISO: string) =>
    toISODate(lundiDuCycle(new Date(instantISO), fuseau))

  const pourLePush: NiveauPourLePush[] = niveaux.map((n) => ({
    competence: n.competence,
    // ⛔ « Une compétence désactivée par TOUTES les classes de l'élève sort du
    //    ciblage » — le routeur la LIT, il ne l'écrit pas (`07-` §1.3).
    statutRecette: optOut.has(n.competence) ? 'differee' : n.statutRecette,
    // ⭐ LA LETTRE DE LA COLONNE — l'ÉTAT, pas l'affichage. C'est celle que R0
    //   lit, et « à C ou moins » veut dire celle-là.
    lettre: n.lettre,
  }))

  const comptantes: MesurePourLePush[] = []
  for (const n of niveaux) {
    const siennes = mesures.filter((m) => m.competence === n.competence)
    for (const m of mesuresQuiComptent(siennes, n.statutRecettePoseLe)) {
      comptantes.push({ competence: n.competence, cycleLundi: cycleDe(m.mesureAt) })
    }
  }

  const suggestions = suggestionsDuPush(pourLePush, comptantes, cycleLundi)
  return {
    aSuggerer: suggestions.length > 0,
    suggestions,
    competenceDite: suggestions[0] ? NOM_COMPETENCE[suggestions[0].competence] ?? null : null,
    incidents,
  }
}
