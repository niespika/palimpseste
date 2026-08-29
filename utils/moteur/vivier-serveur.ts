import 'server-only'
// ============================================================================
// C4 · L12 — CE QUE LE VIVIER LIT. Le seul fichier de ce dossier qui lise.
// ----------------------------------------------------------------------------
// ⚠️ CE FICHIER N'EST PAS PUR : il LIT et il TRADUIT. Les trois filtres vivent à
//    `vivier.ts`, que `npm test` éprouve.
//
// ⚠️⚠️ LE PLAFOND DE 1000 LIGNES. « PostgREST plafonne toute réponse à 1000
//    lignes SANS RIEN SIGNALER — `error` reste nul. » Toute lecture qui peut
//    croître avec les élèves ou les instances passe par `lirePagine` :
//    PAGINER · ORDONNER SUR UNE CLÉ UNIQUE · CONFRONTER AU `count: 'exact'`.
//
// ⛔ « DÉJÀ VU » NE S'INVENTE PAS : la fonction existe, c'est celle qui alimente
//    le RAG — `chargerMatiereClasse` et `statutDe` (`utils/scriptorium-corpus.ts`,
//    « une seule règle, un seul endroit »). On ne réécrit aucune règle de « vu ».
//
// ⛔ LA CHAÎNE DU NON-SPOILER FAIT DEUX SAUTS, et les deux identités de livre ne
//    sont PAS la même : `exercices_textes.plan_livre_id` → `aletheia_livre_
//    reference(id)` — L'ARTEFACT DE RÉFÉRENCE, pas le livre —, dont
//    `scriptorium_livre_id` → `scriptorium_unites`, et la position de l'élève vit
//    à `aletheia_travaux(eleve_id, scriptorium_livre_id, semaine_index)`.
// ============================================================================

import type { createAdminClient } from '@/utils/supabase/admin'
import { lirePagine } from '@/utils/routeur/donnees'
import { chargerMatiereClasse, statutDe } from '@/utils/scriptorium-corpus'
import { chargerDoctrineDepuisBase, dureeExercice, type Doctrine } from '@/utils/fabrique/doctrine'
import { cranNumero } from '@/utils/cran'
import type { Geste, Grain } from '@/utils/routeur/types'
import {
  couvertureDeLInstance, positionDeLecture,
  type InstanceDuVivier, type MateriauRattache, type TravailDeLecture,
} from './vivier'

type Admin = ReturnType<typeof createAdminClient>

// ════════════════════════════════════════════════════════════════════════════
// LES MATÉRIAUX — c'est EUX qui portent le rattachement (`07-` §1.1)
// ════════════════════════════════════════════════════════════════════════════

interface LigneTexte {
  id: string; cours_etat: string; plan_livre_id: string | null; plan_semaine: number | null
  statut: string; bloque: boolean
}
interface LigneSujet {
  id: string; cours_etat: string; statut: string; bloque: boolean
}

async function lireLesMateriaux(admin: Admin): Promise<{
  textes: Map<string, Omit<MateriauRattache, 'role'>>
  sujets: Map<string, Omit<MateriauRattache, 'role'>>
}> {
  const [textes, sujets, texteCours, sujetCours] = await Promise.all([
    lirePagine<LigneTexte>(admin, 'exercices_textes',
      'id, cours_etat, plan_livre_id, plan_semaine, statut, bloque', ['id'], (q) => q),
    lirePagine<LigneSujet>(admin, 'exercices_sujets',
      'id, cours_etat, statut, bloque', ['id'], (q) => q),
    lirePagine<{ texte_id: string; cours_declare: string; cours_id: string | null }>(
      admin, 'exercices_textes_cours', 'texte_id, cours_declare, cours_id',
      ['texte_id', 'cours_declare'], (q) => q),
    lirePagine<{ sujet_id: string; cours_declare: string; cours_id: string | null }>(
      admin, 'exercices_sujets_cours', 'sujet_id, cours_declare, cours_id',
      ['sujet_id', 'cours_declare'], (q) => q),
  ])

  const rattachements = (lignes: Array<{ cours_id: string | null }>) => ({
    // ⛔ « `cours_id` NULL signifie DÉCLARÉ MAIS PAS ENCORE APPARIÉ » — donc pas
    //    servable non plus. On garde les deux comptes pour que le motif le dise.
    coursApparies: lignes.map((l) => l.cours_id).filter((c): c is string => !!c),
    coursDeclares: lignes.length,
  })

  const parTexte = new Map<string, Array<{ cours_id: string | null }>>()
  for (const l of texteCours) parTexte.set(l.texte_id, [...(parTexte.get(l.texte_id) ?? []), l])
  const parSujet = new Map<string, Array<{ cours_id: string | null }>>()
  for (const l of sujetCours) parSujet.set(l.sujet_id, [...(parSujet.get(l.sujet_id) ?? []), l])

  const mTextes = new Map<string, Omit<MateriauRattache, 'role'>>()
  for (const t of textes) {
    mTextes.set(t.id, {
      sorte: 'texte', id: t.id,
      coursEtat: t.cours_etat as MateriauRattache['coursEtat'],
      ...rattachements(parTexte.get(t.id) ?? []),
      // ⚠️ Le `CHECK` `textes_plan_couple_chk` garantit que la semaine et le
      //    livre déclaré vont ENSEMBLE, jamais l'un sans l'autre.
      planLivreReferenceId: t.plan_livre_id, planSemaine: t.plan_semaine,
      statut: t.statut, bloque: t.bloque,
    })
  }
  const mSujets = new Map<string, Omit<MateriauRattache, 'role'>>()
  for (const s of sujets) {
    mSujets.set(s.id, {
      sorte: 'sujet', id: s.id,
      coursEtat: s.cours_etat as MateriauRattache['coursEtat'],
      ...rattachements(parSujet.get(s.id) ?? []),
      planLivreReferenceId: null, planSemaine: null,
      statut: s.statut, bloque: s.bloque,
    })
  }
  return { textes: mTextes, sujets: mSujets }
}

// ════════════════════════════════════════════════════════════════════════════
// LES INSTANCES — la bibliothèque que le routeur SÉLECTIONNE
// ════════════════════════════════════════════════════════════════════════════

interface LigneExercice {
  id: string; lieu: string; statut: string; bloque: boolean; cran: number | string | null
  classe_id: string | null
  genre: string | null; modes_par_competence: Record<string, string[]> | null
  observable_isole_competence: string | null
  materiau_source_texte_id: string | null; materiau_source_sujet_id: string | null
  materiau_cible_texte_id: string | null; materiau_cible_sujet_id: string | null
  exercices_types: { code: string; nature: string; grain: string | null
    exclusions_parcours: string[] | null } | null
}

const COLONNES_EXERCICE =
  'id, lieu, statut, bloque, cran, classe_id, genre, modes_par_competence, '
  + 'observable_isole_competence, '
  + 'materiau_source_texte_id, materiau_source_sujet_id, materiau_cible_texte_id, '
  + 'materiau_cible_sujet_id, exercices_types!inner(code, nature, grain, exclusions_parcours)'

/**
 * Les instances telles que la couche 4 les regarde. ⚠️ ON LIT TOUT et on laisse
 * `constituerLeVivier` écarter : « un vide expliqué, jamais un onglet qui
 * clignote » — un motif d'écart qu'on n'a pas lu ne se dit pas.
 *
 * ⚠️ LE CRAN EST UN NUMÉRO EN BASE ET UN CODE DANS LES RÈGLES, et LE PONT EXISTE
 *    DÉJÀ DANS LA DOCTRINE : `d.crans[n].code`. ⛔ On n'écrit pas une seconde
 *    table de correspondance — « ce serait un second domicile de ce que la
 *    doctrine dérive ».
 */
export async function lireLesInstances(
  admin: Admin, doctrine?: Doctrine,
): Promise<{ instances: InstanceDuVivier[]; incidents: string[] }> {
  const incidents: string[] = []
  const d = doctrine ?? await chargerDoctrineDepuisBase(admin as never)
  const [lignes, materiaux] = await Promise.all([
    lirePagine<LigneExercice>(admin, 'exercices', COLONNES_EXERCICE, ['id'], (q) => q),
    lireLesMateriaux(admin),
  ])

  const instances: InstanceDuVivier[] = []
  for (const l of lignes) {
    const type = l.exercices_types
    if (!type) { incidents.push(`exercice ${l.id.slice(0, 8)} : type illisible.`); continue }
    // Les deux examens diagnostiques (`nature` `complet`) n'ont ni objet ni cran,
    // et ils sont « imposés en classe, HORS ROUTAGE » (`01-` §10).
    const n = cranNumero(l.cran)
    const cran = n === null ? null : d.crans[n] ?? null
    const objet = d.objets[type.code]

    const materiauxDeLInstance: MateriauRattache[] = []
    const ajouter = (id: string | null, sorte: 'texte' | 'sujet',
      role: 'source' | 'cible') => {
      if (!id) return
      const m = (sorte === 'texte' ? materiaux.textes : materiaux.sujets).get(id)
      if (!m) { incidents.push(`${sorte} ${id.slice(0, 8)} introuvable.`); return }
      materiauxDeLInstance.push({ ...m, role })
    }
    ajouter(l.materiau_source_texte_id, 'texte', 'source')
    ajouter(l.materiau_source_sujet_id, 'sujet', 'source')
    ajouter(l.materiau_cible_texte_id, 'texte', 'cible')
    ajouter(l.materiau_cible_sujet_id, 'sujet', 'cible')

    const declarees = Object.keys(l.modes_par_competence ?? {})
    const exerce = cran && objet
      ? ((objet.parCran[cran.n]?.couverture as { exerce?: string[] } | undefined)?.exerce ?? [])
      : []

    instances.push({
      exerciceId: l.id,
      objet: type.code,
      grain: (type.grain ?? objet?.grain ?? 'meso') as Grain,
      geste: (cran?.geste ?? 'produire') as Geste,
      cranNumero: n,
      cranCode: cran?.code ?? null,
      // ⚠️ « `dureeMin` NE SE SAISIT JAMAIS À LA MAIN » : la doctrine la dérive du
      //    GESTE du cran et du GRAIN de l'objet. Sans cran (examen diagnostique),
      //    il n'y en a aucune — et l'instance sort du vivier en le disant.
      dureeMin: n === null ? null : dureeExercice(d, type.code, n),
      lieu: l.lieu === 'classe' ? 'classe' : 'maison',
      classeId: l.classe_id,
      statut: l.statut,
      bloque: !!l.bloque,
      genre: l.genre,
      exclusionsParcours: type.exclusions_parcours ?? objet?.exclusionsParcours ?? [],
      modesParCompetence: l.modes_par_competence ?? {},
      couverture: couvertureDeLInstance(
        declarees, (cran?.geste ?? 'produire') as Geste, exerce,
        l.observable_isole_competence),
      materiaux: materiauxDeLInstance,
    })
  }
  return { instances, incidents }
}

// ════════════════════════════════════════════════════════════════════════════
// LE COURS VU — par CLASSE, et l'union pour un bi-classe
// ════════════════════════════════════════════════════════════════════════════

/**
 * `01-` §4 — « le rattachement se fait à la CLASSE, et un bi-classe en a deux :
 * servable dès qu'AU MOINS UN cours a été EN PARTIE VU ».
 *
 * ⛔ La règle de « vu » est celle du RAG, et elle ne se recopie pas : `statutDe`
 *    rend `vu` / `en_cours` / `a_venir`, et « en partie vu » est exactement la
 *    partition que l'assembleur sert au modèle — `vu` OU `en_cours`. Un élément
 *    `a_venir` n'apporte que son titre, ici comme là.
 */
export async function lireLesCoursVus(
  admin: Admin, classeIds: readonly string[], aujourdHui: string,
): Promise<{ parClasse: Map<string, Set<string>>; incidents: string[] }> {
  const incidents: string[] = []
  const parClasse = new Map<string, Set<string>>()
  for (const classeId of classeIds) {
    const vus = new Set<string>()
    try {
      const matiere = await chargerMatiereClasse(admin as never, classeId, aujourdHui)
      for (const inst of matiere?.instances ?? []) {
        for (const e of inst.elements) {
          if (!e.contenuCle) continue
          const s = statutDe(e, inst.semaineCourante)
          if (s === 'vu' || s === 'en_cours') vus.add(e.contenuCle)
        }
      }
    } catch (err) {
      incidents.push(`cours vus de la classe ${classeId.slice(0, 8)} : ${(err as Error).message}`)
    }
    parClasse.set(classeId, vus)
  }
  return { parClasse, incidents }
}

// ════════════════════════════════════════════════════════════════════════════
// LA POSITION DE LECTURE — deux sauts, et l'ordinal de séance
// ════════════════════════════════════════════════════════════════════════════

/**
 * La position de chaque élève, PAR ARTEFACT DE RÉFÉRENCE
 * (`aletheia_livre_reference.id`) — l'identité que `exercices_textes.
 * plan_livre_id` porte, et qui n'est PAS celle du livre.
 *
 * ⚠️ « SEMAINE » NE VEUT PAS DIRE SEMAINE : `semaine_index` et `plan_semaine`
 *    sont des ORDINAUX DE SÉANCE, comparés PAR ÉGALITÉ sur la même échelle.
 *    ⛔ On ne les compare JAMAIS à un `cycle_lundi`.
 */
export async function lireLesPositionsDeLecture(
  admin: Admin, eleveIds: readonly string[],
): Promise<{ parEleve: Map<string, Map<string, number | null>>; incidents: string[] }> {
  const incidents: string[] = []
  const parEleve = new Map<string, Map<string, number | null>>()
  for (const id of eleveIds) parEleve.set(id, new Map())
  if (eleveIds.length === 0) return { parEleve, incidents }

  // Le premier saut : l'artefact de référence → le livre du Scriptorium.
  const refs = await lirePagine<{ id: string; scriptorium_livre_id: string }>(
    admin, 'aletheia_livre_reference', 'id, scriptorium_livre_id', ['id'], (q) => q)
    .catch((e) => { incidents.push(`références de livre : ${(e as Error).message}`); return [] })
  if (refs.length === 0) return { parEleve, incidents }

  const travaux = await lirePagine<{
    eleve_id: string; scriptorium_livre_id: string; semaine_index: number; statut: string
  }>(admin, 'aletheia_travaux', 'eleve_id, scriptorium_livre_id, semaine_index, statut, id',
    ['id'], (q) => (q as never as { in: (a: string, b: string[]) => unknown })
      .in('eleve_id', eleveIds as string[]))
    .catch((e) => { incidents.push(`travaux de lecture : ${(e as Error).message}`); return [] })

  const parEleveEtLivre = new Map<string, TravailDeLecture[]>()
  for (const t of travaux) {
    const lot = parEleveEtLivre.get(t.eleve_id) ?? []
    lot.push({ livreId: t.scriptorium_livre_id, semaineIndex: t.semaine_index, statut: t.statut })
    parEleveEtLivre.set(t.eleve_id, lot)
  }

  for (const id of eleveIds) {
    const siens = parEleveEtLivre.get(id) ?? []
    const m = parEleve.get(id) as Map<string, number | null>
    for (const r of refs) {
      // La clé est celle que le matériau porte : l'ARTEFACT, pas le livre.
      m.set(r.id, positionDeLecture(siens, r.scriptorium_livre_id))
    }
  }
  return { parEleve, incidents }
}

// ════════════════════════════════════════════════════════════════════════════
// CE QUE L'ÉLÈVE PORTE DÉJÀ
// ════════════════════════════════════════════════════════════════════════════

/**
 * ⛔ « Resservir la MÊME instance au MÊME élève serait un défaut silencieux. »
 * Entre élèves, en revanche, une instance se ressert : « une instance, plusieurs
 * dépôts ».
 */
export async function lireLesInstancesDejaDeposees(
  admin: Admin, eleveIds: readonly string[],
): Promise<{ parEleve: Map<string, Set<string>>; incidents: string[] }> {
  const incidents: string[] = []
  const parEleve = new Map<string, Set<string>>()
  for (const id of eleveIds) parEleve.set(id, new Set())
  if (eleveIds.length === 0) return { parEleve, incidents }
  try {
    const lignes = await lirePagine<{ eleve_id: string; exercice_id: string }>(
      admin, 'exercices_depots', 'eleve_id, exercice_id, id', ['id'],
      (q) => (q as never as { in: (a: string, b: string[]) => unknown })
        .in('eleve_id', eleveIds as string[]))
    for (const l of lignes) parEleve.get(l.eleve_id)?.add(l.exercice_id)
  } catch (e) {
    incidents.push(`dépôts déjà posés : ${(e as Error).message}`)
  }
  return { parEleve, incidents }
}
