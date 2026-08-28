import 'server-only'
// ============================================================================
// C4 · L13 — L'ÉCRIVAIN DES COMPTEURS D'ASSIDUITÉ. Le seul du dépôt.
// ----------------------------------------------------------------------------
// `07-` §1.5 — « Elle est collectée DÈS LA RENTRÉE, même si les écrans
// attendent : un semestre ne se recompte pas après coup. » `07-` §5 — « La
// collecte, elle, ne les attend pas : les compteurs d'assiduité démarrent à la
// rentrée même si les écrans suivent. »
//
// ⭐ PARTAGÉ, comme `utils/scriptorium-synthese-rag.ts` l'est entre son cron et
//    le bouton prof : la route `/api/assiduite/hebdo` est un DÉCLENCHEUR MINCE,
//    tout le travail vit ici. **C'est ce qui rend le greffon de `C4-L12`
//    possible** : il remplira les minutes de la ligne que `poserLaSemaine
//    DAssiduite()` a posée, sans ouvrir un second cron sur la même clé.
//
// ⛔ UN SEUL DÉCLENCHEUR HEBDOMADAIRE, ET C'EST CELUI-CI (`07-` §2, des deux
//    côtés). « Deux crons sur une même clé fabriquent deux lignes. »
//
// ⛔ IL NE GATE RIEN. « Un interrupteur d'assiduité serait le geste exactement
//    contraire à l'échéance du lot : une porte fermée à la rentrée, c'est un
//    semestre perdu. » Et surtout pas `routeur_actif` : les deux agrégats ne
//    dépendent d'AUCUN routeur — les dépôts sont déjà assignés par la voie du
//    professeur, et c'est exactement ce qu'ils comptent.
//
// ⛔ CLIENT ADMIN OBLIGATOIRE, et AUCUNE POLICY ÉLÈVE N'EST OUVERTE.
//    `assiduite_hebdo` n'a qu'une policy — `assiduite_hebdo_prof_all` —, et
//    « zéro policy élève » est un invariant CONTRÔLÉ PAR REQUÊTE dans deux
//    migrations déjà jouées (drapeau `zero_policy_eleve`). Le `service_role`
//    contourne la RLS : rien à ouvrir.
//
// ⚠️ supabase-js NE LÈVE PAS : il rend `{ error }`. Toute écriture dont on ignore
//    le retour échoue INVISIBLEMENT, y compris sous un `try/catch`. Le cron
//    voisin ignore le `{ error }` de son upsert — on ne copie pas ce défaut : le
//    contre-exemple correct est `utils/cout-api.ts`, qui lit `{ error }` et
//    journalise « journalisation PERDUE ».
// ============================================================================

import type { Admin } from '@/utils/routeur/acces'
import { addDaysUTC, lundiOnOrBefore, toISODate } from '@/utils/calendrier-grille'
import { lireLesSeuils, lirePagine } from '@/utils/routeur/donnees'
import { retraitCompteDansLaSemaine } from '@/utils/routeur/assiduite'
import {
  comptesDeLaSemaine, dedoublonner, ligneDAssiduite, lotir,
  semainesDeTravail, trouverLaSemaine, verifierLaCharge,
  type DepotACompter, type LigneAPoser,
} from './collecte'

/** `assiduite_hebdo` — clé primaire `(eleve_id, cycle_lundi)`. L'upsert est idempotent. */
const CONFLIT = 'eleve_id,cycle_lundi'

/**
 * ⭐ LE LUNDI D'UN CRON HEBDOMADAIRE EST CELUI DE LA SEMAINE ÉCOULÉE, pas de la
 * semaine en cours. Même définition que `lundiSemaineEcoulee` du cron voisin :
 * un cron du lundi matin qui compterait la semaine en cours compterait une
 * semaine vide, chaque semaine.
 */
export function lundiSemaineEcoulee(aujourdHui: string): string {
  return toISODate(addDaysUTC(lundiOnOrBefore(aujourdHui), -7))
}

// ════════════════════════════════════════════════════════════════════════════
// LE BILAN — « `reclames` et `traites` SE COMPARENT »
// ════════════════════════════════════════════════════════════════════════════

/**
 * ⭐ EXIGENCE DE CONCEPTION, PAS ORNEMENT. « Une ligne ABSENTE se lit VERT à
 * l'écran » : `chargerAssiduite` remplace l'absence par `assignes: 0,
 * termines: 0`, `completion` rend `null`, la bande est verte, le tableau affiche
 * « — faite », et le taux d'inactivité compte l'absent comme actif. **Une
 * collecte en panne ressemble à une classe parfaite**, et le seul garde-fou
 * honnête, `collecteVide`, est GLOBAL.
 *
 * Le bilan doit donc distinguer « rien à compter » de « pas passé » — d'où
 * `elevesAttendus`, qui SE COMPARE à `lignesPosees + lignesFigees`.
 */
export interface BilanCollecte {
  /** Le lundi de la semaine comptée — toujours une DATE PURE dont l'isodow vaut 1. */
  semaineLundi: string
  /** Le lundi du cycle COURANT, celui contre lequel la règle du retrait s'apprécie. */
  cycleCourant: string
  fuseau: string
  /** `false` → la semaine visée n'est pas une semaine de travail : aucune ligne. */
  semaineDeTravail: boolean
  /** Le numéro pédagogique de la semaine, quand elle en a un. */
  numeroSemaine: number | null
  /** Pourquoi rien n'a été posé, quand rien ne l'a été. `null` sinon. */
  motif: string | null
  /** Le seuil effectivement appliqué, et s'il vient du repli de démarrage. */
  seuilSemaineFaite: number
  seuilParDefaut: boolean
  /** ⭐ LA POPULATION VISÉE — une ligne par élève actif, même à zéro. */
  elevesAttendus: number
  /** Les lignes écrites (créées, ou réécrites quand la semaine est en cours). */
  lignesPosees: number
  /** Les lignes LAISSÉES TELLES QUELLES : semaine déjà arrêtée, le chiffre ne bouge plus. */
  lignesFigees: number
  /** Les dépôts de la semaine entrés au dénominateur. */
  depotsRetenus: number
  /** Les dépôts de la semaine SORTIS du dénominateur — `statut = 'retire'`. */
  depotsRetires: number
  /** ⚠️ Les dépôts trouvés dans la semaine visée alors qu'elle est HORS calendrier. */
  depotsOrphelins: number
  /** Le nombre d'envois — on lotit, et on le dit. */
  envois: number
  erreurs: string[]
}

function bilanVide(
  semaineLundi: string, cycleCourant: string, fuseau: string, motif: string,
): BilanCollecte {
  return {
    semaineLundi, cycleCourant, fuseau,
    semaineDeTravail: false, numeroSemaine: null, motif,
    seuilSemaineFaite: 0, seuilParDefaut: true,
    elevesAttendus: 0, lignesPosees: 0, lignesFigees: 0,
    depotsRetenus: 0, depotsRetires: 0, depotsOrphelins: 0,
    envois: 0, erreurs: [],
  }
}

// ════════════════════════════════════════════════════════════════════════════
// L'ÉCRIVAIN
// ════════════════════════════════════════════════════════════════════════════

/**
 * ⭐⭐ LE POINT D'ENTRÉE, ET LE POINT DE GREFFE DE `C4-L12`.
 *
 * Il pose LA LIGNE et SES DEUX AGRÉGATS pour une semaine, une ligne par élève
 * actif — **même à zéro**. `C4-L12` remplira les MINUTES de cette même ligne
 * quand il posera une semaine ; il n'ouvre pas de cron, et il n'ouvre pas de
 * ligne : il écrit dans celle qu'il trouve.
 *
 * ⛔ **La population de semaines décide de la justesse du pourcentage.**
 * `assiduiteDeLEleve()` calcule `denominateur = horsVacances.length` — le nombre
 * de lignes qu'on lui passe, c'est-à-dire le nombre de lignes EN BASE. Si le cron
 * ne posait une ligne que pour les élèves qui ont eu des exercices, une semaine
 * sans assignation disparaîtrait du dénominateur au lieu d'y entrer, et le
 * pourcentage serait FAUX. D'où : **une ligne par élève actif et par semaine DE
 * TRAVAIL, même à zéro**.
 *
 * ⚠️ **Et ce zéro se lit « faite »** : `exercices_assignes = 0` rend
 * `completion() === null`, donc `semaineFaite() === true` — « faite par
 * construction ». C'est la règle, pas un défaut ; la lecture est contre-intuitive
 * et le relevé le dit (§2).
 *
 * ⛔ **Le retrait ne rétroagit pas, et c'est la règle qui commande tout cet
 * écrivain.** « Une semaine dont le compte est déjà arrêté ne se recalcule pas.
 * Un chiffre déjà montré au professeur ne bouge plus. » La décision est prise par
 * `retraitCompteDansLaSemaine`, la règle pure qui existe déjà :
 *  · semaine ARRÊTÉE (antérieure au cycle courant) → les lignes qui existent sont
 *    LAISSÉES telles quelles ; seules les MANQUANTES sont créées. Une semaine
 *    jamais comptée n'a jamais été montrée à personne : un rattrapage est licite,
 *    une réécriture ne l'est pas.
 *  · semaine EN COURS → tout se recalcule, « le retrait sort du dénominateur ».
 *
 * @param aujourdHui la date pure du jour DANS LE FUSEAU DE L'ÉCOLE.
 * @param semaineDemandee force la semaine comptée (recette, rattrapage). Par
 *        défaut : la semaine ÉCOULÉE.
 */
export async function poserLaSemaineDAssiduite(
  admin: Admin, fuseau: string, aujourdHui: string, semaineDemandee?: string,
): Promise<BilanCollecte> {
  const semaineLundi = semaineDemandee ?? lundiSemaineEcoulee(aujourdHui)
  const cycleCourant = toISODate(lundiOnOrBefore(aujourdHui))
  const erreurs: string[] = []

  // ── Le calendrier : la semaine visée est-elle une semaine de TRAVAIL ? ────
  const { data: semestres, error: eS } = await admin
    .from('semesters').select('id, start_date, end_date')
    .is('archived_at', null).order('start_date')
  if (eS) {
    return { ...bilanVide(semaineLundi, cycleCourant, fuseau,
      `semestres illisibles : ${eS.message}`), erreurs: [`semestres : ${eS.message}`] }
  }
  const { data: vacances, error: eV } = await admin
    .from('holidays').select('semester_id, label, start_date, end_date')
  if (eV) erreurs.push(`vacances : ${eV.message}`)

  const semaines = semainesDeTravail(
    (semestres ?? []) as Array<{ id: string; start_date: string; end_date: string }>,
    (vacances ?? []) as Array<{ semester_id: string; label: string
      start_date: string; end_date: string }>)
  const semaine = trouverLaSemaine(semaineLundi, semaines)

  // ── La population : les élèves ACTIFS, DÉDOUBLONNÉS ──────────────────────
  // ⛔ Un élève peut être inscrit dans DEUX classes (constaté en sandbox) : sans
  //    dédoublonnage, l'envoi porterait deux fois la même clé primaire, et
  //    Postgres refuse tout le lot (`21000`).
  const { data: classes, error: eC } = await admin
    .from('classes').select('id').eq('statut', 'active')
  if (eC) erreurs.push(`classes : ${eC.message}`)
  const classeIds = ((classes ?? []) as Array<{ id: string }>).map((c) => c.id)

  let eleves: string[] = []
  if (classeIds.length) {
    try {
      const inscr = await lirePagine<{ eleve_id: string; classe_id: string }>(
        admin, 'inscriptions', 'eleve_id, classe_id', ['classe_id', 'eleve_id'],
        (q) => (q as never as { eq: (a: string, b: string) => { in: (a: string, b: string[]) => unknown } })
          .eq('statut', 'active').in('classe_id', classeIds))
      eleves = dedoublonner(inscr.map((i) => i.eleve_id))
    } catch (e) {
      erreurs.push(`inscriptions : ${(e as Error).message}`)
    }
  }

  if (!semaine) {
    // ⚠️ HORS CALENDRIER — aucune ligne. Mais on ne se tait pas : on dit combien
    //    de dépôts tombaient dans cette semaine, sans quoi un trou de collecte
    //    serait indiscernable d'une semaine légitimement vide.
    const orphelins = await compterLesDepots(admin, semaineLundi, fuseau, erreurs)
    return {
      ...bilanVide(semaineLundi, cycleCourant, fuseau,
        'semaine HORS CALENDRIER : aucun semestre non archivé ne la porte comme semaine de '
        + 'travail (vacances comprises). Aucune ligne posée — « le dénominateur vient du '
        + 'module Calendrier ».'),
      elevesAttendus: eleves.length,
      depotsOrphelins: orphelins,
      erreurs,
    }
  }

  // ── Le seuil, LU EN CONFIGURATION. Jamais 0,75 en dur. ───────────────────
  const { seuils, parDefaut } = await lireLesSeuils(admin)

  const socle = {
    semaineLundi, cycleCourant, fuseau,
    semaineDeTravail: true, numeroSemaine: semaine.numero, motif: null as string | null,
    seuilSemaineFaite: seuils.semaineFaite, seuilParDefaut: parDefaut,
    elevesAttendus: eleves.length,
    depotsOrphelins: 0,
  }

  if (eleves.length === 0) {
    return { ...socle, motif: 'aucun élève inscrit dans une classe active : rien à compter.',
      lignesPosees: 0, lignesFigees: 0, depotsRetenus: 0, depotsRetires: 0, envois: 0, erreurs }
  }

  // ── Les dépôts de la semaine, PAGINÉS et CONFRONTÉS AU DÉCOMPTE ──────────
  let depots: DepotACompter[]
  try {
    depots = await lireLesDepots(admin, semaineLundi)
  } catch (e) {
    erreurs.push(`dépôts : ${(e as Error).message}`)
    return { ...socle, motif: 'lecture des dépôts en échec : AUCUNE ligne posée — une lecture '
      + 'ratée n\'est pas une base vide.',
    lignesPosees: 0, lignesFigees: 0, depotsRetenus: 0, depotsRetires: 0, envois: 0, erreurs }
  }

  const tri = comptesDeLaSemaine(depots, semaineLundi, fuseau)

  // ── La règle du retrait : que fait-on des lignes DÉJÀ posées ? ───────────
  const { recalculer } = retraitCompteDansLaSemaine(semaineLundi, cycleCourant)
  let deja = new Set<string>()
  if (!recalculer) {
    try {
      const posees = await lirePagine<{ eleve_id: string }>(
        admin, 'assiduite_hebdo', 'eleve_id, cycle_lundi', ['eleve_id'],
        (q) => (q as never as { eq: (a: string, b: string) => unknown })
          .eq('cycle_lundi', semaineLundi))
      deja = new Set(posees.map((p) => p.eleve_id))
    } catch (e) {
      erreurs.push(`lignes déjà posées : ${(e as Error).message}`)
      return { ...socle, motif: 'l\'état des lignes déjà posées est illisible : AUCUNE ligne '
        + 'écrite — réécrire à l\'aveugle une semaine arrêtée est exactement ce que la règle '
        + 'interdit.',
      lignesPosees: 0, lignesFigees: 0,
      depotsRetenus: tri.retenus, depotsRetires: tri.retires, envois: 0, erreurs }
    }
  }

  const maintenant = new Date().toISOString()
  const lignes: LigneAPoser[] = []
  for (const eleveId of eleves) {
    if (deja.has(eleveId)) continue
    lignes.push(ligneDAssiduite(
      eleveId, semaineLundi,
      tri.parEleve.get(eleveId) ?? { assignes: 0, termines: 0 },
      seuils, maintenant))
  }
  const lignesFigees = eleves.length - lignes.length

  // ── L'écriture — lotie, gardée, et dont on LIT le `{ error }` ────────────
  let posees = 0
  let envois = 0
  for (const lot of lotir(lignes)) {
    verifierLaCharge(lot)
    envois++
    const { error } = await admin.from('assiduite_hebdo').upsert(lot, { onConflict: CONFLIT })
    if (error) {
      // Le contre-exemple correct : on LIT le retour, et on le dit.
      console.error(
        `[assiduite] COLLECTE PERDUE — semaine=${semaineLundi} lignes=${lot.length}`,
        { code: error.code, message: error.message, details: error.details, hint: error.hint })
      erreurs.push(`écriture (${lot.length} ligne(s)) : ${error.message}`)
    } else {
      posees += lot.length
    }
  }

  return {
    ...socle,
    motif: posees === 0 && lignesFigees === eleves.length
      ? 'semaine déjà arrêtée : toutes les lignes existaient — un chiffre déjà montré au '
        + 'professeur ne bouge plus.'
      : null,
    lignesPosees: posees, lignesFigees,
    depotsRetenus: tri.retenus, depotsRetires: tri.retires,
    envois, erreurs,
  }
}

// ════════════════════════════════════════════════════════════════════════════
// LES LECTURES
// ════════════════════════════════════════════════════════════════════════════

/**
 * Les dépôts d'une semaine. **La fenêtre d'instants est GÉNÉREUSE d'un jour de
 * chaque côté, et le tri fin se fait dans le fuseau** — le patron de
 * `genererSyntheseClasse`. Borner en UTC exactement sur le lundi laisserait
 * dehors les dépôts du dimanche soir à Toronto, qui sont déjà lundi en UTC.
 *
 * ⚠️ PAGINÉ. La requête la plus proche de celle-ci — `chargerAssignation()` —
 * borne `exercices_depots` à une semaine SANS `.range()` ni décompte : c'est le
 * contre-exemple, pas le modèle.
 */
async function lireLesDepots(admin: Admin, semaineLundi: string): Promise<DepotACompter[]> {
  const ancre = new Date(`${semaineLundi}T00:00:00Z`)
  const gte = `${toISODate(addDaysUTC(ancre, -1))}T00:00:00Z`
  const lt = `${toISODate(addDaysUTC(ancre, 8))}T00:00:00Z`
  // ⭐ C6-L3 — LA MARQUE SE JOINT AU JOURNAL, par `routeur_decision_id`. Elle est
  //   NULLABLE des deux côtés : pas de décision (voie du professeur) ou une
  //   décision d'avant C6-L3 valent `false`, et c'est juste — un exercice du
  //   professeur n'est jamais un bonus.
  const lignes = await lirePagine<{
    id: string; eleve_id: string; statut: string; assigne_at: string
    routeur_decisions: { bonus?: boolean } | Array<{ bonus?: boolean }> | null
  }>(
    admin, 'exercices_depots', 'id, eleve_id, statut, assigne_at, routeur_decisions(bonus)',
    ['assigne_at', 'id'],
    (q) => (q as never as { gte: (a: string, b: string) => { lt: (a: string, b: string) => unknown } })
      .gte('assigne_at', gte).lt('assigne_at', lt))
  return lignes.map((l) => {
    const d = Array.isArray(l.routeur_decisions) ? l.routeur_decisions[0] : l.routeur_decisions
    return {
      eleveId: l.eleve_id, statut: l.statut, assigneAt: l.assigne_at, bonus: d?.bonus === true,
    }
  })
}

/** Le décompte des dépôts d'une semaine hors calendrier — pour ne pas se taire. */
async function compterLesDepots(
  admin: Admin, semaineLundi: string, fuseau: string, erreurs: string[],
): Promise<number> {
  try {
    const depots = await lireLesDepots(admin, semaineLundi)
    const tri = comptesDeLaSemaine(depots, semaineLundi, fuseau)
    return tri.retenus + tri.retires
  } catch (e) {
    erreurs.push(`dépôts orphelins : ${(e as Error).message}`)
    return 0
  }
}
