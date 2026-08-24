import 'server-only'
// ============================================================================
// C4 · L5 — CE QUE LA CHAÎNE LIT AVANT DE PARTIR.
// ----------------------------------------------------------------------------
// Un seul endroit où l'on va chercher en base, pour qu'aucun module de calcul
// n'ait à le faire. Trois disciplines s'y tiennent :
//
//  · « LA COUCHE TYPE LIT CE QUI EST DÉRIVÉ — `exercices_routes`,
//    `exercices_types_crans`, `exercices_crans` —, et NE LIS PAS la doctrine
//    dans le `04-` à l'exécution » (piège 4) ;
//  · « la correspondance observable → formulation, LUE EN BASE, déposée par la
//    fabrique ; JAMAIS lue des fiches en session » (piège 30) ;
//  · « le régime v1→vf SE DÉRIVE DU CRAN ÉLU » (piège 18 ; `02-` §2.2) — et non
//    d'une colonne qu'on aurait ajoutée.
// ============================================================================

import { createAdminClient } from '@/utils/supabase/admin'
import { cranEstUnCode, cranNumero } from '@/utils/cran'
import { lireLesStatutsDeRecette } from '@/utils/statut-recette'
import { formeDepuisLePlan } from './modele'
import { enTexte } from './consigne'
import type { Competence, Forme, Grain, Lieu, StatutRecette } from './types'
import { COMPETENCES } from './types'

type Admin = ReturnType<typeof createAdminClient>

export interface ContexteDepot {
  depotId: string
  eleveId: string
  exerciceId: string
  classeId: string | null
  lieu: Lieu
  forme: Forme
  /** Le code de l'objet — l'opérande « objet » de `distance_contexte` (`01-` §11). */
  objet: string
  grain: Grain
  cran: number | null
  cranCode: string | null
  /**
   * `exercices.cible_primaire` — « la compétence qui commande le retour »
   * (`07-` §1.1 ; `01-` §1, point 1 : « l'exercice porte la cible »).
   *
   * ⚠️ NULLABLE, et elle le reste : « sur la voie du routeur elle reste NULL —
   *    la cible est la sortie de la couche 2 et vit à la décision ». Un
   *    `NOT NULL` casserait toute la voie du routeur.
   */
  ciblePrimaire: Competence | null
  /** `02-` §2.2 — `par paires` · `pas de vf, sauf escalade` · `plein`. */
  regimeV1vf: string | null
  genre: string | null
  bonus: boolean
  paireDiagnostic: boolean
  /** `exercices.modes_par_competence` — les modes ÉLUS, par compétence mesurée. */
  modesParCompetence: Record<string, string[]>
  consigne: string
  /** La production mesurée : le texte saisi, ou la transcription CORRIGÉE (`02-` §6.D). */
  productionV1: string | null
  productionVf: string | null
  /** `07-` §1.3 — le seul endroit où la mécanique touche la lettre (piège 53). */
  exceptionOrthographe: boolean
  statutsRecette: Record<Competence, StatutRecette>
  /** La couche compétence, lue en base (`competences_correspondance`). */
  correspondance: Record<string, Array<{ observable_code: string; dimension_eleve: string }>>
  /** La couche type — « Ce qui est servable ici », lue de la doctrine dérivée. */
  servable: Array<{ competence: string; observable_nom: string }>
  /**
   * Aux TROIS CRANS DE PRODUCTION (2, 6, 8), `exercices_routes` ne porte rien —
   * « les trois crans de production, QUE LES TABLES NE PEUVENT PAS PORTER »
   * (`04-` §0 et §14), et une contrainte de C4-L8 le tient. Ce n'est donc pas un
   * trou de données : c'est la doctrine. Ce que le `04-` §14 porte pour eux, ce
   * sont les QUINZE PATRONS de consigne — l'autre moitié de la couche type,
   * « ce que l'exercice servi demandait » (`01-` §12).
   */
  patronProduction: string | null
  /**
   * Ce que la DÉCISION D'ASSIGNATION porte. « Le drapeau [de sonde de montée]
   * vient de la décision d'assignation ; la chaîne LE RECOPIE sur la mesure,
   * ELLE NE LE DEVINE PAS » (piège 20).
   */
  decision: {
    cibleRetenue: string | null
    /** Les compétences SONDÉES — silencieuses : elles ne produisent aucun retour. */
    sondes: string[]
    /**
     * Les compétences sondées EN MONTÉE, nommément. Le drapeau se recopie sur
     * LEUR mesure, jamais sur celle de la cible : « une mesure de sonde de montée
     * est marquée et NEUTRE POUR TOUT LE RESTE » (`01-` §8.8, M-e).
     */
    sondesMontee: string[]
  } | null
  /** `confiance_declaree`, par compétence — une valeur par `evaluee` mesurée (§1.1). */
  confianceDeclaree: Record<string, string>
  /**
   * Le référent de la production. « UN SEUL appel d'extraction quand le référent
   * est LE COURS — l'aligneur ne tourne pas » (`07-` §1.2 ; piège 6) ; la
   * synthèse en classe a le cours pour référent (`01-` §10).
   */
  referent: 'texte' | 'cours' | null
  /**
   * ⭐⭐ LA RÉFÉRENCE DÉCOMPOSÉE DU TEXTE, telle que `exercices_references.contenu`
   * la porte — le format qui fait foi au `02-exercices.md` §6, et que
   * `copies-tests/_commun/verifie-reference.py` déclare CLOS : `phrases`,
   * `moments`, `concepts`, `lectures`, `armature`, `hesitation`, et rien d'autre.
   *
   * ⛔ ELLE N'EST SERVIE QUE VALIDÉE, et ce n'est pas une prudence : une garde
   *    EN BASE (`garde_reference_validee`, `c4_l1_schema.sql`) **lève une
   *    exception** dès qu'un `artefact_jugement` s'écrit sur un dépôt dont
   *    l'exercice porte une référence non validée. Tant que la chaîne s'arrêtait
   *    avant P2, la garde ne tirait jamais ; en servant la référence, elle
   *    tirerait — et une exception de base emporte la trace avec elle, au lieu
   *    d'une mesure qui s'arrête proprement en NOMMANT ce qui manque.
   *    *Une référence non validée laisse donc ce champ à `null`, le slot du
   *    branchement est servi à `null`, et la mesure s'arrête en le nommant.*
   *
   * ⚠️ `null` NE VEUT PAS DIRE « pas de référent » : `referent` reste `'texte'`
   *    dès que l'exercice porte une `reference_id`. Les deux disent deux choses
   *    différentes — ce que l'exercice DÉCLARE, et ce que la chaîne PEUT SERVIR.
   */
  reference: unknown | null
  /**
   * LE MATÉRIAU — le texte source de la référence, `scriptorium_contenus.texte_extrait`.
   *
   * ⭐ Il vient de la MÊME jointure : `exercices_references.source_contenu_id`.
   * Le pré-relevé mécanique de la Synthèse en a besoin — « le nombre de mots de
   * la production ET DU MATÉRIAU, le taux de compression, et les recouvrements
   * verbatim » (`competences/synthese.md` §3) —, et sans lui son aligneur
   * s'entendrait dire « aucune reprise littérale » alors que rien n'a été
   * cherché. *Servir la référence sans le matériau activerait un chemin sur un
   * énoncé faux : les deux descendent ensemble, ou aucun.*
   *
   * ⚠️ L'arc de source est EXCLUSIF : une référence bâtie sur un livre
   *    (`source_livre_id`) n'a pas de `texte_extrait`, et ce champ reste `null`.
   */
  materiau: string | null
  /**
   * LE SITE UNIQUE des deux observables de lucidité — « la synthèse en classe »,
   * et pas un autre (`01-` §10 ; `competences/monitoring.md` §4 et §6).
   * Elle se reconnaît à sa ligne de plan : `type_exercice = 'synthese'`, que la
   * garde du plan tient déjà en `formatif` × `classe` × `codex`.
   */
  estSyntheseEnClasse: boolean
}

const NUL = 'introuvable'

// Le dépôt n'a pas de types générés : les `select` concaténés ne s'infèrent pas,
// et le patron du dépôt est le transtypage explicite (`utils/acces.ts`,
// `utils/plan-exercices.ts`). Les formes ci-dessous disent CE QU'ON LIT, colonne
// par colonne — elles ne déclarent rien de plus que la requête au-dessus d'elles.
interface LigneDepot {
  id: string; eleve_id: string; exercice_id: string; statut: string
  texte_v1: string | null; transcription_v1: string | null
  texte_vf: string | null; transcription_vf: string | null
  confiance_declaree: Record<string, string> | null
  routeur_decision_id: string | null
}
interface LigneExercice {
  id: string; type_id: string; classe_id: string | null; lieu: string
  consigne_instanciee: unknown; paire_diagnostic: boolean; cran: string | number | null
  cible_primaire: string | null
  genre: string | null; modes_par_competence: Record<string, string[]> | null
  bonus: boolean; exercice_planifie_id: string | null; reference_id: string | null
}

export class DepotIllisible extends Error {}

export async function lireContexte(admin: Admin, depotId: string): Promise<ContexteDepot> {
  const { data: depotBrut, error: eDepot } = await admin
    .from('exercices_depots')
    .select('id, eleve_id, exercice_id, statut, texte_v1, transcription_v1, texte_vf, '
      + 'transcription_vf, confiance_declaree, routeur_decision_id')
    .eq('id', depotId).maybeSingle()
  if (eDepot) throw new DepotIllisible(`dépôt ${depotId} : ${eDepot.code} ${eDepot.message}`)
  if (!depotBrut) throw new DepotIllisible(`dépôt ${depotId} : ${NUL}`)
  const depot = depotBrut as unknown as LigneDepot

  const { data: exerciceBrut, error: eEx } = await admin
    .from('exercices')
    // ⭐ C4-L11 — `cible_primaire` DESCEND JUSQU'ICI. Sans elle dans ce select,
    //    la colonne existerait et ne commanderait rien.
    .select('id, type_id, classe_id, lieu, consigne_instanciee, paire_diagnostic, cran, genre, '
      + 'cible_primaire, modes_par_competence, bonus, exercice_planifie_id, reference_id')
    .eq('id', depot.exercice_id).maybeSingle()
  if (eEx || !exerciceBrut) throw new DepotIllisible(`exercice de ${depotId} : ${eEx?.message ?? NUL}`)
  const exercice = exerciceBrut as unknown as LigneExercice

  const { data: typeBrut } = await admin
    .from('exercices_types').select('code, grain').eq('id', exercice.type_id).maybeSingle()
  if (!typeBrut) throw new DepotIllisible(`type de l'exercice ${exercice.id} : ${NUL}`)
  const type = typeBrut as unknown as { code: string; grain: Grain | null }

  // ── La `forme` de la mesure, dérivée de la ligne de plan (voir `modele.ts`) ──
  let nature: string | null = null
  let typeExercice: string | null = null
  if (exercice.exercice_planifie_id) {
    const { data: planBrut } = await admin
      .from('scriptorium_exercices_planifies').select('nature, type_exercice')
      .eq('id', exercice.exercice_planifie_id).maybeSingle()
    const plan = planBrut as unknown as { nature: string | null; type_exercice: string | null } | null
    nature = plan?.nature ?? null
    typeExercice = plan?.type_exercice ?? null
  }

  // ── LE CRAN — une seule forme, et une lecture qui ne rend jamais NaN ───────
  // ⚠️⚠️ `Number(exercice.cran)` rendait **NaN** sur une instance dont le cran
  //    est écrit AU CODE — et `NaN != null` est vrai. La requête partait alors
  //    en `cran=eq.NaN`, PostgREST rendait un 400 que supabase-js avale, et
  //    `cran`, `cranCode`, `regimeV1vf`, `servable` ET `patronProduction`
  //    ressortaient tous les cinq VIDES sur une instance parfaitement valide.
  //    Trois gardes `Number.isFinite` existaient déjà — la ligne du `servable`
  //    n'en avait pas. `cranNumero()` ferme la porte à la source (C4-L11).
  // ⭐ Et la lecture RÉSOUT un cran écrit au code, une fois, par sa table : la
  //    forme unique est le NUMÉRO (`utils/cran.ts`), mais une instance d'avant
  //    la conversion doit continuer de traverser la chaîne, pas rendre du vide.
  let cran = cranNumero(exercice.cran)
  let cranCode: string | null = null
  let regimeV1vf: string | null = null
  if (cran != null || cranEstUnCode(exercice.cran)) {
    const q = admin.from('exercices_crans').select('cran, code, regime_v1vf')
    const { data: cBrut } = await (cran != null
      ? q.eq('cran', cran)
      : q.eq('code', String(exercice.cran).trim())).maybeSingle()
    const c = cBrut as unknown as
      { cran: number | null; code: string | null; regime_v1vf: string | null } | null
    cran = cranNumero(c?.cran) ?? cran
    cranCode = c?.code ?? null
    regimeV1vf = c?.regime_v1vf ?? null
  }

  // ── LA RÉFÉRENCE DÉCOMPOSÉE, ET SON MATÉRIAU ──────────────────────────────
  //
  // ⭐ UNE SEULE JOINTURE FERME DEUX MANQUES : `exercices_references` porte le
  //    `contenu` — la référence au format du `02-` §6 — ET le lien vers son
  //    texte source. Le Questionnement en lit `armature.question_directrice`
  //    dans les quatre modes réceptifs ; la Synthèse en a besoin pour son
  //    aligneur, pour le document de son juge, et — par le matériau — pour son
  //    pré-relevé mécanique.
  //
  // ⛔ VALIDÉE SEULEMENT. `garde_reference_validee` (en base) LÈVE dès qu'un
  //    `artefact_jugement` s'écrit sur une référence non validée. Servir une
  //    référence non validée échangerait un arrêt propre, qui NOMME le slot qui
  //    manque, contre une exception de base qui emporte la trace.
  let reference: unknown | null = null
  let materiau: string | null = null
  if (exercice.reference_id) {
    const { data: refBrut } = await admin
      .from('exercices_references')
      .select('contenu, validee_at, source_contenu_id')
      .eq('id', exercice.reference_id).maybeSingle()
    const ref = refBrut as unknown as
      { contenu: unknown; validee_at: string | null; source_contenu_id: string | null } | null
    if (ref?.validee_at) {
      reference = ref.contenu ?? null
      if (ref.source_contenu_id) {
        const { data: srcBrut } = await admin
          .from('scriptorium_contenus').select('texte_extrait')
          .eq('id', ref.source_contenu_id).maybeSingle()
        const src = srcBrut as unknown as { texte_extrait: string | null } | null
        materiau = src?.texte_extrait ?? null
      }
    }
  }

  const modesParCompetence = (exercice.modes_par_competence ?? {}) as Record<string, string[]>
  const tousLesModes = [...new Set(Object.values(modesParCompetence).flat())]

  // ── La couche type : « Ce qui est servable ici », DÉRIVÉ en base (piège 4) ──
  //
  // ⚠️ `exercices_routes` NE PORTE QUE LES SIX CRANS QUI ISOLENT (1·3·4·5·7·9) —
  //    une contrainte de C4-L8 le tient, parce que « les trois crans de
  //    production, les tables ne peuvent pas les porter » (`04-` §0 et §14). Aux
  //    crans 2, 6 et 8 — le geste PRODUIRE, donc l'essai, la dissertation, le
  //    diagnostic de la semaine 1 —, filtrer sur les routes rendait une liste
  //    vide, et le prompt affirmait au modèle que « rien n'est déclaré ». La
  //    couche type y lit donc `exercices_types_crans.couverture_observables`, que
  //    le piège 4 nomme AUSSI, et qui dit ce que le cran couvre.
  let servable: ContexteDepot['servable'] = []
  if (cran != null && tousLesModes.length) {
    const { data: routes } = await admin
      .from('exercices_routes').select('competence, observable_nom')
      .eq('objet_code', type.code).eq('cran', cran).in('mode', tousLesModes)
    const vus = new Set<string>()
    servable = ((routes ?? []) as unknown as Array<{ competence: string; observable_nom: string }>)
      .filter((r) => {
        const c = `${r.competence}|${r.observable_nom}`
        if (vus.has(c)) return false
        vus.add(c)
        return true
      })
    // Aux crans de PRODUCTION, `exercices_routes` est vide par contrainte : on
    // demande alors sa couverture au cran lui-même, avant de retomber sur le
    // patron de consigne.
    if (servable.length === 0) {
      servable = await couvertureDuCran(
        admin, exercice.type_id, cran, tousLesModes, Object.keys(modesParCompetence))
    }
  }

  // ── La couche compétence : la correspondance, lue EN BASE (piège 30) ────────
  const competencesEnJeu = Object.keys(modesParCompetence)
  const { data: corr } = await admin
    .from('competences_correspondance')
    .select('competence, observable_code, dimension_eleve, ordre')
    .in('competence', competencesEnJeu.length ? competencesEnJeu : ['__aucune__'])
    .order('ordre', { ascending: true })
  const correspondance: ContexteDepot['correspondance'] = {}
  for (const l of (corr ?? []) as unknown as Array<{ competence: string; observable_code: string; dimension_eleve: string }>) {
    ;(correspondance[l.competence] ??= []).push({
      observable_code: l.observable_code, dimension_eleve: l.dimension_eleve,
    })
  }

  const statutsRecette = await lireStatutsRecette(admin)

  const { data: profilBrut } = await admin
    .from('profiles').select('exception_orthographe').eq('id', depot.eleve_id).maybeSingle()
  const profil = profilBrut as unknown as { exception_orthographe: boolean | null } | null

  let decision: ContexteDepot['decision'] = null
  if (depot.routeur_decision_id) {
    const { data: dBrut } = await admin
      .from('routeur_decisions').select('cible_retenue, sondes_retenues')
      .eq('id', depot.routeur_decision_id).maybeSingle()
    const d = dBrut as unknown as { cible_retenue: string | null; sondes_retenues: unknown } | null
    if (d) {
      const sondes = Array.isArray(d.sondes_retenues)
        ? (d.sondes_retenues as Array<{ competence?: string; sonde_montee?: boolean }>)
        : []
      decision = {
        cibleRetenue: d.cible_retenue ?? null,
        sondes: sondes.map((s) => s.competence ?? '').filter(Boolean),
        sondesMontee: sondes.filter((s) => s.sonde_montee === true)
          .map((s) => s.competence ?? '').filter(Boolean),
      }
    }
  }

  return {
    depotId,
    eleveId: depot.eleve_id,
    exerciceId: exercice.id,
    classeId: exercice.classe_id ?? null,
    lieu: exercice.lieu as Lieu,
    forme: formeDepuisLePlan(nature, typeExercice === 'synthese' && exercice.lieu === 'classe'),
    objet: type.code,
    grain: type.grain ?? 'meso',
    cran,
    cranCode,
    ciblePrimaire: (COMPETENCES as readonly string[]).includes(String(exercice.cible_primaire ?? ''))
      ? exercice.cible_primaire as Competence : null,
    regimeV1vf,
    genre: exercice.genre ?? null,
    bonus: !!exercice.bonus,
    paireDiagnostic: !!exercice.paire_diagnostic,
    modesParCompetence,
    consigne: enTexte(exercice.consigne_instanciee),
    productionV1: production(depot.texte_v1, depot.transcription_v1),
    productionVf: production(depot.texte_vf, depot.transcription_vf),
    exceptionOrthographe: !!profil?.exception_orthographe,
    statutsRecette,
    correspondance,
    servable,
    patronProduction: cran != null && Number.isFinite(cran)
      ? await patronDeProduction(admin, tousLesModes, cran)
      : null,
    decision,
    confianceDeclaree: (depot.confiance_declaree ?? {}) as Record<string, string>,
    estSyntheseEnClasse: typeExercice === 'synthese' && exercice.lieu === 'classe',
    referent: typeExercice === 'synthese' && exercice.lieu === 'classe'
      ? 'cours'
      : (exercice.reference_id ? 'texte' : null),
    reference,
    materiau,
  }
}

/**
 * Le statut de recette, par compétence, pour cet élève.
 *
 * Ligne absente : `01-` §3, principe 5 — « une compétence dont la fiche n'est
 * pas déposée est `differee` ET NE PEUT PAS ÊTRE AUTRE CHOSE » ; sinon « une
 * compétence NAÎT `mesuree_silencieusement` » (`07-` §5). On ne devine rien
 * au-delà de ces deux phrases.
 */
export async function lireStatutsRecette(
  admin: Admin,
): Promise<Record<Competence, StatutRecette>> {
  const { data: fiches } = await admin.from('competences_fiches').select('competence')
  const deposees = new Set(((fiches ?? []) as unknown as Array<{ competence: string }>).map((f) => f.competence))
  // ⛔ LE STATUT SE LIT À SA SOURCE UNIQUE, jamais par élève : il est global
  //    (`07-` §1.3), et le ranger par élève laissait les inscrits d'après la
  //    pose sans aucune ligne. `utils/statut-recette.ts`.
  const globaux = await lireLesStatutsDeRecette(admin as never)
  const poses = new Map(Object.entries(globaux) as Array<[string, StatutRecette]>)
  const out = {} as Record<Competence, StatutRecette>
  for (const c of COMPETENCES) {
    out[c] = poses.get(c) ?? (deposees.has(c) ? 'mesuree_silencieusement' : 'differee')
  }
  return out
}

/**
 * « Ce que ce type mesure », aux crans que `exercices_routes` ne porte pas.
 * `exercices_types_crans.couverture_observables` déclare, par cran, ce que le
 * cran couvre — `isole` / `exerce` (`02-` §2.3.2) — pour chaque observable de
 * chaque compétence que l'objet mesure.
 */
/**
 * « Ce que ce type mesure » au grain de l'observable, quand la doctrine le porte.
 *
 * La forme est celle que la dérivation verse — relue EN BASE, pas devinée :
 * `{ source, valeur: 'isole' | 'exerce', observables: [{ nom, code, mode, competence }] }`.
 *
 * ⚠️ Au 21/08, cette colonne est VIDE aux trois crans de production : « les trois
 *    crans de production, QUE LES TABLES NE PEUVENT PAS PORTER » (`04-` §0 et
 *    §14). Le professeur est en train d'y remédier — les six fiches portent
 *    depuis ce matin une ligne `<!-- PRODUCTION exerce=… -->` à leur §6, et
 *    `scripts/derive-doctrine.py` 1.1 la lit. Ce lot lit donc LES DEUX ÉTATS :
 *    la couverture si elle est là, le patron de consigne sinon.
 */
async function couvertureDuCran(
  admin: Admin, typeId: string, cran: number, modes: readonly string[],
  competences: readonly string[],
): Promise<Array<{ competence: string; observable_nom: string }>> {
  const { data, error } = await admin
    .from('exercices_types_crans').select('couverture_observables')
    // ⚠️ Le numéro, jamais `String(cran)` : `exercices_types_crans.cran` était
    //    la SEULE table de doctrine à le porter en texte, et l'aller-retour de
    //    type disparaît avec la forme unique (C4-L11).
    .eq('type_id', typeId).eq('cran', cran).maybeSingle()
  if (error) {
    console.error(`[chaine] couverture du cran illisible — ${error.code} ${error.message}`)
    return []
  }
  const brut = (data as unknown as { couverture_observables: unknown } | null)?.couverture_observables as
    { observables?: Array<{ nom?: string; mode?: string; competence?: string }> } | null
  const liste = Array.isArray(brut?.observables) ? brut!.observables! : []
  const vus = new Set<string>()
  const out: Array<{ competence: string; observable_nom: string }> = []
  for (const o of liste) {
    if (!o?.competence || !o?.nom) continue
    if (competences.length && !competences.includes(o.competence)) continue
    if (modes.length && o.mode && !modes.includes(o.mode)) continue
    const cle = `${o.competence}|${o.nom}`
    if (vus.has(cle)) continue
    vus.add(cle)
    out.push({ competence: o.competence, observable_nom: o.nom })
  }
  return out
}

async function patronDeProduction(
  admin: Admin, modes: readonly string[], cran: number,
): Promise<string | null> {
  if (!modes.length) return null
  const { data, error } = await admin
    .from('exercices_consignes_production').select('mode, patron')
    .eq('cran', cran).in('mode', modes)
  if (error) {
    console.error(`[chaine] patron de production illisible — ${error.code} ${error.message}`)
    return null
  }
  const lignes = (data ?? []) as unknown as Array<{ mode: string; patron: string }>
  if (!lignes.length) return null
  return lignes.map((l) => `${l.mode} : ${l.patron}`).join(' · ')
}

/** Le texte saisi d'abord, la transcription CORRIGÉE ensuite — jamais les deux. */
function production(texte: unknown, transcription: unknown): string | null {
  const t = typeof texte === 'string' && texte.trim() !== '' ? texte : null
  if (t) return t
  const tr = typeof transcription === 'string' && transcription.trim() !== '' ? transcription : null
  return tr
}
