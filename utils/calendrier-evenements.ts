import 'server-only'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { jourDansFuseau } from '@/utils/fuseau'
import { lireFuseau } from '@/utils/fuseau-serveur'
import { resoudreDatesLivre, pairesLivresGouvernes } from './aletheia-dates'
import { lireGatePlanActif, plansValidesCourants, lireQuizAnnonceDefaut } from './plan-exercices'
import { resoudreDatesSyntheses } from './plan-synthese'
import { titresCoursParSession } from './codex-titre'
import { dateEffectiveSemaine, libelleTypeExercice } from './plan-cadence'

// Agrégation LECTURE SEULE des échéances datées des modules. Le calendrier ne
// stocke aucune échéance : il projette ce que les modules déclarent. L'édition
// légère (lot C6) réécrit dans le module propriétaire.

export type SourceModule = 'fragments' | 'quazian' | 'codex' | 'aletheia'
// 'prevu' = créneau planifié PROSPECTIF (plan d'évaluation), pas encore réalisé.
export type KindEvenement = 'ouverture' | 'fermeture' | 'epreuve' | 'quizz' | 'jalon' | 'prevu'

export interface CalendarEvent {
  source_module: SourceModule
  source_id: string
  classe_id: string | null // uuid si résoluble, sinon null (événement général)
  classe_nom: string | null
  kind: KindEvenement
  date: string // YYYY-MM-DD
  label: string
  is_editable: boolean
}

// Normalise une relation imbriquée Supabase (objet ou tableau) en un objet.
function un<T>(x: T | T[] | null | undefined): T | null {
  if (Array.isArray(x)) return x[0] ?? null
  return x ?? null
}

// Format uuid (même patron que RE_UUID d'app/prof/scriptorium/actions.ts) — dupliqué
// ici plutôt qu'importé : ce module `utils` ne doit pas dépendre d'un fichier 'use server'.
const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Collecte les événements datés de tous les modules dans la fenêtre [debut, fin].
 * Bornes incluses (comparaison lexicale sur YYYY-MM-DD).
 */
export async function assemblerEvenements(opts: {
  debut: string
  fin: string
  classeIds?: string[] // (perf) scope les échéances Aletheia aux classes du spectateur (élève) ; absent = toutes (prof)
  surface?: 'prof' | 'eleve' // gouverne l'émission prospective (source 5) ; défaut 'eleve' = fail-closed
}): Promise<CalendarEvent[]> {
  const supabase = await createClient()
  const { debut, fin, classeIds, surface = 'eleve' } = opts
  const events: CalendarEvent[] = []
  const tz = await lireFuseau() // jour local des instants (lance_at) dans le fuseau choisi

  // Map des classes. idParNom n'est plus qu'un repli défensif : depuis la migration
  // lot1, codex_sessions.classe_id (comme quazian_quizzes.classe_id) est un uuid FK.
  const { data: classes } = await supabase.from('classes').select('id, nom')
  const idParNom = new Map<string, string>()
  const nomParId = new Map<string, string>()
  for (const c of classes ?? []) {
    if (c.nom) idParNom.set(c.nom.toLowerCase().trim(), c.id)
    nomParId.set(c.id, c.nom)
  }

  // 1. Essais Fragments (date par classe, éditable).
  const { data: epClasses } = await supabase
    .from('fragments_essais_classes')
    .select('essai_id, classe_id, date_essai, fragments_essais_epreuves(titre)')
    .gte('date_essai', debut)
    .lte('date_essai', fin)
  for (const e of epClasses ?? []) {
    const titre = un<{ titre: string }>(e.fragments_essais_epreuves)?.titre ?? 'Essai'
    events.push({
      source_module: 'fragments',
      source_id: e.essai_id,
      classe_id: e.classe_id,
      classe_nom: nomParId.get(e.classe_id) ?? null,
      kind: 'epreuve',
      date: e.date_essai,
      label: `Essai — ${titre}`,
      is_editable: true,
    })
  }

  // 2. Quizz Quazian (date = lancement ; non rééditable, lancés en live).
  const { data: quizzes } = await supabase
    .from('quazian_quizzes')
    .select('id, classe_id, lance_at')
    .not('lance_at', 'is', null)
  for (const q of quizzes ?? []) {
    const d = jourDansFuseau(q.lance_at as string, tz) // jour local (fuseau choisi), pas l'UTC
    if (d < debut || d > fin) continue
    events.push({
      source_module: 'quazian',
      source_id: q.id,
      classe_id: q.classe_id ?? null,
      classe_nom: q.classe_id ? nomParId.get(q.classe_id) ?? null : null,
      kind: 'quizz',
      date: d,
      label: 'Quizz',
      is_editable: false,
    })
  }

  // Client admin — mutualisé par les sources 3/4/5 (RLS prof-only sur contenus/parcours).
  const admin = createAdminClient()

  // 3. Synthèses Codex (date = lancement ; classe_id = uuid FK classes depuis lot1). Deux
  //    résolutions séparées, gatées, byte-identiques pré-chantier : (a) le TITRE du bras
  //    CONTENU (synthèse de parcours) via le helper GATÉ PARTAGÉ `titresCoursParSession`
  //    (comme les autres surfaces Codex ; gate OFF → map vide, aucune requête ; via admin
  //    car scriptorium_contenus est RLS prof-only) ; (b) la CLASSE par FORMAT uuid (fix
  //    lot 0), jamais par nom (idParNom renverrait null → fuite historique).
  const { data: sessions } = await supabase
    .from('codex_sessions')
    .select('id, classe_id, lance_at, scriptorium_unites(label)')
    .not('lance_at', 'is', null)
  const sessRows = sessions ?? []
  const titreCoursParSession = await titresCoursParSession(admin, sessRows.map((s) => s.id as string))
  for (const s of sessRows) {
    const d = jourDansFuseau(s.lance_at as string, tz) // jour local (fuseau choisi)
    if (d < debut || d > fin) continue
    // classe_id est un uuid (FK classes) depuis la migration lot1 : le prendre tel quel
    // s'il en a le format. Un uuid d'une classe inconnue du spectateur ne passe pas le
    // filtre classeIds.has() de la page élève → fail-closed par construction. Surtout PAS
    // un test idParNom (indexé par NOM, jamais un uuid) : il renverrait toujours null →
    // l'événement passerait le filtre `classe_id === null` de la page élève (fuite historique).
    const brut = (s.classe_id as string | null) ?? null
    const cid = brut && RE_UUID.test(brut) ? brut : brut ? idParNom.get(brut.toLowerCase().trim()) ?? null : null
    // Fail-closed ciblé du résidu sans classe (Q13 : une synthèse a toujours une classe ;
    // une session à classe_id null est un résidu, pas un événement général légitime) : ne
    // rien émettre côté élève (classeIds défini). Côté prof (classeIds absent) elle reste
    // visible/auditable, sans nom d'uuid brut.
    if (cid === null && classeIds !== undefined) continue
    // Titre bi-source (§6.2) : label d'unité (legacy) OU titre du cours (bras contenu, via
    // le helper gaté titresCoursParSession).
    const libelle = un<{ label: string }>(s.scriptorium_unites)?.label ?? titreCoursParSession.get(s.id as string) ?? ''
    events.push({
      source_module: 'codex',
      source_id: s.id,
      classe_id: cid,
      classe_nom: cid ? nomParId.get(cid) ?? null : null,
      kind: 'jalon',
      date: d,
      label: libelle ? `Codex — ${libelle}` : 'Codex (synthèse)',
      is_editable: false,
    })
  }

  // 4. Aletheia : échéances de lecture — mode b UNIQUEMENT (dates issues du PARCOURS,
  //    résolues via snapshot/frise). Un livre non gouverné (mode a) ne génère aucune
  //    échéance (LD2). scriptorium_parcours* est en RLS prof-only → lecture via `admin` ;
  //    chaque événement porte son classe_id → la page élève filtre par classe (pas de
  //    fuite). L'échéance est déjà le DIMANCHE (résolveur).
  const paires = await pairesLivresGouvernes(admin, classeIds)
  if (paires.length) {
    const livreIds = [...new Set(paires.map(p => p.livreId))]
    const [{ data: docsLivre }, { data: livresRows }] = await Promise.all([
      admin.from('scriptorium_documents').select('unite_id, semaine').in('unite_id', livreIds).not('semaine', 'is', null),
      admin.from('scriptorium_unites').select('id, label').eq('type', 'livre').is('supprime_at', null).in('id', livreIds),
    ])
    const seancesParLivre = new Map<string, number[]>()
    for (const d of docsLivre ?? []) {
      const arr = seancesParLivre.get(d.unite_id as string) ?? []
      arr.push(d.semaine as number)
      seancesParLivre.set(d.unite_id as string, arr)
    }
    const labelParLivre = new Map<string, string>()
    for (const l of livresRows ?? []) labelParLivre.set(l.id as string, l.label as string)

    // (perf) Résolution PARALLÈLE par paire (scopée aux classes du spectateur via classeIds).
    const parPaire = await Promise.all(paires.map(async ({ livreId, classeId }) => {
      const label = labelParLivre.get(livreId)
      if (!label) return [] as CalendarEvent[] // livre supprimé/masqué → pas d'événement
      const seances = seancesParLivre.get(livreId) ?? []
      const { dates } = await resoudreDatesLivre(admin, livreId, classeId, seances)
      const evs: CalendarEvent[] = []
      for (const s of seances) {
        const d = dates.get(s)?.valeur
        if (!d || d < debut || d > fin) continue
        evs.push({
          source_module: 'aletheia',
          source_id: livreId,
          classe_id: classeId,
          classe_nom: nomParId.get(classeId) ?? null,
          kind: 'fermeture',
          date: d,
          label: `Aletheia — ${label} (séance ${s})`,
          is_editable: false,
        })
      }
      return evs
    }))
    for (const evs of parPaire) events.push(...evs)
  }

  // 5. Plan d'évaluation — exercices PROSPECTIFS (créneaux planifiés pas encore réalisés).
  //    DEUX surfaces (E1/E2, §8bis) : `surface` défaut 'eleve' → fail-closed. Gate
  //    `plan_evaluation_actif` : OFF/absent → bloc inerte (les deux surfaces byte-identiques).
  //    Labels GÉNÉRIQUES par type (jamais titre/note — anti-spoiler §8bis-2). Ancrage
  //    'semaine' (exercices figés) + 'parcours' (synthèses, PROF only). Dédup E3 : un objet
  //    déjà LANCÉ est émis par sa source réelle (2/3), pas ici. Lecture via `admin` (tables
  //    du plan en RLS prof-only — la garde applicative est la SEULE barrière anti-fuite).
  //    RÉTENTION ÉLÈVE GÉNÉRALISÉE (§8bis-3) : sous 'eleve', un exercice `concu` non lancé
  //    n'est JAMAIS émis, à l'UNIQUE exception d'un quiz `concu` quand `quiz_annonce_defaut`
  //    (D5) — synthèses retenues (→ rétrospectif au lancement), `a_concevoir` prof-only,
  //    exercices sans canal de module (écriture/lecture/examen) jamais exposés.
  if (await lireGatePlanActif(admin)) {
    const estEleve = surface === 'eleve'
    // Plan COURANT par classe (max AY, valide, classe active). Élève : scope aux classes du
    // spectateur (défense en profondeur — la page filtre déjà, mais on n'émet rien de plus).
    const plansValides = await plansValidesCourants(admin)
    // Élève : scope STRICT aux classes du spectateur — et FAIL-CLOSED si `classeIds` est
    // absent (contrat E1 : « un appelant oublieux n'expose jamais rien au-delà du contrat
    // élève »). Le seul appelant élève passe toujours un tableau ; ce garde ferme le cas
    // d'un futur appelant qui omettrait classeIds sous la surface par défaut 'eleve'.
    const plansScope = estEleve
      ? (classeIds ? plansValides.filter((p) => classeIds.includes(p.classeId)) : [])
      : plansValides
    const planIds = plansScope.map((p) => p.id)
    const classeParPlan = new Map<string, string>(plansScope.map((p) => [p.id, p.classeId]))
    // Dérogation « annoncé » (D5) : côté élève seulement, un quiz concu non lancé devient
    // exposable si le réglage est ON. Côté prof, non pertinent (tout est émis).
    const quizAnnonce = estEleve ? await lireQuizAnnonceDefaut(admin) : true
    if (planIds.length > 0) {
      const { data: exos } = await admin
        .from('scriptorium_exercices_planifies')
        .select('id, plan_id, type_exercice, diagnostique, lieu, module, statut, semaine_lundi, jour_prevu, quiz_id')
        .in('plan_id', planIds)
        .eq('ancrage', 'semaine')
        // Élève : `concu` seulement (a_concevoir est prof-only). Prof : les deux.
        .in('statut', estEleve ? ['concu'] : ['a_concevoir', 'concu'])
        .is('supprime_at', null)
      const exosRows = exos ?? []
      // Dédup E3 : un quiz déjà lancé apparaît via la source 2 → on n'émet pas son
      // créneau prospectif. (Une synthèse est ancrée parcours → hors périmètre ici.)
      const quizIds = [...new Set(exosRows.map((e) => e.quiz_id as string | null).filter((x): x is string => !!x))]
      const quizLances = new Set<string>()
      if (quizIds.length > 0) {
        const { data: qz } = await admin.from('quazian_quizzes').select('id, lance_at').in('id', quizIds).not('lance_at', 'is', null)
        for (const q of qz ?? []) quizLances.add(q.id as string)
      }
      for (const e of exosRows) {
        if (e.quiz_id && quizLances.has(e.quiz_id as string)) continue
        const cid = classeParPlan.get(e.plan_id as string) ?? null
        // Rétention élève (§8bis-3) : SEUL un quiz annoncé survit ; jamais d'événement
        // sans classe (§8bis-4).
        if (estEleve) {
          if (!cid) continue
          if (e.type_exercice !== 'quiz' || !quizAnnonce) continue
        }
        const d = dateEffectiveSemaine(e.semaine_lundi as string, (e.jour_prevu as string | null) ?? null, e.lieu as 'classe' | 'maison')
        if (d < debut || d > fin) continue
        const base = libelleTypeExercice(e.type_exercice as string, e.diagnostique as boolean)
        const libelle = base.charAt(0).toUpperCase() + base.slice(1)
        events.push({
          source_module: e.module as SourceModule,
          source_id: e.id as string,
          classe_id: cid,
          classe_nom: cid ? nomParId.get(cid) ?? null : null,
          kind: 'prevu',
          date: d,
          // Élève : libellé générique nu (« Quiz »). Prof : + statut de conception.
          label: estEleve ? libelle : `${libelle} · ${e.statut === 'concu' ? 'conçu' : 'à concevoir'}`,
          is_editable: false,
        })
      }

      // Synthèses de fin de cours (ancrage 'parcours', §5.4) : PROF UNIQUEMENT. Côté élève,
      // rétention §8bis-3 (symétrie §8bis-6) : une synthèse `concu` non lancée n'est jamais
      // émise ; une fois lancée, c'est la source 3 rétrospective qui l'expose (E3). Date NON
      // stockée → résolue EN LOT (coût constant) ; ce coût ne s'engage donc pas côté élève.
      if (!estEleve) {
        const { data: synths } = await admin
          .from('scriptorium_exercices_planifies')
          .select('id, plan_id, module, statut, parcours_id, contenu_id, codex_session_id')
          .in('plan_id', planIds)
          .eq('ancrage', 'parcours')
          .in('statut', ['a_concevoir', 'concu'])
          .is('supprime_at', null)
        const synthRows = synths ?? []
        if (synthRows.length > 0) {
          // Dédup E3, bras symétrique du quiz : une synthèse déjà LANCÉE est émise par la
          // source 3 (rétrospective, sur `lance_at`) → pas ici (sinon double, deux dates).
          const sessionIds = [...new Set(synthRows.map((s) => s.codex_session_id as string | null).filter((x): x is string => !!x))]
          const sessionsLancees = new Set<string>()
          if (sessionIds.length > 0) {
            const { data: cs } = await admin.from('codex_sessions').select('id, lance_at').in('id', sessionIds).not('lance_at', 'is', null)
            for (const c of cs ?? []) sessionsLancees.add(c.id as string)
          }
          const restantes = synthRows.filter((s) => !(s.codex_session_id && sessionsLancees.has(s.codex_session_id as string)))
          const dates = await resoudreDatesSyntheses(admin, restantes.map((s) => ({
            cle: s.id as string,
            parcoursId: s.parcours_id as string,
            contenuId: s.contenu_id as string,
            classeId: classeParPlan.get(s.plan_id as string) as string,
          })))
          for (const s of restantes) {
            const d = dates.get(s.id as string) ?? null
            if (d == null) continue // S6 — non datable ⇒ aucun événement
            if (d < debut || d > fin) continue
            const cid = classeParPlan.get(s.plan_id as string) ?? null
            events.push({
              source_module: s.module as SourceModule,
              source_id: s.id as string,
              classe_id: cid,
              classe_nom: cid ? nomParId.get(cid) ?? null : null,
              kind: 'prevu',
              date: d,
              label: `Synthèse · ${s.statut === 'concu' ? 'préparée' : 'à préparer'}`,
              is_editable: false,
            })
          }
        }
      }
    }
  }

  events.sort((a, b) => a.date.localeCompare(b.date) || a.label.localeCompare(b.label))
  return events
}
