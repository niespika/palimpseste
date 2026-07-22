// Corpus du RAG de cours Scriptorium (SPEC_scriptorium_rag.md §5–§6).
// Ce module accueillera l'assembleur tout-en-contexte (lot L4 : corpusClasse /
// assemblerCorpus). Le lot L3 y pose déjà la RÉSOLUTION DE LA SEMAINE COURANTE
// (§5.2) : elle décide les trois statuts d'un élément d'instance (vu / en cours /
// à venir) et sert autant au pilotage prof (grille « vu », badges, à-faire)
// qu'au futur corpus élève — une seule règle, un seul endroit.
//
// PUR (aucune I/O) : l'aperçu (snapshot publié prioritaire, repli frise) vient de
// construireApercuAssign (utils/parcours-apercu.ts) ; `aujourdHui` est une date
// pure YYYY-MM-DD dans le fuseau prof (utils/fuseau-serveur.ts) — comparaisons
// lexicales, conformes au régime de dates du repo. Ce module est TESTÉ sous
// node --test : il n'importe jamais 'server-only' (le fuseau se résout chez
// l'appelant, qui passe `aujourdHui` à corpusClasse).

import type { SupabaseClient } from '@supabase/supabase-js'
import { construireApercuAssign, memoSocleFrise, type ApercuSemaine, type AssignParcours } from './parcours-apercu'

/**
 * Semaine courante d'une instance de parcours (§5.2, verrouillé) :
 * la DERNIÈRE semaine k (statut 'definie') dont le LUNDI (dateReelle) ≤ aujourdHui.
 *  - aujourd'hui en vacances / gap inter-semestres → la dernière semaine COMMENCÉE
 *    (on ne « désapprend » pas pendant la relâche) ;
 *  - avant la 1re semaine → 0 (tout est « à venir ») ;
 *  - après la dernière → nb_semaines (plus rien d'« à venir ») ;
 *  - aperçu absent (assignation sans date ni snapshot) → null : instance EXCLUE
 *    du corpus (avis prof dans la vue instance).
 * Les semaines 'a_definir' / 'non_planifiable' ne portent pas de date → ignorées.
 */
export function semaineCourante(apercu: ApercuSemaine[] | null, aujourdHui: string): number | null {
  if (!apercu) return null
  let courante = 0
  for (const s of apercu) {
    if (s.statut !== 'definie' || !s.dateReelle) continue
    if (s.dateReelle <= aujourdHui && s.semaine > courante) courante = s.semaine
  }
  return courante
}

// ═════════════════════════════════════════════════════════════════════════════
// L4 — ASSEMBLEUR DE CORPUS (tout-en-contexte, §6). Trois sections dans un ordre
// STABLE ET DÉTERMINISTE (condition du cache fournisseur) :
//   [1] PLAN DU COURS — squelette complet (titres de TOUT, y compris l'à-venir) ;
//   [2] MATIÈRE — texte intégral des seuls éléments VUS et EN COURS, balisés ;
//   [3] LIVRES — fiches (jamais le texte intégral) et carte, séances vues/en cours.
// ANTI-SPOILER STRUCTUREL : l'assembleur ne PUISE le texte d'un élément (ou une
// fiche de séance) QUE si son statut est vu/en-cours — un élément « à venir »
// n'apporte que son TITRE, même si son texte figure dans les données chargées
// (testé par sentinelles, scriptorium-corpus.test.ts). Le préfixe ne dépend que
// des instances/contenus/fiches et de la semaine courante — jamais de l'élève.
// ═════════════════════════════════════════════════════════════════════════════

export type StatutElement = 'vu' | 'en_cours' | 'a_venir'

/** Estimation grossière : ~4 caractères par token (borne de troncature §6.2). */
export const CAR_PAR_TOKEN = 4
export const LIMITE_TOKENS_CORPUS = 150_000

export interface ElementCorpus {
  cle: string
  refType: 'contenu' | 'section' | 'livre_semaine'
  semaine: number                    // semaine d'instance (clampée à nb_semaines)
  tri: [number, number, number]      // (semaine du créneau, ordre du créneau, ordre d'élément) — ordre total stable
  vu: boolean
  groupe: string                     // clé de groupement du plan (créneau porteur)
  groupeLibelle: string              // libellé du groupe (« Cours « La liberté » », « Livre « X » »)
  libellePlan: string                // libellé court dans le plan (titre de section, « séance 3 (chap. 5-9) », …)
  libelleMatiere: string             // en-tête du bloc matière (« Cours « La liberté » — II. Le déterminisme »)
  texte: string | null               // corps (contenu/section) — l'assembleur n'y puise QUE si vu/en-cours
  legendes: string[]                 // légendes d'images du contenu (images ignorées, légendes incluses — v1)
  livreCle?: string                  // livre_semaine : livre porteur (agrégation section [3])
  seance?: number                    // livre_semaine : ordinal de séance d'origine
}

export interface InstanceCorpus {
  parcoursTitre: string
  nbSemaines: number
  semaineCourante: number            // ≥ 0 — les instances NON DATÉES sont exclues en amont (corpusClasse)
  lundis: Record<number, string>     // semaine → libellé de lundi (« lun. 15 sept. ») ; absent si non résolu
  elements: ElementCorpus[]          // triés par (semaine, tri)
}

export interface FicheSeance { seance: number; texte: string }  // fiche déjà formatée (thèse, arguments, …)
export interface LivreCorpus {
  cle: string
  titre: string
  auteur: string | null
  totalSeances: number
  carte: string | null               // carte du livre formatée (si READY), sinon null
  fiches: FicheSeance[]              // TOUTES les fiches READY — l'assembleur filtre par statut
}

export interface StatsCorpus {
  nbElements: { vu: number; enCours: number; aVenir: number }
  tokensEstimes: number
  tronque: boolean
}

function statutDe(e: ElementCorpus, courante: number): StatutElement {
  if (e.vu) return 'vu'
  return e.semaine <= courante ? 'en_cours' : 'a_venir'
}

const cmpTri = (a: [number, number, number], b: [number, number, number]) =>
  a[0] - b[0] || a[1] - b[1] || a[2] - b[2]

/**
 * Assemble le préfixe de corpus d'une classe — PUR, DÉTERMINISTE (mêmes données →
 * même préfixe à l'octet près ; l'ordre des instances et des livres est celui des
 * tableaux fournis, que corpusClasse trie de façon stable). La troncature (§6.2)
 * retire les blocs de matière VUS les plus ANCIENS — jamais le squelette, jamais
 * l'en-cours, jamais les libellés — et lève `stats.tronque`.
 */
export function assemblerCorpus(instances: InstanceCorpus[], livres: LivreCorpus[]): { prefixe: string; stats: StatsCorpus } {
  const stats: StatsCorpus = { nbElements: { vu: 0, enCours: 0, aVenir: 0 }, tokensEstimes: 0, tronque: false }

  // ── [1] PLAN DU COURS ───────────────────────────────────────────────────────
  const plan: string[] = ['PLAN DU COURS']
  for (const inst of instances) {
    plan.push(`## Parcours « ${inst.parcoursTitre} » — semaine courante : ${inst.semaineCourante}/${inst.nbSemaines}`)
    const parSemaine = new Map<number, ElementCorpus[]>()
    for (const e of inst.elements) {
      const s = statutDe(e, inst.semaineCourante)
      if (s === 'vu') stats.nbElements.vu++
      else if (s === 'en_cours') stats.nbElements.enCours++
      else stats.nbElements.aVenir++
      const arr = parSemaine.get(e.semaine) ?? []
      arr.push(e)
      parSemaine.set(e.semaine, arr)
    }
    for (let k = 1; k <= inst.nbSemaines; k++) {
      const els = (parSemaine.get(k) ?? []).sort((a, b) => cmpTri(a.tri, b.tri))
      if (els.length === 0) continue
      // Libellé de ligne : vu si TOUT est vu ; en cours si la semaine est entamée ; à venir sinon.
      const label = els.every(e => e.vu) ? 'vu' : k <= inst.semaineCourante ? 'en cours' : 'à venir'
      // Groupement par créneau : les sections d'un même cours s'affichent « Cours « X » [a · b] ».
      const groupes: string[] = []
      const vusGroupes = new Set<string>()
      for (const e of els) {
        if (vusGroupes.has(e.groupe)) continue
        vusGroupes.add(e.groupe)
        const freres = els.filter(f => f.groupe === e.groupe)
        // Un contenu entier se suffit (« Texte « Apologie » (Platon) ») ; sections et
        // séances de livre portent leur groupe (« Livre « X » [séance 1 (chap. 1-4)] »).
        groupes.push(freres.length === 1 && freres[0].refType === 'contenu'
          ? freres[0].libellePlan
          : `${e.groupeLibelle} [${freres.map(f => f.libellePlan).join(' · ')}]`)
      }
      const lundi = inst.lundis[k] ? ` (${inst.lundis[k]})` : ''
      const marqueCourante = k === inst.semaineCourante ? 'SEMAINE COURANTE, ' : ''
      plan.push(`Semaine ${k}${lundi} — ${marqueCourante}${label} : ${groupes.join(' · ')}`)
    }
  }

  // ── [2] MATIÈRE (vu + en cours, jamais l'à-venir) ───────────────────────────
  interface BlocMatiere { statut: 'vu' | 'en_cours'; ordre: [number, number, number, number, number]; texte: string }
  const blocs: BlocMatiere[] = []
  instances.forEach((inst, i) => {
    for (const e of [...inst.elements].sort((a, b) => a.semaine - b.semaine || cmpTri(a.tri, b.tri))) {
      if (e.refType === 'livre_semaine') continue // la matière des livres = fiches (section [3])
      const s = statutDe(e, inst.semaineCourante)
      if (s === 'a_venir') continue // ← la ligne anti-spoiler : on ne LIT jamais e.texte ici
      const corps = (e.texte ?? '').trim()
      const legendes = e.legendes.map(l => `(Illustration : ${l})`).join('\n')
      if (!corps && !legendes) continue
      blocs.push({
        statut: s,
        ordre: [i, e.semaine, ...e.tri],
        texte: `### Semaine ${e.semaine} — ${e.libelleMatiere} [${s === 'vu' ? 'VU' : 'EN COURS'}]\n${[corps, legendes].filter(Boolean).join('\n')}`,
      })
    }
  })

  // ── [3] LIVRES (fiches + carte — jamais le texte intégral d'un livre) ───────
  // Statut d'une séance = le plus avancé de ses éléments (toutes instances).
  const rang: Record<StatutElement, number> = { a_venir: 0, en_cours: 1, vu: 2 }
  const statutSeance = new Map<string, StatutElement>() // `${livreCle}|${seance}`
  for (const inst of instances) {
    for (const e of inst.elements) {
      if (e.refType !== 'livre_semaine' || !e.livreCle || e.seance == null) continue
      const cle = `${e.livreCle}|${e.seance}`
      const s = statutDe(e, inst.semaineCourante)
      const actuel = statutSeance.get(cle)
      if (!actuel || rang[s] > rang[actuel]) statutSeance.set(cle, s)
    }
  }
  const livresLignes: string[] = []
  for (const l of livres) {
    const vues: number[] = []
    const enCours: number[] = []
    for (const [cle, s] of statutSeance) {
      const [lc, k] = cle.split('|')
      if (lc !== l.cle) continue
      if (s === 'vu') vues.push(Number(k))
      else if (s === 'en_cours') enCours.push(Number(k))
    }
    vues.sort((a, b) => a - b)
    enCours.sort((a, b) => a - b)
    if (vues.length === 0 && enCours.length === 0) continue // rien d'entamé → titres seuls (déjà au plan)
    const prog: string[] = []
    if (vues.length) prog.push(`séances vues : ${vues.join(', ')}`)
    if (enCours.length) prog.push(`en cours : ${enCours.join(', ')}`)
    livresLignes.push(`## Livre « ${l.titre} »${l.auteur ? ` (${l.auteur})` : ''} — lu en classe, ${prog.join(' · ')} / ${l.totalSeances} séances`)
    if (l.carte) livresLignes.push(`Carte du livre : ${l.carte}`)
    for (const f of [...l.fiches].sort((a, b) => a.seance - b.seance)) {
      const s = statutSeance.get(`${l.cle}|${f.seance}`)
      if (s !== 'vu' && s !== 'en_cours') continue // ← fiche d'une séance à venir : JAMAIS
      livresLignes.push(`Fiche séance ${f.seance} : ${f.texte} [${s === 'vu' ? 'VU' : 'EN COURS'}]`)
    }
  }

  // ── Assemblage + troncature par le plus ancien VU (§6.2) ────────────────────
  const assembler = (matiere: BlocMatiere[]) => [
    plan.join('\n'),
    ['MATIÈRE', ...matiere.map(b => b.texte)].join('\n\n'),
    livresLignes.length ? ['LIVRES', ...livresLignes].join('\n') : null,
  ].filter((x): x is string => x != null).join('\n\n')

  const cmpOrdre = (a: number[], b: number[]) => {
    for (let i = 0; i < a.length; i++) { if (a[i] !== b[i]) return a[i] - b[i] }
    return 0
  }
  let matiere = blocs
  let prefixe = assembler(matiere)
  const limite = LIMITE_TOKENS_CORPUS * CAR_PAR_TOKEN
  while (prefixe.length > limite && matiere.some(b => b.statut === 'vu')) {
    // Retire le bloc VU le plus ancien (ordre d'instance, puis semaine, puis tri).
    const plusAncien = matiere
      .filter(b => b.statut === 'vu')
      .reduce((min, b) => (min == null || cmpOrdre(b.ordre, min.ordre) < 0 ? b : min), null as BlocMatiere | null)
    matiere = matiere.filter(b => b !== plusAncien)
    stats.tronque = true
    prefixe = assembler(matiere)
  }

  stats.tokensEstimes = Math.ceil(prefixe.length / CAR_PAR_TOKEN)
  return { prefixe, stats }
}

// ═════════════════════════════════════════════════════════════════════════════
// I/O — chargement du corpus d'une classe (client ADMIN : les tables d'instance
// sont en RLS prof-only ; l'élève n'a AUCUNE policy — première ligne de
// l'anti-spoiler, la lecture passe exclusivement par ici, §4.2). GARDE : ce
// chargeur ne sélectionne JAMAIS scriptorium_documents.texte_extrait (le texte
// intégral d'un livre ne sort pas — seules les fiches et la carte entrent).
// `aujourdHui` = date pure YYYY-MM-DD dans le fuseau prof (l'appelant la résout
// via utils/fuseau-serveur — jamais importé ici, module testé sous node --test).
// ═════════════════════════════════════════════════════════════════════════════

interface FicheBrute {
  semaine: number
  titre?: string | null
  these_canonique?: string | null
  arguments_cles?: string[] | null
  concepts_cles?: string[] | null
  synthese_modele?: string | null
}
interface CarteBrute {
  fil_conducteur?: string | null
  noeuds?: { chapitre?: string | null; idee?: string | null }[] | null
  liens?: { de?: string | null; vers?: string | null; relation?: string | null }[] | null
}

function formaterFiche(f: FicheBrute, chapitres: string | null): string {
  const parts: string[] = []
  if (f.titre) parts.push(`« ${f.titre} »${chapitres ? ` (${chapitres})` : ''}`)
  else if (chapitres) parts.push(`(${chapitres})`)
  if (f.these_canonique) parts.push(`thèse : ${f.these_canonique}`)
  if (f.arguments_cles?.length) parts.push(`arguments : ${f.arguments_cles.join(' ; ')}`)
  if (f.concepts_cles?.length) parts.push(`concepts : ${f.concepts_cles.join(', ')}`)
  if (f.synthese_modele) parts.push(`synthèse : ${f.synthese_modele}`)
  return parts.join(' · ')
}

function formaterCarte(c: CarteBrute): string | null {
  const parts: string[] = []
  if (c.fil_conducteur) parts.push(`fil conducteur : ${c.fil_conducteur}`)
  if (c.noeuds?.length) parts.push(`nœuds : ${c.noeuds.map(n => `${n.chapitre ?? '?'} — ${n.idee ?? ''}`).join(' ; ')}`)
  if (c.liens?.length) parts.push(`liens : ${c.liens.map(l => `${l.de ?? '?'} → ${l.vers ?? '?'} (${l.relation ?? ''})`).join(' ; ')}`)
  return parts.length ? parts.join(' | ') : null
}

const MOIS_CORPUS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
function lundiCorpus(iso: string): string {
  const [, m, d] = iso.split('-').map(Number)
  return m && d ? `lun. ${d} ${MOIS_CORPUS[m - 1] ?? ''}` : iso
}

/**
 * Corpus tout-en-contexte d'une CLASSE (§6.2) : charge les instances actives
 * DATÉES (union multi-parcours, chacune avec sa semaine courante, présentées
 * dans l'ordre des titres), la matière (contenus/sections/légendes) et les
 * livres (fiches READY + carte), puis délègue au cœur pur assemblerCorpus.
 * null si la classe n'a aucune instance active datée (rien à raconter).
 */
export async function corpusClasse(
  admin: SupabaseClient, classeId: string, aujourdHui: string,
): Promise<{ prefixe: string; stats: StatsCorpus } | null> {
  // 1. Assignations ACTIVES de la classe (tolérant si colonnes snapshot absentes).
  let assignData: Record<string, unknown>[] = []
  const withSnap = await admin.from('scriptorium_parcours_classes')
    .select('id, parcours_id, date_debut, horaire_snapshot')
    .eq('classe_id', classeId).eq('statut', 'active')
  if (withSnap.error) {
    const noSnap = await admin.from('scriptorium_parcours_classes')
      .select('id, parcours_id, date_debut').eq('classe_id', classeId).eq('statut', 'active')
    assignData = (noSnap.data ?? []) as Record<string, unknown>[]
  } else {
    assignData = (withSnap.data ?? []) as Record<string, unknown>[]
  }
  if (assignData.length === 0) return null

  const parcoursIds = [...new Set(assignData.map(a => a.parcours_id as string))]
  const { data: parcs } = await admin.from('scriptorium_parcours')
    .select('id, titre, nb_semaines, supprime_at').in('id', parcoursIds)
  const metaParcours = new Map((parcs ?? [])
    .filter(p => (p.supprime_at as string | null) == null)
    .map(p => [p.id as string, { titre: p.titre as string, nb: (p.nb_semaines as number) ?? 0 }]))

  // 2. Résolution des semaines courantes — une instance NON DATÉE est EXCLUE (§5.2).
  const socleDe = memoSocleFrise(admin)
  const brutes: { pcId: string; titre: string; nb: number; courante: number; lundis: Record<number, string> }[] = []
  for (const a of assignData) {
    const meta = metaParcours.get(a.parcours_id as string)
    if (!meta) continue
    const snap = a.horaire_snapshot as ApercuSemaine[] | null | undefined
    const assign: AssignParcours = {
      parcoursId: a.parcours_id as string, nbSemaines: meta.nb,
      dateDebut: (a.date_debut as string | null) ?? null,
      snapshot: snap && Array.isArray(snap) && snap.length ? snap : null,
    }
    const res = await construireApercuAssign(admin, assign, socleDe)
    const courante = semaineCourante(res?.apercu ?? null, aujourdHui)
    if (courante == null) continue
    const lundis: Record<number, string> = {}
    for (const s of res?.apercu ?? []) {
      if (s.statut === 'definie' && s.dateReelle) lundis[s.semaine] = lundiCorpus(s.dateReelle)
    }
    brutes.push({ pcId: a.id as string, titre: meta.titre, nb: meta.nb, courante, lundis })
  }
  if (brutes.length === 0) return null
  // Ordre STABLE (condition du cache) : titre de parcours, puis id d'assignation.
  brutes.sort((x, y) => x.titre.localeCompare(y.titre, 'fr') || x.pcId.localeCompare(y.pcId))

  // 3. Créneaux + éléments des instances retenues.
  const { data: crens } = await admin.from('scriptorium_parcours_classe_creneaux')
    .select('id, parcours_classe_id, semaine, ordre, ref_type, contenu_id, livre_id, titre_affiche')
    .in('parcours_classe_id', brutes.map(b => b.pcId))
  const creneaux = (crens ?? []) as {
    id: string; parcours_classe_id: string; semaine: number; ordre: number
    ref_type: 'contenu' | 'livre'; contenu_id: string | null; livre_id: string | null; titre_affiche: string | null
  }[]
  const { data: els } = creneaux.length
    ? await admin.from('scriptorium_parcours_classe_elements')
        .select('id, creneau_id, ref_type, section_id, livre_semaine, semaine, ordre, vu_at')
        .in('creneau_id', creneaux.map(c => c.id))
    : { data: [] as Record<string, unknown>[] }
  const elements = (els ?? []) as {
    id: string; creneau_id: string; ref_type: 'contenu' | 'section' | 'livre_semaine'
    section_id: string | null; livre_semaine: number | null; semaine: number; ordre: number; vu_at: string | null
  }[]

  // 4. Référentiels de matière. (Les textes sont chargés pour TOUS les éléments —
  // l'exclusion de l'à-venir est du ressort du cœur pur, testée par sentinelles.)
  const contenuIds = [...new Set(creneaux.map(c => c.contenu_id).filter((x): x is string => !!x))]
  const livreIds = [...new Set(creneaux.map(c => c.livre_id).filter((x): x is string => !!x))]
  const sectionIds = [...new Set(elements.map(e => e.section_id).filter((x): x is string => !!x))]
  const [{ data: conts }, { data: secs }, { data: imgs }, { data: livres }, { data: docs }, { data: refs }, { data: cartes }] = await Promise.all([
    contenuIds.length
      ? admin.from('scriptorium_contenus').select('id, titre, auteur, type, texte_extrait').in('id', contenuIds)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    sectionIds.length
      ? admin.from('scriptorium_contenu_sections').select('id, titre, texte').in('id', sectionIds)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    contenuIds.length
      ? admin.from('scriptorium_contenu_images').select('contenu_id, legende, ordre').in('contenu_id', contenuIds).order('ordre', { ascending: true })
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    livreIds.length
      ? admin.from('scriptorium_unites').select('id, label, auteur').in('id', livreIds)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    livreIds.length
      ? admin.from('scriptorium_documents').select('unite_id, semaine, chapitres').in('unite_id', livreIds).not('semaine', 'is', null)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    livreIds.length
      ? admin.from('aletheia_livre_reference').select('scriptorium_livre_id, statut, contenu').in('scriptorium_livre_id', livreIds)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    livreIds.length
      ? admin.from('aletheia_capstone').select('scriptorium_livre_id, statut, contenu').in('scriptorium_livre_id', livreIds)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
  ])
  const contenuMap = new Map((conts ?? []).map(c => [c.id as string, {
    titre: c.titre as string, auteur: (c.auteur as string | null) ?? null,
    type: c.type as string, texte: (c.texte_extrait as string | null) ?? null,
  }]))
  const sectionMap = new Map((secs ?? []).map(s => [s.id as string, { titre: s.titre as string, texte: (s.texte as string | null) ?? null }]))
  const legendesParContenu = new Map<string, string[]>()
  for (const i of imgs ?? []) {
    const l = (i.legende as string | null)?.trim()
    if (!l) continue
    const arr = legendesParContenu.get(i.contenu_id as string) ?? []
    arr.push(l)
    legendesParContenu.set(i.contenu_id as string, arr)
  }
  const livreMap = new Map((livres ?? []).map(l => [l.id as string, { titre: l.label as string, auteur: (l.auteur as string | null) ?? null }]))
  const chapParSeance = new Map<string, string>()
  const seancesParLivre = new Map<string, Set<number>>()
  for (const d of docs ?? []) {
    const lid = d.unite_id as string
    const k = d.semaine as number
    const set = seancesParLivre.get(lid) ?? new Set<number>()
    set.add(k)
    seancesParLivre.set(lid, set)
    const chap = (d.chapitres as string | null)?.trim()
    if (chap) chapParSeance.set(`${lid}|${k}`, chap)
  }

  // 5. Projection en InstanceCorpus (libellés stables, tri total).
  const creneauParId = new Map(creneaux.map(c => [c.id, c]))
  const elementsParPc = new Map<string, ElementCorpus[]>()
  for (const e of elements) {
    const cr = creneauParId.get(e.creneau_id)
    if (!cr) continue
    const nb = brutes.find(b => b.pcId === cr.parcours_classe_id)?.nb ?? 1
    const semaine = Math.min(Math.max(1, e.semaine), Math.max(1, nb))
    const tri: [number, number, number] = [cr.semaine, cr.ordre, e.ordre]
    let ec: ElementCorpus
    if (e.ref_type === 'livre_semaine') {
      const lv = cr.livre_id ? livreMap.get(cr.livre_id) : undefined
      const titreLivre = lv?.titre ?? cr.titre_affiche ?? 'livre retiré'
      const k = e.livre_semaine as number
      const chap = cr.livre_id ? chapParSeance.get(`${cr.livre_id}|${k}`) : undefined
      ec = {
        cle: e.id, refType: 'livre_semaine', semaine, tri, vu: e.vu_at != null,
        groupe: cr.id, groupeLibelle: `Livre « ${titreLivre} »`,
        libellePlan: `séance ${k}${chap ? ` (${chap})` : ''}`,
        libelleMatiere: `Livre « ${titreLivre} » — séance ${k}`,
        texte: null, legendes: [], livreCle: cr.livre_id ?? undefined, seance: k,
      }
    } else {
      const co = cr.contenu_id ? contenuMap.get(cr.contenu_id) : undefined
      const titreContenu = co?.titre ?? cr.titre_affiche ?? 'contenu retiré'
      const libelleContenu = co?.type === 'texte'
        ? `Texte « ${titreContenu} »${co?.auteur ? ` (${co.auteur})` : ''}`
        : `Cours « ${titreContenu} »`
      if (e.ref_type === 'section') {
        const sec = e.section_id ? sectionMap.get(e.section_id) : undefined
        ec = {
          cle: e.id, refType: 'section', semaine, tri, vu: e.vu_at != null,
          groupe: cr.id, groupeLibelle: libelleContenu,
          libellePlan: sec?.titre ?? 'section retirée',
          libelleMatiere: `${libelleContenu} — ${sec?.titre ?? 'section retirée'}`,
          texte: sec?.texte ?? null, legendes: [],
        }
      } else {
        ec = {
          cle: e.id, refType: 'contenu', semaine, tri, vu: e.vu_at != null,
          groupe: cr.id, groupeLibelle: libelleContenu,
          libellePlan: libelleContenu, libelleMatiere: libelleContenu,
          texte: co?.texte ?? null,
          legendes: cr.contenu_id ? (legendesParContenu.get(cr.contenu_id) ?? []) : [],
        }
      }
    }
    const arr = elementsParPc.get(cr.parcours_classe_id) ?? []
    arr.push(ec)
    elementsParPc.set(cr.parcours_classe_id, arr)
  }

  const instances: InstanceCorpus[] = brutes.map(b => ({
    parcoursTitre: b.titre,
    nbSemaines: b.nb,
    semaineCourante: b.courante,
    lundis: b.lundis,
    elements: (elementsParPc.get(b.pcId) ?? []).sort((x, y) => x.semaine - y.semaine || cmpTri(x.tri, y.tri)),
  }))

  // 6. Livres : fiches READY + carte READY, dans un ordre stable (titre, id).
  const ficheParLivre = new Map<string, FicheBrute[]>()
  for (const r of refs ?? []) {
    if ((r.statut as string) !== 'READY') continue
    const contenu = r.contenu as FicheBrute[] | null
    if (Array.isArray(contenu)) ficheParLivre.set(r.scriptorium_livre_id as string, contenu)
  }
  const carteParLivre = new Map<string, string | null>()
  for (const c of cartes ?? []) {
    if ((c.statut as string) !== 'READY') continue
    carteParLivre.set(c.scriptorium_livre_id as string, formaterCarte((c.contenu as CarteBrute | null) ?? {}))
  }
  const livresCorpus: LivreCorpus[] = [...livreMap.entries()]
    .sort((a, b) => a[1].titre.localeCompare(b[1].titre, 'fr') || a[0].localeCompare(b[0]))
    .map(([id, lv]) => ({
      cle: id,
      titre: lv.titre,
      auteur: lv.auteur,
      totalSeances: seancesParLivre.get(id)?.size ?? 0,
      carte: carteParLivre.get(id) ?? null,
      fiches: (ficheParLivre.get(id) ?? [])
        .filter(f => Number.isInteger(f.semaine))
        .map(f => ({ seance: f.semaine, texte: formaterFiche(f, chapParSeance.get(`${id}|${f.semaine}`) ?? null) })),
    }))

  return assemblerCorpus(instances, livresCorpus)
}
