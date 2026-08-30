import 'server-only'
// ============================================================================
// C4 · L12 — L'ÉCRIVAIN DE L'ÉTAT. Le quatrième geste, et le SECOND VERROU.
// ----------------------------------------------------------------------------
// « TU ÉCRIS DES MESURES ; LE MOTEUR EN FERA DES LETTRES » (`utils/chaine/
// mesures.ts`). Voici le moteur. Avant ce fichier, `competences_niveaux.lettre`
// n'avait AUCUN écrivain dans tout le dépôt — 0 lettre sur 102 lignes d'état —,
// et `filtreR0` exige `evaluee` **ET** `lettre !== null`.
//
// ⚠️ LE GESTE A DEUX MOMENTS, ET UN SEUL EST « APRÈS UNE MESURE » (`01-` §9) :
//   · la MONTÉE, la DESCENTE par l'ancre, la DÉSESCALADE et les COMPTEURS se
//     jugent AU FIL DES MESURES — c'est là que la chaîne délègue ;
//   · `cloturerLaCalibration` est un ÉVÉNEMENT DE BORNE DE SEGMENT — « segment 2
//     seulement, l'exception meurt à la bascule », « à la bascule, chaque lettre
//     est jugée UNE FOIS ». Il appartient au passage hebdomadaire, pas à la chaîne.
//   · et le COLD START est un événement de SEMAINE 1 : « sa première lettre vient
//     de sa première ancre », et `jugerLaLettre` n'en fabrique JAMAIS une.
//
// ⛔ CLIENT ADMIN OBLIGATOIRE, ET AUCUNE POLICY ÉLÈVE N'EST OUVERTE. Les vingt
//    tables du moteur n'ont qu'une policy chacune, `*_prof_all`, et « zéro policy
//    élève » est un invariant CONTRÔLÉ PAR REQUÊTE dans deux migrations déjà
//    jouées. Le `service_role` contourne la RLS : rien à ouvrir.
//
// ⚠️ supabase-js NE LÈVE PAS : il rend `{ error }`. Toute écriture dont on ignore
//    le retour échoue INVISIBLEMENT, même sous `try/catch`. On lit chaque retour.
// ============================================================================

import type { createAdminClient } from '@/utils/supabase/admin'
import { jourDansFuseau } from '@/utils/fuseau'
import { etatCompetence, valeursDesParametres } from '@/utils/chaine/instruments'
import { COMPETENCES } from '@/utils/chaine/types'
import {
  lireLesEscalades, lireLaMontee, lireLesMesures, lireLesNiveaux, lireLesFiches, lirePagine,
} from '@/utils/routeur/donnees'
import { observablesRequis } from '@/utils/routeur/fiche-observables'
import { fenetreDEvidence } from '@/utils/routeur/profil'
import {
  cloturerLaCalibration, derniereAncre, jugerLaLettre, type EtatNiveau,
} from '@/utils/routeur/lettres'
import { estUneAncre, mesuresQuiComptent, parDate, type Mesure } from '@/utils/routeur/mesure'
import {
  compteurN1N2, compteurN3, degreAppele, desescalade, suiviDeLObservable,
  type MesurePourCompteur,
} from '@/utils/routeur/escalade'
import {
  etatDesObservables, preconditionBasse, preconditionHaute, type InstrumentLu,
} from '@/utils/routeur/observables'
import { deplacementsDeMasse, reporterAuGrainSuperieur, sondeCompte } from '@/utils/routeur/montee'
import { FENETRE_EVIDENCE } from '@/utils/routeur/config'
import { CRANS, type Competence, type Grain, type Lettre, type Palier }
  from '@/utils/routeur/types'
import {
  lettreAEcrire, ligneDEscalade, ligneDeMontee, ligneDeNiveau, medianeDeLaClasse,
  premiereLettre, verifierLesLignesDeNiveau, grouperParForme, type LigneDeNiveau,
} from './etat'

type Admin = ReturnType<typeof createAdminClient>

const CONFLIT_NIVEAU = 'eleve_id,competence'
const CONFLIT_ESCALADE = 'eleve_id,competence,observable'
const CONFLIT_MONTEE = 'eleve_id,competence,grain'

// ════════════════════════════════════════════════════════════════════════════
// LE BILAN — « `reclames` et `traites` SE COMPARENT »
// ════════════════════════════════════════════════════════════════════════════

export interface BilanDeLEtat {
  eleveId: string
  /** Les compétences qu'on a réclamées — celles que la mesure vient de toucher. */
  reclamees: string[]
  /** Celles dont l'état a été RÉÉCRIT. */
  traitees: string[]
  /** Celles qu'on a laissées, avec leur motif — jamais un silence. */
  ecartees: Array<{ competence: string; motif: string }>
  lettresEcrites: number
  escaladesPosees: number
  escaladesLevees: number
  monteesPosees: number
  erreurs: string[]
}

/** L'instrument d'une compétence, dans la forme que les règles du routeur lisent. */
export function instrumentDuRouteur(competence: Competence): InstrumentLu | null {
  const e = etatCompetence(competence)
  if (!e.ouverte || !e.instrument) return null
  return {
    observablesMesure: e.instrument.observables_mesure,
    // ⚠️ « Un lecteur ne prend JAMAIS `parametres` tel quel » — la fiche l'écrit
    //    en blocs, et `valeursDesParametres` l'aplatit à son défaut.
    parametres: valeursDesParametres(e.instrument),
  }
}

/**
 * Le couple (`grain`, `cran`) d'un dépôt — « l'unité d'assignation est LE COUPLE,
 * pas le grain seul » (M-a). Il vit sur l'exercice et son type ; la mesure ne le
 * porte pas, et lui donner une colonne en ferait un second domicile.
 *
 * ⚠️ Le CRAN est un NUMÉRO en base et un CODE dans les règles : le pont est
 *    `exercices_crans.code`, lu d'une jointure — jamais une seconde table.
 */
async function casesDesDepots(
  admin: Admin, depotIds: readonly string[],
): Promise<Map<string, { grain: string; cran: string | null }>> {
  const out = new Map<string, { grain: string; cran: string | null }>()
  const ids = [...new Set(depotIds)]
  if (ids.length === 0) return out
  const { data } = await admin.from('exercices_depots')
    .select('id, exercices!inner(cran, exercices_types!inner(grain))').in('id', ids)
  const crans = await admin.from('exercices_crans').select('cran, code')
  const parNumero = new Map<number, string>()
  for (const c of (crans.data ?? []) as Array<{ cran: number; code: string }>) {
    parNumero.set(c.cran, c.code)
  }
  type L = { id: string; exercices: { cran: number | null
    exercices_types: { grain: string | null } | null } | null }
  for (const l of (data ?? []) as unknown as L[]) {
    const n = l.exercices?.cran ?? null
    out.set(l.id, {
      grain: l.exercices?.exercices_types?.grain ?? 'meso',
      cran: n === null ? null : parNumero.get(n) ?? null,
    })
  }
  return out
}

// ════════════════════════════════════════════════════════════════════════════
// LE GESTE D — L'ÉTAT APRÈS UNE MESURE
// ════════════════════════════════════════════════════════════════════════════

/**
 * ⭐⭐ LE POINT DE GREFFE DE LA CHAÎNE. Elle écrit des MESURES puis appelle ceci ;
 * rien ici n'écrit une mesure, et rien dans la chaîne n'écrit une lettre.
 *
 * ⚠️ IL NE TOUCHE JAMAIS `profil_provisoire` : « il bascule à la fin du segment 2 »
 *    (`01-` §9), et c'est un événement de BORNE DE SEGMENT.
 * ⚠️ IL N'ÉCRIT JAMAIS `verdict.lettre` : la colonne porte la valeur PLAFONNÉE,
 *    et la suppression d'affichage se fait à la lecture (`etat.ts`, piège 32).
 */
export async function ecrireLEtatApresMesure(
  admin: Admin, eleveId: string, competences: readonly string[], fuseau: string,
  maintenant: string = new Date().toISOString(),
): Promise<BilanDeLEtat> {
  const bilan: BilanDeLEtat = {
    eleveId, reclamees: [...competences], traitees: [], ecartees: [],
    lettresEcrites: 0, escaladesPosees: 0, escaladesLevees: 0, monteesPosees: 0, erreurs: [],
  }
  if (competences.length === 0) return bilan

  let mesures: Mesure[]
  let niveaux: Awaited<ReturnType<typeof lireLesNiveaux>>
  let escalades: Awaited<ReturnType<typeof lireLesEscalades>>
  let montees: Awaited<ReturnType<typeof lireLaMontee>>
  let fiches: Map<Competence, string>
  try {
    [mesures, niveaux, escalades, montees, fiches] = await Promise.all([
      lireLesMesures(admin, eleveId), lireLesNiveaux(admin, eleveId),
      lireLesEscalades(admin, eleveId), lireLaMontee(admin, eleveId), lireLesFiches(admin),
    ])
  } catch (e) {
    // « Une lecture ratée n'est pas une base vide » : on n'écrit RIEN.
    bilan.erreurs.push(`lecture de l'état : ${(e as Error).message} — AUCUNE écriture.`)
    return bilan
  }

  // M-d se compte PAR CASE : il faut donc le couple (grain, cran) de chaque sonde
  // de montée, et il vit sur l'exercice — jamais sur la mesure.
  const cases = await casesDesDepots(admin,
    mesures.filter((m) => m.sondeMontee && m.depotId).map((m) => m.depotId as string))

  const lignesNiveau: LigneDeNiveau[] = []
  const lignesEscalade: ReturnType<typeof ligneDEscalade>[] = []
  const lignesMontee: ReturnType<typeof ligneDeMontee>[] = []
  const aLever: Array<{ competence: string; observable: string }> = []

  for (const brut of competences) {
    const competence = brut as Competence
    const niveau = niveaux.find((n) => n.competence === competence)
    if (!niveau) {
      bilan.ecartees.push({ competence, motif: 'aucune ligne d\'état lisible.' })
      continue
    }
    const siennes = parDate(mesures.filter((m) => m.competence === competence))
    const comptent = mesuresQuiComptent(siennes, niveau.statutRecettePoseLe)

    // ── LA LETTRE ───────────────────────────────────────────────────────────
    if (niveau.lettre === null) {
      // ⛔ « `jugerLaLettre` NE FABRIQUE JAMAIS UNE PREMIÈRE LETTRE » : elle vient
      //    du cold start, ou de la première ancre. On ne l'invente pas ici.
      const ancre = derniereAncre(comptent)
      if (ancre?.lettreEquivalente) {
        lignesNiveau.push(ligneDeNiveau(eleveId, competence, ancre.lettreEquivalente, niveau,
          { date: jourDansFuseau(ancre.mesureAt, fuseau), valeur: ancre.lettreEquivalente },
          maintenant))
        bilan.traitees.push(competence)
        bilan.lettresEcrites += 1
      } else {
        bilan.ecartees.push({ competence,
          motif: 'sans lettre, et aucune ANCRE : « sa première lettre vient de sa première ancre » '
            + '(§9). Le cold start, lui, se pose à la semaine 1.' })
      }
      continue
    }

    // « L'ancre QUI ARRIVE, et elle seule, fait jouer la descente et la
    //   discordance » : c'est l'ancre postérieure à celle qui est enregistrée.
    const ancres = comptent.filter(estUneAncre)
    const derniere = ancres[ancres.length - 1]
    const dateDerniere = derniere ? jourDansFuseau(derniere.mesureAt, fuseau) : null
    const ancreNouvelle = derniere?.lettreEquivalente
      && (!niveau.ancreDerniereDate || dateDerniere! > niveau.ancreDerniereDate)
      ? (derniere.lettreEquivalente as Palier) : null

    const etat: EtatNiveau = niveau
    const verdict = jugerLaLettre(etat, comptent, {
      cyclesDepuis: () => 0, // le cycle ne borne pas une écriture après mesure
      ancreNouvelle,
    })
    const { lettre } = lettreAEcrire(verdict)
    lignesNiveau.push(ligneDeNiveau(eleveId, competence, lettre, etat,
      ancreNouvelle && dateDerniere ? { date: dateDerniere, valeur: ancreNouvelle } : null,
      maintenant))
    bilan.traitees.push(competence)
    if (lettre !== null) bilan.lettresEcrites += 1

    // ── L'ESCALADE ET LA MONTÉE ─────────────────────────────────────────────
    const instrument = instrumentDuRouteur(competence)
    if (!instrument) {
      bilan.ecartees.push({ competence,
        motif: `escalade et montée non jugées : ${etatCompetence(competence).motif ?? 'instrument absent'}.` })
      continue
    }
    const requis = observablesRequis(fiches.get(competence) ?? '').requis
    const fenetre = fenetreDEvidence(comptent)
    const etats = etatDesObservables(fenetre, instrument, requis)
    const dejaEscaladees = escalades.get(competence) ?? []

    for (const o of etats) {
      const precedent = dejaEscaladees.find((e) => e.observable === o.code) ?? null
      const suivi = suiviDeLObservable(comptent, o.code, instrument, FENETRE_EVIDENCE)
      const avantDernier = suivi[suivi.length - 2]?.acquis ?? false
      // « DÉSESCALADE DÈS QUE L'OBSERVABLE CIBLÉ CHANGE DE STATUT. »
      if (desescalade(precedent, o.acquis, avantDernier)) {
        aLever.push({ competence, observable: o.code })
        continue
      }
      const pourN3: MesurePourCompteur[] = comptent.map((m) => ({
        mesure: m,
        // `01-` §8.6 — N3 n'accepte que les mesures où la compétence était CIBLE.
        etaitCible: !m.sondeMontee,
      }))
      const { degre } = degreAppele(
        compteurN1N2(comptent, o.code, instrument, FENETRE_EVIDENCE),
        compteurN3(pourN3, o.code, instrument, FENETRE_EVIDENCE),
        {
          statutRecette: niveau.statutRecette as never,
          profilProvisoire: niveau.profilProvisoire,
          // ⭐ `degreAppele` refuse DÉJÀ tout seul hors `evaluee`, sous
          //    `profil_provisoire` et avant le segment 3 : on ne redouble pas
          //    ses gardes, on lui passe l'état.
          segment: 3,
          preconditionBasse: preconditionBasse(
            o.code, comptent, instrument, FENETRE_EVIDENCE).satisfaite,
          preconditionHaute: preconditionHaute(etats),
          semainesDepuisN1: precedent?.entreN1At
            ? Math.floor((Date.parse(maintenant) - Date.parse(precedent.entreN1At))
              / (7 * 86_400_000))
            : null,
        })
      if (degre) {
        lignesEscalade.push(
          ligneDEscalade(eleveId, competence, o.code, degre, precedent, maintenant))
      }
    }

    // ── LA MONTÉE (M-d, M-c) ────────────────────────────────────────────────
    // « Une sonde réussie ne compte pour la montée QUE SI la compétence sondée
    //   est `evaluee` » (§8.9, borne (a)).
    if (sondeCompte(niveau.statutRecette)) {
      // ⚠️ LA CASE D'UNE SONDE NE VIT PAS SUR LA MESURE : `competences_mesures`
      //    ne porte ni grain ni cran — ce sont des propriétés de L'EXERCICE. On
      //    remonte donc par le DÉPÔT, le seul chemin qui existe.
      const sondes = siennes.filter((m) => m.sondeMontee).map((m) => {
        const c = m.depotId ? cases.get(m.depotId) : undefined
        return {
          grain: (c?.grain ?? 'meso') as Grain,
          cran: (c?.cran ?? '') as never,
          // « Une sonde est ratée souvent » : seule une lettre-équivalente au
          // moins égale au palier courant vaut réussite.
          reussie: !!m.lettreEquivalente && !!niveau.lettre
            && m.lettreEquivalente >= (niveau.lettre as string),
        }
      }).filter((s) => (CRANS as readonly string[]).includes(s.cran))
      const deplacements = deplacementsDeMasse(sondes)
      if (deplacements.length) {
        let etatsMontee = montees.get(competence) ?? []
        for (const d of deplacements) {
          etatsMontee = reporterAuGrainSuperieur(etatsMontee, d,
            (c) => CRANS.indexOf(c) + 1)
        }
        for (const e of etatsMontee) {
          if (e.cranAtteint === null) continue
          lignesMontee.push(ligneDeMontee(eleveId, competence, e.grain, e.cranAtteint, maintenant))
        }
      }
    }
  }

  // ── LES ÉCRITURES — dont on LIT le `{ error }` ────────────────────────────
  //
  // ⛔⛔ ON GROUPE PAR FORME AVANT D'ÉCRIRE, ET CE N'EST PAS UNE PRÉCAUTION.
  //   `ligneDeNiveau` émet DEUX paires de clés OPTIONNELLES — `ancre_derniere_*`
  //   quand une ancre arrive, `lettre_initiale*` quand la compétence n'en avait
  //   pas — donc jusqu'à QUATRE formes d'objet dans un même lot. Dès qu'un dépôt
  //   touche une compétence DÉJÀ LETTRÉE et une compétence NEUVE, la charge est
  //   hétérogène, `verifierLesLignesDeNiveau` LÈVE, et TOUT LE LOT EST PERDU.
  //   ⭐ La garde a raison de lever : un `upsert` en lot UNIFIE les clés, donc la
  //   `lettre_initiale` de la déjà-lettrée partirait à NULL — et son plafond avec
  //   elle. Ce qu'elle empêche est pire que ce qu'elle coûte.
  //
  //   ⚠️ Ce n'était pas une hypothèse : mesuré en PRODUCTION le 29/08 — 13
  //   mesures de `synthese` pour ZÉRO ligne de niveau `synthese`, quand les trois
  //   autres compétences avaient la leur. Treize élèves sur treize, en silence.
  //
  //   ⭐ Et la parade était déjà écrite DEUX FOIS dans ce fichier :
  //   `poserLeColdStart` et `cloturerLaCalibrationDesEleves` groupent `parForme`.
  //   Cette fonction-ci était la seule à ne pas le faire. (`C4L12-24`.)
  if (lignesNiveau.length) {
    for (const lot of grouperParForme(lignesNiveau)) {
      // ⭐ Le compte se défait LOT PAR LOT, jamais en bloc : un lot perdu ne doit
      //   pas effacer les lettres qu'un autre a bien écrites — sans quoi le bilan
      //   mentirait dans l'autre sens.
      const ecritesDuLot = lot.filter((l) => l.lettre !== null).length
      try {
        verifierLesLignesDeNiveau(lot)
        const { error } = await admin.from('competences_niveaux')
          .upsert(lot, { onConflict: CONFLIT_NIVEAU })
        if (error) {
          console.error(`[moteur] ÉTAT PERDU — élève=${eleveId} lignes=${lot.length}`
            + ` compétences=${lot.map((l) => l.competence).join(',')}`,
          { code: error.code, message: error.message, details: error.details })
          bilan.erreurs.push(`écriture des niveaux (${lot.map((l) => l.competence).join(', ')}) : `
            + error.message)
          bilan.lettresEcrites -= ecritesDuLot
        }
      } catch (e) {
        bilan.erreurs.push(`charge de niveaux refusée (${lot.map((l) => l.competence).join(', ')}) : `
          + (e as Error).message)
        bilan.lettresEcrites -= ecritesDuLot
      }
    }
  }
  for (const l of lignesEscalade) {
    const { error } = await admin.from('competences_escalade')
      .upsert([l], { onConflict: CONFLIT_ESCALADE })
    if (error) bilan.erreurs.push(`escalade ${l.competence}/${l.observable} : ${error.message}`)
    else bilan.escaladesPosees += 1
  }
  for (const a of aLever) {
    // ⛔ `competences_escalade.degre` n'a AUCUNE valeur « aucun » : la désescalade
    //    RETIRE la ligne d'état. La TRACE, elle, survit — `routeur_decisions.
    //    etat_escalade` porte l'état au moment de chaque décision (`07-` §1.5).
    const { error } = await admin.from('competences_escalade').delete()
      .eq('eleve_id', eleveId).eq('competence', a.competence).eq('observable', a.observable)
    if (error) bilan.erreurs.push(`désescalade ${a.competence}/${a.observable} : ${error.message}`)
    else bilan.escaladesLevees += 1
  }
  for (const l of lignesMontee) {
    const { error } = await admin.from('competences_montee')
      .upsert([l], { onConflict: CONFLIT_MONTEE })
    if (error) bilan.erreurs.push(`montée ${l.competence}/${l.grain} : ${error.message}`)
    else bilan.monteesPosees += 1
  }
  return bilan
}

// ════════════════════════════════════════════════════════════════════════════
// LE COLD START — la PREMIÈRE lettre (`01-` §4)
// ════════════════════════════════════════════════════════════════════════════

/** Une candidate de lettre, telle qu'UNE des classes de l'élève la propose. */
interface CandidateColdStart {
  lettre: Lettre | null
  source: string
  // ⚠️ La valeur de l'ancre est un PALIER, pas une chaîne libre — on garde le
  //    type d'origine plutôt que de l'élargir, sinon `ligneDeNiveau` le refuse.
  ancre: { date: string; valeur: Palier } | null
}

export interface BilanDuColdStart {
  elevesAttendus: number
  lettresPosees: number
  parMediane: number
  sansLettre: number
  /**
   * ⭐ Les couples `(élève, compétence)` tranchés par LA MÉDIANE DES MÉDIANES :
   * un élève bi-classe sans mesure propre reçoit la médiane de SA classe, et il
   * en a plusieurs qui peuvent différer. *(Décision de Louis, 30/08.)* Le compte
   * est là pour que le cas se VOIE — il n'appelle aucun geste.
   */
  medianeDesMedianes: number
  /** ⛔ Les compétences qu'aucune passation diagnostique ne mesure (§10). */
  horsDiagnostic: string[]
  erreurs: string[]
}

/**
 * ⭐ « LE COLD START S'APPLIQUE PASSATION PAR PASSATION, NON ÉLÈVE PAR ÉLÈVE. »
 * Un élève présent à l'essai et absent à l'explication garde ses paliers réels
 * sur ce que l'essai mesure, et ne reçoit un profil par défaut que sur les
 * compétences que SEULE L'AUTRE passation mesure.
 *
 * ⛔ « CETTE MÉDIANE N'EST JAMAIS ÉCRITE DANS `derniere_ancre` : ce n'est pas une
 *    mesure de cet élève. »
 * ⛔ Et il n'écrase JAMAIS une lettre existante : il POSE la première.
 *
 * @param elevesParClasse la population, par classe — « une passation a lieu dans
 *        une classe identifiée, ce qui lève l'ambiguïté de "la médiane de sa
 *        classe" pour un bi-classe ».
 */
export async function poserLeColdStart(
  admin: Admin, elevesParClasse: ReadonlyMap<string, readonly string[]>, fuseau: string,
  maintenant: string = new Date().toISOString(),
): Promise<BilanDuColdStart> {
  const bilan: BilanDuColdStart = { elevesAttendus: 0, lettresPosees: 0, parMediane: 0,
    sansLettre: 0, medianeDesMedianes: 0, horsDiagnostic: [], erreurs: [] }

  const eleves = [...new Set([...elevesParClasse.values()].flat())]
  bilan.elevesAttendus = eleves.length
  if (eleves.length === 0) return bilan

  // Les mesures des DEUX EXAMENS DIAGNOSTIQUES — repérés par la `nature`
  // `complet` de leur type, la seule marque qui les distingue (`07-` §1.1).
  let depotsDiagnostiques: Set<string>
  try {
    const lignes = await lirePagine<{ id: string
      exercices: { exercices_types: { nature: string } | null } | null }>(
      admin, 'exercices_depots',
      'id, exercices!inner(exercices_types!inner(nature))', ['id'],
      (q) => (q as never as { in: (a: string, b: string[]) => unknown })
        .in('eleve_id', eleves))
    depotsDiagnostiques = new Set(lignes
      .filter((l) => l.exercices?.exercices_types?.nature === 'complet').map((l) => l.id))
  } catch (e) {
    bilan.erreurs.push(`dépôts diagnostiques : ${(e as Error).message} — AUCUNE écriture.`)
    return bilan
  }

  const mesuresParEleve = new Map<string, Mesure[]>()
  const niveauxParEleve = new Map<string, Awaited<ReturnType<typeof lireLesNiveaux>>>()
  for (const id of eleves) {
    try {
      const [m, n] = await Promise.all([lireLesMesures(admin, id), lireLesNiveaux(admin, id)])
      mesuresParEleve.set(id, m.filter((x) => x.depotId && depotsDiagnostiques.has(x.depotId)))
      niveauxParEleve.set(id, n)
    } catch (e) {
      bilan.erreurs.push(`${id.slice(0, 8)} : ${(e as Error).message}`)
    }
  }

  // Les compétences QUE LES PASSATIONS ONT RÉELLEMENT MESURÉES, constatées —
  // jamais une liste recopiée du §10, qui périmerait au premier plan changé.
  const mesureesParLaPassation = new Set<string>()
  for (const m of mesuresParEleve.values()) for (const x of m) mesureesParLaPassation.add(x.competence)
  bilan.horsDiagnostic = COMPETENCES.filter((c) => !mesureesParLaPassation.has(c))

  const lignes: LigneDeNiveau[] = []
  // ⭐ Une entrée par `(eleve_id, competence)` — la clé même de la table —, et
  //    autant de CANDIDATES que l'élève a de classes.
  const parCle = new Map<string, {
    id: string; competence: Competence; niveau: EtatNiveau
    candidats: CandidateColdStart[]
  }>()
  for (const [classeId, membres] of elevesParClasse) {
    void classeId
    // La médiane de LA CLASSE de la passation, compétence par compétence.
    const medianes = new Map<string, Lettre>()
    for (const c of mesureesParLaPassation) {
      const lettres = membres.map((id) => {
        const m = (mesuresParEleve.get(id) ?? []).filter((x) => x.competence === c)
        return m.length ? (m[m.length - 1].lettreEquivalente as Lettre) : null
      })
      medianes.set(c, medianeDeLaClasse(lettres))
    }

    for (const id of membres) {
      const niveaux = niveauxParEleve.get(id)
      if (!niveaux) continue
      for (const c of COMPETENCES) {
        const niveau = niveaux.find((n) => n.competence === c)
        // ⛔ « Il POSE la première lettre » : une lettre existante ne s'écrase pas.
        if (!niveau || niveau.lettre !== null) continue
        const p = premiereLettre(c as Competence,
          (mesuresParEleve.get(id) ?? []).filter((x) => x.competence === c),
          mesureesParLaPassation.has(c), medianes.get(c) ?? null)
        // ⛔⛔ L'ÉLÈVE BI-CLASSE PASSE ICI DEUX FOIS — la boucle englobante est
        //    PAR CLASSE, et `elevesParClasse` le liste dans chacune des siennes
        //    (`cycle-serveur.ts`). Sans la clé ci-dessous, on produisait DEUX
        //    lignes de même `(eleve_id, competence)` dans un même envoi, et
        //    `verifierLesLignesDeNiveau` refusait alors **TOUT LE LOT** — pas
        //    seulement la ligne fautive. *Mesuré le 30/08 en bac à sable :
        //    « ON CONFLICT DO UPDATE command cannot affect row a second time »,
        //    et 0 lettre posée sur 98 attendues.*
        // ⭐ UNE ENTRÉE PAR `(élève, compétence)`, et un élève bi-classe y dépose
        //    PLUSIEURS candidates : la boucle englobante est PAR CLASSE, et
        //    `elevesParClasse` le liste dans chacune des siennes.
        const cle = `${id}|${c}`
        const e = parCle.get(cle)
          ?? { id, competence: c as Competence, niveau, candidats: [] as CandidateColdStart[] }
        e.candidats.push({ lettre: p.lettre, source: p.source, ancre: p.ancre ?? null })
        parCle.set(cle, e)
      }
    }
  }

  // ══ LA RÉSOLUTION D'UN ÉLÈVE BI-CLASSE, ET LES COMPTEURS ══════════════════
  // ⛔⛔ SANS CETTE PASSE, DEUX LIGNES DE MÊME CLÉ PARTAIENT DANS UN MÊME ENVOI
  //    et `verifierLesLignesDeNiveau` refusait **TOUT LE LOT**, pas la ligne
  //    fautive. *Mesuré le 30/08 en bac à sable : 0 lettre posée sur 98.*
  // ⭐ LE CAS ORDINAIRE EST UN ACCORD, et il se démontre : quand l'élève a SA
  //    PROPRE mesure, `premiereLettre` rend `mesures_du_diagnostic` — la même
  //    dans toutes ses classes. Rien à arbitrer.
  // ⭐⭐ QUAND ELLES DIFFÈRENT — c'est-à-dire à défaut de mesure propre, la
  //    lettre venant alors de la MÉDIANE DE SA CLASSE et un bi-classe en ayant
  //    deux — on prend **LA MÉDIANE DES MÉDIANES** *(décision de Louis, 30/08)*.
  //    ⭐ Elle réutilise `medianeDeLaClasse`, donc **aucune convention n'est
  //    inventée ici** : sur deux valeurs, elle rend la borne INFÉRIEURE des deux
  //    du milieu (`rangs[Math.floor((n-1)/2)]`), soit **la lettre la plus
  //    faible** — mesuré : `[B,D] → D`, `[A,C] → C`. Le choix penche donc du
  //    côté prudent, ce qui est cohérent avec « une descente perdue laisse
  //    l'élève affiché meilleur qu'il n'est ».
  // ⭐ ET LES COMPTEURS SE FONT ICI, JAMAIS DANS LA BOUCLE : compter à la volée
  //    doublait `sansLettre` et `parMediane` pour tout élève bi-classe.
  for (const e of parCle.values()) {
    const connues = e.candidats.map((x) => x.lettre).filter((l): l is Lettre => l !== null)
    if (connues.length === 0) { bilan.sansLettre += 1; continue }
    const distinctes = new Set(connues)
    let lettre = connues[0]
    if (distinctes.size > 1) {
      lettre = medianeDeLaClasse(connues)
      bilan.medianeDesMedianes += 1
    }
    if (lettre === null) { bilan.sansLettre += 1; continue }
    if (e.candidats.some((x) => x.source === 'mediane_de_classe')) bilan.parMediane += 1
    const ancre = e.candidats.find((x) => x.ancre !== null)?.ancre ?? null
    lignes.push(ligneDeNiveau(e.id, e.competence, lettre, e.niveau,
      ancre ? { date: jourDansFuseau(ancre.date, fuseau), valeur: ancre.valeur } : null,
      maintenant))
  }

  // ⚠️ Jeux de clés HOMOGÈNES : `lettre_initiale` et l'ancre ne partent pas sur
  //    toutes les lignes → on envoie par FORME DE CLÉ, jamais en un seul lot.
  for (const lot of grouperParForme(lignes)) {
    try {
      verifierLesLignesDeNiveau(lot)
      const { error } = await admin.from('competences_niveaux')
        .upsert(lot, { onConflict: CONFLIT_NIVEAU })
      if (error) {
        console.error(`[moteur] COLD START PERDU — lignes=${lot.length}`,
          { code: error.code, message: error.message, details: error.details })
        bilan.erreurs.push(`cold start (${lot.length} ligne(s)) : ${error.message}`)
      } else {
        bilan.lettresPosees += lot.length
      }
    } catch (e) {
      bilan.erreurs.push(`charge du cold start refusée : ${(e as Error).message}`)
    }
  }
  return bilan
}

// ════════════════════════════════════════════════════════════════════════════
// LA CLÔTURE DE LA CALIBRATION — un événement de BORNE DE SEGMENT
// ════════════════════════════════════════════════════════════════════════════

export interface BilanDeLaCloture {
  elevesAttendus: number
  lettresJugees: number
  montees: number
  descentes: number
  restees: number
  sansLettre: number
  /**
   * ⭐ Les niveaux DÉJÀ clos — `profil_provisoire` à `false` — et donc sautés.
   * C'est le compteur de l'idempotence : « à la bascule, chaque lettre est jugée
   * UNE FOIS ». Au second passage, il vaut ce que `lettresJugees` valait au
   * premier, et tout le reste est à zéro.
   */
  dejaCloturees: number
  erreurs: string[]
}

/**
 * `01-` §9 — « CLÔTURE DE LA CALIBRATION, SEGMENT 2 SEULEMENT, L'EXCEPTION MEURT
 * À LA BASCULE. À la bascule, CHAQUE LETTRE EST JUGÉE UNE FOIS : elle RESTE par
 * défaut ; 2 confirmations concordantes SOUS la lettre → −1 palier ; 2 AU-DESSUS
 * → +1 palier ; jamais plus d'un palier. » Et `profil_provisoire` y bascule.
 *
 * ⛔ Elle NE PEUT PAS VIVRE DANS LA CHAÎNE : elle appartient au passage
 *    hebdomadaire, au dernier lundi du segment 2.
 */
export async function cloturerLaCalibrationDesEleves(
  admin: Admin, eleves: readonly string[], debutDuSegment2: string,
  /**
   * ⭐ LA BORNE HAUTE — le premier lundi du segment 3. Elle rend le verdict
   * INDÉPENDANT DU MOMENT OÙ LA CLÔTURE TOURNE : jouée à l'heure ou trois
   * semaines plus tard, elle compte exactement les mêmes mesures, celles « du
   * segment 2 ». Sans elle, une clôture en retard jugerait sur des mesures que
   * le §9 n'y range pas. `null` = pas de borne (le comportement d'avant).
   */
  finDuSegment2: string | null = null,
  maintenant: string = new Date().toISOString(),
): Promise<BilanDeLaCloture> {
  const bilan: BilanDeLaCloture = { elevesAttendus: eleves.length, lettresJugees: 0, montees: 0,
    descentes: 0, restees: 0, sansLettre: 0, dejaCloturees: 0, erreurs: [] }
  const lignes: LigneDeNiveau[] = []

  for (const id of eleves) {
    let mesures: Mesure[]
    let niveaux: Awaited<ReturnType<typeof lireLesNiveaux>>
    try {
      [mesures, niveaux] = await Promise.all([lireLesMesures(admin, id), lireLesNiveaux(admin, id)])
    } catch (e) {
      bilan.erreurs.push(`${id.slice(0, 8)} : ${(e as Error).message}`)
      continue
    }
    for (const niveau of niveaux) {
      // ⭐⭐ « À LA BASCULE, CHAQUE LETTRE EST JUGÉE UNE FOIS » (`01-` §9), et
      //    c'est ce drapeau qui le tient. Sans cette garde, un second passage
      //    RE-JUGERAIT depuis la lettre déjà bougée : un élève monté de C à B
      //    pourrait monter à A sur les MÊMES mesures, parce que le décompte
      //    `auDessus` se refait contre le nouveau rang. ⛔ Ce n'est pas une
      //    précaution, c'est la règle — et c'est elle qui rend la clôture
      //    REJOUABLE, donc réparable si le passage hebdomadaire l'a manquée.
      if (!niveau.profilProvisoire) { bilan.dejaCloturees += 1; continue }
      const duSegment = mesures.filter((m) => m.competence === niveau.competence
        && m.mesureAt >= debutDuSegment2
        && (finDuSegment2 === null || m.mesureAt < finDuSegment2))
      const c = cloturerLaCalibration(niveau, duSegment,
        // « Une sonde ÉCHOUÉE ne compte pas pour la descente » — une sonde de
        // montée est marquée, et elle est ratée quand sa lettre est sous celle
        // de l'élève.
        (m) => m.sondeMontee && !!niveau.lettre && !!m.lettreEquivalente
          && m.lettreEquivalente < niveau.lettre)
      if (c.mouvement === 'sans_lettre') { bilan.sansLettre += 1; continue }
      bilan.lettresJugees += 1
      if (c.mouvement === 'monte') bilan.montees += 1
      else if (c.mouvement === 'descend') bilan.descentes += 1
      else bilan.restees += 1
      lignes.push({
        eleve_id: id, competence: niveau.competence, lettre: c.lettre,
        // ⭐ « `profil_provisoire` BASCULE à la fin du segment 2 » : c'est ici,
        //    et nulle part ailleurs.
        profil_provisoire: false,
        ...(niveau.lettreInitiale === null && c.lettreInitiale
          ? { lettre_initiale: c.lettreInitiale, lettre_initiale_at: maintenant }
          : {}),
        updated_at: maintenant,
      })
    }
  }

  for (const lot of grouperParForme(lignes)) {
    try {
      verifierLesLignesDeNiveau(lot)
      const { error } = await admin.from('competences_niveaux')
        .upsert(lot, { onConflict: CONFLIT_NIVEAU })
      if (error) bilan.erreurs.push(`clôture (${lot.length} ligne(s)) : ${error.message}`)
    } catch (e) {
      bilan.erreurs.push(`charge de clôture refusée : ${(e as Error).message}`)
    }
  }
  return bilan
}
