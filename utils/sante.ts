import type { SupabaseClient } from '@supabase/supabase-js'
import { semainesComptees } from './fragments-semaines'
import { noteVersLettre } from './notation'
import { lancer } from '@/utils/lancer'

// ----------------------------------------------------------------------------
// Santé des élèves pour le tableau de bord (Lot 3). Calcul PAR INSCRIPTION
// (élève × classe) : un élève bi-classe peut être à risque dans une classe et à
// jour dans l'autre.
//
// ⚙️  SEUILS AJUSTABLES — un seul endroit. Modifier ces valeurs suffit à recalibrer
//    tout le dashboard (à affiner selon les résultats réels des élèves).
// ----------------------------------------------------------------------------
export const SEUILS_SANTE = {
  /** « en difficulté » si au moins ce nombre de dépôts (semaines passées) manquent. */
  depotsManquants: 2,
  /** … ou si la moyenne des sections (échelle canonique /4) est strictement sous ce seuil. */
  moyenneSous: 2,
  /** … ou s'il y a STRICTEMENT plus que ce nombre de cartes en retard de révision. */
  revisionEnRetard: 15,
}

export interface SanteInscription {
  inscriptionId: string
  eleveId: string
  classeId: string
  nbSemainesPassees: number
  nbDeposes: number
  nbManquants: number
  nbEnRetard: number
  moyenne: number | null // canonique /4 (affichage en lettres = Lot 5.6)
  backlogRevision: number
  enDifficulte: boolean
  raisons: string[]
}

// ----------------------------------------------------------------------------
// Motifs « à risque » TYPÉS — source unique pour colorer la raison partout
// (page à-risque, encart Signaux de la fiche élève). Chaque signal porte son
// type → une puce/chip de la couleur d'état correspondante.
// ----------------------------------------------------------------------------
export type TypeSignal = 'fragment' | 'moyenne' | 'revision'
export interface MotifSante {
  type: TypeSignal
  label: string
}

/** Jeton de couleur d'une chip par type de signal (jetons charte). */
export const COULEUR_SIGNAL: Record<TypeSignal, string> = {
  fragment: 'bg-retard-teinte text-retard',
  moyenne: 'bg-attention-teinte text-attention',
  revision: 'bg-info-teinte text-info',
}

/** Raisons structurées (lettres, pas de /4) à partir des seuils. */
export function motifsSante(s: SanteInscription): MotifSante[] {
  const m: MotifSante[] = []
  if (s.nbManquants >= SEUILS_SANTE.depotsManquants) {
    m.push({ type: 'fragment', label: `${s.nbManquants} fragment${s.nbManquants > 1 ? 's' : ''} manquant${s.nbManquants > 1 ? 's' : ''}` })
  }
  if (s.moyenne != null && s.moyenne < SEUILS_SANTE.moyenneSous) {
    m.push({ type: 'moyenne', label: `moyenne ${noteVersLettre(s.moyenne)} (sous seuil)` })
  }
  if (s.backlogRevision > SEUILS_SANTE.revisionEnRetard) {
    m.push({ type: 'revision', label: `${s.backlogRevision} cartes en retard` })
  }
  return m
}

/**
 * Santé par inscription, pour les inscriptions actives sur des classes ayant le
 * module fragments (signal pédagogique principal). Le backlog de révision n'est
 * compté que pour les classes ayant aussi Quazian.
 */
export async function calculerSante(admin: SupabaseClient): Promise<Map<string, SanteInscription>> {
  const resultat = new Map<string, SanteInscription>()

  // ⭐ 18/09 — LES LECTURES INDÉPENDANTES PARTENT ENSEMBLE (patron `utils/lancer.ts`).
  //    Ce calcul enchaînait huit lectures en série, et il sert trois écrans
  //    (accueil, « À risque », fiche élève). Les quatre premières ne dépendent de
  //    rien ; chacune est attendue à sa place d'avant, avec les mêmes sorties.
  const modulesQ = lancer(admin
    .from('modules').select('id, slug').in('slug', ['fragments-erudition', 'quazian']))
  const cmQ = lancer(admin.from('classe_modules').select('classe_id, module_id'))
  const inscriptionsQ = lancer(admin
    .from('inscriptions').select('id, eleve_id, classe_id').eq('statut', 'active'))
  const semestreQ = lancer(admin
    .from('semesters').select('id, fragments_premiere_semaine').eq('is_active', true).maybeSingle())

  const { data: modules } = await modulesQ
  const moduleFragments = modules?.find((m) => m.slug === 'fragments-erudition')?.id
  const moduleQuazian = modules?.find((m) => m.slug === 'quazian')?.id
  if (!moduleFragments) return resultat

  const { data: cm } = await cmQ
  const classesFragments = new Set((cm ?? []).filter((r) => r.module_id === moduleFragments).map((r) => r.classe_id))
  const classesQuazian = new Set((cm ?? []).filter((r) => r.module_id === moduleQuazian).map((r) => r.classe_id))

  const { data: inscriptions } = await inscriptionsQ
  const inscFragments = (inscriptions ?? []).filter((i) => classesFragments.has(i.classe_id))
  if (inscFragments.length === 0) return resultat
  const inscIds = inscFragments.map((i) => i.id as string)

  // Les dépôts ne dépendent que des inscriptions : ils partent avant les semaines.
  const depotsQ = lancer(admin
    .from('fragments_depots').select('id, inscription_id, semaine_id, statut').in('inscription_id', inscIds))
  // Le retard de révision ne dépend que des inscriptions et des modules : il part ici aussi.
  const eleveIdsQuazian = [...new Set(
    inscFragments.filter((i) => classesQuazian.has(i.classe_id)).map((i) => i.eleve_id as string)
  )]
  const cardStatesQ = moduleQuazian && eleveIdsQuazian.length > 0
    ? lancer(admin.from('quazian_card_states').select('eleve_id, due').in('eleve_id', eleveIdsQuazian))
    : null

  // Semaines passées (date limite dépassée) — scopées au semestre courant, sinon les
  // semaines des semestres précédents comptent à tort comme « dépôts manquants ».
  const maintenant = new Date()
  const { data: semestreCourant } = await semestreQ
  let reqSemaines = admin.from('fragments_semaines').select('id, date_limite, numero, is_vacation')
  if (semestreCourant) reqSemaines = reqSemaines.eq('semestre_id', semestreCourant.id)
  const { data: semaines } = await reqSemaines
  // C8-L4 — deux filtres, et AUCUN des deux n'était là. Cet écran fabrique le
  // signal « élève à risque » : il ne doit réclamer que ce que Fragments réclame.
  //  • les VACANCES sortent — sans ce filtre, chaque période passée ajoutait un
  //    « dépôt manquant » à tout le monde, et pouvait franchir le seuil à elle seule ;
  //  • les semaines d'avant le seuil du semestre sortent — présentation du
  //    dispositif, choix des sujets : l'élève n'avait pas encore de thème.
  const idsSemainesPassees = new Set(
    semainesComptees(semaines ?? [], semestreCourant?.fragments_premiere_semaine ?? 1)
      .filter((s) => new Date(s.date_limite as string) < maintenant)
      .map((s) => s.id)
  )
  const nbSemainesPassees = idsSemainesPassees.size

  // Dépôts des inscriptions
  const { data: depots } = await depotsQ
  const depotsParInsc = new Map<string, { id: string; semaine_id: string; statut: string }[]>()
  for (const d of depots ?? []) {
    const arr = depotsParInsc.get(d.inscription_id as string) ?? []
    arr.push({ id: d.id as string, semaine_id: d.semaine_id as string, statut: d.statut as string })
    depotsParInsc.set(d.inscription_id as string, arr)
  }

  // Notes (analyses publiées) → moyenne canonique /4 par dépôt
  const depotIds = (depots ?? []).map((d) => d.id as string)
  const { data: analyses } = depotIds.length > 0
    ? await admin.from('fragments_analyses')
        .select('depot_id, note_decouvertes, note_sources, note_reflexions')
        .eq('statut', 'publiee').in('depot_id', depotIds)
    : { data: [] }
  const noteParDepot = new Map<string, number>()
  for (const a of analyses ?? []) {
    const d = a.note_decouvertes, s = a.note_sources, r = a.note_reflexions
    if (d != null && s != null && r != null) noteParDepot.set(a.depot_id as string, (d + s + r) / 3)
  }

  // Backlog révision (cartes dues dépassées) — classes Quazian uniquement.
  // quazian_card_states est scopé par eleve_id (inscription_id jamais peuplé), donc on
  // compte par élève puis on rattache à l'inscription.
  const backlogParEleve = new Map<string, number>()
  if (cardStatesQ) {
    const { data: cs } = await cardStatesQ
    for (const c of cs ?? []) {
      if (c.due && new Date(c.due as string) < maintenant) {
        backlogParEleve.set(c.eleve_id as string, (backlogParEleve.get(c.eleve_id as string) ?? 0) + 1)
      }
    }
  }

  for (const i of inscFragments) {
    const ds = depotsParInsc.get(i.id as string) ?? []
    const semainesDeposees = new Set(ds.filter((d) => idsSemainesPassees.has(d.semaine_id)).map((d) => d.semaine_id))
    const nbManquants = Math.max(0, nbSemainesPassees - semainesDeposees.size)
    const nbEnRetard = ds.filter((d) => d.statut === 'en_retard').length
    const notes = ds.map((d) => noteParDepot.get(d.id)).filter((n): n is number => n != null)
    const moyenne = notes.length > 0 ? notes.reduce((a, b) => a + b, 0) / notes.length : null
    // Le backlog de révision est scopé par élève (quazian_card_states n'a pas
    // d'inscription_id) : on ne le crédite qu'aux inscriptions dont la classe a
    // Quazian, sinon un élève bi-classe verrait le même backlog (donc le même
    // signal « à risque ») reporté à tort sur sa classe sans Quazian.
    const backlogRevision = classesQuazian.has(i.classe_id) ? (backlogParEleve.get(i.eleve_id as string) ?? 0) : 0

    const raisons: string[] = []
    if (nbManquants >= SEUILS_SANTE.depotsManquants) raisons.push(`${nbManquants} dépôts manquants`)
    if (moyenne != null && moyenne < SEUILS_SANTE.moyenneSous) raisons.push(`moyenne ${noteVersLettre(moyenne)}`)
    if (backlogRevision > SEUILS_SANTE.revisionEnRetard) raisons.push(`${backlogRevision} cartes en retard`)

    resultat.set(i.id as string, {
      inscriptionId: i.id as string,
      eleveId: i.eleve_id as string,
      classeId: i.classe_id as string,
      nbSemainesPassees,
      nbDeposes: semainesDeposees.size, // dépôts parmi les semaines échues (ratio ≤ 1)
      nbManquants,
      nbEnRetard,
      moyenne,
      backlogRevision,
      enDifficulte: raisons.length > 0,
      raisons,
    })
  }

  return resultat
}
