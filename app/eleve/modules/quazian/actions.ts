'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { messageSiBloque } from '@/utils/integrite'
import { classeIdsDuContexte } from '@/app/eleve/contexte-classe'
import { perimetreVuClasses } from '@/utils/quazian-cibles'
import {
  carteVisible, perimetreVide,
  type CarteAncree, type PerimetreCartes,
} from '@/utils/quazian-visibilite'
import { fsrs, createEmptyCard, type Card, type Grade } from 'ts-fsrs'

async function verifierEleve() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'eleve') throw new Error('Accès refusé')
  return { supabase, userId: user.id }
}

// ── Visibilité des cartes partagées (Lot 6/7, recâblée à C7·L1 puis L3) ──────
//
// ⚠️ C7·L3 — LA PUBLICATION A DISPARU DU BRAS CONTENU. Le prof n'a plus à presser
// « Publier aux élèves » : une carte validée devient visible quand l'élément
// correspondant est coché « VU » dans le pilotage de la classe (Scriptorium).
// La règle elle-même vit dans `utils/quazian-visibilite.ts` (pure, testée) ; ici
// on ne fait que lui donner à manger. Deux grains :
//   • carte née d'une SOUS-SECTION → cette sous-section doit être vue ;
//   • carte au grain CONTENU → le contenu doit être ENTAMÉ (≥ 1 élément vu, R7).
//
// ⚠️ C7·L2 — « une classe de l'élève » veut dire les classes EN CONTEXTE, pas
// l'union de ses inscriptions. Sur une page de module le contexte vaut toujours
// une seule classe (l'état « Toutes » y est intercepté par le choix de classe) ;
// le tableau de bord, lui, agrège et passe les deux. Avant ce lot, la fonction
// lisait les inscriptions elle-même : un bi-classe voyait les cartes de son
// autre classe quel que soit le commutateur (item 3 du lot).
//
// Le bras UNITÉ (hérité) NE BOUGE PAS : publication + tuple (unité, semaine)
// assigné via `scriptorium_document_classes`, cartes à semaine nulle visibles par
// la seule publication. Il n'y a aucune unité en base ; `quazian_publications`
// n'est donc plus lue que là, et n'est plus écrite nulle part.
//
// Centralisé pour que la file, la consultation ET les stats appliquent EXACTEMENT
// le même périmètre.
async function contexteVisibiliteCartes(
  admin: ReturnType<typeof createAdminClient>,
  classeIds: string[],
): Promise<PerimetreCartes> {
  // Bras hérité — publications d'UNITÉS seulement (le bras contenu n'en a plus).
  const { data: publis } = await admin
    .from('quazian_publications')
    .select('scriptorium_unite_id')
    .eq('flashcards_visibles', true)
    .not('scriptorium_unite_id', 'is', null)
  const unitesPubliees = (publis ?? [])
    .map((p) => p.scriptorium_unite_id as string | null)
    .filter((v): v is string => !!v)

  if (classeIds.length === 0) return { ...perimetreVide(), unitesPubliees }

  // Bras contenu — LE « vu » des instances de parcours ACTIVES de ses classes.
  const { contenusEntames, sectionsVues } = await perimetreVuClasses(admin, classeIds)

  // Bras hérité — inchangé.
  const tuplesVisibles = new Set<string>()
  const { data: liens } = await admin
    .from('scriptorium_document_classes').select('document_id').in('classe_id', classeIds)
  const docIds = [...new Set((liens ?? []).map((l) => l.document_id as string))]
  if (docIds.length > 0) {
    const { data: documents } = await admin
      .from('scriptorium_documents').select('unite_id, semaine').in('id', docIds).not('semaine', 'is', null)
    for (const d of documents ?? []) tuplesVisibles.add(`${d.unite_id}:${d.semaine}`)
  }

  return { contenusEntames, sectionsVues, unitesPubliees, tuplesVisibles }
}

/**
 * Cartes partagées validées que le périmètre de l'élève laisse passer, des deux
 * bras. `select` doit inclure `section_id, contenu_id, scriptorium_unite_id,
 * semaine` — les quatre champs que `carteVisible` lit.
 *
 * Côté contenu, la requête part des contenus ENTAMÉS : une sous-section vue rend
 * son contenu entamé, donc cet ensemble contient déjà toutes les cartes
 * candidates des deux grains — `carteVisible` fait ensuite le tri fin.
 */
async function cartesPartageesVisibles(
  admin: ReturnType<typeof createAdminClient>,
  p: PerimetreCartes,
  select: string,
): Promise<Record<string, unknown>[]> {
  const requete = (colonne: 'contenu_id' | 'scriptorium_unite_id', ids: string[]) =>
    ids.length > 0
      ? lireCartes(admin, select, { eleveId: null, colonne, ids })
      : Promise.resolve([] as Record<string, unknown>[])

  const [parContenu, parUnite] = await Promise.all([
    requete('contenu_id', [...p.contenusEntames]),
    requete('scriptorium_unite_id', p.unitesPubliees),
  ])
  return [...parContenu, ...parUnite].filter((c) => carteVisible(c as CarteAncree, p))
}

interface FiltreCartes {
  /** `null` = cartes PARTAGÉES ; un id = les cartes personnelles de cet élève. */
  eleveId: string | null
  colonne?: 'contenu_id' | 'scriptorium_unite_id'
  ids?: string[]
}

/**
 * Lecture des cartes VALIDES, tolérante à l'absence de `section_id`.
 *
 * Le protocole renforcé fait partir le CODE avant le SQL : entre le déploiement
 * et l'exécution de `c7_quazian_sections.sql`, la colonne n'existe pas encore et
 * une requête qui la nomme rendrait zéro carte à l'élève. Le repli relit sans
 * elle — la visibilité retombe alors au grain CONTENU (comportement d'avant le
 * grain fin), au lieu de vider l'écran. Même idiome que le repli
 * `horaire_snapshot` de `chargerInstanceDeClasse` (app/prof/scriptorium/instance-serveur.ts).
 * Une fois le SQL joué, le premier appel passe : aucun aller-retour en plus.
 */
async function lireCartes(
  admin: ReturnType<typeof createAdminClient>,
  select: string,
  f: FiltreCartes,
): Promise<Record<string, unknown>[]> {
  const requete = (s: string) => {
    let q = admin.from('quazian_flashcards').select(s).eq('statut', 'valide')
    q = f.eleveId === null ? q.is('eleve_id', null) : q.eq('eleve_id', f.eleveId)
    if (f.colonne && f.ids) q = q.in(f.colonne, f.ids)
    return q
  }
  const { data, error } = await requete(select)
  if (!error) return (data ?? []) as unknown as Record<string, unknown>[]
  const repli = await requete(select.replace(/\bsection_id\s*,?\s*/g, ''))
  return (repli.data ?? []) as unknown as Record<string, unknown>[]
}

/**
 * Combien de cartes une session de révision sert au plus. C'est un choix
 * pédagogique — ne pas noyer l'élève — et c'est LE plafond que l'écran doit
 * annoncer : le compteur ne promet que ce que la file servira.
 */
// (non exportée : un fichier `'use server'` ne peut exporter que des fonctions
// asynchrones — les deux seuls lecteurs, la file et les stats, vivent ici.)
const PLAFOND_SESSION = 30

export interface CarteRevision {
  flashcard_id: string
  card_state_id: string | null  // null = première révision
  recto: string
  verso: string
  format: string                // 'recto_verso' | 'cloze' — pilote le masquage au recto
  type: string
  concept_tag: string
  label_unite: string
  // État FSRS sérialisé (pour le client, pas besoin de tout)
  state: number
  due: string
}

// Colonnes lues pour une carte : les deux bras de l'arc, la sous-section (C7·L3)
// et les deux relations dont on tire le libellé affiché. `carteVisible` a besoin
// des quatre premières.
const SELECT_CARTE = `
    id, recto, verso, format, type, concept_tag, semaine, created_at,
    scriptorium_unite_id, contenu_id, section_id,
    scriptorium_unites(label), scriptorium_contenus(titre)
  `

// Libellé affiché sous une carte : le titre du contenu, le label de l'unité
// héritée, ou « Cartes personnelles » pour une carte sans cible visible (Codex).
// Chaque relation arrive en objet OU en tableau selon la jointure Supabase — même
// précaution que `libelleSession` (utils/codex-libelle.ts).
function labelDeLaCarte(f: Record<string, unknown>, defaut = ''): string {
  const u = (Array.isArray(f.scriptorium_unites) ? f.scriptorium_unites[0] : f.scriptorium_unites) as { label?: string } | null
  const c = (Array.isArray(f.scriptorium_contenus) ? f.scriptorium_contenus[0] : f.scriptorium_contenus) as { titre?: string } | null
  return c?.titre ?? u?.label ?? defaut
}

// C7·L3 — la CIBLE d'une carte, clé des tuiles par cours côté élève. Le grain de
// la tuile est le COURS, jamais la sous-section : l'élève range ses cartes par
// cours, c'est le « vu » du prof qui travaille au grain fin.
const CIBLE_PERSO = 'perso'
function cibleDeLaCarte(f: Record<string, unknown>): string {
  return (f.contenu_id as string | null) ?? (f.scriptorium_unite_id as string | null) ?? CIBLE_PERSO
}

// Charger la file de révision du jour
export async function chargerFileRevision(): Promise<CarteRevision[]> {
  const { supabase, userId } = await verifierEleve()
  const maintenant = new Date().toISOString()

  // Périmètre « vu » des classes en contexte — admin pour contourner RLS.
  const admin = createAdminClient()
  // Blocage « petit malin » : la révision de flashcards est gelée (le quizz reste ouvert).
  if (await messageSiBloque(admin, userId)) return []
  const perimetre = await contexteVisibiliteCartes(admin, await classeIdsDuContexte(supabase, userId))

  const partagees = await cartesPartageesVisibles(admin, perimetre, SELECT_CARTE)

  // Cartes personnelles de l'élève (ex. Codex) — toujours révisables par lui.
  // Elles ne passent PAS par le périmètre « vu » : elles sont à lui (C7·L3).
  const perso = await lireCartes(admin, SELECT_CARTE, { eleveId: userId })

  const flashcards = [...partagees, ...perso] as unknown as Record<string, unknown>[]
  if (flashcards.length === 0) return []

  const flashcardIds = flashcards.map((f) => f.id as string)

  // États FSRS existants pour cet élève
  const { data: etats } = await supabase
    .from('quazian_card_states')
    .select('id, flashcard_id, state, due, difficulty, stability, reps, lapses, last_review')
    .eq('eleve_id', userId)
    .in('flashcard_id', flashcardIds)

  const etatsMap: Record<string, typeof etats extends (infer T)[] | null ? T : never> = {}
  for (const e of etats ?? []) {
    etatsMap[e.flashcard_id] = e
  }

  // File = nouvelles cartes (sans état) + cartes dues aujourd'hui
  const file: CarteRevision[] = []

  for (const f of flashcards) {
    const etat = etatsMap[f.id as string]
    const labelUnite = labelDeLaCarte(f)
    const commun = {
      flashcard_id: f.id as string,
      recto: f.recto as string,
      verso: f.verso as string,
      format: f.format as string,
      type: f.type as string,
      concept_tag: f.concept_tag as string,
      label_unite: labelUnite,
    }

    if (!etat) {
      // Nouvelle carte — à réviser
      file.push({ ...commun, card_state_id: null, state: 0 /* New */, due: maintenant })
    } else if (etat.due <= maintenant) {
      // Carte due
      file.push({ ...commun, card_state_id: etat.id, state: etat.state, due: etat.due })
    }
  }

  // Mélanger légèrement (nouvelles d'abord, puis dues)
  const nouvelles = file.filter((c) => c.card_state_id === null)
  const dues = file.filter((c) => c.card_state_id !== null)

  // Plafond de session — LE nombre que `chargerStatsRevision` doit annoncer.
  return [...nouvelles, ...dues].slice(0, PLAFOND_SESSION)
}

export interface CarteConsultation {
  flashcard_id: string
  recto: string
  verso: string
  format: string
  type: string
  concept_tag: string
  label_unite: string
  /** Cours / texte / unité d'origine — clé de regroupement des tuiles (C7·L3). */
  cible_id: string
  nouvelle: boolean // pas encore d'état FSRS pour cet élève (= récemment ajoutée)
  /** Mûre pour la révision d'aujourd'hui : jamais vue, ou échéance atteinte. */
  a_reviser: boolean
  created_at: string
}

// Mode « consultation » (Lot 11) : TOUTES les cartes visibles avec leur réponse,
// sans impact sur la répétition espacée. Même visibilité que la file de révision.
export async function chargerToutesLesCartes(): Promise<CarteConsultation[]> {
  const { supabase, userId } = await verifierEleve()
  const admin = createAdminClient()

  // Gel de l'intégrité : même garde que `chargerFileRevision`. Une Server Action
  // exportée est un point d'entrée HTTP à part entière — la page ne l'appelle pas
  // quand l'élève est bloqué, mais elle ne peut pas être la seule barrière
  // (§5 du RAPPORT_Diagnostic_C7_quazian.md).
  if (await messageSiBloque(admin, userId)) return []

  // Périmètre « vu » — MÊME périmètre que la file de révision.
  const perimetre = await contexteVisibiliteCartes(admin, await classeIdsDuContexte(supabase, userId))
  const partagees = await cartesPartageesVisibles(admin, perimetre, SELECT_CARTE)

  const perso = await lireCartes(admin, SELECT_CARTE, { eleveId: userId })

  const flashcards = [...partagees, ...perso] as unknown as Record<string, unknown>[]
  if (flashcards.length === 0) return []

  // `due` en plus de l'id : les tuiles par cours annoncent « N à réviser », et
  // ce compte doit sortir du MÊME prédicat que la file (jamais vue, ou échue).
  const maintenant = new Date().toISOString()
  const { data: etats } = await supabase
    .from('quazian_card_states')
    .select('flashcard_id, due')
    .eq('eleve_id', userId)
    .in('flashcard_id', flashcards.map((f) => f.id as string))
  const echeance = new Map((etats ?? []).map((e) => [e.flashcard_id as string, e.due as string]))

  return flashcards
    .map((f) => {
      const labelUnite = labelDeLaCarte(f, 'Cartes personnelles')
      const due = echeance.get(f.id as string)
      return {
        flashcard_id: f.id as string,
        recto: f.recto as string,
        verso: f.verso as string,
        format: f.format as string,
        type: f.type as string,
        concept_tag: f.concept_tag as string,
        label_unite: labelUnite,
        cible_id: cibleDeLaCarte(f),
        nouvelle: due === undefined,
        a_reviser: due === undefined || due <= maintenant,
        created_at: f.created_at as string,
      }
    })
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
}

// Soumettre une note et mettre à jour l'état FSRS
export async function soumettreNote(
  flashcardId: string,
  cardStateId: string | null,
  rating: 1 | 2 | 3 | 4
): Promise<{ due: string; state: number; cardStateId: string | null }> {
  const { supabase, userId } = await verifierEleve()

  // Garde-fou : élève bloqué → aucune mise à jour FSRS (la révision est gelée).
  if (await messageSiBloque(createAdminClient(), userId)) {
    return { due: new Date().toISOString(), state: 0, cardStateId }
  }

  const scheduler = fsrs()
  const maintenant = new Date()

  // Reconstruire la carte FSRS depuis l'état RÉEL en base (jamais l'état du client).
  // Résolution tolérante : par id si fourni ET valide, sinon par (élève, flashcard) — le
  // client peut renvoyer un id factice « pending » pour une carte neuve re-enfilée (raté).
  const idValide = cardStateId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cardStateId)
    ? cardStateId : null
  type EtatCarte = { id: string; difficulty: number; stability: number; state: number; due: string; reps: number; lapses: number; last_review: string | null }
  let etat: EtatCarte | null = null
  if (idValide) {
    const { data } = await supabase
      .from('quazian_card_states')
      .select('id, difficulty, stability, state, due, reps, lapses, last_review')
      .eq('id', idValide).eq('eleve_id', userId).maybeSingle()
    etat = (data as EtatCarte | null) ?? null
  }
  if (!etat) {
    const { data } = await supabase
      .from('quazian_card_states')
      .select('id, difficulty, stability, state, due, reps, lapses, last_review')
      .eq('eleve_id', userId).eq('flashcard_id', flashcardId).maybeSingle()
    etat = (data as EtatCarte | null) ?? null
  }

  // Garde de visibilité (création d'un nouvel état uniquement) : carte partagée valide, ou
  // carte personnelle de l'élève. Empêche de semer un état FSRS pour une carte arbitraire.
  //
  // ⚠️ Lecture ADMIN, et c'est le correctif d'un bug MUET découvert à la recette
  // de C7·L3 (14/08). Cette garde lisait `quazian_flashcards` avec le client
  // user-scoped ; or la policy RLS `eleve_read_flashcards` joint sur
  // `scriptorium_unite_id` et exige une ligne `quazian_publications`. Pour une
  // carte du bras CONTENU, `scriptorium_unite_id` est NULL — `NULL = NULL` n'est
  // jamais vrai — donc la policy ne laissait passer AUCUNE carte : `fc` valait
  // `null`, la garde sortait en silence, et l'état FSRS n'était JAMAIS créé.
  // L'élève notait ses cartes, l'écran avançait, « ✓ N cartes révisées »
  // s'affichait, et rien n'était enregistré : toute carte restait « nouvelle »
  // pour toujours. Constat en base à la recette : 0 ligne dans
  // `quazian_card_states`, tous élèves confondus.
  //
  // Le bug date de C7·L1 (naissance du bras contenu sans que la policy suive) et
  // restait masqué parce que la LECTURE passe partout ailleurs par le client
  // admin — cette garde était le seul endroit à interroger la table sous RLS.
  // Le reste de l'action (états FSRS, journal de révision) continue d'écrire
  // sous RLS : `eleve_own_card_states` et `eleve_own_review_log` portent bien
  // leurs lignes, elles n'ont jamais été le problème.
  //
  // ⚠️ Ce que cette garde ne fait TOUJOURS pas : vérifier le PÉRIMÈTRE (« vu »).
  // Elle reproduit exactement le contrôle d'avant — carte partagée valide, ou
  // carte personnelle de l'élève — sans rien resserrer. Y ajouter `carteVisible`
  // serait une décision de conception (R7), notée en fin de session.
  if (!etat) {
    const { data: fc } = await createAdminClient()
      .from('quazian_flashcards').select('eleve_id, statut').eq('id', flashcardId).maybeSingle()
    if (!fc || (fc.eleve_id === null ? fc.statut !== 'valide' : fc.eleve_id !== userId)) {
      return { due: maintenant.toISOString(), state: 0, cardStateId: null }
    }
  }

  const card: Card = etat
    ? {
        due: new Date(etat.due),
        stability: etat.stability,
        difficulty: etat.difficulty,
        elapsed_days: 0,
        scheduled_days: 0,
        reps: etat.reps,
        lapses: etat.lapses,
        learning_steps: 0,
        state: etat.state as 0 | 1 | 2 | 3,
        last_review: etat.last_review ? new Date(etat.last_review) : undefined,
      }
    : createEmptyCard(maintenant)

  const result = scheduler.next(card, maintenant, rating as Grade)
  const nouvelleCarteEtat = result.card
  const log = result.log

  const nouveauDue = nouvelleCarteEtat.due.toISOString()

  let etatId = etat?.id ?? null
  if (!etat) {
    // Créer l'état
    const { data: nouvelEtat, error } = await supabase
      .from('quazian_card_states')
      .insert({
        eleve_id: userId,
        flashcard_id: flashcardId,
        difficulty: nouvelleCarteEtat.difficulty,
        stability: nouvelleCarteEtat.stability,
        due: nouveauDue,
        last_review: maintenant.toISOString(),
        state: nouvelleCarteEtat.state,
        reps: nouvelleCarteEtat.reps,
        lapses: nouvelleCarteEtat.lapses,
      })
      .select('id')
      .single()

    if (!error && nouvelEtat) {
      etatId = nouvelEtat.id
      await supabase.from('quazian_review_log').insert({
        card_state_id: nouvelEtat.id,
        rating,
        reviewed_at: maintenant.toISOString(),
        elapsed_days: log.elapsed_days,
        scheduled_days: log.scheduled_days,
      })
    }
  } else {
    // Mettre à jour l'état existant
    await supabase
      .from('quazian_card_states')
      .update({
        difficulty: nouvelleCarteEtat.difficulty,
        stability: nouvelleCarteEtat.stability,
        due: nouveauDue,
        last_review: maintenant.toISOString(),
        state: nouvelleCarteEtat.state,
        reps: nouvelleCarteEtat.reps,
        lapses: nouvelleCarteEtat.lapses,
      })
      .eq('id', etat.id)
      .eq('eleve_id', userId)

    await supabase.from('quazian_review_log').insert({
      card_state_id: etat.id,
      rating,
      reviewed_at: maintenant.toISOString(),
      elapsed_days: log.elapsed_days,
      scheduled_days: log.scheduled_days,
    })
  }

  return { due: nouveauDue, state: nouvelleCarteEtat.state, cardStateId: etatId }
}

// Stats pour la page d'accueil
export async function chargerStatsRevision() {
  const { supabase, userId } = await verifierEleve()
  const maintenant = new Date().toISOString()
  const admin = createAdminClient()

  // Gel de l'intégrité : les compteurs annoncent la file, et la file est vide
  // quand l'élève est bloqué — sans cette garde ils promettraient un travail
  // inaccessible (et l'action reste un point d'entrée HTTP, cf. §5 du rapport).
  if (await messageSiBloque(admin, userId)) {
    return { totalCartes: 0, connues: 0, dues: 0, nouvelles: 0, mures: 0, aFaire: 0 }
  }

  // Périmètre « vu » — MÊME périmètre que la file de révision,
  // sinon les compteurs annoncent des cartes que l'élève ne verra jamais. Sur le
  // tableau de bord en état « Toutes », le contexte rend les deux classes : les
  // compteurs agrègent, ce que l'écran annonce.
  const perimetre = await contexteVisibiliteCartes(admin, await classeIdsDuContexte(supabase, userId))
  const partagees = await cartesPartageesVisibles(
    admin, perimetre, 'id, scriptorium_unite_id, contenu_id, section_id, semaine',
  )

  const perso = await lireCartes(admin, 'id', { eleveId: userId })

  const flashcards = [...partagees, ...perso] as unknown as Record<string, unknown>[]
  const totalCartes = flashcards.length
  const ids = flashcards.map((f) => f.id as string)

  const { data: etats } = ids.length > 0
    ? await supabase
        .from('quazian_card_states')
        .select('state, due')
        .eq('eleve_id', userId)
        .in('flashcard_id', ids)
    : { data: [] }

  const connues = etats?.length ?? 0
  const dues = etats?.filter((e) => e.due <= maintenant).length ?? 0
  const nouvelles = totalCartes - connues

  // Deux nombres, deux sens — et c'est le correctif du 14/08 (recette C7·L3) :
  //   • `mures`  = tout ce qui est prêt à être revu (jamais vu, ou échéance atteinte) ;
  //   • `aFaire` = ce que la session servira VRAIMENT, plafond compris.
  // Avant, l'écran annonçait `dues + min(nouvelles, 20)` — une troisième formule
  // qui ne correspondait ni au stock mûr ni à la session : Elo lisait « 50 à
  // réviser » et n'en recevait que 30. Le plafond des 20 nouvelles/jour qu'elle
  // esquissait n'a jamais existé dans la file ; on ne l'invente pas ici, on
  // aligne l'annonce sur ce que la file fait réellement.
  const mures = dues + nouvelles
  return { totalCartes, connues, dues, nouvelles, mures, aFaire: Math.min(mures, PLAFOND_SESSION) }
}
