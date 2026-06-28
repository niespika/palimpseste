import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { moduleIdsAccessibles, slugsModulesAccessibles } from '@/utils/acces'
import { contexteClasseEleve } from './contexte-classe'
import { noteVersLettre, type LettreSection } from '@/utils/notation'
import { calculerGrilleSemaines } from '@/utils/calendrier-grille'
import { jourDansFuseau, formatJour } from '@/utils/fuseau'
import { lireFuseau } from '@/utils/fuseau-serveur'
import { chargerStatsRevision } from './modules/quazian/actions'
import { livresPourClasse, toutesSemainesDone } from './modules/aletheia/data'
import Pastille, { type ModuleSceau } from '@/components/Pastille'

// Dates PURES (bornes de semaine) → UTC, agnostique au fuseau.
const fmtJourCourt = (d: string) => formatJour(d, { day: 'numeric', month: 'short' })

type ModuleInfo = { id: string; slug: string; nom: string; description: string | null; actif: boolean }
const MODULES_MASQUES_ELEVE = ['scriptorium']

// slug en base → clé de monde (les vars charte / sceaux utilisent « fragments »).
const SCEAU: Record<string, ModuleSceau> = {
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
}

const TON_BADGE: Record<Ton, string> = {
  retard: 'bg-retard-teinte text-retard',
  attention: 'bg-attention-teinte text-attention',
  info: 'bg-info-teinte text-info',
  ok: 'bg-ok-teinte text-ok',
  muet: 'bg-parchemin-fonce text-muet',
}

const TEXTE_LETTRE: Record<LettreSection, string> = {
  A: 'text-ok', B: 'text-info', C: 'text-attention', D: 'text-attention', E: 'text-retard',
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

  const { active } = await contexteClasseEleve(supabase, user!.id)

  // Modules réellement accessibles à l'élève : on ne dérive AUCUNE tâche/échéance
  // d'un module hors périmètre (ex. pilote Aletheia-only ne voit pas Fragments,
  // dont la semaine est globale au semestre). Réutilise le modèle d'accès existant.
  const slugs = await slugsModulesAccessibles(supabase, user!.id)
  const accFragments = slugs.has('fragments-erudition')
  const accQuazian = slugs.has('quazian')
  const accCodex = slugs.has('codex')
  const accAletheia = slugs.has('aletheia')

  // ── Collecte (scopée sur l'inscription active) ─────────────────────────────
  let fragmentTache: { texte: string; depose: boolean; enRetard: boolean; pistes: string[] } | null = null
  let cartesDues = 0
  let codexEnCoursId: string | null = null
  let quizzEnCoursId: string | null = null
  let aletheiaAFaire = false
  let semaineCourante: { label: string; debut: string; fin: string; vacances: boolean } | null = null

  if (active) {
    // Semaine ouverte scopée au semestre actif (évite une semaine restée ouverte
    // d'un semestre précédent).
    const { data: semActif } = await supabase.from('semesters').select('id').eq('is_active', true).maybeSingle()
    let reqSemaine = supabase
      .from('fragments_semaines')
      .select('id, numero, date_limite')
      .eq('ouverte', true)
    if (semActif?.id) reqSemaine = reqSemaine.eq('semestre_id', semActif.id)
    const { data: semaine } = await reqSemaine
      .order('numero', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (semaine && accFragments) {
      const { data: depot } = await supabase
        .from('fragments_depots')
        .select('id, statut')
        .eq('inscription_id', active.id)
        .eq('semaine_id', semaine.id)
        .maybeSingle()
      // date_limite est une date PURE → libellé jour (UTC), sans heure trompeuse.
      const limite = formatJour(semaine.date_limite as string, { weekday: 'long', day: 'numeric', month: 'long' })
      const enRetard = !depot && new Date(semaine.date_limite) < new Date()
      const texte = depot
        ? depot.statut === 'en_retard' ? `Semaine ${semaine.numero} — déposé en retard` : `Semaine ${semaine.numero} — déposé ✓`
        : `Semaine ${semaine.numero} — à déposer avant ${limite}`
      fragmentTache = { texte, depose: !!depot, enRetard, pistes: [] }
    }

    // Pistes du dernier retour (analyse publiée la plus récente de cette inscription)
    if (accFragments && fragmentTache) {
      const { data: depots } = await admin.from('fragments_depots').select('id').eq('inscription_id', active.id)
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
        fragmentTache.pistes = (ps ?? []).map((p) => p.contenu as string)
      }
    }

    // Flashcards dues — via la même dérivation de visibilité que la file de révision
    // (sinon on comptait des cartes d'unités non publiées / non assignées à l'élève).
    if (accQuazian) cartesDues = (await chargerStatsRevision()).dues

    if (accCodex) {
      const { data: codex } = await admin.from('codex_sessions').select('id').eq('classe_id', active.classe_id).in('statut', ['phase_1', 'phase_2']).limit(1).maybeSingle()
      codexEnCoursId = (codex?.id as string) ?? null
    }
    if (accQuazian) {
      const { data: quizz } = await admin.from('quazian_quizzes').select('id').eq('classe_id', active.classe_id).eq('statut', 'lance').limit(1).maybeSingle()
      quizzEnCoursId = (quizz?.id as string) ?? null
    }

    // Aletheia : au moins un livre dont toutes les semaines ne sont pas terminées.
    if (accAletheia) {
      const livres = (await livresPourClasse(admin, active.classe_id)).filter((l) => l.semaines.length > 0)
      const done = await Promise.all(livres.map((l) => toutesSemainesDone(admin, user!.id, l.id)))
      aletheiaAFaire = done.some((d) => !d)
    }

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

  // ── Progression : moyenne par section (Fragments) → lettre, en une bande ────
  const sectionsProg: { label: string; lettre: LettreSection }[] = []
  if (active && accFragments) {
    const { data: depots } = await admin
      .from('fragments_depots')
      .select('id, fragments_semaines(numero)')
      .eq('inscription_id', active.id)
    const numParDepot = new Map((depots ?? []).map((d) => [d.id as string, (d.fragments_semaines as unknown as { numero: number } | null)?.numero ?? 0]))
    const depotIds = (depots ?? []).map((d) => d.id as string)
    const { data: analyses } = depotIds.length > 0
      ? await admin.from('fragments_analyses').select('depot_id, note_decouvertes, note_sources, note_reflexions').eq('statut', 'publiee').in('depot_id', depotIds)
      : { data: [] }
    const triees = (analyses ?? [])
      .map((a) => ({ ...a, num: numParDepot.get(a.depot_id as string) ?? 0 }))
      .sort((a, b) => a.num - b.num)

    if (triees.length > 0) {
      const sections = [
        { key: 'note_decouvertes', label: 'Découvertes' },
        { key: 'note_sources', label: 'Sources' },
        { key: 'note_reflexions', label: 'Réflexions' },
      ] as const
      for (const s of sections) {
        const vals = triees.map((a) => a[s.key] as number | null).filter((v): v is number => v != null)
        if (vals.length === 0) continue
        const avg = vals.reduce((x, y) => x + y, 0) / vals.length
        const lettre = noteVersLettre(Math.round(avg)) ?? 'C'
        sectionsProg.push({ label: s.label, lettre })
      }
    }
  }

  // ── Modules accessibles (pour « Mes mondes ») ───────────────────────────────
  const idsAccessibles = await moduleIdsAccessibles(supabase, user!.id)
  const { data: mods } = idsAccessibles.size > 0
    ? await supabase.from('modules').select('id, slug, nom, description, actif').in('id', [...idsAccessibles])
    : { data: [] as ModuleInfo[] }
  const modulesActifs = (mods ?? []).filter((m): m is ModuleInfo => !!m && m.actif === true && !MODULES_MASQUES_ELEVE.includes(m.slug))

  // ── Construction des tâches priorisées ──────────────────────────────────────
  const taches: Tache[] = []
  if (quizzEnCoursId) taches.push({
    cle: 'quizz', module: 'quazian', titre: 'Quizz en cours', detail: 'Un quizz est ouvert en ce moment.',
    href: `/eleve/modules/quazian/quizz/${quizzEnCoursId}`, cta: 'Participer au quizz', urgence: 100,
    badge: { texte: 'en direct', ton: 'ok', pulse: true },
  })
  if (codexEnCoursId) taches.push({
    cle: 'codex', module: 'codex', titre: 'Synthèse Codex', detail: 'Une séance de synthèse est en cours.',
    href: `/eleve/modules/codex/synthese/${codexEnCoursId}`, cta: 'Rejoindre la séance', urgence: 95,
    badge: { texte: 'en direct', ton: 'ok', pulse: true },
  })
  if (fragmentTache && !fragmentTache.depose) taches.push({
    cle: 'fragment', module: 'fragments', titre: "Fragments d'érudition", detail: fragmentTache.texte,
    href: '/eleve/modules/fragments-erudition',
    cta: fragmentTache.enRetard ? 'Déposer (en retard)' : 'Déposer mon fragment',
    urgence: fragmentTache.enRetard ? 90 : 70,
    badge: fragmentTache.enRetard ? { texte: 'en retard', ton: 'retard' } : { texte: 'à rendre', ton: 'attention' },
    pistes: fragmentTache.pistes,
  })
  if (cartesDues > 0) taches.push({
    cle: 'cartes', module: 'quazian', titre: 'Flashcards à réviser',
    detail: `${cartesDues} carte${cartesDues > 1 ? 's' : ''} à revoir aujourd'hui.`,
    href: '/eleve/modules/quazian', cta: `Réviser mes ${cartesDues} carte${cartesDues > 1 ? 's' : ''}`, urgence: 50,
    badge: { texte: `${cartesDues} due${cartesDues > 1 ? 's' : ''}`, ton: 'attention' },
  })
  if (aletheiaAFaire) taches.push({
    cle: 'aletheia', module: 'aletheia', titre: 'Lecture à poursuivre', detail: 'Reprends ta lecture là où tu en étais.',
    href: '/eleve/modules/aletheia', cta: 'Continuer ma lecture', urgence: 40,
    badge: { texte: 'Aletheia', ton: 'muet' },
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
        {active && (
          <p className="text-muet text-sm mt-0.5">
            {active.classe_nom}
            {semaineCourante && <span> · {semaineCourante.label} · {fmtJourCourt(semaineCourante.debut)}–{fmtJourCourt(semaineCourante.fin)}</span>}
          </p>
        )}
      </div>

      {!active ? (
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
                    <p className="text-sm text-encre-douce mt-1">{hero.detail}</p>

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
                        <span className="text-sm text-encre flex-1 min-w-0 truncate">{t.titre}</span>
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

            {sectionsProg.length > 0 && (
              <section>
                <h3 className="font-ui text-xs tracking-[0.1em] text-muet uppercase mb-2">Ta progression</h3>
                <div className="bg-surface border border-bordure rounded-xl p-4 grid grid-cols-3 gap-2 text-center">
                  {sectionsProg.map((s) => (
                    <div key={s.label}>
                      <p className={`font-titre text-2xl leading-none ${TEXTE_LETTRE[s.lettre]}`}>{s.lettre}</p>
                      <p className="text-xs text-muet mt-1.5">{s.label}</p>
                    </div>
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
