import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ModuleSceau } from '@/components/Pastille'
import { motifsSante, type SanteInscription } from '@/utils/sante'
import { semainesComptees } from '@/utils/fragments-semaines'
import { inscriptionsClasse } from '@/utils/acces'
import {
  livresDeClasse,
  progression,
  chargerDiagnostics,
  diagnosticEnAttente,
  estRendu,
} from '@/app/prof/aletheia/donnees'
import type { TravailAletheia, DiagnosticTravail } from '@/app/eleve/modules/aletheia/types'
import { statutDuTheme, type StatutDuTheme } from '@/utils/fragments-theme'
import { perimetreVuClasses } from '@/utils/quazian-cibles'
import { carteVisible, perimetreVide, type CarteAncree } from '@/utils/quazian-visibilite'
import { lireLaPorte } from '@/utils/deroule/acces'
import { lundiDuCycle } from '@/utils/deroule/echeance'
import { toISODate } from '@/utils/calendrier-grille'
import { visibleDansLaClasse } from '@/utils/codex-onglets/regles'
import { FUSEAU_DEFAUT } from '@/utils/fuseau'

// ----------------------------------------------------------------------------
// Matrice « Pilotage Classe » — élèves × modules. Agrégation PAR CLASSE de l'état
// de chaque élève dans chaque module, indépendante du gating fragments de
// `calculerSante` (qui est global et ne couvre que les classes ayant Fragments).
// On RÉUTILISE la logique métier existante : seuils/motifs « à risque »
// (utils/sante), progression + diagnostic Aletheia (app/prof/aletheia/donnees).
// Lecture via le client admin, comme le reste de l'espace prof.
// ----------------------------------------------------------------------------

// Colonnes affichées (ordre + sceau + libellé). On affiche toujours les 5 mondes :
// une colonne non donnée à la classe est rendue grisée (« non activé »).
export const MODULES_PILOTAGE: { slug: string; sceau: ModuleSceau; nom: string }[] = [
  { slug: 'quazian', sceau: 'quazian', nom: 'Quazian' },
  { slug: 'aletheia', sceau: 'aletheia', nom: 'Aletheia' },
  // ⭐ « Vestigia » est le nom d'écran du module depuis le 03/09 (`utils/nom-module.ts`) ;
  //    le slug, le sceau et les tables `fragments_*` ne bougent pas.
  { slug: 'fragments-erudition', sceau: 'fragments', nom: 'Vestigia' },
  { slug: 'codex', sceau: 'codex', nom: 'Codex' },
  { slug: 'scriptorium', sceau: 'scriptorium', nom: 'Scriptorium' },
]

// Seuil d'« action » du backlog de révision dans la matrice (chip rouge). Plus bas
// que le seuil « à risque » de la santé (15) : ici on signale visuellement un
// retard de révision avant qu'il ne fasse basculer l'élève « à risque ».
export const SEUIL_REVISION_MATRICE = 10

export type KindCellule = 'action' | 'encours' | 'ok' | 'neutre' | 'absent'
export interface Cellule {
  kind: KindCellule
  label: string
  /**
   * Une seconde ligne, discrète, sous le libellé : le total du paquet Quazian,
   * l'état du thème Vestigia. Facultative — la plupart des cellules n'en ont pas.
   */
  detail?: string
}

export interface ColonneModule {
  slug: string
  sceau: ModuleSceau
  nom: string
  accessible: boolean
}

export interface RowPilotage {
  eleveId: string
  inscriptionId: string
  nom: string
  enDifficulte: boolean
  raisons: string[]
  cellules: Record<string, Cellule>
}

export interface ModuleDb { id: string; description: string | null }

export interface MatricePilotage {
  colonnes: ColonneModule[]
  lignes: RowPilotage[]
  nbARisque: number
  /** Infos DB par slug de module (id + description) — évite une 2ᵉ requête côté page. */
  modulesDb: Record<string, ModuleDb>
}

const CELLULE_ABSENTE: Cellule = { kind: 'absent', label: '—' }
const CELLULE_NEUTRE: Cellule = { kind: 'neutre', label: '—' }

// ── Constructeurs de cellule par module ─────────────────────────────────────

// Ce que la cellule Vestigia dit du THÈME du semestre (règle : `utils/fragments-theme.ts`).
// Mesuré en prod le 05/09 sur la classe regardée : 2 thèmes sur 24 inscrits, tous deux validés.
const LIBELLE_THEME: Record<StatutDuTheme, string> = {
  vide: 'sans thème',
  a_valider: 'thème à valider',
  valide: 'thème validé',
  pose_par_le_prof: 'thème défini',
  commente: 'thème commenté',
}

function celluleFragments(f: FragInsc | undefined): Cellule {
  const theme = f?.theme ?? 'vide'
  const detail = LIBELLE_THEME[theme]
  // Aucune semaine échue : la cellule ne porte que le thème — et « à valider »
  // est un geste du professeur, donc une action, comme « à valider » en Codex.
  if (!f || f.nbSemainesPassees === 0) {
    if (theme === 'a_valider') return { kind: 'action', label: detail }
    if (theme === 'valide' || theme === 'pose_par_le_prof') return { kind: 'ok', label: detail }
    return { kind: 'neutre', label: detail }
  }
  if (f.nbManquants > 0) {
    return { kind: 'action', label: `${f.nbDeposes}/${f.nbSemainesPassees} · ${f.nbManquants} à faire`, detail }
  }
  if (theme === 'a_valider') return { kind: 'action', label: detail, detail: `${f.nbDeposes}/${f.nbSemainesPassees} déposés` }
  return { kind: 'ok', label: `${f.nbDeposes}/${f.nbSemainesPassees} · à jour`, detail }
}

function celluleQuazian(q: QuazianEleve | undefined): Cellule {
  const due = q?.due ?? 0
  // « vues / total » : les cartes que l'élève a déjà rencontrées (un état FSRS
  // existe) sur les cartes que sa classe lui ouvre. Mesuré en prod le 05/09 :
  // 5 élèves sur 24 ont des états, 13 chacun, pour 94 cartes partagées valides.
  const detail = q && q.total > 0 ? `${q.vues}/${q.total} cartes vues` : undefined
  if (!q || q.total === 0) return CELLULE_NEUTRE
  // Jamais ouvert : « à jour » mentirait (0 due parce que 0 vue). Vu en bac à
  // sable le 05/09 : 6 élèves sur 7 auraient lu « à jour · 0/63 cartes vues ».
  if (q.vues === 0) return { kind: 'neutre', label: `0/${q.total} cartes vues` }
  if (due <= 0) return { kind: 'ok', label: 'à jour', detail }
  if (due >= SEUIL_REVISION_MATRICE) return { kind: 'action', label: `${due} à réviser`, detail }
  return { kind: 'encours', label: `${due} à réviser`, detail }
}

// Scriptorium : les exercices MAISON de la semaine en cours (cycle lundi → dimanche
// dans le fuseau de l'école, rattachés par `assigne_at` comme la frise de l'élève).
// Mesuré en prod le 05/09 : 8 à 12 dépôts par élève, assignés le 31/08, 23 servis sur 24.
function celluleScriptorium(s: ScriptoriumEleve | undefined): Cellule {
  if (!s || s.total === 0) return CELLULE_NEUTRE
  const label = `${s.faits}/${s.total} faits`
  if (s.faits >= s.total) return { kind: 'ok', label }
  if (s.faits === 0) return { kind: 'action', label }
  return { kind: 'encours', label }
}

function celluleAletheia(a: AletheiaEleve | undefined): Cellule {
  if (!a || a.total === 0) return CELLULE_NEUTRE
  if (a.diagAFaire) return { kind: 'action', label: 'diagnostic à faire' }
  // Lecture terminée → état « à jour » (vert), comme les autres modules.
  if (a.done >= a.total) return { kind: 'ok', label: `lecture ${a.done}/${a.total}` }
  return { kind: 'encours', label: `lecture ${a.done}/${a.total}` }
}

function celluleCodex(c: CodexInsc | undefined): Cellule {
  if (!c || c.nbTotal === 0) return CELLULE_NEUTRE
  if (c.nbAValider > 0) return { kind: 'action', label: `${c.nbAValider} à valider` }
  if (c.nbEnCours > 0) return { kind: 'encours', label: `${c.nbEnCours} en cours` }
  return { kind: 'ok', label: 'à jour' }
}

// ── Types internes d'agrégat ────────────────────────────────────────────────
interface FragInsc {
  nbSemainesPassees: number; nbDeposes: number; nbManquants: number; moyenne: number | null
  /** L'état du thème du semestre courant (C8) — `vide` quand aucune ligne n'existe. */
  theme: StatutDuTheme
}
interface AletheiaEleve { done: number; total: number; diagAFaire: boolean }
interface CodexInsc { nbTotal: number; nbAValider: number; nbEnCours: number }
/** `due` = cartes en retard de révision ; `vues` = cartes ayant un état FSRS ; `total` = paquet ouvert à l'élève. */
interface QuazianEleve { due: number; vues: number; total: number }
/** Exercices maison de la semaine en cours : `faits` = rendus (V1 partie, ou plus) ; `total` = imposés (hors bonus). */
interface ScriptoriumEleve { faits: number; total: number }

// ── Agrégats par module (uniquement si le module est accessible à la classe) ──

async function aggregerFragments(
  admin: SupabaseClient,
  inscriptions: { id: string }[],
): Promise<Map<string, FragInsc>> {
  const out = new Map<string, FragInsc>()
  const inscIds = inscriptions.map((i) => i.id)
  if (inscIds.length === 0) return out

  const maintenant = new Date()
  const { data: semestreCourant } = await admin
    .from('semesters').select('id, fragments_premiere_semaine').eq('is_active', true).maybeSingle()
  let reqSemaines = admin.from('fragments_semaines').select('id, date_limite, numero, is_vacation')
  if (semestreCourant) reqSemaines = reqSemaines.eq('semestre_id', semestreCourant.id)
  const { data: semaines } = await reqSemaines
  // C8-L4 — même règle qu'à `utils/sante.ts`, et pour la même raison : la matrice
  // de pilotage affiche « déposés / semaines échues ». Ni les vacances ni les
  // semaines d'avant le seuil du semestre n'ont été réclamées à l'élève.
  const idsPassees = new Set(
    semainesComptees(semaines ?? [], semestreCourant?.fragments_premiere_semaine ?? 1)
      .filter((s) => new Date(s.date_limite as string) < maintenant)
      .map((s) => s.id as string),
  )
  const nbSemainesPassees = idsPassees.size

  const { data: depots } = await admin
    .from('fragments_depots').select('id, inscription_id, semaine_id').in('inscription_id', inscIds)
  const depotsParInsc = new Map<string, { id: string; semaine_id: string }[]>()
  for (const d of depots ?? []) {
    const arr = depotsParInsc.get(d.inscription_id as string) ?? []
    arr.push({ id: d.id as string, semaine_id: d.semaine_id as string })
    depotsParInsc.set(d.inscription_id as string, arr)
  }

  const depotIds = (depots ?? []).map((d) => d.id as string)
  const { data: analyses } = depotIds.length > 0
    ? await admin.from('fragments_analyses')
        .select('depot_id, note_decouvertes, note_sources, note_reflexions')
        .eq('statut', 'publiee').in('depot_id', depotIds)
    : { data: [] }
  const noteParDepot = new Map<string, number>()
  for (const a of analyses ?? []) {
    const d = a.note_decouvertes as number | null
    const s = a.note_sources as number | null
    const r = a.note_reflexions as number | null
    if (d != null && s != null && r != null) noteParDepot.set(a.depot_id as string, (d + s + r) / 3)
  }

  // C8 — le thème du semestre, une ligne par inscription (`fragments_themes`),
  // lu avec la même règle que l'écran élève et la page Suivi (`statutDuTheme`).
  // ⚠️ Sans semestre actif, aucune ligne ne se lit : le thème reste `vide`.
  const themeParInsc = new Map<string, StatutDuTheme>()
  if (semestreCourant) {
    const { data: themes } = await admin
      .from('fragments_themes')
      .select('inscription_id, theme, propose_at, valide_at, commentaire_prof, commente_at')
      .in('inscription_id', inscIds).eq('semestre_id', semestreCourant.id)
    for (const t of themes ?? []) {
      themeParInsc.set(t.inscription_id as string, statutDuTheme({
        theme: t.theme as string | null,
        propose_at: t.propose_at as string | null,
        valide_at: t.valide_at as string | null,
        commentaire_prof: t.commentaire_prof as string | null,
        commente_at: t.commente_at as string | null,
      }))
    }
  }

  for (const i of inscriptions) {
    const ds = depotsParInsc.get(i.id) ?? []
    const semainesDeposees = new Set(ds.filter((d) => idsPassees.has(d.semaine_id)).map((d) => d.semaine_id))
    const nbDeposes = semainesDeposees.size
    const nbManquants = Math.max(0, nbSemainesPassees - nbDeposes)
    const notes = ds.map((d) => noteParDepot.get(d.id)).filter((n): n is number => n != null)
    const moyenne = notes.length > 0 ? notes.reduce((x, y) => x + y, 0) / notes.length : null
    out.set(i.id, { nbSemainesPassees, nbDeposes, nbManquants, moyenne, theme: themeParInsc.get(i.id) ?? 'vide' })
  }
  return out
}

/**
 * Le PAQUET d'un élève de cette classe : les cartes partagées que le « vu » de la
 * classe lui ouvre (`utils/quazian-visibilite.ts`, la même règle que la file de
 * révision de l'élève, bras contenu ET bras hérité) + ses cartes personnelles.
 * Le périmètre est celui de LA classe regardée — « dans les modules on reste par
 * classe » — donc un bi-classe peut voir ici moins que dans sa file.
 */
async function paquetQuazian(
  admin: SupabaseClient, classeId: string, eleveIds: string[],
): Promise<{ partagees: number; persoParEleve: Map<string, number> }> {
  const perimetre = { ...perimetreVide(), ...(await perimetreVuClasses(admin, [classeId])) }
  // Bras hérité — publications d'unités et tuples (unité, semaine) de la classe.
  // Aucune unité en base au 05/09, mais la règle les lit encore : on la copie.
  const { data: publis } = await admin
    .from('quazian_publications').select('scriptorium_unite_id')
    .eq('flashcards_visibles', true).not('scriptorium_unite_id', 'is', null)
  perimetre.unitesPubliees = (publis ?? [])
    .map((p) => p.scriptorium_unite_id as string | null).filter((v): v is string => !!v)
  if (perimetre.unitesPubliees.length > 0) {
    const { data: liens } = await admin
      .from('scriptorium_document_classes').select('document_id').eq('classe_id', classeId)
    const docIds = [...new Set((liens ?? []).map((l) => l.document_id as string))]
    if (docIds.length > 0) {
      const { data: documents } = await admin
        .from('scriptorium_documents').select('unite_id, semaine').in('id', docIds).not('semaine', 'is', null)
      for (const d of documents ?? []) perimetre.tuplesVisibles.add(`${d.unite_id}:${d.semaine}`)
    }
  }

  const select = 'id, eleve_id, contenu_id, section_id, scriptorium_unite_id, semaine'
  // ⚠️ Même repli que `lireCartes` (module Quazian élève) : si `section_id` n'existe
  //    pas encore, on relit sans elle plutôt que de rendre zéro carte.
  type Carte = CarteAncree & { eleve_id: string | null }
  const lire = async (s: string): Promise<Carte[] | null> => {
    const { data, error } = await admin.from('quazian_flashcards').select(s).eq('statut', 'valide')
    return error ? null : ((data ?? []) as unknown as Carte[])
  }
  const cartes = (await lire(select)) ?? (await lire(select.replace('section_id, ', ''))) ?? []
  let partagees = 0
  const persoParEleve = new Map<string, number>()
  const eleves = new Set(eleveIds)
  for (const c of cartes) {
    if (c.eleve_id == null) { if (carteVisible(c, perimetre)) partagees++; continue }
    if (eleves.has(c.eleve_id)) persoParEleve.set(c.eleve_id, (persoParEleve.get(c.eleve_id) ?? 0) + 1)
  }
  return { partagees, persoParEleve }
}

async function aggregerQuazian(
  admin: SupabaseClient, classeId: string, eleveIds: string[],
): Promise<Map<string, QuazianEleve>> {
  const out = new Map<string, QuazianEleve>()
  if (eleveIds.length === 0) return out
  const maintenant = new Date()
  const [{ data: cs }, paquet] = await Promise.all([
    admin.from('quazian_card_states').select('eleve_id, due').in('eleve_id', eleveIds),
    paquetQuazian(admin, classeId, eleveIds),
  ])
  for (const e of eleveIds) {
    out.set(e, { due: 0, vues: 0, total: paquet.partagees + (paquet.persoParEleve.get(e) ?? 0) })
  }
  for (const c of cs ?? []) {
    const e = out.get(c.eleve_id as string)
    if (!e) continue
    // Un état existe dès la première rencontre de la carte : c'est « vue ».
    e.vues++
    if (c.due && new Date(c.due as string) < maintenant) e.due++
  }
  return out
}

/**
 * Scriptorium — la semaine en cours de chaque élève, vue du professeur.
 * Le même ensemble que la frise de « Ma semaine » (`utils/eleve/semaine-serveur.ts`) :
 * dépôts MAISON non retirés, rattachés au cycle par `assigne_at` dans le fuseau de
 * l'école, bornés à la classe regardée, bonus comptés À PART (ici : pas comptés).
 * ⚠️ « Fait » diverge volontairement de la frise de l'élève : pour le professeur,
 *    un exercice RENDU est fait, même si le retour n'est pas encore lu ; et un
 *    exercice `non_fait` ou `abandonne` reste au dénominateur sans monter au
 *    numérateur. UNE requête pour toute la classe (225 lignes mesurées le 05/09).
 */
const STATUTS_RENDUS = new Set(['v1_remis', 'retour_publie', 'vf_remis', 'clos'])
async function aggregerScriptorium(
  admin: SupabaseClient, classeId: string, eleveIds: string[], fuseau: string,
): Promise<Map<string, ScriptoriumEleve>> {
  const out = new Map<string, ScriptoriumEleve>()
  if (eleveIds.length === 0) return out
  // ⛔ La porte se lit ICI, comme partout : porte fermée, cellule neutre.
  if (!(await lireLaPorte(admin)).exercicesActifs) return out

  const cycleLundi = toISODate(lundiDuCycle(new Date(), fuseau))
  // Borne large (le lundi moins un jour, en UTC) puis filtre exact au fuseau : un
  // `assigne_at` du dimanche soir à Paris est un lundi en UTC, et inversement.
  const borne = new Date(`${cycleLundi}T00:00:00Z`)
  borne.setUTCDate(borne.getUTCDate() - 1)
  const { data, error } = await admin
    .from('exercices_depots')
    .select('eleve_id, statut, assigne_at, routeur_decisions(bonus), exercices!inner(lieu, classe_id)')
    .in('eleve_id', eleveIds).neq('statut', 'retire').eq('exercices.lieu', 'maison')
    .gte('assigne_at', borne.toISOString())
  if (error) {
    console.error(`[matrice-pilotage] exercices maison illisibles — ${error.code} ${error.message}`)
    return out
  }
  for (const e of eleveIds) out.set(e, { faits: 0, total: 0 })
  for (const d of data ?? []) {
    if (!d.assigne_at || toISODate(lundiDuCycle(new Date(d.assigne_at as string), fuseau)) !== cycleLundi) continue
    const ex = (Array.isArray(d.exercices) ? d.exercices[0] : d.exercices) as { classe_id: string | null } | null
    if (!visibleDansLaClasse(ex?.classe_id ?? null, classeId)) continue
    const rd = (Array.isArray(d.routeur_decisions) ? d.routeur_decisions[0] : d.routeur_decisions) as { bonus?: boolean } | null
    if (rd?.bonus === true) continue
    const s = out.get(d.eleve_id as string)
    if (!s) continue
    s.total++
    if (STATUTS_RENDUS.has(d.statut as string)) s.faits++
  }
  return out
}

async function aggregerAletheia(
  admin: SupabaseClient,
  classeId: string,
  eleveIds: string[],
): Promise<Map<string, AletheiaEleve>> {
  const out = new Map<string, AletheiaEleve>()
  if (eleveIds.length === 0) return out
  const livres = (await livresDeClasse(admin, classeId)).filter((l) => l.semaines.length > 0)
  if (livres.length === 0) return out
  const livreIds = livres.map((l) => l.id)

  // Tous les travaux de tous les livres de la classe, en une requête.
  const { data: tousTravaux } = await admin.from('aletheia_travaux').select('*')
    .in('scriptorium_livre_id', livreIds).in('eleve_id', eleveIds)
  const parLivreEleve = new Map<string, Map<string, Map<number, TravailAletheia>>>()
  for (const t of (tousTravaux ?? []) as TravailAletheia[]) {
    const parEleve = parLivreEleve.get(t.scriptorium_livre_id) ?? new Map<string, Map<number, TravailAletheia>>()
    const parSem = parEleve.get(t.eleve_id) ?? new Map<number, TravailAletheia>()
    parSem.set(t.semaine_index, t)
    parEleve.set(t.eleve_id, parSem)
    parLivreEleve.set(t.scriptorium_livre_id, parEleve)
  }
  const diagParLivre = new Map<string, Map<string, Map<number, DiagnosticTravail>>>()
  await Promise.all(livres.map(async (l) => { diagParLivre.set(l.id, await chargerDiagnostics(admin, eleveIds, l.id)) }))

  // Agrégation à TRAVERS tous les livres de la classe (une classe peut en avoir plusieurs).
  for (const eId of eleveIds) out.set(eId, { done: 0, total: 0, diagAFaire: false })
  for (const livre of livres) {
    const travauxEleves = parLivreEleve.get(livre.id) ?? new Map<string, Map<number, TravailAletheia>>()
    const diagEleves = diagParLivre.get(livre.id) ?? new Map<string, Map<number, DiagnosticTravail>>()
    for (const eId of eleveIds) {
      const travaux = travauxEleves.get(eId) ?? new Map<number, TravailAletheia>()
      const prog = progression(livre.semaines, travaux)
      const acc = out.get(eId)!
      acc.done += prog.done
      acc.total += prog.total
      const diagSem = diagEleves.get(eId)
      for (const [sem, t] of travaux) {
        if (estRendu(t) && diagnosticEnAttente(t, diagSem?.get(sem))) { acc.diagAFaire = true; break }
      }
    }
  }
  return out
}

// Codex est scopé par (élève × session), PAS par inscription : `codex_travaux.
// inscription_id` n'est jamais peuplé (cf. utils/effacement). On relie donc via
// les sessions de la classe + l'eleve_id. Résultat indexé par eleve_id.
async function aggregerCodex(
  admin: SupabaseClient,
  classeId: string,
  eleveIds: string[],
): Promise<Map<string, CodexInsc>> {
  const out = new Map<string, CodexInsc>()
  if (eleveIds.length === 0) return out
  for (const e of eleveIds) out.set(e, { nbTotal: 0, nbAValider: 0, nbEnCours: 0 })
  const { data: sessions } = await admin
    .from('codex_sessions').select('id').eq('classe_id', classeId)
  const sessionIds = (sessions ?? []).map((s) => s.id as string)
  if (sessionIds.length === 0) return out
  const { data: travaux } = await admin
    .from('codex_travaux')
    .select('eleve_id, analyse_vf_statut, statut_validation')
    .in('session_id', sessionIds).in('eleve_id', eleveIds)
  for (const t of travaux ?? []) {
    const e = out.get(t.eleve_id as string)
    if (!e) continue
    e.nbTotal++
    if (t.statut_validation === 'valide') continue // terminé
    if (t.analyse_vf_statut === 'prete') e.nbAValider++ // VF prête → action prof
    else e.nbEnCours++
  }
  return out
}

// ── Point d'entrée ──────────────────────────────────────────────────────────
export async function chargerMatricePilotage(
  admin: SupabaseClient,
  classeId: string,
  /** Le fuseau de l'école — la semaine Scriptorium se coupe au lundi DANS ce fuseau. */
  fuseau: string = FUSEAU_DEFAUT,
): Promise<MatricePilotage> {
  // 1. Inscriptions + noms.
  const inscriptions = await inscriptionsClasse(admin, classeId)
  const eleveIds = [...new Set(inscriptions.map((i) => i.eleve_id))]
  const { data: profils } = eleveIds.length > 0
    ? await admin.from('profiles').select('id, display_name').in('id', eleveIds)
    : { data: [] }
  const nomParEleve = new Map((profils ?? []).map((p) => [p.id as string, p.display_name as string]))

  // 2. Modules accessibles à la classe.
  const { data: modulesRows } = await admin.from('modules').select('id, slug, description')
  const slugParId = new Map((modulesRows ?? []).map((m) => [m.id as string, m.slug as string]))
  const modulesDb: Record<string, ModuleDb> = {}
  for (const m of modulesRows ?? []) {
    modulesDb[m.slug as string] = { id: m.id as string, description: (m.description as string | null) ?? null }
  }
  const { data: cm } = await admin
    .from('classe_modules').select('module_id').eq('classe_id', classeId)
  const slugsAccessibles = new Set(
    (cm ?? []).map((r) => slugParId.get(r.module_id as string)).filter((s): s is string => !!s),
  )
  const colonnes: ColonneModule[] = MODULES_PILOTAGE.map((m) => ({
    slug: m.slug, sceau: m.sceau, nom: m.nom, accessible: slugsAccessibles.has(m.slug),
  }))
  const aAcces = (slug: string) => slugsAccessibles.has(slug)

  // 3. Agrégats par module (en parallèle ; seuls les modules accessibles requêtent).
  const [frag, quazian, aletheia, codex, scriptorium] = await Promise.all([
    aAcces('fragments-erudition') ? aggregerFragments(admin, inscriptions) : Promise.resolve(new Map<string, FragInsc>()),
    aAcces('quazian') ? aggregerQuazian(admin, classeId, eleveIds) : Promise.resolve(new Map<string, QuazianEleve>()),
    aAcces('aletheia') ? aggregerAletheia(admin, classeId, eleveIds) : Promise.resolve(new Map<string, AletheiaEleve>()),
    aAcces('codex') ? aggregerCodex(admin, classeId, eleveIds) : Promise.resolve(new Map<string, CodexInsc>()),
    aAcces('scriptorium') ? aggregerScriptorium(admin, classeId, eleveIds, fuseau) : Promise.resolve(new Map<string, ScriptoriumEleve>()),
  ])

  // 4. Lignes + « à risque » (seuils/motifs santé sur les nombres calculés ici).
  const lignes: RowPilotage[] = inscriptions.map((i) => {
    const eId = i.eleve_id
    const f = frag.get(i.id)
    const santeLike: SanteInscription = {
      inscriptionId: i.id, eleveId: eId, classeId,
      nbSemainesPassees: f?.nbSemainesPassees ?? 0,
      nbDeposes: f?.nbDeposes ?? 0,
      nbManquants: f?.nbManquants ?? 0,
      nbEnRetard: 0,
      moyenne: f?.moyenne ?? null,
      backlogRevision: quazian.get(eId)?.due ?? 0,
      enDifficulte: false,
      raisons: [],
    }
    const motifs = motifsSante(santeLike)

    const cellules: Record<string, Cellule> = {}
    for (const col of colonnes) {
      if (!col.accessible) { cellules[col.slug] = CELLULE_ABSENTE; continue }
      switch (col.slug) {
        case 'fragments-erudition': cellules[col.slug] = celluleFragments(f); break
        case 'quazian': cellules[col.slug] = celluleQuazian(quazian.get(eId)); break
        case 'aletheia': cellules[col.slug] = celluleAletheia(aletheia.get(eId)); break
        case 'codex': cellules[col.slug] = celluleCodex(codex.get(eId)); break
        case 'scriptorium': cellules[col.slug] = celluleScriptorium(scriptorium.get(eId)); break
        default: cellules[col.slug] = CELLULE_NEUTRE
      }
    }

    return {
      eleveId: eId,
      inscriptionId: i.id,
      nom: nomParEleve.get(eId) ?? '—',
      enDifficulte: motifs.length > 0,
      raisons: motifs.map((m) => m.label),
      cellules,
    }
  })

  return { colonnes, lignes, nbARisque: lignes.filter((l) => l.enDifficulte).length, modulesDb }
}

// Tri des lignes (appliqué côté serveur). `risque` = à risque d'abord puis nom.
export type TriPilotage = 'risque' | 'nom'
export function trierLignes(lignes: RowPilotage[], tri: TriPilotage): RowPilotage[] {
  const parNom = (a: RowPilotage, b: RowPilotage) => a.nom.localeCompare(b.nom, 'fr')
  if (tri === 'nom') return [...lignes].sort(parNom)
  return [...lignes].sort((a, b) => Number(b.enDifficulte) - Number(a.enDifficulte) || parNom(a, b))
}
