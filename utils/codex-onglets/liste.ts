import 'server-only'
// ============================================================================
// C4 · L6 — CE QUE LES ONGLETS LISENT. Une porte par côté.
// (⭐ C5-L2 — la liste de l'ÉLÈVE sert les deux ateliers.
//  ⭐ C5-L4 — celle du PROFESSEUR aussi : ce fichier porte les DEUX modules.)
//
// ⚠️ LE DOSSIER S'APPELLE `codex-onglets` PARCE QUE C4-L6 L'A ÉCRIT ; SON
//    CONTENU N'EST PLUS PROPRE À CODEX. Deux lectures sur trois prennent
//    désormais leur atelier en paramètre, et le renommer coûterait plus de
//    churn qu'il n'apporte de clarté — la note vaut mieux que le déménagement.
//    Seul `nombreAValiderCodex` reste ATTACHÉ à Codex, et le motif est réel :
//    il lit `codex_travaux`, la synthèse en classe, dont il n'y a AUCUN
//    équivalent côté lecture. On ne fabrique pas une file qui n'existe pas.
// ----------------------------------------------------------------------------
// « Un écran sans porte n'existe pas. » — `07-` §2, C4-L6
//
// Ce lot ne construit ni le déroulé (C4-L3), ni le flux de passation (C4-L4),
// ni la conception d'un examen (C4-L9) : il les RANGE et les rend ATTEIGNABLES.
// Les deux lectures ci-dessous ne servent QUE cela — une liste, et un href.
//
// ⛔ LE MOTEUR NE PORTE AUCUNE POLICY ÉLÈVE SUR SES TABLES — « lecture élève :
//    ses propres lignes, strictement ; toutes les écritures passent par le
//    serveur » (`07-` §1), et C4-L3, C4-L4 et C4-L9 l'ont re-vérifié par
//    requête. Les listes élève se lisent donc CÔTÉ SERVEUR, PAR LE CLIENT ADMIN,
//    FILTRÉES SUR `eleve_id` DANS LE CODE. Le patron est `utils/examens/signal.ts`.
//    ⚠️ AUCUNE POLICY N'EST OUVERTE POUR RENDRE UNE LISTE PLUS SIMPLE À ÉCRIRE.
//
// ⛔ DEUX TABLES NE SONT JAMAIS JOINTES ICI — les SQUELETTES et la
//    MÉTACOGNITION (`07-` §1). « C'est la garde la plus facile à casser et la
//    plus coûteuse : elle donne la grille et les réponses. » Une liste
//    d'exercices qui joint une table de trop la casse EN SILENCE : les seuls
//    voisins lus ci-dessous sont `exercices` (la consigne) et
//    `exercices_retours` (publié / lu — l'obligation de lecture du `02-` §6.D).
//
// ⚠️ supabase-js NE LÈVE PAS : il rend `{ error }`. Une lecture ratée n'est pas
//    « rien à faire » — on le dit au serveur plutôt que de laisser un écran
//    affirmer « aucun exercice » (leçon C11a).
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import { lireLaPorte } from '@/utils/deroule/acces'
import {
  atelierDUnFormatif, comparerLignes, etatDeLExercice, hrefDeLaPassationProf, hrefDuDeroule,
  titreDeLaConsigne, visibleDansLaClasse, type Atelier, type EtatDeLigne,
} from './regles'

type Admin = SupabaseClient
type Ligne = Record<string, unknown>
const txt = (x: unknown): string => (typeof x === 'string' ? x : '')
const lig = (x: unknown): Ligne => (typeof x === 'object' && x !== null ? x as Ligne : {})
const un = (v: unknown): unknown => (Array.isArray(v) ? v[0] ?? null : v ?? null)

// ─────────────────────────────────────────────────────────────────────────────
// CÔTÉ ÉLÈVE — l'onglet Exercices : ce qu'il a à faire à la maison.
// ─────────────────────────────────────────────────────────────────────────────

export interface ExerciceMaison {
  depotId: string
  titre: string
  echeance: string | null
  etat: EtatDeLigne
  /** Où l'élève entre — le déroulé à six temps de C4-L3. */
  href: string
}

/**
 * ⭐ LA PORTE LA PLUS IMPORTANTE DU LOT. `app/eleve/modules/codex/exercice/[depotId]`
 *    — le déroulé à six temps de C4-L3 — n'était lié DEPUIS NULLE PART : aucun
 *    `href` du dépôt ne le désignait, et l'écran ne s'atteignait qu'en tapant
 *    l'identifiant d'un dépôt.
 *
 * Le prédicat, et il tient en quatre clauses :
 *   1. le dépôt est À CET ÉLÈVE — le client admin contourne la RLS ;
 *   2. son instance est À LA MAISON — le canal classe a son propre onglet ;
 *   3. le dépôt n'est pas `retire` — c'est le filtre que `lireDepotMaison`
 *      applique aussi : un lien vers un dépôt retiré mènerait à `notFound()`,
 *      c'est-à-dire à une porte cassée ;
 *   4. l'instance relève de L'ATELIER DEMANDÉ — l'atelier suit le mode (`01-` §2).
 *
 * ⭐⭐ C5-L2 — LA CLAUSE 4 EST DEVENUE UN PARAMÈTRE, ET C'EST TOUT LE GESTE.
 *    Elle disait `=== 'codex'` en dur : **tout ce qui n'est pas `composer` était
 *    écarté de la seule liste d'exercices maison, et rien ne le reprenait
 *    ailleurs** — un exercice de lecture assigné n'avait NI LIEN, NI LISTE, NI
 *    ADRESSE. Le prédicat ne change pas d'un caractère ; c'est sa CIBLE qui se
 *    déclare. *« Deux ateliers, deux portes, un seul prédicat. »*
 *
 * ⚠️ LA CLASSE EN CONTEXTE BORNE LA LISTE (`01-` §2, « dans les modules on reste
 *    par classe ») : un élève bi-classe ne voit jamais ici le travail de l'autre
 *    classe. Le filtre est POSÉ DANS LE CODE, sur des lignes déjà restreintes à
 *    l'élève — jamais en base, où `classe_id` est nullable.
 *
 * ⭐ LA LISTE NAÎT DERRIÈRE SA PORTE, ET C'EST `exercices_actif` — celui qui
 *    répond à *« les élèves peuvent-ils faire des exercices ? »* (`07-` §5), et
 *    **lui seul** : `chaine_actif`, `fabrique_actif` et `passation_classe_actif`
 *    appartiennent à leurs lots. C'est exactement ce que fait
 *    `utils/examens/signal.ts` avec la sienne, et pour la même raison : **un
 *    lien qui mènerait à une page fermée est un lien qui promet une porte
 *    close**. L'écran du déroulé se ferme sur ce drapeau
 *    (`utils/deroule/acces.ts`) — lister ses dépôts par-dessus enverrait l'élève
 *    cliquer sur un refus.
 *    ⚠️ **La lecture se fait ICI, pas au site d'appel** : une garde qu'on peut
 *    oublier en écrivant un second écran n'est pas une garde.
 *    ⚠️ **Et ce n'est PAS un onglet qui clignote** (piège 41) : l'onglet reste
 *    affiché, c'est son CONTENU qui est vide, et l'écran dit pourquoi.
 */
export async function exercicesMaisonDeLEleve(
  admin: Admin, eleveId: string, classeEnContexte: string, atelier: Atelier = 'codex',
): Promise<ExerciceMaison[]> {
  if (!(await lireLaPorte(admin)).exercicesActifs) return []

  const { data, error } = await admin
    .from('exercices_depots')
    .select('id, statut, echeance, '
      + 'exercices!inner(id, lieu, classe_id, consigne_instanciee, modes_par_competence)')
    .eq('eleve_id', eleveId)
    .neq('statut', 'retire')
    .eq('exercices.lieu', 'maison')
  if (error) {
    console.error(`[codex-onglets] exercices maison (${atelier}) illisibles — `
      + `${error.code} ${error.message}`)
    return []
  }
  const rows = (data ?? []) as unknown as Ligne[]
  if (rows.length === 0) return []

  const retenus = rows.filter((d) => {
    const ex = lig(un(d.exercices))
    if (!visibleDansLaClasse((ex.classe_id as string | null) ?? null, classeEnContexte)) return false
    return atelierDUnFormatif(ex.modes_par_competence) === atelier
  })
  if (retenus.length === 0) return []

  const retours = await retoursDesDepots(admin, retenus.map((d) => txt(d.id)))

  return retenus
    .map((d) => {
      const ex = lig(un(d.exercices))
      return {
        depotId: txt(d.id),
        titre: titreDeLaConsigne(ex.consigne_instanciee),
        echeance: (d.echeance as string | null) ?? null,
        etat: etatDeLExercice(txt(d.statut), retours.get(txt(d.id)) ?? null),
        href: hrefDuDeroule(atelier, txt(d.id)),
      }
    })
    .sort((a, b) => comparerLignes(
      { ton: a.etat.ton, echeance: a.echeance },
      { ton: b.etat.ton, echeance: b.echeance },
    ))
}

/**
 * Publié / lu, par dépôt — l'obligation de lecture du `02-` §6.D (étape 17).
 *
 * ⚠️ LA VALIDATION DE LECTURE VIT SUR LE RETOUR, jamais sur le dépôt : « un seul
 *    domicile pour un seul geste » (`07-` §1.1). On la lit donc là où elle est.
 *    Un dépôt peut porter deux retours (`chaud` et `final`) : il suffit qu'UN
 *    retour publié ne soit pas lu pour que la chose à lire existe.
 */
async function retoursDesDepots(
  admin: Admin, depotIds: readonly string[],
): Promise<Map<string, { publie: boolean; lu: boolean }>> {
  const out = new Map<string, { publie: boolean; lu: boolean }>()
  if (depotIds.length === 0) return out
  const { data, error } = await admin
    .from('exercices_retours')
    .select('depot_id, published_at, lu_at')
    .in('depot_id', depotIds as string[])
  if (error) {
    console.error(`[codex-onglets] retours illisibles — ${error.code} ${error.message}`)
    return out
  }
  for (const r of (data ?? []) as unknown as Ligne[]) {
    const id = txt(r.depot_id)
    const publie = r.published_at != null
    const lu = r.lu_at != null
    const deja = out.get(id)
    out.set(id, {
      publie: (deja?.publie ?? false) || publie,
      // ⚠️ NON LU DÈS QU'UN RETOUR PUBLIÉ N'EST PAS LU : le « et » serait faux —
      //    un retour chaud lu ne dispense pas de lire le retour final.
      lu: (deja?.lu ?? true) && (publie ? lu : true),
    })
  }
  return out
}

// ─────────────────────────────────────────────────────────────────────────────
// CÔTÉ PROFESSEUR — l'onglet Exercices : l'accès aux passations en classe.
// ─────────────────────────────────────────────────────────────────────────────

export interface PassationDeClasse {
  exerciceId: string
  titre: string
  classeNom: string | null
  /** Le début de la fenêtre de passation, quand l'instance en porte une. */
  quand: string | null
  /** Où le professeur entre — l'écran de C4-L4. */
  href: string
}

/**
 * Les passations en classe DE L'ATELIER DEMANDÉ, pour l'accès depuis son onglet
 * Exercices.
 *
 * ⭐⭐ C5-L4 — LA CIBLE EST DEVENUE UN PARAMÈTRE, ET C'EST TOUT LE GESTE. C'est
 *    exactement ce que `C5-L2` a fait sur `exercicesMaisonDeLEleve` : le nom
 *    disait `Codex`, le filtre disait `=== 'codex'` en dur, et **le prédicat ne
 *    change pas d'un caractère**. *« Deux ateliers, deux portes, un seul
 *    prédicat. »* ⛔ **Un second exemplaire divergerait au premier correctif** —
 *    et la règle qu'il porte (la ligne de plan d'abord, le mode ensuite) est
 *    précisément celle qu'il ne faut jamais laisser diverger.
 *
 * ⭐ DEUX PORTES VERS LE MÊME ÉCRAN NE SONT PAS UN DOUBLON. `app/prof/codex/passation/[exerciceId]`
 *    ne s'atteignait que depuis `app/prof/conception/[id]`, « là où le professeur
 *    vient déjà d'assigner ». CE LIEN RESTE ; celui-ci en est un second, depuis
 *    la liste — ce sont deux chemins qu'il emprunte à deux moments.
 *
 * ⚠️ LE MODULE D'UNE INSTANCE DE CLASSE SE LIT À SA LIGNE DE PLAN, jamais à ses
 *    modes : « les sommatifs se conçoivent CHACUN DANS SON MODULE » (`02-` §6 B,
 *    citant le `01-` §2), et l'explication de texte mesure l'Expression EN
 *    `composer` — la règle des modes l'enverrait dans Codex quand le `06-` §1 la
 *    range en lecture. À DÉFAUT DE LIGNE DE PLAN (une passation de classe hors
 *    plan, un formatif passé en classe), l'atelier suit le mode.
 *    C'est l'ordre exact de `utils/examens/signal.ts`, et on ne l'inverse pas.
 *
 * ⚠️ `passation_classe_actif` À OFF NE VIDE PAS CETTE LISTE : l'interrupteur
 *    garde l'ÉCRAN (`utils/passation/acces.ts`), pas l'inventaire. L'écran dit
 *    pourquoi il est fermé ; un onglet qui clignote selon un drapeau apprendrait
 *    au professeur une navigation qui changera sous lui à l'allumage (piège 41).
 */
export async function passationsDeClasse(
  admin: Admin, atelier: Atelier = 'codex',
): Promise<PassationDeClasse[]> {
  const { data, error } = await admin
    .from('exercices')
    .select('id, lieu, classe_id, consigne_instanciee, modes_par_competence, '
      + 'exercice_planifie_id, fenetre_debut, statut, classes(nom)')
    .eq('lieu', 'classe')
    .neq('statut', 'a_concevoir')
  if (error) {
    console.error(`[codex-onglets] passations (${atelier}) illisibles — `
      + `${error.code} ${error.message}`)
    return []
  }
  const rows = (data ?? []) as unknown as Ligne[]
  if (rows.length === 0) return []

  // Règle 1 — la ligne de plan. `type_exercice` est une liste fermée de couples
  // (`exercices_typologie_chk`) : `ecriture` ⇒ Codex, `lecture` ⇒ Aletheia.
  const planifieIds = [...new Set(rows.map((e) => txt(e.exercice_planifie_id)).filter(Boolean))]
  const typeParLigne = new Map<string, string>()
  if (planifieIds.length > 0) {
    const { data: lignes, error: e2 } = await admin
      .from('scriptorium_exercices_planifies').select('id, type_exercice').in('id', planifieIds)
    if (e2) {
      console.error(`[codex-onglets] lignes de plan (${atelier}) illisibles — `
        + `${e2.code} ${e2.message}`)
    }
    for (const l of (lignes ?? []) as unknown as Ligne[]) typeParLigne.set(txt(l.id), txt(l.type_exercice))
  }

  return rows
    .filter((e) => {
      // ⚠️ L'ORDRE NE S'INVERSE PAS : la ligne de plan D'ABORD, le mode ENSUITE
      //    et seulement à défaut de ligne de plan. Le motif est mesurable —
      //    l'explication de texte mesure l'Expression EN `composer`, et la règle
      //    des modes l'enverrait dans Codex quand le `06-` §1 la range en
      //    LECTURE. C'est l'ordre exact de `utils/examens/signal.ts`.
      const parPlan = typeParLigne.get(txt(e.exercice_planifie_id))
      if (parPlan === 'ecriture') return atelier === 'codex'
      if (parPlan === 'lecture') return atelier === 'aletheia'
      return atelierDUnFormatif(e.modes_par_competence) === atelier
    })
    .map((e) => {
      const c = lig(un(e.classes))
      return {
        exerciceId: txt(e.id),
        titre: titreDeLaConsigne(e.consigne_instanciee, 'Passation en classe'),
        classeNom: txt(c.nom) || null,
        quand: (e.fenetre_debut as string | null) ?? null,
        href: hrefDeLaPassationProf(atelier, txt(e.id)),
      }
    })
    // ⚠️ DÉPARTAGE SUR UNE CLÉ UNIQUE, ET IL N'EST PAS DÉCORATIF : `fenetre_debut`
    //    est NULLABLE — *« l'écran ne demande jamais de date »* —, et l'écran du
    //    22/08 a montré SIX passations dont AUCUNE n'en portait. Sans le second
    //    critère, les six comparaisons rendent 0 et l'ordre est celui que la base
    //    a bien voulu servir : il change d'un rechargement à l'autre, sous les
    //    yeux du professeur, sans que rien ne l'explique.
    .sort((a, b) => (b.quand ?? '').localeCompare(a.quand ?? '')
      || a.exerciceId.localeCompare(b.exerciceId))
}

/**
 * ⭐ « VALIDATION » N'EST PLUS UN ONGLET — sa file reste un ÉCRAN, atteint
 *    depuis Exercices (« tous les exercices vivent sous un seul onglet »,
 *    `07-` §2). Ce compte est ce qui empêche la file de disparaître avec son
 *    onglet : sans un nombre à côté du lien, le professeur n'a plus aucun signe
 *    qu'il a des retours en attente.
 *
 * Le prédicat est celui de la file elle-même (`app/prof/codex/validation/page.tsx`),
 * restreint à ce qui reste à faire : analyse de version finale `prete`, pas
 * encore validée. ⚠️ `count: 'exact', head: true` — supabase-js PLAFONNE TOUTE
 * RÉPONSE À 1000 LIGNES SANS RIEN SIGNALER : on demande un décompte, jamais des
 * lignes qu'on compterait ensuite.
 */
export async function nombreAValiderCodex(admin: Admin): Promise<number> {
  const { count, error } = await admin
    .from('codex_travaux')
    .select('id', { count: 'exact', head: true })
    .eq('analyse_vf_statut', 'prete')
    .neq('statut_validation', 'valide')
  if (error) {
    console.error(`[codex-onglets] file de validation illisible — ${error.code} ${error.message}`)
    return 0
  }
  return count ?? 0
}
