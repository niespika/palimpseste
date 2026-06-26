import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ModuleSceau } from '@/components/Pastille'
import { motifsSante, type SanteInscription } from '@/utils/sante'
import { inscriptionsClasse } from '@/utils/acces'
import {
  livresDeClasse,
  progression,
  chargerDiagnostics,
  diagnosticEnAttente,
  estRendu,
} from '@/app/prof/aletheia/donnees'
import type { TravailAletheia, DiagnosticTravail } from '@/app/eleve/modules/aletheia/types'

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
  { slug: 'fragments-erudition', sceau: 'fragments', nom: 'Fragments' },
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

function celluleFragments(f: FragInsc | undefined): Cellule {
  if (!f || f.nbSemainesPassees === 0) return CELLULE_NEUTRE
  if (f.nbManquants > 0) {
    return { kind: 'action', label: `${f.nbDeposes}/${f.nbSemainesPassees} · ${f.nbManquants} à faire` }
  }
  return { kind: 'ok', label: `${f.nbDeposes}/${f.nbSemainesPassees} · à jour` }
}

function celluleQuazian(due: number): Cellule {
  if (due <= 0) return { kind: 'ok', label: 'à jour' }
  if (due >= SEUIL_REVISION_MATRICE) return { kind: 'action', label: `${due} à réviser` }
  return { kind: 'encours', label: `${due} à réviser` }
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
interface FragInsc { nbSemainesPassees: number; nbDeposes: number; nbManquants: number; moyenne: number | null }
interface AletheiaEleve { done: number; total: number; diagAFaire: boolean }
interface CodexInsc { nbTotal: number; nbAValider: number; nbEnCours: number }

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
    .from('semesters').select('id').eq('is_active', true).maybeSingle()
  let reqSemaines = admin.from('fragments_semaines').select('id, date_limite')
  if (semestreCourant) reqSemaines = reqSemaines.eq('semestre_id', semestreCourant.id)
  const { data: semaines } = await reqSemaines
  const idsPassees = new Set(
    (semaines ?? []).filter((s) => new Date(s.date_limite as string) < maintenant).map((s) => s.id as string),
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

  for (const i of inscriptions) {
    const ds = depotsParInsc.get(i.id) ?? []
    const semainesDeposees = new Set(ds.filter((d) => idsPassees.has(d.semaine_id)).map((d) => d.semaine_id))
    const nbDeposes = semainesDeposees.size
    const nbManquants = Math.max(0, nbSemainesPassees - nbDeposes)
    const notes = ds.map((d) => noteParDepot.get(d.id)).filter((n): n is number => n != null)
    const moyenne = notes.length > 0 ? notes.reduce((x, y) => x + y, 0) / notes.length : null
    out.set(i.id, { nbSemainesPassees, nbDeposes, nbManquants, moyenne })
  }
  return out
}

async function aggregerQuazian(admin: SupabaseClient, eleveIds: string[]): Promise<Map<string, number>> {
  const out = new Map<string, number>()
  if (eleveIds.length === 0) return out
  const maintenant = new Date()
  const { data: cs } = await admin
    .from('quazian_card_states').select('eleve_id, due').in('eleve_id', eleveIds)
  for (const c of cs ?? []) {
    if (c.due && new Date(c.due as string) < maintenant) {
      out.set(c.eleve_id as string, (out.get(c.eleve_id as string) ?? 0) + 1)
    }
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
  const [frag, quazian, aletheia, codex] = await Promise.all([
    aAcces('fragments-erudition') ? aggregerFragments(admin, inscriptions) : Promise.resolve(new Map<string, FragInsc>()),
    aAcces('quazian') ? aggregerQuazian(admin, eleveIds) : Promise.resolve(new Map<string, number>()),
    aAcces('aletheia') ? aggregerAletheia(admin, classeId, eleveIds) : Promise.resolve(new Map<string, AletheiaEleve>()),
    aAcces('codex') ? aggregerCodex(admin, classeId, eleveIds) : Promise.resolve(new Map<string, CodexInsc>()),
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
      backlogRevision: quazian.get(eId) ?? 0,
      enDifficulte: false,
      raisons: [],
    }
    const motifs = motifsSante(santeLike)

    const cellules: Record<string, Cellule> = {}
    for (const col of colonnes) {
      if (!col.accessible) { cellules[col.slug] = CELLULE_ABSENTE; continue }
      switch (col.slug) {
        case 'fragments-erudition': cellules[col.slug] = celluleFragments(f); break
        case 'quazian': cellules[col.slug] = celluleQuazian(quazian.get(eId) ?? 0); break
        case 'aletheia': cellules[col.slug] = celluleAletheia(aletheia.get(eId)); break
        case 'codex': cellules[col.slug] = celluleCodex(codex.get(eId)); break
        // Scriptorium : pas de statut élève défini pour l'instant.
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
