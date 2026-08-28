import 'server-only'
// ============================================================================
// C6 · L2 — LE LECTEUR DE L'ÉCRAN DE LA SEMAINE.
// ----------------------------------------------------------------------------
// Les RÈGLES vivent à `semaine.ts`, pures et éprouvées. Ici, on LIT.
//
// ⭐⭐ CE FICHIER NE RECOPIE NI LA LISTE, NI SA PORTE, NI SON TRI.
//    `exercicesMaisonDeLEleve` porte déjà les quatre clauses du prédicat, LIT
//    `exercices_actif` ELLE-MÊME (`lireLaPorte`) et trie par `comparerLignes`.
//    ⚠️ **Elle est PAR ATELIER, et cet écran en couvre DEUX** — `codex` ET
//       `aletheia` : on l'appelle deux fois, on ne l'élargit pas.
//    ⭐ Deux champs lui ont été AJOUTÉS pour ce lot — `assigneAt` et
//       `competences` —, tous deux déjà lus par sa requête. C'est un
//       élargissement de ce qu'elle REND, jamais une seconde liste.
//
// ⛔⛔ `assiduite_hebdo` NE SE LIT PAS ICI, ET ELLE NE LE POURRA JAMAIS. Son
//    écrivain est un cron HEBDOMADAIRE (C4-L13) qui compte UNE SEMAINE CLOSE —
//    premier comptage réel le lundi 2026-09-07 —, et elle est VIDE dans les deux
//    bases au 28/08. **La frise de la semaine EN COURS compte les dépôts, en
//    direct.** ⚠️ Et ses trois colonnes de minutes sont AU PROFESSEUR : « pas de
//    budget-temps hebdomadaire » (`06-` §2).
//
// ⚠️ UN CYCLE EST UNE SEMAINE DE LUNDI À DIMANCHE **DANS LE FUSEAU DE L'ÉCOLE**.
//    On ne recalcule pas un lundi à la main : `lundiDuCycle(instant, fuseau)`.
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import { COMPETENCES, type Competence } from '@/utils/chaine/types'
import { NOM_COMPETENCE } from '@/utils/competences-classe'
import { toISODate } from '@/utils/calendrier-grille'
import { lundiDuCycle } from '@/utils/deroule/echeance'
import { lireLaPorte } from '@/utils/deroule/acces'
import { exercicesMaisonDeLEleve } from '@/utils/codex-onglets/liste'
import { comparerLignes } from '@/utils/codex-onglets/regles'
import { instrumentDuRouteur } from '@/utils/moteur/etat-serveur'
import { mesuresQuiComptent } from '@/utils/routeur/mesure'
import { fenetreDEvidence } from '@/utils/routeur/profil'
import { etatDesObservables, type EtatObservable } from '@/utils/routeur/observables'
import { lireLesStatutsAvecDate } from '@/utils/statut-recette'
import { dimensionsRegardees, forcesDeLaCompetence, type DimensionDite } from './profil'
import {
  bilanDeLaCompetence, ceQuiManqueAuBilan, competencesDeLaSemaine, friseDeLaSemaine,
  momentDeLaSemaine,
  type Bilan, type BlocRecapitulatif, type CeQuiManqueAuBilan, type ExerciceDeLaSemaine,
  type Frise, type MomentDeLaSemaine,
} from './semaine'

type Admin = SupabaseClient
const PAGE = 1000

export interface SemaineDeLEleve {
  /** Le lundi du cycle regardé, en date pure (ISO). */
  cycleLundi: string
  /**
   * ⛔ LA PORTE, ET ELLE SE DISTINGUE DU VIDE. « Il y a DEUX vides à distinguer,
   *    pas un : "la porte est fermée" et "tu n'as rien à faire", qui n'appellent
   *    ni la même phrase ni la même conduite » (`07-` §5).
   */
  porteOuverte: boolean
  moment: MomentDeLaSemaine
  exercices: ExerciceDeLaSemaine[]
  frise: Frise
  /** Le PREMIER temps. Vide au second. */
  recapitulatif: BlocRecapitulatif[]
  /** Le SECOND temps. Vide au premier. */
  bilan: Bilan[]
  /** Ce que le bilan ne sait pas encore — et il le DIT. */
  manque: CeQuiManqueAuBilan
  /**
   * ⚠️ L'ÉCART RELEVÉ QUAND LA SEMAINE TRAVAILLE PLUS DE TROIS COMPÉTENCES. Le
   *    `02-` §6.C en annonce trois ; l'écran en dit autant qu'il y en a, et
   *    signale la différence plutôt que de tronquer.
   */
  ecartAuTroisDuSixC: number
  incidents: string[]
}

/**
 * ⭐ LA SEMAINE D'UN ÉLÈVE, DANS SA CLASSE EN CONTEXTE.
 *
 * ⚠️ LA CLASSE BORNE LA LISTE, PAS LE PROFIL. « Dans les modules on reste par
 *    classe » (`01-` §2) — et `exercicesMaisonDeLEleve` applique déjà
 *    `visibleDansLaClasse`. Le PROFIL, lui, est unifié par élève et n'a aucun
 *    `classe_id` : les deux ne s'alignent pas par confort (`07-` §1.3).
 */
export async function chargerLaSemaineDeLEleve(
  admin: Admin, eleveId: string, classeEnContexte: string, cycleLundi: string, fuseau: string,
): Promise<SemaineDeLEleve> {
  const incidents: string[] = []
  const vide: SemaineDeLEleve = {
    cycleLundi, porteOuverte: false, moment: 'vide', exercices: [],
    frise: { cases: [], faits: 0, total: 0, enPlus: { faits: 0, total: 0 } },
    recapitulatif: [], bilan: [],
    manque: { copiesNonMesurees: 0, incomplet: false }, ecartAuTroisDuSixC: 0, incidents,
  }

  // ⛔ LA PORTE EST LUE ICI AUSSI, ET C'EST VOULU : `exercicesMaisonDeLEleve` la
  //    lit pour SA liste, mais cet écran doit DIRE POURQUOI il est vide, et
  //    « la porte est fermée » n'est pas « tu n'as rien à faire ».
  const porte = await lireLaPorte(admin)
  if (!porte.exercicesActifs) return vide

  // ⚠️ Les deux ateliers, parce que la semaine de l'élève les couvre tous deux.
  const [codex, aletheia] = await Promise.all([
    exercicesMaisonDeLEleve(admin, eleveId, classeEnContexte, 'codex'),
    exercicesMaisonDeLEleve(admin, eleveId, classeEnContexte, 'aletheia'),
  ])

  const deLaSemaine: ExerciceDeLaSemaine[] = [
    ...codex.map((e) => ({ ...e, atelier: 'codex' as const })),
    ...aletheia.map((e) => ({ ...e, atelier: 'aletheia' as const })),
  ]
    // ⚠️ LE RATTACHEMENT AU CYCLE PASSE PAR `assigne_at`, LU DANS LE FUSEAU DE
    //    L'ÉCOLE — la même règle que `comptesDeLaSemaine` (C4-L13). Un dépôt
    //    sans `assigne_at` lisible sort : on ne le range pas dans une semaine au
    //    hasard.
    .filter((e) => e.assigneAt && toISODate(lundiDuCycle(new Date(e.assigneAt), fuseau)) === cycleLundi)
    .map((e) => ({
      depotId: e.depotId, titre: e.titre, echeance: e.echeance, assigneAt: e.assigneAt,
      atelier: e.atelier, href: e.href, ton: e.etat.ton, libelle: e.etat.libelle,
      competences: e.competences,
      // ⭐ C6-L3 — la marque, lue au JOURNAL par `exercicesMaisonDeLEleve`.
      bonus: e.bonus,
    }))

  // ⭐ LE TRI EST DÉJÀ ÉCRIT (`comparerLignes`) et `exercicesMaisonDeLEleve` l'a
  //    appliqué. La fusion des deux ateliers le refait sur l'ensemble, avec la
  //    MÊME fonction : on ne réinvente pas un ordre.
  deLaSemaine.sort((a, b) => comparerLignes(
    { ton: a.ton, echeance: a.echeance }, { ton: b.ton, echeance: b.echeance }))

  const moment = momentDeLaSemaine(deLaSemaine)
  const frise = friseDeLaSemaine(deLaSemaine)
  const prioritaires = competencesDeLaSemaine(deLaSemaine)

  if (moment === 'vide') {
    // ⚠️ C6-L3 — ON GARDE LA LISTE ET LA FRISE, ET CE N'EST PAS UN DÉTAIL. Le
    //    moment se lit sur la semaine IMPOSÉE : un élève dont l'unique exercice
    //    imposé a été RETIRÉ par son professeur peut porter un bonus et rien
    //    d'autre. Vider la liste ici lui dirait « tu n'as aucun exercice cette
    //    semaine » avec un exercice à faire sous les yeux.
    return { ...vide, porteOuverte: true, moment: 'vide', exercices: deLaSemaine, frise }
  }

  // ── Ce que les deux temps partagent : les mesures, et les noms ─────────────
  const [mesures, dimensions, statuts] = await Promise.all([
    lireLesMesures(admin, eleveId, incidents),
    lireLaCorrespondance(admin, incidents),
    lireLesStatutsAvecDate(admin as never),
  ])
  const borneDe = new Map(statuts.map((s) => [s.competence as string, s.poseLe]))
  const dimsPar = grouper(dimensions)
  // ⚠️⚠️ LE CYCLE D'UNE MESURE SE LIT DANS LE FUSEAU DE L'ÉCOLE, JAMAIS EN UTC.
  //    Comparer un INSTANT à la date pure `cycleLundi` reviendrait à couper à
  //    minuit UTC — soit 20 h le dimanche à Toronto : une mesure du dimanche
  //    soir basculerait dans la semaine SUIVANTE. C'est le piège exact que
  //    `comptesDeLaSemaine` (C4-L13) documente, et on applique la même règle
  //    avec la même fonction.
  const cycleDe = (instantISO: string) =>
    toISODate(lundiDuCycle(new Date(instantISO), fuseau))

  let recapitulatif: BlocRecapitulatif[] = []
  let bilan: Bilan[] = []

  for (const p of prioritaires) {
    if (!(COMPETENCES as readonly string[]).includes(p.competence)) continue
    const c = p.competence as Competence
    const dims = dimsPar.get(c) ?? []
    const instrument = instrumentDuRouteur(c)
    const comptent = mesuresQuiComptent(
      mesures.filter((m) => m.competence === c), borneDe.get(c) ?? null)

    if (moment === 'recapitulatif') {
      // ⛔ UNE COMPÉTENCE QUE SEUL UN BONUS PORTE N'ENTRE PAS AU RÉCAPITULATIF :
      //    il annonce LA SEMAINE QU'ON LUI DONNE, et « 0 exercice » se lirait
      //    comme un score. Elle reste dans `prioritaires` pour le BILAN, qui,
      //    lui, compte le bonus comme n'importe quel exercice.
      if (p.nbExercices === 0) continue
      // ⛔ LE RÉCAPITULATIF NE NOMME AUCUNE FAIBLESSE. Seules les FORCES sortent
      //    d'ici — `manquesDeLaCompetence` n'est PAS appelée, et ce n'est pas un
      //    oubli : la nommer ici donnerait à l'élève la réponse à « se juger ».
      const etats = instrument
        ? etatDesObservables(fenetreDEvidence(comptent) as never, instrument, [])
        : []
      const { forces } = forcesDeLaCompetence(etats, dims)
      recapitulatif.push({
        competence: NOM_COMPETENCE[c],
        nbExercices: p.nbExercices,
        forces,
        dimensionsRegardees: dimensionsRegardees(dims),
      })
      continue
    }

    // ── LE BILAN : un AVANT et un APRÈS, exactement la mécanique du progrès ──
    const avantLeCycle = comptent.filter((m) => cycleDe(m.mesureAt) < cycleLundi)
    const pendantLeCycle = comptent.filter((m) => cycleDe(m.mesureAt) === cycleLundi)
    const etatsAvant: EtatObservable[] = instrument
      ? etatDesObservables(fenetreDEvidence(avantLeCycle) as never, instrument, [])
      : []
    const etatsSemaine: EtatObservable[] = instrument
      ? etatDesObservables(pendantLeCycle as never, instrument, [])
      : []
    bilan.push(bilanDeLaCompetence(NOM_COMPETENCE[c], etatsAvant, etatsSemaine, dims))
  }

  if (moment === 'bilan') recapitulatif = []
  else bilan = []

  const manque = moment === 'bilan'
    ? ceQuiManqueAuBilan(deLaSemaine, await depotsMesures(admin, eleveId, incidents))
    : { copiesNonMesurees: 0, incomplet: false }

  return {
    cycleLundi, porteOuverte: true, moment, exercices: deLaSemaine, frise,
    recapitulatif, bilan, manque,
    // ⚠️ L'écart se compte sur ce que le RÉCAPITULATIF annonce — donc sur les
    //    compétences que la semaine IMPOSE : le `02-` §6.C en annonce trois, et
    //    c'est de celles-là qu'il parle.
    ecartAuTroisDuSixC: Math.max(0, prioritaires.filter((p) => p.nbExercices > 0).length - 3),
    incidents,
  }
}

// ════════════════════════════════════════════════════════════════════════════
// LES LECTURES — admin, filtrées sur `eleve_id` DANS LE CODE (`07-` §1)
// ════════════════════════════════════════════════════════════════════════════

interface MesureLue { competence: string; observables: Record<string, unknown> | null
  mesureAt: string; sondeMontee: boolean }

async function lireLesMesures(
  admin: Admin, eleveId: string, incidents: string[],
): Promise<MesureLue[]> {
  const out: MesureLue[] = []
  for (let debut = 0; ; debut += PAGE) {
    const { data, error } = await admin
      .from('competences_mesures')
      .select('id, competence, observables, mesure_at, sonde_montee')
      .eq('eleve_id', eleveId)
      .order('mesure_at', { ascending: true })
      .order('id', { ascending: true })
      .range(debut, debut + PAGE - 1)
    if (error) { incidents.push(`tes mesures : ${error.code} ${error.message}`); return [] }
    const page = data ?? []
    out.push(...page.map((m) => ({
      competence: m.competence as string,
      observables: (m.observables ?? null) as Record<string, unknown> | null,
      mesureAt: m.mesure_at as string,
      sondeMontee: m.sonde_montee === true,
    })))
    if (page.length < PAGE) break
  }
  return out
}

interface CorrespondanceLue extends DimensionDite { competence: string }

async function lireLaCorrespondance(
  admin: Admin, incidents: string[],
): Promise<CorrespondanceLue[]> {
  const { data, error } = await admin
    .from('competences_correspondance')
    .select('competence, observable_code, dimension_eleve, ordre')
  if (error) {
    incidents.push(`les noms des dimensions : ${error.code} ${error.message}`)
    return []
  }
  return (data ?? []).map((d) => ({
    competence: d.competence as string,
    observableCode: d.observable_code as string,
    dimensionEleve: (d.dimension_eleve ?? '') as string,
    ordre: (d.ordre ?? 0) as number,
  }))
}

/** Les dépôts de cet élève dont AU MOINS UNE mesure est écrite (`07-` §1.2). */
async function depotsMesures(
  admin: Admin, eleveId: string, incidents: string[],
): Promise<Set<string>> {
  const { data, error } = await admin
    .from('competences_mesures').select('depot_id')
    .eq('eleve_id', eleveId).not('depot_id', 'is', null)
  if (error) {
    incidents.push(`ce qui a été mesuré : ${error.code} ${error.message}`)
    // ⚠️ Un ensemble vide dirait « rien n'est mesuré », donc « tout manque » —
    //    ce qui est le côté PRUDENT de l'erreur : le bilan se déclarera
    //    incomplet plutôt que de se prétendre entier.
    return new Set()
  }
  return new Set((data ?? []).map((m) => m.depot_id as string))
}

function grouper(lignes: readonly CorrespondanceLue[]): Map<string, DimensionDite[]> {
  const m = new Map<string, DimensionDite[]>()
  for (const d of lignes) {
    const l = m.get(d.competence) ?? []
    l.push({ observableCode: d.observableCode, dimensionEleve: d.dimensionEleve, ordre: d.ordre })
    m.set(d.competence, l)
  }
  return m
}

// ════════════════════════════════════════════════════════════════════════════
// LE SIGNAL DU TABLEAU DE BORD — « un "à faire" dès qu'il a des exercices
// assignés » (`07-` §2)
// ════════════════════════════════════════════════════════════════════════════

/**
 * ⛔⛔ CE SIGNAL NAÎT DE L'**ASSIGNATION**, ET C'EST CE QUI LE DISTINGUE.
 *
 * Deux endroits du dépôt le disaient déjà, et disaient aussi qu'ils n'étaient
 * pas lui : `utils/examens/signal.ts` — *« CE N'EST PAS LE "À FAIRE" DU TABLEAU
 * DE BORD (C6-L2), et ce n'est pas le même événement : celui-là naît de
 * l'ASSIGNATION, celui-ci du LANCEMENT »* — et l'entrée `C4-L9` du `07-` §2, qui
 * le redit mot pour mot. ⛔ **Deux événements, deux signaux : on n'en fabrique
 * pas un seul pour les deux.**
 *
 * ⭐ IL EST LÉGER À DESSEIN. Le tableau de bord n'a besoin que de DEUX
 *    DÉCOMPTES ; il ne lit ni mesure, ni correspondance, ni fiche. Charger le
 *    profil pour allumer une tuile coûterait, sur chaque visite, tout ce que
 *    l'écran de la semaine coûte une fois.
 *
 * ⚠️ LA PORTE EST LUE PAR `exercicesMaisonDeLEleve` ELLE-MÊME. Une porte fermée
 *    rend une liste vide, donc AUCUNE tuile — et c'est juste : **un lien qui
 *    mène à une page fermée est un lien qui promet une porte close.**
 */
export interface SignalDeLaSemaine {
  /** Combien attendent encore un geste. 0 = rien à faire ; la tuile ne naît pas. */
  aFaire: number
  /** Combien la semaine en compte en tout. */
  total: number
  /** Vrai dès qu'un exercice encore à faire a dépassé son échéance. */
  enRetard: boolean
}

export async function signalDeLaSemaine(
  admin: Admin, eleveId: string, classeEnContexte: string, cycleLundi: string, fuseau: string,
  maintenant: Date,
): Promise<SignalDeLaSemaine> {
  const [codex, aletheia] = await Promise.all([
    exercicesMaisonDeLEleve(admin, eleveId, classeEnContexte, 'codex'),
    exercicesMaisonDeLEleve(admin, eleveId, classeEnContexte, 'aletheia'),
  ])
  const duCycle = [...codex, ...aletheia].filter((e) =>
    e.assigneAt && toISODate(lundiDuCycle(new Date(e.assigneAt), fuseau)) === cycleLundi)

  // ⭐ « Attend un geste » se lit sur le TON de `etatDeLExercice` — la même règle
  //    que `momentDeLaSemaine`, jamais une seconde liste de statuts.
  const attendus = duCycle.filter((e) => TONS_QUI_APPELLENT.includes(e.etat.ton))
  return {
    aFaire: attendus.length,
    total: duCycle.length,
    enRetard: attendus.some((e) => e.echeance != null && new Date(e.echeance) < maintenant),
  }
}

const TONS_QUI_APPELLENT: readonly string[] = ['a_lire', 'a_faire', 'en_cours']
