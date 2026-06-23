import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { contexteClasseEleve } from '../contexte-classe'
import { calculerGrilleSemaines, lundiOnOrBefore, addDaysUTC, toISODate, jourParis } from '@/utils/calendrier-grille'
import { assemblerEvenements } from '@/utils/calendrier-evenements'
import { couleursParClasse } from '@/utils/calendrier-couleurs'

type Vue = 'mois' | 'semaine' | 'jour'
const JOURS = ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim']
const COULEUR_FRAGMENTS = '#f59e0b'
const COULEUR_NEUTRE = '#a8a29e'

const parse = (d: string) => new Date(d + 'T00:00:00Z')
const addMonths = (d: string, n: number) => { const x = parse(d); x.setUTCMonth(x.getUTCMonth() + n); return toISODate(x) }
const firstOfMonth = (d: string) => d.slice(0, 7) + '-01'
const lastOfMonth = (d: string) => { const x = parse(d); x.setUTCMonth(x.getUTCMonth() + 1, 0); return toISODate(x) }
const fmt = (d: string, opts: Intl.DateTimeFormatOptions) => parse(d).toLocaleDateString('fr-FR', { ...opts, timeZone: 'UTC' })

// Événement affiché (unifié : événements partagés color-codés par classe +
// échéances hebdo des Fragments propres à l'élève).
interface Evt { date: string; label: string; couleur: string; sousTitre: string | null }

export default async function CalendrierEleve({
  searchParams,
}: {
  searchParams: Promise<{ vue?: string; date?: string }>
}) {
  const sp = await searchParams
  const vue: Vue = sp.vue === 'semaine' || sp.vue === 'jour' ? sp.vue : 'mois'
  const today = jourParis(new Date())
  const anchor = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : today

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { inscriptions } = await contexteClasseEleve(supabase, user!.id)
  const classeIds = new Set(inscriptions.map((i) => i.classe_id))

  const admin = createAdminClient()
  const { data: sem } = await admin.from('semesters').select('id, name, start_date, end_date').eq('is_active', true).maybeSingle()
  const { data: hols } = sem ? await admin.from('holidays').select('label, start_date, end_date').eq('semester_id', sem.id) : { data: [] }
  const holidays = hols ?? []
  const grille = sem ? calculerGrilleSemaines(sem, holidays) : []
  const infoSemaine = new Map(grille.map((w) => [w.start, w]))
  const estVacance = (jour: string) => holidays.some((h) => h.start_date <= jour && jour <= h.end_date)

  // Couleurs des classes de l'élève (code couleur, indépendant du toggle).
  const { data: classes } = classeIds.size > 0
    ? await admin.from('classes').select('id, nom, couleur').in('id', [...classeIds])
    : { data: [] }
  const cls = classes ?? []
  const couleurs = couleursParClasse(cls)
  const multiClasse = cls.length > 1

  // Fenêtre selon la vue.
  let debut: string, fin: string
  if (vue === 'mois') {
    debut = toISODate(lundiOnOrBefore(firstOfMonth(anchor)))
    fin = toISODate(addDaysUTC(lundiOnOrBefore(lastOfMonth(anchor)), 6))
  } else if (vue === 'semaine') {
    debut = toISODate(lundiOnOrBefore(anchor))
    fin = toISODate(addDaysUTC(parse(debut), 6))
  } else {
    debut = anchor; fin = anchor
  }

  // 1. Événements partagés (essais, quizz, Codex, lectures) → classes de l'élève
  //    (+ événements sans classe, visibles de tous). Color-codés par classe.
  const partages = (await assemblerEvenements({ debut, fin }))
    .filter((e) => e.classe_id === null || classeIds.has(e.classe_id))
    .map((e): Evt => ({
      date: e.date,
      label: e.label,
      couleur: e.classe_id ? couleurs.get(e.classe_id) ?? COULEUR_NEUTRE : COULEUR_NEUTRE,
      sousTitre: e.classe_nom,
    }))

  // 2. Échéances hebdomadaires des Fragments (à rendre) du semestre, dans la fenêtre.
  const { data: semaines } = sem
    ? await admin.from('fragments_semaines').select('numero, date_limite').eq('semestre_id', sem.id).eq('is_vacation', false)
    : { data: [] }
  const fragments = (semaines ?? [])
    .map((s): Evt => ({ date: jourParis(s.date_limite as string), label: `Fragment S${s.numero} — à rendre`, couleur: COULEUR_FRAGMENTS, sousTitre: null }))
    .filter((e) => e.date >= debut && e.date <= fin)

  const parJour = new Map<string, Evt[]>()
  for (const e of [...partages, ...fragments]) {
    const arr = parJour.get(e.date) ?? []
    arr.push(e)
    parJour.set(e.date, arr)
  }

  // Navigation.
  const lien = (v: Vue, d: string) => `/eleve/calendrier?vue=${v}&date=${d}`
  let prev: string, next: string, titre: string
  if (vue === 'mois') {
    prev = addMonths(firstOfMonth(anchor), -1); next = addMonths(firstOfMonth(anchor), 1)
    titre = fmt(anchor, { month: 'long', year: 'numeric' })
  } else if (vue === 'semaine') {
    prev = toISODate(addDaysUTC(parse(debut), -7)); next = toISODate(addDaysUTC(parse(debut), 7))
    const w = infoSemaine.get(debut)
    const prefixe = w?.pedagogicalNumber ? `S${w.pedagogicalNumber} · ` : w?.isVacation ? '(vacances) · ' : ''
    titre = `${prefixe}${fmt(debut, { day: 'numeric', month: 'short' })} – ${fmt(fin, { day: 'numeric', month: 'short' })}`
  } else {
    prev = toISODate(addDaysUTC(parse(anchor), -1)); next = toISODate(addDaysUTC(parse(anchor), 1))
    titre = fmt(anchor, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }

  const Pastille = ({ e }: { e: Evt }) => (
    <div className="flex items-center gap-1.5" title={e.sousTitre ? `${e.label} · ${e.sousTitre}` : e.label}>
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: e.couleur }} />
      <span className="text-[11px] text-stone-600 truncate">{e.label}</span>
    </div>
  )

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-serif text-stone-900">Calendrier</h2>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href={lien(vue, prev)} aria-label="Précédent" className="px-2 py-1 text-sm text-stone-500 hover:text-stone-900 border border-stone-200 rounded-lg">←</Link>
          <Link href={lien(vue, today)} className="px-3 py-1 text-sm text-stone-600 hover:text-stone-900 border border-stone-200 rounded-lg">Aujourd&apos;hui</Link>
          <Link href={lien(vue, next)} aria-label="Suivant" className="px-2 py-1 text-sm text-stone-500 hover:text-stone-900 border border-stone-200 rounded-lg">→</Link>
          <h3 className="text-base font-medium text-stone-900 ml-2 capitalize">{titre}</h3>
        </div>
        <div className="flex gap-1 text-sm">
          {(['mois', 'semaine', 'jour'] as Vue[]).map((v) => (
            <Link key={v} href={lien(v, anchor)} className={`px-3 py-1 rounded-lg capitalize ${vue === v ? 'bg-stone-800 text-white' : 'text-stone-600 hover:bg-stone-100'}`}>{v}</Link>
          ))}
        </div>
      </div>

      {/* Légende couleurs */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500">
        {multiClasse && cls.map((c) => (
          <span key={c.id} className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: couleurs.get(c.id) ?? COULEUR_NEUTRE }} />
            {c.nom}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COULEUR_FRAGMENTS }} />
          Fragment à rendre
        </span>
      </div>

      {!sem && (
        <div className="bg-white border border-stone-200 rounded-xl p-6 text-sm text-stone-500">Aucun semestre actif pour le moment.</div>
      )}

      {/* ── Vue MOIS ── */}
      {vue === 'mois' && (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <div className="grid grid-cols-7 border-b border-stone-100 text-[11px] text-stone-400 uppercase">
            {JOURS.map((j) => <div key={j} className="px-2 py-1.5 text-center">{j}</div>)}
          </div>
          {(() => {
            const rows: string[] = []
            let c = debut
            while (c <= fin) { rows.push(c); c = toISODate(addDaysUTC(parse(c), 7)) }
            return rows.map((ws) => (
              <div key={ws} className="grid grid-cols-7 border-b border-stone-50 last:border-0">
                {Array.from({ length: 7 }).map((_, j) => {
                  const jour = toISODate(addDaysUTC(parse(ws), j))
                  const evs = parJour.get(jour) ?? []
                  const horsMois = jour.slice(0, 7) !== anchor.slice(0, 7)
                  const vac = estVacance(jour)
                  return (
                    <Link key={jour} href={lien('jour', jour)} className={`min-h-[5.5rem] border-r border-stone-50 last:border-0 p-1.5 align-top transition-colors hover:bg-stone-50 ${vac ? 'bg-stone-50' : ''} ${horsMois ? 'opacity-40' : ''}`}>
                      <div className={`text-[11px] ${jour === today ? 'font-bold text-stone-900' : 'text-stone-400'}`}>{parse(jour).getUTCDate()}</div>
                      <div className="mt-1 space-y-0.5">
                        {evs.slice(0, 3).map((e, i) => <Pastille key={i} e={e} />)}
                        {evs.length > 3 && <p className="text-[10px] text-stone-400">+ {evs.length - 3}</p>}
                      </div>
                    </Link>
                  )
                })}
              </div>
            ))
          })()}
        </div>
      )}

      {/* ── Vue SEMAINE ── */}
      {vue === 'semaine' && (
        <div className="space-y-2">
          {Array.from({ length: 7 }).map((_, j) => {
            const jour = toISODate(addDaysUTC(parse(debut), j))
            const evs = parJour.get(jour) ?? []
            const vac = estVacance(jour)
            return (
              <div key={jour} className={`bg-white border border-stone-200 rounded-xl px-4 py-3 ${vac ? 'bg-stone-50' : ''}`}>
                <div className="flex items-center justify-between">
                  <Link href={lien('jour', jour)} className="text-sm font-medium text-stone-700 hover:underline capitalize">{fmt(jour, { weekday: 'long', day: 'numeric', month: 'short' })}</Link>
                  {vac && <span className="text-xs text-stone-400">vacances</span>}
                </div>
                {evs.length > 0 && <div className="mt-2 space-y-1">{evs.map((e, i) => <Pastille key={i} e={e} />)}</div>}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Vue JOUR ── */}
      {vue === 'jour' && (
        <div className="bg-white border border-stone-200 rounded-xl p-5">
          {estVacance(anchor) && <p className="text-sm text-stone-400 mb-3">Période de vacances.</p>}
          {(parJour.get(anchor) ?? []).length === 0 ? (
            <p className="text-sm text-stone-400">Rien à faire ni à rendre ce jour.</p>
          ) : (
            <ul className="space-y-2">
              {(parJour.get(anchor) ?? []).map((e, i) => (
                <li key={i} className="flex flex-wrap items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: e.couleur }} />
                  <span className="text-sm text-stone-700">{e.label}</span>
                  {e.sousTitre && <span className="text-xs text-stone-400">· {e.sousTitre}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
