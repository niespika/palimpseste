import 'server-only'
// ============================================================================
// C6 · L1 — LES QUATRE DRAPEAUX, CHARGÉS. Un lot de COUTURE, pas d'écran.
// ----------------------------------------------------------------------------
// ⭐⭐ LA COUTURE SE NOMME EN UNE PHRASE :
//
//     « Un signal levé par le moteur atteint-il l'œil du professeur —
//       et son geste redescend-il jusqu'à la base ? »
//
// Cinq canaux, et QUATRE ÉTAIENT COUPÉS au 27/08 :
//   ① `etat-serveur.ts` → `competences_niveaux.lettre` → la matrice     ✅ passait
//   ② `jugerLaLettre`   → `verdict.drapeaux[]`         → PERSONNE       ⛔ coupé
//   ③ `etat-serveur.ts` → `dossier_n3_ouvert_at`       → PERSONNE       ⛔ coupé
//   ④ `contestation.ts` → `citation_absente`           → une trace      ⛔ coupé
//   ⑤ télémétrie+collages+chaîne → les sept signaux    → PERSONNE       ⛔ coupé
//
// ⛔ CE MODULE NE RECALCULE RIEN. Il APPELLE les fonctions qui savent — 
//    `jugerLaLettre`, `dossierN3`, `mesuresQuiComptent`, `faisceauDuDepot` — et
//    il leur donne les entrées qu'on leur laissait vides. « Il n'y a rien à
//    recalculer, il y a un canal à ouvrir entre un calcul et un écran. »
//
// ⚠️⚠️ POURQUOI LA CADENCE D'ANCRE SE CALCULE À LA LECTURE, ET PAS À L'ÉCRITURE.
//    `ContexteLettre` déclare `cyclesDepuisDerniereAncre`, et les DEUX appelants
//    du moteur ne le passent pas (`etat-serveur.ts:215`, `cycle-serveur.ts:379`) :
//    le drapeau est **structurellement muet**. On aurait pu remplir l'entrée
//    chez eux. On ne le fait pas, et le motif est décisif :
//      · **le drapeau est une fonction du TEMPS ÉCOULÉ, pas d'un événement.** Il
//        devient vrai par le seul passage des cycles, quand rien n'arrive. Or le
//        moteur ne tourne QU'APRÈS UNE MESURE : une valeur écrite là serait
//        fausse le jour où elle compte le plus — la compétence que personne ne
//        mesure et que personne n'ancre ;
//      · **et elle n'aurait pas de colonne où vivre.** `competences_niveaux`
//        porte « la lettre, la dernière ancre, le statut, la date de pose,
//        `profil_provisoire`, `updated_at`, la lettre initiale. **Rien d'autre** »
//        (`07-` §1.3). Stocker un drapeau qui change tout seul, c'est écrire une
//        TRACE à la place de la CHOSE.
//    ⛔ **Le moteur n'est donc pas touché** — ni `etat-serveur.ts`, ni
//       `cycle-serveur.ts`, ni une règle de ciblage.
//
// ⛔ ET LA LETTRE NE SE RELIT JAMAIS ICI. `jugerLaLettre` rend un verdict
//    complet ; ce module n'en retient QUE `drapeaux`. La lettre affichée reste
//    celle de la colonne, écrite par le moteur (`utils/competences-classe.ts`) —
//    deux lettres calculées à deux endroits finiraient par diverger.
//
// ⚠️ LES TROIS PIÈGES DE `supabase-js`, ET ILS MORDENT DANS LES LISTES :
//    il **ne lève pas** (`{ error }`) · il **plafonne à 1000 lignes sans rien
//    dire** (on pagine et on confronte au `count: 'exact'`) · son constructeur
//    est **paresseux** (un `Promise.resolve` avant tout `Promise.all`).
//    ⛔ Une lecture ratée n'est pas une base vide : elle devient un INCIDENT que
//       l'écran affiche.
// ============================================================================

import type { createAdminClient } from '@/utils/supabase/admin'
import { COMPETENCES, type Competence } from '@/utils/chaine/types'
import { etatCompetence, valeursDesParametres } from '@/utils/chaine/instruments'
import { statutDeLaMesure, tauxDeReussite, type ValeurObservable } from '@/utils/chaine/observables'
import { jugerLaLettre, type EtatNiveau } from '@/utils/routeur/lettres'
import { dossierN3 } from '@/utils/routeur/escalade'
import { mesuresQuiComptent, parDate, type Mesure } from '@/utils/routeur/mesure'
import {
  lireLesMesuresDesEleves, lireLElevesDesMesures, LectureTronquee,
} from '@/utils/routeur/donnees'
import { fenetreDEvidence } from '@/utils/routeur/profil'
import { estAcquis } from '@/utils/routeur/observables'
import { lireLesStatutsAvecDate } from '@/utils/statut-recette'
import { calculerGrilleSemaines } from '@/utils/calendrier-grille'
import { jourDansFuseau } from '@/utils/fuseau'
import { lireTelemetrie } from '@/utils/deroule/telemetrie'
import { lireLesCollages } from '@/utils/passation/collage'
import {
  convergence, faisceauDuDepot, estRegardable, motifDuFaisceau, PHRASE_SIGNAL,
  type DepotAuFaisceau,
} from '@/utils/integrite-faisceau'
import { signalerEnAttenteIA, lireParamsIntegrite, TYPE_FAISCEAU } from '@/utils/integrite'
import {
  cyclesEcoules, distributionDesContestations, elevesQuiRepetent, fileDExamenHumain,
  ordonnerLesDrapeaux, type ActeLu, type CycleDuCalendrier, type Drapeau,
  type DistributionContestations,
} from './attention'

type Admin = ReturnType<typeof createAdminClient>

const PAGE = 1000

/**
 * ⚠️ CE QU'ON FAIT D'UN DRAPEAU SUR UNE COMPÉTENCE EN OPT-OUT — et il fallait le
 *    décider (`07-` §1.3 ; piège 11 du prompt).
 *
 * « L'opt-out ne retire pas une lettre, il retire une compétence D'UN COURS » :
 * une colonne en opt-out garde ses mesures et ses lettres, et l'écran dit
 * « retirée de ce cours ». Un drapeau posé dessus **serait du bruit** — le
 * professeur a explicitement dit qu'il ne travaille pas cette compétence-là.
 *
 * ⭐ ON NE LE CACHE PAS POUR AUTANT, ET LE MOTIF DÉCIDE. Un dossier N3 est un
 *    TRANSFERT DE CHARGE vers le professeur (`01-` §8.4) : le masquer le ferait
 *    disparaître pour tout le monde si aucune autre classe ne travaille cette
 *    compétence — et c'est précisément la file que le « fait quand » exige de
 *    voir. **On applique donc la doctrine que la matrice applique déjà à la
 *    mesure venue d'un autre cours : ça se SIGNALE, ça ne se cache pas.**
 *    Le drapeau reste, et il porte la phrase « retirée de ce cours ».
 * ⛔ Une seule règle, pour les deux drapeaux indexés par compétence — la
 *    fraîcheur d'ancre et le dossier N3. Les deux autres sont indexés par dépôt :
 *    l'opt-out ne les concerne pas.
 */
const PHRASE_OPT_OUT = 'Cette compétence est RETIRÉE de ce cours (opt-out) : elle garde ses '
  + 'mesures et sa lettre, mais ce cours ne la travaille pas.'

export interface AttentionDeLaClasse {
  /** Les quatre natures confondues, déjà ordonnées. ⛔ Jamais bornée. */
  drapeaux: Drapeau[]
  /** La distribution des contestations — montrée MÊME sans seuil réglé. */
  distribution: DistributionContestations
  /** Les deux seuils lus de `scriptorium_params`. `null` = aucun drapeau. */
  reglages: { contestations: number | null; faisceau: number | null }
  /**
   * ⭐ LE VIDE S'EXPLIQUE, ET IL A PLUSIEURS RAISONS. « Un bloc de drapeaux vide
   * sous un onglet qu'on vient de cliquer DOIT dire pourquoi » (`07-` §5).
   * Ces trois-là ne se confondent pas : rien à signaler · le calendrier ne dit
   * pas les cycles · une lecture a échoué.
   */
  cyclesConnus: boolean
  incidents: string[]
  /** Ce qui a été REGARDÉ — un décompte réel, jamais un score (`06-` §5). */
  regarde: {
    eleves: number
    /** ⚠️ DEUX nombres, pas un : la file compte des DOSSIERS, pas des élèves. */
    dossiersN3: number
    elevesEnN3: number
    depotsMaison: number
    actes: number
  }
}

/**
 * ⚠️ LES CYCLES SONT CEUX DU CALENDRIER, VACANCES RETIRÉES. « Un compte de
 *    semaines n'est pas un compte de jours divisé par sept » : les semaines de
 *    vacances « sortent du dénominateur PAR OMISSION » (`06-` §5 ; `07-` §1.5).
 *    On reprend la lecture de `lireLesSegments` — même source, même filtre.
 */
async function lireLesCycles(
  admin: Admin, incidents: string[],
): Promise<CycleDuCalendrier[]> {
  const [rSem, rVac] = await Promise.all([
    Promise.resolve(admin.from('semesters').select('id, start_date, end_date')
      .is('archived_at', null).order('start_date')),
    Promise.resolve(admin.from('holidays').select('semester_id, label, start_date, end_date')),
  ])
  if (rSem.error) incidents.push(`le calendrier (semestres) : ${rSem.error.message}`)
  if (rVac.error) incidents.push(`le calendrier (vacances) : ${rVac.error.message}`)
  const cycles: CycleDuCalendrier[] = []
  for (const s of (rSem.data ?? []) as Array<{ id: string; start_date: string; end_date: string }>) {
    const h = ((rVac.data ?? []) as Array<{ semester_id: string; label: string
      start_date: string; end_date: string }>)
      .filter((v) => v.semester_id === s.id)
      .map((v) => ({ label: v.label, start_date: v.start_date, end_date: v.end_date }))
    for (const w of calculerGrilleSemaines(s, h)) {
      if (w.isVacation) continue
      cycles.push({ dateDebutLundi: w.start })
    }
  }
  return cycles
}

// ════════════════════════════════════════════════════════════════════════════
// LES MESURES — une seule lecture pour les trois drapeaux qui en ont besoin
// ════════════════════════════════════════════════════════════════════════════

/**
 * Une mesure, PLUS l'élève à qui elle appartient. `Mesure` ne le porte pas :
 * elle est toujours lue POUR un élève.
 *
 * ⛔ LA CONVERSION N'EST PAS RECOPIÉE ICI. On appelle `lireLesMesuresDesEleves`
 *    (`utils/routeur/donnees.ts`), qui pagine, confronte au `count: 'exact'` et
 *    LÈVE sur une lecture tronquée. « Une copie privée de la règle a déjà coûté
 *    un écran entier » (`C4L11-F`).
 */
type MesureDeClasse = Mesure & { eleveId: string }

async function lireLesMesuresDeLaClasse(
  admin: Admin, eleveIds: string[], incidents: string[],
): Promise<MesureDeClasse[]> {
  if (eleveIds.length === 0) return []
  try {
    const [mesures, eleveDe] = await Promise.all([
      lireLesMesuresDesEleves(admin, eleveIds),
      lireLElevesDesMesures(admin, eleveIds),
    ])
    return mesures.map((m) => ({ ...m, eleveId: eleveDe.get(m.id) ?? '?' }))
  } catch (e) {
    // ⛔ Une lecture ratée ou TRONQUÉE n'est pas une base vide : on le dit, et
    //    l'écran affiche l'incident au lieu d'un bloc vide rassurant.
    const quoi = e instanceof LectureTronquee ? 'tronquée' : 'échouée'
    incidents.push(`les mesures de la classe (${quoi}) : ${(e as Error).message}`)
    return []
  }
}

// ════════════════════════════════════════════════════════════════════════════
// ③ LE DRAPEAU DE LA FRAÎCHEUR D'ANCRE — celui qui était muet par construction
// ════════════════════════════════════════════════════════════════════════════

/**
 * `01-` §9 — « une ancre par compétence `evaluee` tous les 6 cycles, portée par
 * le PLAN D'ÉVALUATION. Si le plan manque cet objectif : **signal non bloquant**
 * vers le professeur, et **la lettre ne gèle pas** — elle continue de monter
 * jusqu'au plafond ancre + 2. »
 *
 * ⛔ ET LA CADENCE NE SE DIFFÉRENCIE PAS PAR PARCOURS : « aucune cadence
 *    différenciée, aucune source d'ancre de remplacement, aucun traitement
 *    particulier d'un parcours n'est à construire ». Le signal joue à
 *    l'identique en TC et en HLP — rien ici ne lit le parcours.
 *
 * ⭐ LA PHRASE VIENT DE `lettres.ts`, PAS D'ICI. C'est tout l'objet du canal :
 *    ce module donne l'entrée qu'on laissait vide, et rend la phrase que le
 *    verdict a écrite.
 */
async function drapeauxDeFraicheurDAncre(
  admin: Admin, eleveIds: string[], nomDe: Map<string, string>,
  mesures: readonly MesureDeClasse[], cycles: CycleDuCalendrier[], aujourdHui: string,
  fuseau: string, optOut: Record<string, boolean>, incidents: string[],
): Promise<Drapeau[]> {
  if (eleveIds.length === 0 || cycles.length === 0) return []
  const [rNiveaux, statuts] = await Promise.all([
    Promise.resolve(admin.from('competences_niveaux')
      .select('eleve_id, competence, lettre, lettre_initiale, profil_provisoire, '
        + 'ancre_derniere_date, ancre_derniere_valeur')
      .in('eleve_id', eleveIds)),
    lireLesStatutsAvecDate(admin),
  ])
  if (rNiveaux.error) {
    incidents.push(`les niveaux : ${rNiveaux.error.message}`)
    return []
  }
  const statutDe = new Map(statuts.map((s) => [s.competence as string, s]))
  if (statuts.length === 0) {
    incidents.push('les statuts de recette : aucune ligne lue — la borne des mesures qui '
      + 'comptent est inconnue.')
  }

  const parCellule = new Map<string, MesureDeClasse[]>()
  for (const m of mesures) {
    const k = `${m.eleveId}|${m.competence}`
    const lot = parCellule.get(k) ?? []
    lot.push(m)
    parCellule.set(k, lot)
  }

  const drapeaux: Drapeau[] = []
  for (const n of (rNiveaux.data ?? []) as unknown as Array<{
    eleve_id: string; competence: string; lettre: string | null; lettre_initiale: string | null
    profil_provisoire: boolean | null; ancre_derniere_date: string | null
    ancre_derniere_valeur: string | null
  }>) {
    const competence = n.competence as Competence
    const st = statutDe.get(competence)
    // ⛔ « Une ancre par compétence **`evaluee`** » : une compétence différée ou
    //    mesurée en silence n'a pas d'objectif de cadence à manquer.
    if (st?.statut !== 'evaluee') continue

    // La borne : la dernière ancre, ou à défaut la pose du statut de recette —
    // c'est de là que la cadence commence à courir pour une compétence qui n'a
    // jamais été ancrée. ⛔ Sans l'une ni l'autre, on ne compte RIEN : on ne sait
    // pas depuis quand, et un drapeau qui compte depuis une date inventée ment.
    const depuis = n.ancre_derniere_date ?? (st.poseLe ? jourDansFuseau(st.poseLe, fuseau) : null)
    if (!depuis) continue
    const d = cyclesEcoules(cycles, depuis, aujourdHui)
    if (d === null) continue

    const siennes = parDate(parCellule.get(`${n.eleve_id}|${competence}`) ?? [])
    const comptent = mesuresQuiComptent(siennes, st.poseLe ?? null)
    const etat: EtatNiveau = {
      lettre: (n.lettre ?? null) as EtatNiveau['lettre'],
      lettreInitiale: (n.lettre_initiale ?? null) as EtatNiveau['lettreInitiale'],
      profilProvisoire: n.profil_provisoire ?? false,
      ancreDerniereDate: n.ancre_derniere_date,
      ancreDerniereValeur: (n.ancre_derniere_valeur ?? null) as EtatNiveau['ancreDerniereValeur'],
      statutRecettePoseLe: st.poseLe ?? null,
    }
    // ⭐ LE CANAL. On donne l'entrée qu'on laissait vide, et on ne retient QUE
    //    `drapeaux` : la lettre du verdict n'est jamais lue ici.
    // ⛔ `incoherenceRepetee` N'EST PAS PASSÉ, et c'est délibéré : son drapeau
    //    est l'un des TROIS QUE CE LOT NE POSE PAS (`06-` §3 ; `01-` §9), et le
    //    passer BLOQUERAIT LA MONTÉE dans le verdict rendu. Le canal l'accueille
    //    sans une ligne de code neuve — voir le relevé.
    // ⛔ `ancreNouvelle` non plus : à la lecture, aucune ancre ne « vient
    //    d'arriver » — le moteur l'a déjà enregistrée. Le drapeau de discordance
    //    est TRANSITOIRE et se lève à l'écriture, chez `etat-serveur.ts`.
    const verdict = jugerLaLettre(etat, comptent, {
      cyclesDepuis: (m) => cyclesEcoules(cycles, jourDansFuseau(m.mesureAt, fuseau), aujourdHui) ?? 0,
      cyclesDepuisDerniereAncre: d,
    })
    for (const phrase of verdict.drapeaux) {
      drapeaux.push({
        nature: 'fraicheur_ancre',
        eleveId: n.eleve_id,
        eleveNom: nomDe.get(n.eleve_id) ?? '?',
        cle: `${n.eleve_id}|${competence}`,
        phrase,
        detail: [
          n.ancre_derniere_date
            ? `Dernière ancre le ${n.ancre_derniere_date}${n.ancre_derniere_valeur ? ` (${n.ancre_derniere_valeur})` : ''}.`
            : 'Aucune ancre : le compte part de la pose du statut de recette.',
          'Signal NON BLOQUANT : rien n’est bloqué, et la lettre continue de monter '
          + 'jusqu’au plafond ancre + 2.',
          'La cadence est un objectif du plan d’évaluation, qui appartient au professeur.',
          ...(optOut[competence] === false ? [PHRASE_OPT_OUT] : []),
        ],
        at: n.ancre_derniere_date ? `${n.ancre_derniere_date}T00:00:00Z` : null,
        enTete: false,
        // ⛔ AUCUN GESTE : le signal est non bloquant, et poser une ancre est un
        //    acte du plan d'évaluation, pas un bouton sur un drapeau.
        geste: null,
      })
    }
  }
  return drapeaux
}

// ════════════════════════════════════════════════════════════════════════════
// ④ LA FILE DES DOSSIERS N3 — le moteur les ouvre, l'écran vit ici
// ════════════════════════════════════════════════════════════════════════════

/**
 * `01-` §8.4 — « drapeau professeur avec **DOSSIER COMPLET** : observable en
 * échec, interventions tentées, productions exemplaires ». ⛔ Ne rends pas un
 * dossier à un tiers vide en appelant ça une file.
 *
 * ⚠️ LA CLÉ EST (élève × compétence × OBSERVABLE) : un élève peut porter
 *    plusieurs dossiers à la fois, sur la même compétence. La file compte des
 *    DOSSIERS, pas des élèves.
 *
 * ⭐ La lecture est celle que l'index partiel `idx_escalade_n3_ouvert` sert
 *    exactement (`c4_l1_schema.sql:756`) : ouvert non nul, traité nul.
 */
async function drapeauxDeDossierN3(
  admin: Admin, eleveIds: string[], nomDe: Map<string, string>,
  mesures: readonly MesureDeClasse[], cycles: CycleDuCalendrier[], aujourdHui: string,
  fuseau: string, optOut: Record<string, boolean>, incidents: string[],
): Promise<{ drapeaux: Drapeau[]; dossiers: number; eleves: number }> {
  if (eleveIds.length === 0) return { drapeaux: [], dossiers: 0, eleves: 0 }
  const { data, error } = await admin.from('competences_escalade')
    .select('eleve_id, competence, observable, degre, entre_n1_at, dossier_n3_ouvert_at, '
      + 'dossier_n3_traite_at')
    .in('eleve_id', eleveIds)
    .not('dossier_n3_ouvert_at', 'is', null)
    .is('dossier_n3_traite_at', null)
    .order('dossier_n3_ouvert_at', { ascending: true })
  if (error) {
    incidents.push(`la file des dossiers N3 : ${error.message}`)
    return { drapeaux: [], dossiers: 0, eleves: 0 }
  }
  const lignes = (data ?? []) as unknown as Array<{
    eleve_id: string; competence: string; observable: string; degre: string
    entre_n1_at: string | null; dossier_n3_ouvert_at: string; dossier_n3_traite_at: string | null
  }>

  // Ce que la fiche dit à l'élève, pour nommer l'observable en langue élève.
  const { data: corresp } = await admin.from('competences_correspondance')
    .select('competence, observable_code, dimension_eleve')
  const nomObservable = new Map(((corresp ?? []) as Array<{
    competence: string; observable_code: string; dimension_eleve: string | null
  }>).map((c) => [`${c.competence}|${c.observable_code}`, c.dimension_eleve ?? c.observable_code]))

  const parCellule = new Map<string, MesureDeClasse[]>()
  for (const m of mesures) {
    const k = `${m.eleveId}|${m.competence}`
    const lot = parCellule.get(k) ?? []
    lot.push(m)
    parCellule.set(k, lot)
  }
  const statuts = await lireLesStatutsAvecDate(admin)
  const poseLeDe = new Map(statuts.map((s) => [s.competence as string, s.poseLe ?? null]))

  const drapeaux: Drapeau[] = []
  for (const l of lignes) {
    const competence = l.competence as Competence
    const ouvertJour = jourDansFuseau(l.dossier_n3_ouvert_at, fuseau)
    // ⚠️ EN CYCLES, jamais en `Date` : « les semaines de vacances n'en sont pas ».
    const semaines = cyclesEcoules(cycles, ouvertJour, aujourdHui)
    const etat = {
      observable: l.observable,
      degre: l.degre as 'N1' | 'N2' | 'N3',
      entreN1At: l.entre_n1_at,
      dossierN3OuvertAt: l.dossier_n3_ouvert_at,
      dossierN3TraiteAt: l.dossier_n3_traite_at,
    }
    // ⭐ LE MOTEUR DÉCIDE, PAS L'ÉCRAN : `dossierN3` porte la règle du §8.4.
    const verdict = dossierN3(etat, semaines)

    // ── LE DOSSIER COMPLET, ses trois pièces ──────────────────────────────
    const detail: string[] = []
    const nomObs = nomObservable.get(`${competence}|${l.observable}`) ?? l.observable
    detail.push(`Observable en échec : « ${nomObs} » (${l.observable}).`)

    // (1) L'observable en échec — au sens du ROUTEUR : l'ACQUISITION sur la
    //     fenêtre d'évidence, pas la réussite d'une mesure. « C'est
    //     l'acquisition qui décide de l'escalade » (`01-` §8.2).
    const instrument = etatCompetence(competence).instrument
    const entree = instrument?.observables_mesure?.[l.observable]
    const comptent = mesuresQuiComptent(
      parDate(parCellule.get(`${l.eleve_id}|${competence}`) ?? []),
      poseLeDe.get(competence) ?? null)
    if (entree && instrument) {
      const parametres = valeursDesParametres(instrument)
      const fenetre = fenetreDEvidence(comptent)
      const t = tauxDeReussite(
        fenetre.map((m) => m.observables?.[l.observable] as ValeurObservable | undefined),
        entree, parametres)
      detail.push(t.taux === null
        ? 'Fenêtre d’évidence : aucune mesure ayant un objet — l’observable ne se classe pas.'
        : `Fenêtre d’évidence : ${t.reussies}/${t.denominateur} réussies (${Math.round(t.taux * 100)} %) `
          + `— ${estAcquis(t.taux) ? 'ACQUIS' : 'non acquis'} au sens du routeur (seuil > 2/3).`)
    } else {
      detail.push('L’instrument de cette compétence n’est pas lisible : le taux ne se calcule pas '
        + '(le dossier reste, il n’est pas moins réel).')
    }

    // (2) Les interventions tentées — le degré et la date d'entrée en N1.
    const cyclesDepuisN1 = l.entre_n1_at
      ? cyclesEcoules(cycles, jourDansFuseau(l.entre_n1_at, fuseau), aujourdHui) : null
    detail.push(`Interventions tentées : degré ${l.degre}`
      + (l.entre_n1_at
        ? ` · entré en N1 le ${jourDansFuseau(l.entre_n1_at, fuseau)}`
          + (cyclesDepuisN1 !== null ? ` (${cyclesDepuisN1} cycle(s))` : '')
        : ' · aucune date d’entrée en N1 enregistrée')
      + '.')

    // (3) Les productions exemplaires — les mesures de l'observable et leurs dépôts.
    const portantes = entree && instrument
      ? comptent.filter((m) => m.observables?.[l.observable] !== undefined)
      : []
    if (portantes.length === 0) {
      detail.push('Productions : aucune mesure qui compte ne porte cet observable.')
    } else {
      const parametres = valeursDesParametres(instrument!)
      const dernieres = portantes.slice(-4).map((m) => {
        const s = statutDeLaMesure(
          m.observables?.[l.observable] as ValeurObservable | undefined, entree!, parametres)
        const mot = s === 'reussie' ? 'réussie' : s === 'ratee' ? 'ratée' : 'sans objet'
        return `${jourDansFuseau(m.mesureAt, fuseau)} ${mot}`
      })
      detail.push(`Productions (${portantes.length} mesure(s) qui comptent, `
        + `${portantes.filter((m) => m.depotId).length} avec un dépôt) — les 4 dernières : `
        + `${dernieres.join(' · ')}.`)
    }

    if (optOut[competence] === false) detail.push(PHRASE_OPT_OUT)

    if (verdict.reSignaler) {
      detail.push(`RE-SIGNALÉ : ${semaines} cycle(s) sans traitement. Il remonte en tête ; `
        + 'il ne se compte pas, et rien ne se met en attente.')
    }

    drapeaux.push({
      nature: 'dossier_n3',
      eleveId: l.eleve_id,
      eleveNom: nomDe.get(l.eleve_id) ?? '?',
      cle: `${l.eleve_id}|${competence}|${l.observable}`,
      phrase: `Dossier N3 ouvert le ${ouvertJour} sur ${competence} — « ${nomObs} ». `
        + 'Le routeur rend la main : la compétence est en régime d’entretien.',
      detail,
      at: l.dossier_n3_ouvert_at,
      enTete: verdict.reSignaler,
      geste: {
        action: 'traiter_n3',
        ref: `${l.eleve_id}|${competence}|${l.observable}`,
        mot: 'J’ai pris le dossier',
      },
    })
  }
  // ⚠️ « Ta file compte des DOSSIERS, pas des élèves — et l'écran doit rendre
  //    les DEUX lisibles » : un élève peut porter plusieurs dossiers à la fois,
  //    la clé de l'escalade étant (élève × compétence × observable).
  return { drapeaux, dossiers: lignes.length, eleves: new Set(lignes.map((l) => l.eleve_id)).size }
}

// ════════════════════════════════════════════════════════════════════════════
// ⑤ LES CONTESTATIONS — un drapeau ET une file, et ce ne sont pas la même chose
// ════════════════════════════════════════════════════════════════════════════

interface LotContestations {
  actes: ActeLu[]
  /** `point_id` → le texte du point du retour PUBLIÉ. Jamais le squelette. */
  texteDuPoint: Map<string, string>
}

/**
 * ⚠️ CE QUE L'ÉCRAN A LE DROIT DE MONTRER. « N'expose jamais à un client ce que
 *    `exercices_squelettes` et `exercices_metacognition` portent : c'est la garde
 *    la plus facile à casser et la plus coûteuse — elle donne la grille et les
 *    réponses » (`07-` §1). ⭐ La preuve d'une contestation est un cas limite, et
 *    la règle est nette : **elle montre LE POINT DU RETOUR PUBLIÉ**, pas le
 *    squelette. On ne remonte donc que `exercices_retours.texte`, et seulement
 *    pour les points effectivement contestés.
 *
 * ⚠️ « Le retour arrive SEGMENTÉ, et c'est un contrat sur celui qui l'engendre »
 *    (`07-` §1.2) : `texte` est une LISTE DE POINTS à identifiants stables.
 *    ⛔ NE LE DÉCOUPE PAS, LIS-LE.
 */
async function lireLesContestations(
  admin: Admin, eleveIds: string[], incidents: string[],
): Promise<LotContestations> {
  const vide: LotContestations = { actes: [], texteDuPoint: new Map() }
  if (eleveIds.length === 0) return vide

  // Les dépôts de ces élèves — la borne est la POPULATION D'ÉLÈVES de la classe,
  // jamais un `classe_id` sur la mesure, « qui est NULL la plupart du temps ».
  const depots: Array<{ id: string; eleveId: string }> = []
  for (let debut = 0; ; debut += PAGE) {
    const { data, error } = await admin.from('exercices_depots').select('id, eleve_id')
      .in('eleve_id', eleveIds).order('id', { ascending: true })
      .range(debut, debut + PAGE - 1)
    if (error) { incidents.push(`les dépôts : ${error.message}`); return vide }
    const page = (data ?? []) as Array<{ id: string; eleve_id: string }>
    depots.push(...page.map((d) => ({ id: d.id, eleveId: d.eleve_id })))
    if (page.length < PAGE) break
  }
  if (depots.length === 0) return vide
  const eleveDuDepot = new Map(depots.map((d) => [d.id, d.eleveId]))
  const ids = depots.map((d) => d.id)

  const brutes: Array<{ depot_id: string; contestation_points: unknown }> = []
  for (let debut = 0; debut < ids.length; debut += 200) {
    const tranche = ids.slice(debut, debut + 200)
    const { data, error } = await admin.from('exercices_metacognition')
      .select('depot_id, contestation_points')
      .in('depot_id', tranche)
      .not('contestation_points', 'is', null)
    if (error) { incidents.push(`les contestations : ${error.message}`); return vide }
    brutes.push(...((data ?? []) as Array<{ depot_id: string; contestation_points: unknown }>))
  }

  const actes: ActeLu[] = []
  for (const b of brutes) {
    if (!Array.isArray(b.contestation_points)) continue
    for (const x of b.contestation_points as unknown[]) {
      if (!x || typeof x !== 'object') continue
      const o = x as Record<string, unknown>
      if (typeof o.point_id !== 'string' || typeof o.texte !== 'string') continue
      actes.push({
        depotId: b.depot_id,
        eleveId: eleveDuDepot.get(b.depot_id) ?? '?',
        pointId: o.point_id,
        texte: o.texte,
        at: typeof o.at === 'string' ? o.at : '',
        citationAbsente: o.citation_absente === true,
        // ⭐ La marque de ce lot. Une clé absente vaut « en file », jamais traitée.
        traiteAt: typeof o.traite_at === 'string' && o.traite_at !== '' ? o.traite_at : null,
      })
    }
  }
  if (actes.length === 0) return vide

  // Le texte des points contestés, depuis le retour PUBLIÉ de leurs dépôts.
  const texteDuPoint = new Map<string, string>()
  const depotsContestes = [...new Set(actes.map((a) => a.depotId))]
  for (let debut = 0; debut < depotsContestes.length; debut += 200) {
    const { data, error } = await admin.from('exercices_retours')
      .select('depot_id, texte, published_at')
      .in('depot_id', depotsContestes.slice(debut, debut + 200))
      .not('published_at', 'is', null)
    if (error) { incidents.push(`les retours contestés : ${error.message}`); continue }
    for (const r of (data ?? []) as Array<{ texte: unknown }>) {
      if (!Array.isArray(r.texte)) continue
      for (const p of r.texte as unknown[]) {
        if (!p || typeof p !== 'object') continue
        const o = p as Record<string, unknown>
        if (typeof o.id === 'string' && typeof o.texte === 'string') texteDuPoint.set(o.id, o.texte)
      }
    }
  }
  return { actes, texteDuPoint }
}

function drapeauxDeContestation(
  lot: LotContestations, nomDe: Map<string, string>, seuil: number | null, fuseau: string,
): Drapeau[] {
  const drapeaux: Drapeau[] = []
  const extrait = (t: string) => (t.length > 220 ? `${t.slice(0, 217)}…` : t)

  // (a) LA FILE D'EXAMEN HUMAIN — un acte par ligne, elle n'attend AUCUNE
  //     répétition, et « ce n'est pas un confort » (`06-` §7, loi 25).
  for (const a of fileDExamenHumain(lot.actes)) {
    const point = lot.texteDuPoint.get(a.pointId)
    drapeaux.push({
      nature: 'contestations_repetees',
      eleveId: a.eleveId,
      eleveNom: nomDe.get(a.eleveId) ?? '?',
      cle: `${a.depotId}|${a.pointId}`,
      phrase: 'Contestation sur une CITATION ABSENTE de la copie — elle part directement en '
        + 'file professeur : c’est l’exigence d’examen humain de la loi.',
      detail: [
        point ? `Le point contesté : « ${extrait(point)} »` : 'Le point contesté n’a pas pu être '
          + 'relu dans le retour publié (retour non publié, ou point retiré).',
        `Ce que l’élève écrit : « ${extrait(a.texte)} »`,
        'Regarder n’est pas corriger : contester n’altère rien automatiquement, et cet écran '
        + 'ne corrige aucune mesure.',
      ],
      at: a.at || null,
      enTete: false,
      geste: {
        action: 'traiter_contestation',
        ref: `${a.depotId}|${a.pointId}`,
        mot: 'J’ai examiné',
      },
    })
  }

  // (b) LE DRAPEAU DES CONTESTATIONS RÉPÉTÉES — un par élève, et il n'existe
  //     que si un seuil est réglé.
  for (const e of elevesQuiRepetent(lot.actes, { seuil })) {
    const dejaEnFile = new Set(e.actes.filter((a) => a.citationAbsente).map((a) => a.pointId))
    drapeaux.push({
      nature: 'contestations_repetees',
      eleveId: e.eleveId,
      eleveNom: nomDe.get(e.eleveId) ?? '?',
      cle: `repetition|${e.eleveId}`,
      phrase: `${e.actes.length} contestations distinctes non traitées — au-delà du seuil réglé `
        + `(${seuil}). « La contestation remonte au professeur en drapeau si elle se répète. »`,
      detail: [
        ...e.actes.slice(0, 8).map((a) => {
          const point = lot.texteDuPoint.get(a.pointId)
          // ⚠️ `at` est un INSTANT : il se formate dans le fuseau de l'école,
          //    jamais tranché à dix caractères (qui rend l'UTC).
          return `${a.at ? jourDansFuseau(a.at, fuseau) : 'sans date'} — ${point ? `« ${extrait(point)} » : ` : ''}`
            + `« ${extrait(a.texte)} »${dejaEnFile.has(a.pointId) ? ' [aussi en file d’examen humain]' : ''}`
        }),
        ...(e.actes.length > 8 ? [`… et ${e.actes.length - 8} de plus.`] : []),
        'Un acte compte UNE fois : un même point recontesté remplace le sien.',
      ],
      at: e.actes.map((a) => a.at).filter(Boolean).sort()[0] ?? null,
      enTete: false,
      // ⛔ Aucun geste global : le traitement se fait acte par acte, dans la file.
      geste: null,
    })
  }
  return drapeaux
}

// ════════════════════════════════════════════════════════════════════════════
// ⑥ LE FAISCEAU D'INTÉGRITÉ — il conclut, et il exige une confirmation humaine
// ════════════════════════════════════════════════════════════════════════════

/**
 * ⭐⭐ POURQUOI L'ÉVALUATION VIT ICI, ET CE QUI LA REND SÛRE.
 *
 * « Le drapeau d'intégrité passe par le canal qui existe déjà —
 *   `signalerEnAttenteIA`, qui écrit dans `integrite_signalements`, DÉDUPLIQUE
 *   PAR RENDU et s'éteint par SON PROPRE INTERRUPTEUR. Un lot le réutilise, il
 *   n'en crée pas un second. » (`07-` §1.2)
 *
 * Le drapeau doit donc être ÉCRIT pour exister — c'est sur cette ligne que la
 * confirmation humaine s'exerce. Les sept signaux, eux, sont collectés depuis
 * C4-L3 et C4-L4 et **personne ne les fait converger**. Ce lot est le premier
 * lecteur ; c'est donc lui qui conclut, au moment où le professeur regarde.
 *
 * TROIS GARDES rendent l'écriture sûre :
 *   · **idempotente** — `signalerEnAttenteIA` fait un `upsert … ignoreDuplicates`
 *     sur `(eleve_id, module, rendu_ref)` : rejouer n'écrit rien de neuf ;
 *   · **gatée** — elle sort sans rien écrire quand `integrite_params.actif` est
 *     à OFF. ⛔ Ce n'est PAS l'interrupteur de la page : « chaque écran lit LE
 *     SIEN » (`07-` §5), la page est gardée par `competences_affichage_actif`
 *     et le canal par le sien. On ne bascule ni l'un ni l'autre ;
 *   · **sans conséquence automatique** — le type ne compte AUCUN strike, donc
 *     rien ne se bloque : « le professeur voit, il confirme, et rien ne se
 *     bloque » (arbitrage ③ de Louis, 27/08).
 *
 * ⭐ LA FORME DE `rendu_ref` EST L'ID DU DÉPÔT, et le choix se justifie :
 *    la contrainte d'unicité est `(eleve_id, module, rendu_ref)`, et c'est elle
 *    qui déduplique. « Un dépôt porte deux versions ; un faisceau par version et
 *    un faisceau par dépôt ne comptent pas la même chose. » Le faisceau se lit
 *    sur LE DÉPÔT — le `delta_v1_vf` a besoin des DEUX versions pour exister, et
 *    un faisceau par version ne pourrait jamais porter ce signal-là.
 */
async function drapeauxDuFaisceau(
  admin: Admin, eleveIds: string[], nomDe: Map<string, string>,
  mesures: readonly MesureDeClasse[], seuil: number | null, incidents: string[],
): Promise<{ drapeaux: Drapeau[]; depotsMaison: number }> {
  if (eleveIds.length === 0) return { drapeaux: [], depotsMaison: 0 }

  // ── Les dépôts dont il y a quelque chose à juger ────────────────────────
  // ⛔ `abandonne` est EXCLU : « un exercice jamais ouvert n'est pas une preuve »
  //    (`c4_l1_schema.sql`), et il n'en est pas une de triche non plus.
  const brutes: Array<Record<string, unknown>> = []
  for (let debut = 0; ; debut += PAGE) {
    const { data, error } = await admin.from('exercices_depots')
      .select('id, eleve_id, exercice_id, duree_taguee, saisie_telemetrie, collages_bloques, '
        + 'texte_v1, transcription_v1, statut, exercices(lieu)')
      .in('eleve_id', eleveIds)
      .not('v1_remis_at', 'is', null)
      .neq('statut', 'abandonne')
      .order('id', { ascending: true })
      .range(debut, debut + PAGE - 1)
    if (error) {
      incidents.push(`les dépôts du faisceau : ${error.message}`)
      return { drapeaux: [], depotsMaison: 0 }
    }
    const page = (data ?? []) as unknown as Array<Record<string, unknown>>
    brutes.push(...page)
    if (page.length < PAGE) break
  }
  if (brutes.length === 0) return { drapeaux: [], depotsMaison: 0 }

  // La `forme` et les deltas viennent des MESURES du dépôt (`07-` §1.2).
  const parDepot = new Map<string, MesureDeClasse[]>()
  for (const m of mesures) {
    if (!m.depotId) continue
    const lot = parDepot.get(m.depotId) ?? []
    lot.push(m)
    parDepot.set(m.depotId, lot)
  }

  const candidats: DepotAuFaisceau[] = []
  for (const d of brutes) {
    const id = d.id as string
    const relLieu = d.exercices as { lieu?: string | null } | Array<{ lieu?: string | null }> | null
    const lieu = (Array.isArray(relLieu) ? relLieu[0]?.lieu : relLieu?.lieu) ?? null
    const desMesures = parDepot.get(id) ?? []
    // La `forme` est celle des mesures du dépôt. Sans mesure, on prend le défaut
    // du `07-` §1.2 (`formatif`) — et le LIEU, lui, ne se devine jamais.
    const forme = desMesures.find((m) => m.forme)?.forme ?? null
    const texte = ((d.texte_v1 as string | null) ?? (d.transcription_v1 as string | null) ?? '')
    candidats.push({
      depotId: id,
      eleveId: d.eleve_id as string,
      lieu: (lieu as string | null) ?? (desMesures.find((m) => m.lieu)?.lieu ?? null),
      forme,
      dureeTaguee: (d.duree_taguee as string | null) ?? null,
      telemetrieV1: lireTelemetrie(d.saisie_telemetrie).v1 ?? null,
      signesV1: texte.replace(/\s+/g, ' ').trim().length,
      collagesBloques: lireLesCollages(d.collages_bloques).length,
      calibration: null, // rempli plus bas, pour les seuls dépôts regardables
      deltas: desMesures.map((m) => m.deltaV1Vf),
    })
  }

  // ⛔ LA PREMIÈRE GARDE, AVANT TOUTE AUTRE LECTURE : « le faisceau ne regarde
  //    QUE le formatif fait à la maison » (`06-` §6).
  const regardables = candidats.filter(estRegardable)
  if (regardables.length === 0) return { drapeaux: [], depotsMaison: 0 }

  // La calibration, pour ceux-là seulement.
  const idsRegardables = regardables.map((d) => d.depotId)
  for (let debut = 0; debut < idsRegardables.length; debut += 200) {
    const { data, error } = await admin.from('exercices_metacognition')
      .select('depot_id, calibration')
      .in('depot_id', idsRegardables.slice(debut, debut + 200))
    if (error) { incidents.push(`la calibration : ${error.message}`); break }
    const parId = new Map(((data ?? []) as Array<{ depot_id: string; calibration: string | null }>)
      .map((r) => [r.depot_id, r.calibration]))
    for (const d of regardables) {
      if (parId.has(d.depotId)) d.calibration = parId.get(d.depotId) ?? null
    }
  }

  // ── La convergence, et le drapeau qui en part ──────────────────────────
  const params = await lireParamsIntegrite(admin)
  const converges = regardables
    .map((d) => ({ d, c: convergence(faisceauDuDepot(d), { seuil }) }))
    .filter((x) => x.c.converge)

  if (converges.length > 0 && params.actif) {
    // ⚠️ Séquentiel et best-effort : `signalerEnAttenteIA` avale ses erreurs par
    //    conception (« un échec de signalement ne doit jamais casser le flux »).
    for (const { d, c } of converges) {
      await signalerEnAttenteIA(admin, {
        eleveId: d.eleveId,
        module: 'exercices',
        renduRef: d.depotId,
        type: TYPE_FAISCEAU,
        motif: motifDuFaisceau(c),
      })
    }
  }

  // ── Ce que l'écran montre : les lignes du canal, pas notre calcul ───────
  // ⭐ On relit `integrite_signalements` : le drapeau est CE QUI EST EN BASE, et
  //    c'est sur cette ligne que la confirmation humaine s'exercera.
  const { data: signalements, error: eSig } = await admin.from('integrite_signalements')
    .select('id, eleve_id, rendu_ref, motif, statut, created_at')
    .eq('module', 'exercices')
    .in('eleve_id', eleveIds)
    .is('acquitte_at', null)
    .order('created_at', { ascending: true })
  if (eSig) {
    incidents.push(`les signalements du faisceau : ${eSig.message}`)
    return { drapeaux: [], depotsMaison: regardables.length }
  }

  const parCandidat = new Map(regardables.map((d) => [d.depotId, d]))
  const drapeaux: Drapeau[] = ((signalements ?? []) as Array<{
    id: string; eleve_id: string; rendu_ref: string; motif: string | null
    statut: string; created_at: string
  }>).map((s) => {
    const d = parCandidat.get(s.rendu_ref)
    const c = d ? convergence(faisceauDuDepot(d), { seuil }) : null
    return {
      nature: 'faisceau_integrite' as const,
      eleveId: s.eleve_id,
      eleveNom: nomDe.get(s.eleve_id) ?? '?',
      cle: `faisceau|${s.id}`,
      phrase: 'Faisceau d’intégrité : les signaux convergent sur un exercice fait à la maison. '
        + 'Il EXIGE une confirmation humaine, et il ne produit AUCUN verdict.',
      detail: [
        s.motif ?? 'Motif absent.',
        ...(c ? [`Signaux éteints : ${c.eteints.map((x) => PHRASE_SIGNAL[x]).join(', ') || 'aucun'}.`] : []),
        'Confirmer NE COMPTE AUCUN STRIKE et ne bloque rien : le faisceau dit « quelqu’un '
        + 'd’autre a fait le travail », le strike parle d’effort.',
      ],
      at: s.created_at,
      enTete: false,
      geste: {
        action: 'confirmer_faisceau' as const,
        ref: s.id,
        mot: 'Je confirme (sans strike)',
      },
    }
  })
  return { drapeaux, depotsMaison: regardables.length }
}

// ════════════════════════════════════════════════════════════════════════════
// L'ASSEMBLAGE
// ════════════════════════════════════════════════════════════════════════════

/**
 * LES QUATRE DRAPEAUX D'UNE CLASSE.
 *
 * ⚠️ LA BORNE EST LA POPULATION D'ÉLÈVES, JAMAIS UN `classe_id` SUR LA MESURE :
 *    `competences_niveaux` n'a aucun `classe_id` (« la lettre est une propriété
 *    de l'ÉLÈVE, pas de son cours », `07-` §1.3), et le `classe_id` d'une mesure
 *    est NULL la plupart du temps. C'est exactement la manière dont la matrice
 *    se borne déjà.
 *
 * ⚠️ `eleveIds` vient de la matrice de pilotage, déjà chargée par la page :
 *    la liste des inscrits ne se relit pas une seconde fois.
 */
export async function chargerLAttentionDeLaClasse(
  admin: Admin, eleveIds: string[], nomDe: Map<string, string>,
  fuseau: string, aujourdHui: string, optOut: Record<string, boolean> = {},
): Promise<AttentionDeLaClasse> {
  const incidents: string[] = []

  const [rParams, cycles] = await Promise.all([
    Promise.resolve(admin.from('scriptorium_params')
      .select('contestations_repetees_seuil, faisceau_convergence_seuil')
      .limit(1).maybeSingle()),
    lireLesCycles(admin, incidents),
  ])
  if (rParams.error) incidents.push(`les seuils réglables : ${rParams.error.message}`)
  const reglages = {
    contestations: (rParams.data?.contestations_repetees_seuil ?? null) as number | null,
    faisceau: (rParams.data?.faisceau_convergence_seuil ?? null) as number | null,
  }

  const mesures = await lireLesMesuresDeLaClasse(admin, eleveIds, incidents)

  const [ancre, n3, contestations] = await Promise.all([
    drapeauxDeFraicheurDAncre(
      admin, eleveIds, nomDe, mesures, cycles, aujourdHui, fuseau, optOut, incidents),
    drapeauxDeDossierN3(
      admin, eleveIds, nomDe, mesures, cycles, aujourdHui, fuseau, optOut, incidents),
    lireLesContestations(admin, eleveIds, incidents),
  ])
  // ⚠️ Le faisceau ÉCRIT (par le canal existant) : il part APRÈS les lectures,
  //    seul, pour que rien ne dépende de l'ordre d'exécution d'un `Promise.all`.
  const faisceau = await drapeauxDuFaisceau(
    admin, eleveIds, nomDe, mesures, reglages.faisceau, incidents)

  const drapeaux = ordonnerLesDrapeaux([
    ...n3.drapeaux,
    ...faisceau.drapeaux,
    ...drapeauxDeContestation(contestations, nomDe, reglages.contestations, fuseau),
    ...ancre,
  ])

  return {
    drapeaux,
    distribution: distributionDesContestations(contestations.actes),
    reglages,
    cyclesConnus: cycles.length > 0,
    incidents,
    regarde: {
      eleves: eleveIds.length,
      dossiersN3: n3.dossiers,
      elevesEnN3: n3.eleves,
      depotsMaison: faisceau.depotsMaison,
      actes: contestations.actes.length,
    },
  }
}

/** Les six du référentiel, pour que l'écran n'invente aucune liste. */
export const COMPETENCES_DE_LA_PAGE = COMPETENCES
