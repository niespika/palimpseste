import 'server-only'
// ============================================================================
// C4 · L9 — LE SIGNAL DE L'ÉLÈVE AU LANCEMENT.
// ----------------------------------------------------------------------------
// « Quand le professeur OUVRE LE DÉPÔT, l'élève LE VOIT et entre PAR SON
//   MODULE. »                                                 — `07-` §2, C4-L9
//
// ⭐ LE TROU QUE CE FICHIER BOUCHE. `ouvrirLesDepots()`
//    (`utils/passation/depots.ts`) fait passer `assigne → ouvert`, pose
//    `ouvert_at` ET `ouvert_par_prof_at`, n'ouvre QUE ce qui attend, et laisse
//    son horodatage à un dépôt déjà ouvert. La page de passation de l'élève
//    existe aussi — `/eleve/modules/{codex,aletheia}/passation/{depotId}`.
//    ⚠️ Mais AUCUNE page de module de l'élève n'y renvoyait : le chemin ne
//    s'atteignait qu'en CONNAISSANT l'identifiant du dépôt.
//
// ⚠️ CE N'EST PAS LE « À FAIRE » DU TABLEAU DE BORD (C6-L2), et ce n'est pas le
//    même événement : celui-là naît de l'ASSIGNATION, celui-ci du LANCEMENT.
//    Deux événements, deux signaux — on n'attend pas l'un pour faire l'autre, et
//    on n'en fabrique pas un seul pour les deux.
//
// ⚠️ LECTURE PAR LE CLIENT ADMIN, FILTRÉE SUR `eleve_id` DANS LE CODE. « Lecture
//    élève : ses propres lignes, strictement ; toutes les écritures passent par
//    le serveur » (`07-` §1) — et le moteur va plus loin : ZÉRO policy élève sur
//    ses 39 tables. On n'en ouvre aucune ; le serveur lit pour l'élève.
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import { passationOuverteAEleve } from '@/utils/passation/acces'
import { moduleDuType, type ModuleExamen } from './types'

type Admin = SupabaseClient
type Ligne = Record<string, unknown>
const txt = (x: unknown): string => (typeof x === 'string' ? x : '')
const lig = (x: unknown): Ligne => (typeof x === 'object' && x !== null ? x as Ligne : {})
const un = (v: unknown): unknown => (Array.isArray(v) ? v[0] ?? null : v ?? null)

export interface SignalDeLancement {
  depotId: string
  /** Ce que l'élève lit sur la tuile — la première ligne de la consigne. */
  titre: string
  /** L'instant du geste du professeur : ce qui distingue l'ouverture de classe. */
  ouvertLe: string
  /** Où l'élève entre — DANS SON MODULE. */
  href: string
}

/**
 * Les passations en classe OUVERTES pour cet élève, dans ce module.
 *
 * ⭐ LE PRÉDICAT, ET IL TIENT EN UNE LIGNE : un dépôt `ouvert` dont l'instance a
 *    `lieu = 'classe'`.
 *
 * ⚠️ `ouvert_par_prof_at` EST CE QUI DISTINGUE L'OUVERTURE DE CLASSE — « rien
 *    n'est relisible avant que le professeur ait ouvert le dépôt », le garde-fou
 *    de terrain du `02-` §6.D. On l'exige, on ne se contente pas du statut.
 *
 * ⚠️ `retire` ET `abandonne` SONT EXCLUS PAR L'ÉGALITÉ SUR `ouvert`, et c'est
 *    voulu : `retire` est une DÉCISION DU PROFESSEUR, `abandonne` un NON-GESTE
 *    DE L'ÉLÈVE, et les deux ne se confondent pas (§1.1) — mais ni l'un ni
 *    l'autre n'est `ouvert`. Un prédicat de plus serait mort ; qu'on ne
 *    l'ajoute pas plus tard en croyant combler un trou.
 *
 * ⚠️ LE SIGNAL S'ÉTEINT À LA REMISE (`v1_remis`), et c'est le sens du mot
 *    « lancement » : il ouvre l'entrée, il ne suit pas le déroulé. La page de
 *    passation, elle, reste atteignable par son adresse tant que le dépôt vit.
 */
export async function signauxDeLancement(
  admin: Admin, eleveId: string, module: ModuleExamen,
): Promise<SignalDeLancement[]> {
  // ⭐ LE CÔTÉ ÉLÈVE NAÎT DERRIÈRE SES PORTES, ET IL Y EN A DEUX : `exercices_actif`
  //    — « les élèves peuvent-ils faire des exercices ? » (§1.5, au professeur) —
  //    et `passation_classe_actif`, l'interrupteur propre de C4-L4. LE PLUS FERMÉ
  //    GAGNE, et c'est exactement ce que `garderEleve` applique à la page de
  //    passation elle-même : un signal qui mènerait à une page fermée serait un
  //    lien qui promet une porte close. On réutilise LEUR lecture, on n'en écrit
  //    pas une seconde — et ce lot n'ouvre aucun interrupteur, ni n'en crée.
  if (!(await passationOuverteAEleve(admin))) return []

  const { data, error } = await admin
    .from('exercices_depots')
    .select('id, ouvert_par_prof_at, exercices!inner(id, lieu, consigne_instanciee, '
      + 'modes_par_competence, exercice_planifie_id)')
    .eq('eleve_id', eleveId)
    .eq('statut', 'ouvert')
    .not('ouvert_par_prof_at', 'is', null)
    .eq('exercices.lieu', 'classe')
  if (error) {
    // Une lecture ratée n'est pas « rien à faire » : on le dit au serveur.
    console.error(`[examens] signaux de lancement illisibles (${module}) — `
      + `${error.code} ${error.message}`)
    return []
  }
  const rows = (data ?? []) as unknown as Ligne[]
  if (rows.length === 0) return []

  // Le module de chaque instance : la ligne de plan d'abord (voir ci-dessous).
  const planifieIds = [...new Set(rows
    .map((d) => txt(lig(un(d.exercices)).exercice_planifie_id)).filter(Boolean))]
  const moduleParLigne = new Map<string, string>()
  if (planifieIds.length > 0) {
    const { data: lignes } = await admin
      .from('scriptorium_exercices_planifies').select('id, type_exercice').in('id', planifieIds)
    for (const l of (lignes ?? []) as unknown as Ligne[]) {
      const m = moduleDuType(txt(l.type_exercice))
      if (m) moduleParLigne.set(txt(l.id), m)
    }
  }

  const out: SignalDeLancement[] = []
  for (const d of rows) {
    const ex = lig(un(d.exercices))
    const m = moduleDeLInstance(ex, moduleParLigne)
    if (m !== module) continue
    out.push({
      depotId: txt(d.id),
      titre: premiereLigne(ex.consigne_instanciee),
      ouvertLe: txt(d.ouvert_par_prof_at),
      href: `/eleve/modules/${m}/passation/${txt(d.id)}`,
    })
  }
  return out.sort((a, b) => b.ouvertLe.localeCompare(a.ouvertLe))
}

/**
 * « L'élève entre PAR SON MODULE » — et voici comment on sait lequel.
 *
 * 1. LA LIGNE DE PLAN, quand il y en a une, et c'est le cas de tout examen
 *    diagnostique. Sa typologie est une LISTE FERMÉE DE COUPLES
 *    (`exercices_typologie_chk`) : `ecriture` × diagnostique ⇒ `codex`,
 *    `lecture` × diagnostique ⇒ `aletheia`. Rien n'est plus sûr que ça.
 * 2. À DÉFAUT — une passation de classe hors plan —, la règle du `01-` §2 :
 *    « tout exercice qui a demandé une production se consulte dans son atelier
 *    — CODEX s'il porte `composer`, ALETHEIA sinon ».
 *
 * ⚠️ L'ORDRE N'EST PAS INDIFFÉRENT, et l'inverser casserait l'explication de
 *    texte : elle mesure l'Expression EN `composer` (`01-` §10), la règle 2
 *    l'enverrait donc dans CODEX — quand le `06-` §1 la range en LECTURE
 *    DIAGNOSTIQUE, dans ALETHEIA. La règle 2 est écrite pour les FORMATIFS, dont
 *    l'atelier suit le mode ; « les sommatifs se conçoivent CHACUN DANS SON
 *    MODULE » (`02-` §6 B, citant le `01-` §2), et leur module est au plan.
 */
function moduleDeLInstance(
  ex: Ligne, moduleParLigne: Map<string, string>,
): ModuleExamen {
  const parPlan = moduleParLigne.get(txt(ex.exercice_planifie_id))
  if (parPlan === 'codex' || parPlan === 'aletheia') return parPlan
  const modes = Object.values((ex.modes_par_competence ?? {}) as Record<string, unknown>)
    .flatMap((v) => (Array.isArray(v) ? v.map(txt) : []))
  return modes.includes('composer') ? 'codex' : 'aletheia'
}

/** La première ligne non vide de la consigne — la consigne reste dans l'écran. */
function premiereLigne(v: unknown): string {
  const brut = typeof v === 'string' ? v
    : Array.isArray(v) ? txt(v[0])
    : typeof v === 'object' && v !== null ? txt((v as Ligne).texte) : ''
  const ligne = brut.split('\n').map((x) => x.trim()).find((x) => x !== '')
  return ligne ?? 'Passation en classe'
}
