import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { moduleIdsAccessibles } from '@/utils/acces'
import { contexteClasseEleve } from './contexte-classe'
import SelecteurClasseEleve from './SelecteurClasseEleve'
import { noteVersLettre, COULEUR_LETTRE, type LettreSection } from '@/utils/notation'
import { chargerStatsRevision } from './modules/quazian/actions'

type ModuleInfo = { id: string; slug: string; nom: string; description: string | null; actif: boolean }
const MODULES_MASQUES_ELEVE = ['scriptorium']

interface SectionProg { label: string; lettre: LettreSection }

function BadgeLettre({ label, lettre }: SectionProg) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span className="text-stone-600">{label}</span>
      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${COULEUR_LETTRE[lettre]}`}>{lettre}</span>
    </span>
  )
}

export default async function TableauDeBordEleve() {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', user!.id).single()

  const { inscriptions, active } = await contexteClasseEleve(supabase, user!.id)

  // ── Zone « À faire » (scopée sur l'inscription active) ─────────────────────
  let fragmentTache: { texte: string; depose: boolean; pistes: string[] } | null = null
  let cartesDues = 0
  let codexEnCoursId: string | null = null
  let quizzEnCoursId: string | null = null

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

  const rienAFaire = active && !codexEnCoursId && !quizzEnCoursId && cartesDues === 0 && (!fragmentTache || fragmentTache.depose)

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-serif text-stone-900 mb-1">Bonjour, {profile?.display_name} !</h2>
          {active && <p className="text-stone-500 text-sm">{active.classe_nom}</p>}
        </div>
        {active && <SelecteurClasseEleve inscriptions={inscriptions} activeId={active.id} />}
      </div>

      {!active ? (
        <div className="bg-white border border-stone-200 rounded-xl p-8 text-center text-stone-600 text-sm">
          Tu n&apos;es inscrit dans aucune classe pour l&apos;instant.<br />Ton professeur t&apos;y ajoutera bientôt.
        </div>
      ) : (
        <>
          {/* À FAIRE */}
          <section>
            <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wide mb-3">À faire</h3>
            <div className="space-y-3">
              {fragmentTache && (
                <div className={`bg-white border rounded-xl p-4 ${fragmentTache.depose ? 'border-stone-200' : 'border-amber-200'}`}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-stone-800">Fragments d&apos;érudition</p>
                    <Link href="/eleve/modules/fragments-erudition" className="text-xs text-stone-500 hover:text-stone-800 underline">Ouvrir →</Link>
                  </div>
                  <p className={`text-sm mt-1 ${fragmentTache.depose ? 'text-stone-500' : 'text-amber-700'}`}>{fragmentTache.texte}</p>
                  {fragmentTache.pistes.length > 0 && (
                    <div className="mt-3 border-t border-stone-100 pt-3">
                      <p className="text-xs text-stone-400 mb-1.5">Pistes à suivre (dernier retour)</p>
                      <ul className="space-y-1">
                        {fragmentTache.pistes.map((p, i) => (
                          <li key={i} className="text-sm text-stone-600 flex gap-2"><span className="text-stone-300">→</span><span>{p}</span></li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {cartesDues > 0 && (
                <Link href="/eleve/modules/quazian" className="block bg-white border border-amber-200 rounded-xl p-4 hover:border-amber-300 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-stone-800">Flashcards à réviser</p>
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{cartesDues} carte{cartesDues > 1 ? 's' : ''} due{cartesDues > 1 ? 's' : ''}</span>
                  </div>
                </Link>
              )}

              {codexEnCoursId && (
                <Link href={`/eleve/modules/codex/seance/${codexEnCoursId}`} className="block bg-white border border-green-200 rounded-xl p-4 hover:border-green-300 transition-colors">
                  <p className="text-sm font-medium text-stone-800">Séance Codex en cours <span className="text-xs text-green-600 ml-1">· en direct</span></p>
                </Link>
              )}

              {quizzEnCoursId && (
                <Link href={`/eleve/modules/quazian/quizz/${quizzEnCoursId}`} className="block bg-white border border-violet-200 rounded-xl p-4 hover:border-violet-300 transition-colors">
                  <p className="text-sm font-medium text-stone-800">Quizz en cours</p>
                </Link>
              )}

              {rienAFaire && (
                <div className="bg-white border border-stone-200 rounded-xl p-4 text-sm text-stone-500">Rien d&apos;urgent pour l&apos;instant. Tu peux réviser ou explorer tes modules.</div>
              )}
            </div>
          </section>

          {/* PROGRESSION */}
          {progression && (progression.forts.length + progression.amelioration.length + progression.aTravailler.length > 0) && (
            <section>
              <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wide mb-3">Ta progression</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white border border-stone-200 rounded-xl p-4">
                  <p className="text-xs font-medium text-green-700 mb-2">Tes points forts</p>
                  {progression.forts.length > 0 ? (
                    <div className="space-y-1.5">{progression.forts.map((s) => <div key={s.label}><BadgeLettre {...s} /></div>)}</div>
                  ) : <p className="text-sm text-stone-300">—</p>}
                </div>
                <div className="bg-white border border-stone-200 rounded-xl p-4">
                  <p className="text-xs font-medium text-blue-700 mb-2">Où tu progresses</p>
                  {progression.amelioration.length > 0 ? (
                    <div className="space-y-1.5">{progression.amelioration.map((s) => <div key={s.label}><BadgeLettre {...s} /></div>)}</div>
                  ) : <p className="text-sm text-stone-300">—</p>}
                </div>
                <div className="bg-white border border-stone-200 rounded-xl p-4">
                  <p className="text-xs font-medium text-amber-700 mb-2">À travailler</p>
                  {progression.aTravailler.length > 0 ? (
                    <div className="space-y-1.5">{progression.aTravailler.map((s) => <div key={s.label}><BadgeLettre {...s} /></div>)}</div>
                  ) : <p className="text-sm text-stone-300">—</p>}
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* MODULES */}
      {modulesActifs.length > 0 && (
        <section>
          <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wide mb-3">Tes modules</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {modulesActifs.map((m) => (
              <Link key={m.id} href={`/eleve/modules/${m.slug}`} className="bg-white border border-stone-200 rounded-xl p-6 hover:border-stone-400 hover:shadow-sm transition-all group">
                <h3 className="font-medium text-stone-900 mb-1 group-hover:text-stone-700">{m.nom}</h3>
                {m.description && <p className="text-sm text-stone-500 leading-relaxed">{m.description}</p>}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
