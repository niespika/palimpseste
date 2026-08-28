import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { moduleIdsDesClasses, slugsModulesParClasse } from '@/utils/acces'
import { lireReglagesRag } from '@/utils/scriptorium-rag'
import { contexteClasseEleve } from './contexte-classe'
import { estSemaineComptee } from '@/utils/fragments-semaines'
import { calculerGrilleSemaines } from '@/utils/calendrier-grille'
import { jourDansFuseau, formatJour, formatInstant } from '@/utils/fuseau'
import { lireFuseau } from '@/utils/fuseau-serveur'
import { chargerStatsRevision } from './modules/quazian/actions'
import { livresPourClasse, toutesSemainesDone } from './modules/aletheia/data'
import { retoursDExamenALire } from '@/utils/codex-onglets/liste'
import { signalDeLaSemaine } from '@/utils/eleve/semaine-serveur'
import { fichesDejaServies } from '@/utils/eleve/fiche-serveur'
import { lundiOnOrBefore, toISODate } from '@/utils/calendrier-grille'
import Pastille, { type ModuleSceau } from '@/components/Pastille'

// Dates PURES (bornes de semaine) → UTC, agnostique au fuseau.
const fmtJourCourt = (d: string) => formatJour(d, { day: 'numeric', month: 'short' })

type ModuleInfo = { id: string; slug: string; nom: string; description: string | null; actif: boolean }

// slug en base → clé de monde (les vars charte / sceaux utilisent « fragments »).
const SCEAU: Record<string, ModuleSceau> = {
  scriptorium: 'scriptorium',
  'fragments-erudition': 'fragments',
  quazian: 'quazian',
  codex: 'codex',
  aletheia: 'aletheia',
}

// ── Tâches « à faire » (héros + ensuite) ─────────────────────────────────────
type Monde = 'fragments' | 'quazian' | 'codex' | 'aletheia'
type Ton = 'retard' | 'attention' | 'info' | 'ok' | 'muet'
interface Tache {
  cle: string
  module: Monde          // sceau + data-module (pigment)
  titre: string
  detail: string
  href: string
  cta: string
  urgence: number        // plus haut = plus urgent
  badge?: { texte: string; ton: Ton; pulse?: boolean }
  pistes?: string[]
  /** Classe d'origine, affichée seulement quand le tableau agrège (C7·L2). */
  classe?: string
}

const TON_BADGE: Record<Ton, string> = {
  retard: 'bg-retard-teinte text-retard',
  attention: 'bg-attention-teinte text-attention',
  info: 'bg-info-teinte text-info',
  ok: 'bg-ok-teinte text-ok',
  muet: 'bg-parchemin-fonce text-muet',
}

function Badge({ texte, ton, pulse }: { texte: string; ton: Ton; pulse?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${TON_BADGE[ton]}`}>
      {pulse && <span className="w-1.5 h-1.5 rounded-full bg-ok animate-pulse" />}
      {texte}
    </span>
  )
}

export default async function TableauDeBordEleve() {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', user!.id).single()

  // C7·L2 — le tableau de bord AGRÈGE en état « Toutes » : la collecte ci-dessous
  // ne tourne plus sur une inscription mais sur toutes celles en contexte (une
  // seule dans l'état classe, d'où l'absence de changement pour un mono-classe).
  const { inscriptions, active, toutes } = await contexteClasseEleve(supabase, user!.id)
  const enContexte = toutes ? inscriptions : active ? [active] : []

  // Modules réellement accessibles : on ne dérive AUCUNE tâche/échéance d'un
  // module hors périmètre (ex. pilote Aletheia-only ne voit pas Fragments, dont
  // la semaine est globale au semestre).
  // Accès & classes · L1 — le périmètre est PAR INSCRIPTION, plus par élève : le
  // module appartient à la classe, donc une tâche Quazian ne naît que d'une
  // classe qui A Quazian. En état « Toutes », l'écran agrège deux classes aux
  // modules différents — un drapeau unique en union y faisait naître, pour la
  // classe qui n'a pas le module, des tâches sans objet.
  const modulesParClasse = await slugsModulesParClasse(supabase, enContexte.map((i) => i.classe_id))
  const aModule = (classeId: string, slug: string) => modulesParClasse.get(classeId)?.has(slug) ?? false
  /** Au moins une classe en contexte a ce module (pour les lectures globales). */
  const uneClasseA = (slug: string) => enContexte.some((i) => aModule(i.classe_id, slug))

  // ── Collecte (une passe par inscription EN CONTEXTE) ───────────────────────
  // Une seule inscription dans l'état classe (cas d'hier, inchangé) ; les deux
  // dans l'état « Toutes », d'où une tâche par classe.
  interface FragmentTache { texte: string; depose: boolean; enRetard: boolean; pistes: string[]; classe: string; inscriptionId: string }
  const fragmentTaches: FragmentTache[] = []
  let cartesDues = 0
  const codexEnCours: { id: string; classe: string }[] = []
  const quizzEnCours: { id: string; classe: string }[] = []
  const aletheiaAFaire: { classe: string }[] = []
  let semaineCourante: { label: string; debut: string; fin: string; vacances: boolean } | null = null

  if (enContexte.length > 0) {
    // Semaine ouverte scopée au semestre actif (évite une semaine restée ouverte
    // d'un semestre précédent). Globale au semestre : une seule lecture.
    const { data: semActif } = await supabase
      .from('semesters').select('id, fragments_premiere_semaine').eq('is_active', true).maybeSingle()
    // C8-L4 — `is_vacation = false` explicitement : une semaine ouverte AVANT de
    // devenir vacance gardait son drapeau, et `order by numero desc` classe les
    // `NULL` EN PREMIER sous PostgreSQL — elle gagnerait donc la sélection.
    let reqSemaine = supabase
      .from('fragments_semaines')
      .select('id, numero, date_limite, is_vacation')
      .eq('ouverte', true)
      .eq('is_vacation', false)
    if (semActif?.id) reqSemaine = reqSemaine.eq('semestre_id', semActif.id)
    const { data: semaine } = await reqSemaine
      .order('numero', { ascending: false })
      .limit(1)
      .maybeSingle()

    for (const insc of enContexte) {
      if (semaine && aModule(insc.classe_id, 'fragments-erudition')) {
        const { data: depot } = await supabase
          .from('fragments_depots')
          .select('id, statut')
          .eq('inscription_id', insc.id)
          .eq('semaine_id', semaine.id)
          .maybeSingle()
        // date_limite est un INSTANT (fin de journée dans le fuseau de l'école) : on
        // nomme le JOUR dans ce fuseau — en UTC, l'échéance du dimanche dirait lundi.
        const limite = formatInstant(semaine.date_limite as string, await lireFuseau(), { weekday: 'long', day: 'numeric', month: 'long' })
        // C8-L4 — une semaine que Fragments ne réclame pas ne met personne en
        // retard, et ne s'annonce pas comme un travail dû. Le professeur peut
        // l'avoir ouverte à dessein : le dépôt reste offert, jamais exigé.
        const reclamee = estSemaineComptee(semaine, semActif?.fragments_premiere_semaine ?? 1)
        const enRetard = reclamee && !depot && new Date(semaine.date_limite) < new Date()
        const texte = depot
          ? depot.statut === 'en_retard' ? `Semaine ${semaine.numero} — déposé en retard` : `Semaine ${semaine.numero} — déposé ✓`
          : reclamee
            ? `Semaine ${semaine.numero} — à déposer avant ${limite}`
            : `Semaine ${semaine.numero} — dépôt libre, rien n’est réclamé`
        fragmentTaches.push({ texte, depose: !!depot, enRetard, pistes: [], classe: insc.classe_nom, inscriptionId: insc.id })
      }

      if (aModule(insc.classe_id, 'codex')) {
        const { data: codex } = await admin.from('codex_sessions').select('id').eq('classe_id', insc.classe_id).in('statut', ['phase_1', 'phase_2']).limit(1).maybeSingle()
        if (codex?.id) codexEnCours.push({ id: codex.id as string, classe: insc.classe_nom })
      }
      if (aModule(insc.classe_id, 'quazian')) {
        const { data: quizz } = await admin.from('quazian_quizzes').select('id').eq('classe_id', insc.classe_id).eq('statut', 'lance').limit(1).maybeSingle()
        if (quizz?.id) quizzEnCours.push({ id: quizz.id as string, classe: insc.classe_nom })
      }

      // Aletheia : au moins un livre dont toutes les semaines ne sont pas terminées.
      if (aModule(insc.classe_id, 'aletheia')) {
        const livres = (await livresPourClasse(admin, insc.classe_id)).filter((l) => l.semaines.length > 0)
        // (perf #2) livresPourClasse a déjà les séances exposées → on les passe pour éviter un
        // modeExposition redondant par livre.
        const done = await Promise.all(livres.map((l) => toutesSemainesDone(admin, user!.id, l.id, insc.classe_id, l.semaines.map((s) => s.semaine))))
        if (done.some((d) => !d)) aletheiaAFaire.push({ classe: insc.classe_nom })
      }
    }

    // Pistes du dernier retour (analyse publiée la plus récente de cette inscription).
    // `fragmentTaches` ne contient déjà que des inscriptions dont la classe a le
    // module : la boucle porte son propre périmètre.
    for (const ft of fragmentTaches) {
      const { data: depots } = await admin.from('fragments_depots').select('id').eq('inscription_id', ft.inscriptionId)
      const depotIds = (depots ?? []).map((d) => d.id as string)
      const { data: derniere } = depotIds.length > 0
        ? await admin.from('fragments_analyses').select('id').eq('statut', 'publiee').in('depot_id', depotIds).order('created_at', { ascending: false }).limit(1).maybeSingle()
        : { data: null }
      if (derniere) {
        const { data: ps } = await admin
          .from('fragments_pistes')
          .select('contenu')
          .eq('analyse_id', derniere.id)
          .eq('statut', 'proposee')
          .order('created_at')
          .limit(3)
        ft.pistes = (ps ?? []).map((p) => p.contenu as string)
      }
    }

    // Flashcards dues — via la même dérivation de visibilité que la file de révision
    // (sinon on comptait des cartes d'unités non publiées / non assignées à l'élève).
    // `chargerStatsRevision` lit le contexte de classe : il agrège de lui-même en
    // état « Toutes », d'où un seul appel ici et un compteur unique.
    if (uneClasseA('quazian')) cartesDues = (await chargerStatsRevision()).dues

    // Semaine calendaire en cours (depuis le semestre actif + vacances).
    const { data: semCal } = await admin.from('semesters').select('id, start_date, end_date').eq('is_active', true).maybeSingle()
    if (semCal) {
      const { data: hols } = await admin.from('holidays').select('label, start_date, end_date').eq('semester_id', semCal.id)
      const today = jourDansFuseau(new Date(), await lireFuseau())
      const wk = calculerGrilleSemaines(semCal, hols ?? []).find((w) => w.start <= today && today <= w.end)
      if (wk) {
        semaineCourante = {
          label: wk.isVacation ? `Vacances${wk.vacanceLabel ? ` — ${wk.vacanceLabel}` : ''}` : `Semaine ${wk.pedagogicalNumber}`,
          debut: wk.start,
          fin: wk.end,
          vacances: wk.isVacation,
        }
      }
    }
  }

  // ── ⭐⭐ LE « À FAIRE » DE LA SEMAINE — LA TUILE QUI NAÎT DE L'ASSIGNATION ───
  // C6-L2. « Sur son tableau de bord, l'élève voit un "à faire" DÈS QU'IL A DES
  // EXERCICES ASSIGNÉS. Il clique, et arrive sur l'écran de sa semaine. » (`07-` §2)
  //
  // ⛔⛔ LE TROU QUE CETTE LECTURE BOUCHE, ET IL SE CONSTATAIT EN UNE LECTURE :
  //    AUCUNE des six tuiles de ce tableau ne naissait d'un exercice assigné.
  //    Ce fichier n'importait ni `exercices_depots`, ni `exercicesMaisonDeLEleve`.
  //    L'élève découvrait donc son travail exercice par exercice, sans jamais
  //    voir le volume de sa semaine.
  //
  // ⚠️ CE N'EST PAS LE SIGNAL DE LANCEMENT (`utils/examens/signal.ts`, C4-L9) :
  //    celui-là naît du LANCEMENT par le professeur, celui-ci de l'ASSIGNATION.
  //    Deux événements, deux signaux — on n'en fabrique pas un seul pour les deux.
  //
  // ⚠️ LA PORTE EST LUE DANS `exercicesMaisonDeLEleve`, pas ici : la tuile porte
  //    un lien, et un lien vers un écran fermé est une promesse cassée.
  // `lireFuseau` est mémoïsé (`cache`) : l'appeler ici ne coûte pas une lecture de plus.
  const fuseauEcole = await lireFuseau()
  const cycleLundi = toISODate(lundiOnOrBefore(jourDansFuseau(new Date(), fuseauEcole)))
  const semaines = enContexte.length > 0
    ? await Promise.all(enContexte.map(async (i) => ({
      classe: i.classe_nom,
      signal: await signalDeLaSemaine(admin, user!.id, i.classe_id, cycleLundi, fuseauEcole, new Date()),
    })))
    : []

  // ── ⭐ LA FICHE « SERVIE UNE FOIS — À LA RENTRÉE » (`06-` §5) ───────────────
  // *Consultable* est une page ; *servie une fois* est une POUSSÉE, au premier
  // passage. Le tableau de bord est la seule surface de poussée de l'élève.
  // ⚠️ La marque vit sur `profiles` (`c6_l2_marques_eleve.sql`) ; NULL = jamais
  //    servie. La tuile s'éteint dès qu'il a ouvert ses fiches.
  const fichesVues = enContexte.length > 0 ? await fichesDejaServies(admin, user!.id) : true

  // ⛔⛔ ARBITRAGE ④ DE LOUIS, 28/08 — LES LETTRES DE FRAGMENTS ONT QUITTÉ CE
  //    TABLEAU DE BORD, ET ELLES RESTENT DANS LEUR MODULE.
  //    « C'est normal, c'est voulu, mais dans le module Fragments seulement —
  //      si on les met au tableau de bord, on risque de les faire se mélanger. »
  //    Le bloc « Ta progression » affichait ici trois lettres A→E (Découvertes ·
  //    Sources · Réflexions), converties par `utils/notation.ts`, SANS OPT-IN —
  //    quand le `06-` §5 dit « côté élève, par défaut : PAS DE LETTRE », et que
  //    « une lettre affichée par défaut serait lue comme une note ».
  //    ⚠️ LE MOTIF EXACT EST LE MÉLANGE : le profil de compétences porte lui
  //       aussi des lettres, sous trois conditions (C6-L2). Deux systèmes de
  //       lettres côte à côte sur le même écran se seraient confondus.
  //    ⭐ Elles vivent toujours à « Ton parcours »
  //       (`app/eleve/modules/fragments-erudition/page.tsx`) : rien n'y a été
  //       touché — ce lot RETIRE d'ici, il ne déplace rien.

  // ── Retours d'examen à lire (passation en classe) ───────────────────────────
  // ⭐⭐ CE QUE CETTE LECTURE RÉPARE, ET IL A ÉTÉ MESURÉ EN PROD LE 27/08 :
  //    quatorze retours d'examen diagnostique PUBLIÉS, `lu_at` NULL sur les
  //    quatorze. « Le retour devient visible quand il coche la case de
  //    publication, AVEC OBLIGATION POUR L'ÉLÈVE DE VALIDER SA LECTURE »
  //    (`02-` §6.D, étape 17) — et RIEN ne rappelait cette obligation à l'élève :
  //    `utils/retours-lus.ts` ne lit que `codex_travaux` (la synthèse en classe),
  //    jamais `exercices_retours`. La tuile « à faire » ne s'allumait donc jamais.
  //
  // ⚠️ LA PORTE EST LUE DANS `retoursDExamenALire`, pas ici : la tuile porte un
  //    lien, et un lien vers un écran fermé est une promesse cassée.
  const examensALire = enContexte.length > 0
    ? await retoursDExamenALire(admin, user!.id)
    : []

  // ── Modules accessibles (pour « Mes mondes ») ───────────────────────────────
  // Accès & classes · L1 — les modules DES CLASSES EN CONTEXTE : en état classe,
  // seuls ceux de CETTE classe ; en état « Toutes », `enContexte` porte toutes
  // les inscriptions, donc l'union — qui y reste juste, chaque module demandant
  // ensuite sa classe via `ChoixClasseModule`.
  const idsAccessibles = await moduleIdsDesClasses(supabase, enContexte.map((i) => i.classe_id))
  const { data: mods } = idsAccessibles.size > 0
    ? await supabase.from('modules').select('id, slug, nom, description, actif').in('id', [...idsAccessibles])
    : { data: [] as ModuleInfo[] }
  // Scriptorium élève est GATÉ (RAG L5) : dévoilé seulement si rag_actif.
  const masquesEleve = (await lireReglagesRag(createAdminClient())).actif ? [] : ['scriptorium']
  const modulesActifs = (mods ?? []).filter((m): m is ModuleInfo => !!m && m.actif === true && !masquesEleve.includes(m.slug))

  // ── Construction des tâches priorisées ──────────────────────────────────────
  // En état « Toutes », chaque tâche porte sa classe (`classe`) et une clé qui la
  // distingue de sa jumelle de l'autre classe.
  const taches: Tache[] = []
  for (const q of quizzEnCours) taches.push({
    cle: `quizz-${q.id}`, module: 'quazian', titre: 'Quizz en cours', detail: 'Un quizz est ouvert en ce moment.',
    href: `/eleve/modules/quazian/quizz/${q.id}`, cta: 'Participer au quizz', urgence: 100,
    badge: { texte: 'en direct', ton: 'ok', pulse: true }, classe: q.classe,
  })
  for (const c of codexEnCours) taches.push({
    cle: `codex-${c.id}`, module: 'codex', titre: 'Synthèse Codex', detail: 'Une séance de synthèse est en cours.',
    href: `/eleve/modules/codex/synthese/${c.id}`, cta: 'Rejoindre la séance', urgence: 95,
    badge: { texte: 'en direct', ton: 'ok', pulse: true }, classe: c.classe,
  })
  for (const f of fragmentTaches.filter((f) => !f.depose)) taches.push({
    cle: `fragment-${f.inscriptionId}`, module: 'fragments', titre: "Fragments d'érudition", detail: f.texte,
    href: `/eleve/modules/fragments-erudition?inscription=${f.inscriptionId}`,
    cta: f.enRetard ? 'Déposer (en retard)' : 'Déposer mon fragment',
    urgence: f.enRetard ? 90 : 70,
    badge: f.enRetard ? { texte: 'en retard', ton: 'retard' } : { texte: 'à rendre', ton: 'attention' },
    pistes: f.pistes, classe: f.classe,
  })
  for (const e of examensALire) {
    // Accès & classes · L1 — on ne dérive AUCUNE tâche d'un module hors
    // périmètre. ⚠️ `exercices.classe_id` est NULLABLE (`c4_l1_schema.sql`) :
    // une instance sans classe n'est pas « l'autre classe », elle passe dès
    // qu'UNE classe en contexte a le module — même règle que
    // `visibleDansLaClasse`, qui la sert déjà côté onglet.
    const accessible = e.classeId == null
      ? uneClasseA(e.atelier)
      : enContexte.some((i) => i.classe_id === e.classeId) && aModule(e.classeId, e.atelier)
    if (!accessible) continue
    taches.push({
      cle: `examen-retour-${e.depotId}`,
      module: e.atelier,
      titre: 'Retour d’examen à lire',
      detail: e.titre,
      href: e.href,
      cta: 'Lire mon retour',
      // Au-dessus d'un fragment en retard (90) : c'est une OBLIGATION, pas une
      // échéance — et elle reste sous les deux séances « en direct » (100, 95),
      // qui se passent, elles, à la minute.
      urgence: 92,
      badge: { texte: 'à lire', ton: 'attention' },
      classe: enContexte.find((i) => i.classe_id === e.classeId)?.classe_nom,
    })
  }
  for (const { classe, signal } of semaines) {
    if (signal.aFaire === 0) continue
    taches.push({
      cle: `semaine-${classe}`,
      // ⭐ La semaine couvre LES DEUX ateliers : sa tuile ne porte donc le sceau
      //    d'aucun des deux. Codex est le pigment du travail écrit, et c'est là
      //    que mène la majorité des dépôts maison ; l'atelier de CHAQUE exercice
      //    se montre, lui, sur l'écran de la semaine (`01-` §2 : « pendant le
      //    cycle, l'atelier est un attribut visuel, jamais un lieu »).
      module: 'codex',
      titre: 'Mes exercices de la semaine',
      detail: signal.total === signal.aFaire
        ? `${signal.total} exercice${signal.total > 1 ? 's' : ''} à faire cette semaine.`
        : `${signal.aFaire} exercice${signal.aFaire > 1 ? 's' : ''} sur ${signal.total} te reste${signal.aFaire > 1 ? 'nt' : ''} à faire.`,
      href: '/eleve/semaine',
      cta: 'Voir ma semaine',
      // ⚠️ OÙ CETTE TUILE SE PLACE, ET POURQUOI. Le barème du tableau est :
      //    quizz en direct 100 · synthèse en direct 95 · retour d'examen à lire
      //    92 · fragment en retard 90 · fragment dû 70 · flashcards 50 · lecture
      //    40. Elle reste SOUS les deux séances « en direct », qui se passent à
      //    la minute, et SOUS l'obligation de lecture d'un retour, qui est une
      //    obligation et non une échéance. Elle passe JUSTE AU-DESSUS de
      //    Fragments parce que le cycle d'exercices est le travail hebdomadaire
      //    que le routeur compose, et que cette tuile est LE SEUL endroit d'où
      //    son volume se voit — « sans lui, l'élève découvre son travail
      //    exercice par exercice » (`07-` §2).
      urgence: signal.enRetard ? 91 : 75,
      badge: signal.enRetard
        ? { texte: 'en retard', ton: 'retard' }
        : { texte: `${signal.aFaire} à faire`, ton: 'attention' },
      classe,
    })
  }
  // ⭐ « Servie une fois, à la rentrée » — la poussée, et elle s'éteint seule.
  // ⚠️ L'URGENCE LA PLUS BASSE DU TABLEAU (30, sous la lecture Aletheia à 40) :
  //    découvrir ses compétences n'est jamais urgent, et cette tuile ne doit
  //    jamais passer devant un travail à rendre.
  if (!fichesVues) taches.push({
    cle: 'fiches-competences',
    module: 'codex',
    titre: 'Les six compétences',
    detail: 'Ce qu’on regarde dans ton travail, expliqué en une page par compétence.',
    href: '/eleve/moi/competences',
    cta: 'Les découvrir',
    urgence: 30,
    badge: { texte: 'à lire une fois', ton: 'muet' },
  })
  if (cartesDues > 0) taches.push({
    cle: 'cartes', module: 'quazian', titre: 'Flashcards à réviser',
    detail: `${cartesDues} carte${cartesDues > 1 ? 's' : ''} à revoir aujourd'hui.`,
    href: '/eleve/modules/quazian', cta: `Réviser mes ${cartesDues} carte${cartesDues > 1 ? 's' : ''}`, urgence: 50,
    badge: { texte: `${cartesDues} due${cartesDues > 1 ? 's' : ''}`, ton: 'attention' },
  })
  for (const [i, a] of aletheiaAFaire.entries()) taches.push({
    cle: `aletheia-${i}`, module: 'aletheia', titre: 'Lecture à poursuivre', detail: 'Reprends ta lecture là où tu en étais.',
    href: '/eleve/modules/aletheia', cta: 'Continuer ma lecture', urgence: 40,
    badge: { texte: 'Aletheia', ton: 'muet' }, classe: a.classe,
  })
  taches.sort((a, b) => b.urgence - a.urgence)
  const hero = taches[0] ?? null
  const ensuite = taches.slice(1)

  // « Mes mondes » : état dérivé (a-t-il une tâche en cours ?).
  const modulesAvecTache = new Set(taches.map((t) => t.module))
  const mondes = modulesActifs.map((m) => ({
    slug: m.slug,
    nom: m.nom,
    sceau: SCEAU[m.slug] as ModuleSceau | undefined,
    aFaire: SCEAU[m.slug] ? modulesAvecTache.has(SCEAU[m.slug] as Monde) : false,
  }))

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-titre text-2xl text-encre">Bonjour, {profile?.display_name} !</h2>
        {enContexte.length > 0 && (
          <p className="text-muet text-sm mt-0.5">
            {toutes ? 'Toutes les classes' : active?.classe_nom}
            {semaineCourante && <span> · {semaineCourante.label} · {fmtJourCourt(semaineCourante.debut)}–{fmtJourCourt(semaineCourante.fin)}</span>}
          </p>
        )}
      </div>

      {enContexte.length === 0 ? (
        <div className="bg-surface border border-bordure rounded-xl p-8 text-center text-encre-douce text-sm">
          Tu n&apos;es inscrit dans aucune classe pour l&apos;instant.<br />Ton professeur t&apos;y ajoutera bientôt.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] items-start">
          {/* ── Colonne principale : héros + ensuite ──────────────────────── */}
          <div className="space-y-6 min-w-0">
            <section>
              {hero ? (
                <article data-module={hero.module} className="bg-surface border border-bordure rounded-xl overflow-hidden">
                  <div className="h-1.5 bg-pigment" />
                  <div className="p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-ui text-xs tracking-[0.1em] text-pigment uppercase">À faire maintenant</p>
                      {hero.badge && <Badge {...hero.badge} />}
                    </div>
                    <h4 className="font-titre text-2xl text-encre leading-tight mt-2">{hero.titre}</h4>
                    <p className="text-sm text-encre-douce mt-1">
                      {hero.detail}
                      {/* La classe n'est dite que quand le tableau agrège : dans
                          l'état classe, elle est déjà en tête d'écran. */}
                      {toutes && hero.classe && <span className="text-muet"> · {hero.classe}</span>}
                    </p>

                    {hero.pistes && hero.pistes.length > 0 && (
                      <div className="mt-3 border-t border-bordure pt-3">
                        <p className="text-xs text-muet mb-1.5">Pistes à suivre (dernier retour)</p>
                        <ul className="space-y-1">
                          {hero.pistes.map((p, i) => (
                            <li key={i} className="text-sm text-encre-douce flex gap-2"><span className="text-bordure">→</span><span>{p}</span></li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <Link
                      href={hero.href}
                      className="inline-flex items-center gap-1.5 mt-4 bg-bouton text-surface font-ui text-sm font-medium px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
                    >
                      {hero.cta} <span aria-hidden>→</span>
                    </Link>
                  </div>
                </article>
              ) : (
                <div className="bg-surface border border-bordure rounded-xl p-6 text-sm text-muet">
                  Rien d&apos;urgent pour l&apos;instant. Tu peux réviser tes cartes ou explorer tes modules.
                </div>
              )}
            </section>

            {ensuite.length > 0 && (
              <section>
                <h3 className="font-ui text-xs tracking-[0.1em] text-muet uppercase mb-2">Ensuite cette semaine</h3>
                <ul className="bg-surface border border-bordure rounded-xl divide-y divide-bordure">
                  {ensuite.map((t) => (
                    <li key={t.cle}>
                      <Link
                        href={t.href}
                        data-module={t.module}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-parchemin-fonce transition-colors"
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-pigment shrink-0" aria-hidden />
                        <span className="text-sm text-encre flex-1 min-w-0 truncate">
                          {t.titre}
                          {toutes && t.classe && <span className="text-muet"> · {t.classe}</span>}
                        </span>
                        {t.badge && <Badge {...t.badge} />}
                        <span className="text-bordure shrink-0" aria-hidden>→</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* ── Colonne droite : mes mondes + progression ─────────────────── */}
          <aside className="space-y-6 min-w-0">
            {mondes.length > 0 && (
              <section>
                <h3 className="font-ui text-xs tracking-[0.1em] text-muet uppercase mb-2">Mes mondes</h3>
                <div className="bg-surface border border-bordure rounded-xl divide-y divide-bordure">
                  {mondes.map((m) => (
                    <Link
                      key={m.slug}
                      href={`/eleve/modules/${m.slug}`}
                      data-module={m.sceau}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-parchemin-fonce transition-colors"
                    >
                      {m.sceau ? <Pastille module={m.sceau} size={34} /> : <span className="w-[34px] h-[34px] rounded-full bg-parchemin-fonce shrink-0" />}
                      <span className={`flex-1 truncate ${m.sceau ? 'font-marque text-sm font-semibold tracking-wide text-pigment' : 'font-ui text-sm text-encre'}`}>
                        {m.sceau ? m.nom.toUpperCase() : m.nom}
                      </span>
                      {m.aFaire
                        ? <Badge texte="À faire" ton="attention" />
                        : <span className="text-xs text-muet whitespace-nowrap">à jour</span>}
                    </Link>
                  ))}
                </div>
              </section>
            )}

          </aside>
        </div>
      )}
    </div>
  )
}
