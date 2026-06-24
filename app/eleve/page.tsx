import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { moduleIdsAccessibles } from '@/utils/acces'
import { contexteClasseEleve } from './contexte-classe'
import { noteVersLettre, COULEUR_LETTRE, type LettreSection } from '@/utils/notation'
import { calculerGrilleSemaines, jourParis } from '@/utils/calendrier-grille'
import { chargerStatsRevision } from './modules/quazian/actions'
import { livresPourClasse, toutesSemainesDone } from './modules/aletheia/data'

function fmtJourCourt(d: string) {
  return new Date(d + 'T00:00:00Z').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' })
}

type ModuleInfo = { id: string; slug: string; nom: string; description: string | null; actif: boolean }
const MODULES_MASQUES_ELEVE = ['scriptorium']

interface SectionProg { label: string; lettre: LettreSection }

function BadgeLettre({ label, lettre }: SectionProg) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span className="text-encre-douce">{label}</span>
      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${COULEUR_LETTRE[lettre]}`}>{lettre}</span>
    </span>
  )
}

export default async function TableauDeBordEleve() {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', user!.id).single()

  const { active } = await contexteClasseEleve(supabase, user!.id)

  // ── Zone « À faire » (scopée sur l'inscription active) ─────────────────────
  let fragmentTache: { texte: string; depose: boolean; pistes: string[] } | null = null
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

    if (semaine) {
      const { data: depot } = await supabase
        .from('fragments_depots')
        .select('id, statut')
        .eq('inscription_id', active.id)
        .eq('semaine_id', semaine.id)
        .maybeSingle()
      const limite = new Date(semaine.date_limite).toLocaleDateString('fr-FR', { weekday: 'long', hour: '2-digit', minute: '2-digit' })
      const texte = depot
        ? depot.statut === 'en_retard' ? `Semaine ${semaine.numero} — déposé en retard` : `Semaine ${semaine.numero} — déposé ✓`
        : `Semaine ${semaine.numero} — à déposer avant ${limite}`
      fragmentTache = { texte, depose: !!depot, pistes: [] }
    }

    // Pistes du dernier retour (analyse publiée la plus récente de cette inscription)
    const { data: depots } = await admin.from('fragments_depots').select('id').eq('inscription_id', active.id)
    const depotIds = (depots ?? []).map((d) => d.id as string)
    const { data: derniere } = depotIds.length > 0
      ? await admin.from('fragments_analyses').select('id').eq('statut', 'publiee').in('depot_id', depotIds).order('created_at', { ascending: false }).limit(1).maybeSingle()
      : { data: null }
    if (derniere && fragmentTache) {
      const { data: ps } = await admin
        .from('fragments_pistes')
        .select('contenu')
        .eq('analyse_id', derniere.id)
        .eq('statut', 'proposee')
        .order('created_at')
        .limit(3)
      fragmentTache.pistes = (ps ?? []).map((p) => p.contenu as string)
    }

    // Flashcards dues — via la même dérivation de visibilité que la file de révision
    // (sinon on comptait des cartes d'unités non publiées / non assignées à l'élève).
    cartesDues = (await chargerStatsRevision()).dues

    const { data: codex } = await admin.from('codex_sessions').select('id').eq('classe_id', active.classe_id).in('statut', ['phase_1', 'phase_2']).limit(1).maybeSingle()
    codexEnCoursId = (codex?.id as string) ?? null
    const { data: quizz } = await admin.from('quazian_quizzes').select('id').eq('classe_id', active.classe_id).eq('statut', 'lance').limit(1).maybeSingle()
    quizzEnCoursId = (quizz?.id as string) ?? null

    // Aletheia : au moins un livre dont toutes les semaines ne sont pas terminées.
    const livres = (await livresPourClasse(admin, active.classe_id)).filter((l) => l.semaines.length > 0)
    const done = await Promise.all(livres.map((l) => toutesSemainesDone(admin, user!.id, l.id)))
    aletheiaAFaire = done.some((d) => !d)

    // Semaine calendaire en cours (depuis le semestre actif + vacances).
    const { data: semCal } = await admin.from('semesters').select('id, start_date, end_date').eq('is_active', true).maybeSingle()
    if (semCal) {
      const { data: hols } = await admin.from('holidays').select('label, start_date, end_date').eq('semester_id', semCal.id)
      const today = jourParis(new Date())
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

  // ── Zone « Progression » (tendances des sections, inscription active) ──────
  let progression: { forts: SectionProg[]; amelioration: SectionProg[]; aTravailler: SectionProg[] } | null = null
  if (active) {
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
      const forts: SectionProg[] = [], amelioration: SectionProg[] = [], aTravailler: SectionProg[] = []
      for (const s of sections) {
        const vals = triees.map((a) => a[s.key] as number | null).filter((v): v is number => v != null)
        if (vals.length === 0) continue
        const avg = vals.reduce((x, y) => x + y, 0) / vals.length
        const lettre = noteVersLettre(Math.round(avg)) ?? 'C'
        const mid = Math.floor(vals.length / 2)
        const earlier = vals.slice(0, Math.max(1, mid))
        const recent = vals.slice(mid)
        const trend = recent.reduce((x, y) => x + y, 0) / recent.length - earlier.reduce((x, y) => x + y, 0) / earlier.length
        const entry: SectionProg = { label: s.label, lettre }
        if (avg >= 3) forts.push(entry)
        else if (trend >= 0.5 && vals.length >= 2) amelioration.push(entry)
        else if (avg < 2) aTravailler.push(entry)
        else amelioration.push(entry)
      }
      progression = { forts, amelioration, aTravailler }
    }
  }

  // ── Modules ────────────────────────────────────────────────────────────────
  const idsAccessibles = await moduleIdsAccessibles(supabase, user!.id)
  const { data: mods } = idsAccessibles.size > 0
    ? await supabase.from('modules').select('id, slug, nom, description, actif').in('id', [...idsAccessibles])
    : { data: [] as ModuleInfo[] }
  const modulesActifs = (mods ?? []).filter((m): m is ModuleInfo => !!m && m.actif === true && !MODULES_MASQUES_ELEVE.includes(m.slug))

  const rienAFaire = active && !codexEnCoursId && !quizzEnCoursId && cartesDues === 0 && !aletheiaAFaire && (!fragmentTache || fragmentTache.depose)

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-serif text-encre mb-1">Bonjour, {profile?.display_name} !</h2>
        {active && <p className="text-muet text-sm">{active.classe_nom}</p>}
      </div>

      {!active ? (
        <div className="bg-surface border border-bordure rounded-xl p-8 text-center text-encre-douce text-sm">
          Tu n&apos;es inscrit dans aucune classe pour l&apos;instant.<br />Ton professeur t&apos;y ajoutera bientôt.
        </div>
      ) : (
        <>
          {/* À FAIRE */}
          <section>
            <div className="flex items-baseline justify-between gap-3 mb-3">
              <h3 className="text-sm font-medium text-muet uppercase tracking-wide">À faire</h3>
              {semaineCourante && (
                <span className={`text-xs ${semaineCourante.vacances ? 'text-muet' : 'text-muet'}`}>
                  {semaineCourante.label} · {fmtJourCourt(semaineCourante.debut)}–{fmtJourCourt(semaineCourante.fin)}
                </span>
              )}
            </div>
            <div className="space-y-3">
              {fragmentTache && (
                <div data-module="fragments" className="bg-surface border border-bordure border-l-4 border-l-liseret rounded-xl p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-encre">Fragments d&apos;érudition</p>
                    <Link href="/eleve/modules/fragments-erudition" className="text-xs text-muet hover:text-encre underline">Ouvrir →</Link>
                  </div>
                  <p className={`text-sm mt-1 ${fragmentTache.depose ? 'text-muet' : 'text-attention'}`}>{fragmentTache.texte}</p>
                  {fragmentTache.pistes.length > 0 && (
                    <div className="mt-3 border-t border-bordure pt-3">
                      <p className="text-xs text-muet mb-1.5">Pistes à suivre (dernier retour)</p>
                      <ul className="space-y-1">
                        {fragmentTache.pistes.map((p, i) => (
                          <li key={i} className="text-sm text-encre-douce flex gap-2"><span className="text-bordure">→</span><span>{p}</span></li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {cartesDues > 0 && (
                <Link href="/eleve/modules/quazian" data-module="quazian" className="block bg-surface border border-bordure border-l-4 border-l-liseret rounded-xl p-4 hover:shadow-sm transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-encre">Flashcards à réviser</p>
                    <span className="text-xs bg-attention-teinte text-attention px-2 py-0.5 rounded-full">{cartesDues} carte{cartesDues > 1 ? 's' : ''} due{cartesDues > 1 ? 's' : ''}</span>
                  </div>
                </Link>
              )}

              {codexEnCoursId && (
                <Link href={`/eleve/modules/codex/synthese/${codexEnCoursId}`} data-module="codex" className="block bg-surface border border-bordure border-l-4 border-l-liseret rounded-xl p-4 hover:shadow-sm transition-colors">
                  <p className="text-sm font-medium text-encre">Synthèse Codex en cours <span className="text-xs text-ok ml-1">· en direct</span></p>
                </Link>
              )}

              {quizzEnCoursId && (
                <Link href={`/eleve/modules/quazian/quizz/${quizzEnCoursId}`} data-module="quazian" className="block bg-surface border border-bordure border-l-4 border-l-liseret rounded-xl p-4 hover:shadow-sm transition-colors">
                  <p className="text-sm font-medium text-encre">Quizz en cours</p>
                </Link>
              )}

              {aletheiaAFaire && (
                <Link href="/eleve/modules/aletheia" data-module="aletheia" className="block bg-surface border border-bordure border-l-4 border-l-liseret rounded-xl p-4 hover:shadow-sm transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-encre">Lecture à poursuivre</p>
                    <span className="text-xs text-muet">Aletheia →</span>
                  </div>
                </Link>
              )}

              {rienAFaire && (
                <div className="bg-surface border border-bordure rounded-xl p-4 text-sm text-muet">Rien d&apos;urgent pour l&apos;instant. Tu peux réviser ou explorer tes modules.</div>
              )}
            </div>
          </section>

          {/* PROGRESSION */}
          {progression && (progression.forts.length + progression.amelioration.length + progression.aTravailler.length > 0) && (
            <section>
              <h3 className="text-sm font-medium text-muet uppercase tracking-wide mb-3">Ta progression</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-surface border border-bordure rounded-xl p-4">
                  <p className="text-xs font-medium text-ok mb-2">Tes points forts</p>
                  {progression.forts.length > 0 ? (
                    <div className="space-y-1.5">{progression.forts.map((s) => <div key={s.label}><BadgeLettre {...s} /></div>)}</div>
                  ) : <p className="text-sm text-bordure">—</p>}
                </div>
                <div className="bg-surface border border-bordure rounded-xl p-4">
                  <p className="text-xs font-medium text-info mb-2">Où tu progresses</p>
                  {progression.amelioration.length > 0 ? (
                    <div className="space-y-1.5">{progression.amelioration.map((s) => <div key={s.label}><BadgeLettre {...s} /></div>)}</div>
                  ) : <p className="text-sm text-bordure">—</p>}
                </div>
                <div className="bg-surface border border-bordure rounded-xl p-4">
                  <p className="text-xs font-medium text-attention mb-2">À travailler</p>
                  {progression.aTravailler.length > 0 ? (
                    <div className="space-y-1.5">{progression.aTravailler.map((s) => <div key={s.label}><BadgeLettre {...s} /></div>)}</div>
                  ) : <p className="text-sm text-bordure">—</p>}
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* MODULES */}
      {modulesActifs.length > 0 && (
        <section>
          <h3 className="text-sm font-medium text-muet uppercase tracking-wide mb-3">Tes modules</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {modulesActifs.map((m) => (
              <Link key={m.id} href={`/eleve/modules/${m.slug}`} className="bg-surface border border-bordure rounded-xl p-6 hover:border-encre-douce hover:shadow-sm transition-all group">
                <h3 className="font-medium text-encre mb-1 group-hover:text-encre-douce">{m.nom}</h3>
                {m.description && <p className="text-sm text-muet leading-relaxed">{m.description}</p>}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
