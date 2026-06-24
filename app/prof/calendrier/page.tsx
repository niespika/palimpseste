import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { calculerGrilleSemaines, lundiOnOrBefore, addDaysUTC, toISODate, jourParis } from '@/utils/calendrier-grille'
import { assemblerEvenements, type CalendarEvent } from '@/utils/calendrier-evenements'
import { coursParJour } from '@/utils/calendrier-cours'
import { couleursParClasse } from '@/utils/calendrier-couleurs'
import FiltreClasses from './FiltreClasses'
import EditeurDate from './EditeurDate'

type Vue = 'mois' | 'semaine' | 'jour'
const JOURS = ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim']

const parse = (d: string) => new Date(d + 'T00:00:00Z')
const addMonths = (d: string, n: number) => {
  const x = parse(d)
  x.setUTCMonth(x.getUTCMonth() + n)
  return toISODate(x)
}
const firstOfMonth = (d: string) => d.slice(0, 7) + '-01'
const lastOfMonth = (d: string) => {
  const x = parse(d)
  x.setUTCMonth(x.getUTCMonth() + 1, 0)
  return toISODate(x)
}
const fmt = (d: string, opts: Intl.DateTimeFormatOptions) =>
  parse(d).toLocaleDateString('fr-FR', { ...opts, timeZone: 'UTC' })

export default async function CalendrierVue({
  searchParams,
}: {
  searchParams: Promise<{ vue?: string; date?: string; classes?: string }>
}) {
  const sp = await searchParams
  const vue: Vue = sp.vue === 'semaine' || sp.vue === 'jour' ? sp.vue : 'mois'
  const today = jourParis(new Date())
  const anchor = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : today
  // Filtre classes : absent = toutes (null) ; 'aucune' = ensemble vide ; sinon liste.
  const selSet = sp.classes === 'aucune' ? new Set<string>() : sp.classes ? new Set(sp.classes.split(',').filter(Boolean)) : null

  const supabase = await createClient()

  // Semestre actif + grille (numéros pédagogiques, vacances).
  const { data: sem } = await supabase
    .from('semesters')
    .select('id, name, start_date, end_date')
    .eq('is_active', true)
    .maybeSingle()
  const { data: hols } = sem
    ? await supabase.from('holidays').select('label, start_date, end_date').eq('semester_id', sem.id)
    : { data: [] }
  const holidays = hols ?? []
  const grille = sem ? calculerGrilleSemaines(sem, holidays) : []
  const infoSemaine = new Map(grille.map((w) => [w.start, w]))
  const estVacance = (jour: string) => holidays.some((h) => h.start_date <= jour && jour <= h.end_date)

  // Classes + couleurs.
  const { data: classes } = await supabase
    .from('classes')
    .select('id, nom, couleur')
    .eq('statut', 'active')
    .order('nom')
  const cls = classes ?? []
  const couleurs = couleursParClasse(cls)
  const couleursObj: Record<string, string> = Object.fromEntries(couleurs)

  // Fenêtre selon la vue.
  let debut: string
  let fin: string
  if (vue === 'mois') {
    debut = toISODate(lundiOnOrBefore(firstOfMonth(anchor)))
    fin = toISODate(addDaysUTC(lundiOnOrBefore(lastOfMonth(anchor)), 6))
  } else if (vue === 'semaine') {
    debut = toISODate(lundiOnOrBefore(anchor))
    fin = toISODate(addDaysUTC(parse(debut), 6))
  } else {
    debut = anchor
    fin = anchor
  }

  // Événements de la fenêtre, filtrés par classe (les généraux sont toujours visibles).
  const tousEvents = await assemblerEvenements({ debut, fin })
  const visible = (e: CalendarEvent) => e.classe_id === null || selSet === null || selSet.has(e.classe_id)
  const events = tousEvents.filter(visible)
  const parJour = new Map<string, CalendarEvent[]>()
  for (const e of events) {
    const arr = parJour.get(e.date) ?? []
    arr.push(e)
    parJour.set(e.date, arr)
  }

  // Jours de cours (informatif), filtrés par la sélection de classes.
  const coursTous = await coursParJour({ debut, fin })
  const coursJour = (jour: string) =>
    (coursTous.get(jour) ?? []).filter((c) => selSet === null || selSet.has(c.id))

  // Navigation prev / next / aujourd'hui.
  const lien = (v: Vue, d: string) => `/prof/calendrier?vue=${v}${sp.classes ? `&classes=${sp.classes}` : ''}&date=${d}`
  let prev: string
  let next: string
  let titre: string
  if (vue === 'mois') {
    prev = addMonths(firstOfMonth(anchor), -1)
    next = addMonths(firstOfMonth(anchor), 1)
    titre = fmt(anchor, { month: 'long', year: 'numeric' })
  } else if (vue === 'semaine') {
    prev = toISODate(addDaysUTC(parse(debut), -7))
    next = toISODate(addDaysUTC(parse(debut), 7))
    const w = infoSemaine.get(debut)
    const prefixe = w?.pedagogicalNumber ? `S${w.pedagogicalNumber} · ` : w?.isVacation ? '(vacances) · ' : ''
    titre = `Semaine ${prefixe}${fmt(debut, { day: 'numeric', month: 'short' })} – ${fmt(fin, { day: 'numeric', month: 'short' })}`
  } else {
    prev = toISODate(addDaysUTC(parse(anchor), -1))
    next = toISODate(addDaysUTC(parse(anchor), 1))
    titre = fmt(anchor, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }

  const Pastille = ({ e }: { e: CalendarEvent }) => (
    <div className="flex items-center gap-1.5" title={e.classe_nom ? `${e.label} · ${e.classe_nom}` : e.label}>
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: e.classe_id ? couleurs.get(e.classe_id) ?? '#a8a29e' : '#a8a29e' }}
      />
      <span className="text-[11px] text-encre-douce truncate">{e.label}</span>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Barre de contrôle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href={lien(vue, prev)} aria-label="Période précédente" className="px-2 py-1 text-sm text-muet hover:text-encre border border-bordure rounded-lg">←</Link>
          <Link href={lien(vue, today)} className="px-3 py-1 text-sm text-encre-douce hover:text-encre border border-bordure rounded-lg">Aujourd&apos;hui</Link>
          <Link href={lien(vue, next)} aria-label="Période suivante" className="px-2 py-1 text-sm text-muet hover:text-encre border border-bordure rounded-lg">→</Link>
          <h3 className="text-base font-medium text-encre ml-2 capitalize">{titre}</h3>
        </div>
        <div className="flex gap-1 text-sm">
          {(['mois', 'semaine', 'jour'] as Vue[]).map((v) => (
            <Link
              key={v}
              href={lien(v, anchor)}
              className={`px-3 py-1 rounded-lg capitalize ${vue === v ? 'bg-bouton text-surface' : 'text-encre-douce hover:bg-parchemin-fonce'}`}
            >
              {v}
            </Link>
          ))}
        </div>
      </div>

      {cls.length > 0 && <FiltreClasses classes={cls.map((c) => ({ id: c.id, nom: c.nom }))} couleurs={couleursObj} />}

      {!sem && (
        <div className="bg-surface border border-bordure rounded-xl p-6 text-sm text-muet">
          Aucun semestre actif. <Link href="/prof/calendrier/config" className="underline">Configurer →</Link>
        </div>
      )}

      {/* ── Vue MOIS ───────────────────────────────────────────────────────── */}
      {vue === 'mois' && (
        <div className="bg-surface border border-bordure rounded-xl overflow-hidden">
          <div className="grid grid-cols-7 border-b border-bordure text-[11px] text-muet uppercase">
            {JOURS.map((j) => (
              <div key={j} className="px-2 py-1.5 text-center">{j}</div>
            ))}
          </div>
          {(() => {
            const rows: string[] = []
            let c = debut
            while (c <= fin) {
              rows.push(c)
              c = toISODate(addDaysUTC(parse(c), 7))
            }
            return rows.map((ws) => (
              <div key={ws} className="grid grid-cols-7 border-b border-bordure last:border-0">
                {Array.from({ length: 7 }).map((_, j) => {
                  const jour = toISODate(addDaysUTC(parse(ws), j))
                  const evs = parJour.get(jour) ?? []
                  const horsMois = jour.slice(0, 7) !== anchor.slice(0, 7)
                  const vac = estVacance(jour)
                  return (
                    <Link
                      key={jour}
                      href={lien('jour', jour)}
                      className={`min-h-[5.5rem] border-r border-bordure last:border-0 p-1.5 align-top transition-colors hover:bg-parchemin-fonce ${vac ? 'bg-parchemin-fonce' : ''} ${horsMois ? 'opacity-40' : ''}`}
                    >
                      <div className={`text-[11px] ${jour === today ? 'font-bold text-encre' : 'text-muet'}`}>
                        {parse(jour).getUTCDate()}
                      </div>
                      <div className="mt-1 space-y-0.5">
                        {evs.slice(0, 3).map((e, i) => (
                          <Pastille key={i} e={e} />
                        ))}
                        {evs.length > 3 && <p className="text-[10px] text-muet">+ {evs.length - 3}</p>}
                      </div>
                    </Link>
                  )
                })}
              </div>
            ))
          })()}
        </div>
      )}

      {/* ── Vue SEMAINE ────────────────────────────────────────────────────── */}
      {vue === 'semaine' && (
        <div className="space-y-2">
          {Array.from({ length: 7 }).map((_, j) => {
            const jour = toISODate(addDaysUTC(parse(debut), j))
            const evs = parJour.get(jour) ?? []
            const vac = estVacance(jour)
            return (
              <div key={jour} className={`bg-surface border border-bordure rounded-xl px-4 py-3 ${vac ? 'bg-parchemin-fonce' : ''}`}>
                <div className="flex items-center justify-between">
                  <Link href={lien('jour', jour)} className="text-sm font-medium text-encre-douce hover:underline capitalize">
                    {fmt(jour, { weekday: 'long', day: 'numeric', month: 'short' })}
                  </Link>
                  {vac && <span className="text-xs text-muet">vacances</span>}
                </div>
                {coursJour(jour).length > 0 && (
                  <p className="text-xs text-muet mt-1">Cours : {coursJour(jour).map((c) => c.nom).join(', ')}</p>
                )}
                {evs.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {evs.map((e, i) => (
                      <Pastille key={i} e={e} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Vue JOUR ───────────────────────────────────────────────────────── */}
      {vue === 'jour' && (
        <div className="bg-surface border border-bordure rounded-xl p-5">
          {estVacance(anchor) && <p className="text-sm text-muet mb-3">Période de vacances.</p>}
          {coursJour(anchor).length > 0 && (
            <p className="text-sm text-muet mb-3">Cours : {coursJour(anchor).map((c) => c.nom).join(', ')}</p>
          )}
          {(parJour.get(anchor) ?? []).length === 0 ? (
            <p className="text-sm text-muet">Aucune échéance ce jour.</p>
          ) : (
            <ul className="space-y-2">
              {(parJour.get(anchor) ?? []).map((e, i) => (
                <li key={i} className="flex flex-wrap items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: e.classe_id ? couleurs.get(e.classe_id) ?? '#a8a29e' : '#a8a29e' }}
                  />
                  <span className="text-sm text-encre-douce">{e.label}</span>
                  {e.classe_nom && <span className="text-xs text-muet">· {e.classe_nom}</span>}
                  {e.is_editable && (
                    <EditeurDate
                      sourceModule={e.source_module}
                      sourceId={e.source_id}
                      classeId={e.classe_id}
                      dateActuelle={e.date}
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
