import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { contexteClasseEleve } from '../contexte-classe'
import { slugsModulesAccessibles } from '@/utils/acces'
import { calculerGrilleSemaines, lundiOnOrBefore, addDaysUTC, toISODate, jourParis } from '@/utils/calendrier-grille'
import { assemblerEvenements } from '@/utils/calendrier-evenements'
import { couleursParClasse } from '@/utils/calendrier-couleurs'

// Échéances d'un module visibles seulement si l'élève y a accès (périmètre par classe).
const SLUG_PAR_SOURCE: Record<string, string> = {
  fragments: 'fragments-erudition', quazian: 'quazian', codex: 'codex', aletheia: 'aletheia',
}

type Vue = 'agenda' | 'mois' | 'semaine' | 'jour'
const JOURS = ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim']
const COULEUR_FRAGMENTS = '#f59e0b'
const COULEUR_NEUTRE = '#a8a29e'

const parse = (d: string) => new Date(d + 'T00:00:00Z')
const addMonths = (d: string, n: number) => { const x = parse(d); x.setUTCMonth(x.getUTCMonth() + n); return toISODate(x) }
const firstOfMonth = (d: string) => d.slice(0, 7) + '-01'
const lastOfMonth = (d: string) => { const x = parse(d); x.setUTCMonth(x.getUTCMonth() + 1, 0); return toISODate(x) }
const fmt = (d: string, opts: Intl.DateTimeFormatOptions) => parse(d).toLocaleDateString('fr-FR', { ...opts, timeZone: 'UTC' })
const sansPoint = (s: string) => s.replace(/\./g, '')

// Événement affiché (unifié : événements partagés color-codés par classe +
// échéances hebdo des Fragments propres à l'élève).
interface Evt { date: string; label: string; couleur: string; sousTitre: string | null }

export default async function CalendrierEleve({
  searchParams,
}: {
  searchParams: Promise<{ vue?: string; date?: string; jour?: string }>
}) {
  const sp = await searchParams
  // Vue explicite = segment tapé par l'élève (honoré à toutes les largeurs).
  // Absente → base desktop 'mois' ; l'agenda mobile par défaut est géré en CSS.
  const vueExplicite: Vue | null =
    sp.vue === 'agenda' || sp.vue === 'mois' || sp.vue === 'semaine' || sp.vue === 'jour' ? sp.vue : null
  const vue: Vue = vueExplicite ?? 'mois'
  const today = jourParis(new Date())
  const anchor = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : today
  const jourSel = sp.jour && /^\d{4}-\d{2}-\d{2}$/.test(sp.jour) ? sp.jour : today

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { inscriptions } = await contexteClasseEleve(supabase, user!.id)
  const classeIds = new Set(inscriptions.map((i) => i.classe_id))
  const slugs = await slugsModulesAccessibles(supabase, user!.id)

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

  // Bornes de la grille mois (lundi→dimanche couvrant le mois de `anchor`).
  const debutMois = toISODate(lundiOnOrBefore(firstOfMonth(anchor)))
  const finMois = toISODate(addDaysUTC(lundiOnOrBefore(lastOfMonth(anchor)), 6))
  // Fenêtre « à venir » : aujourd'hui → +6 semaines.
  const finAgenda = toISODate(addDaysUTC(parse(today), 42))

  // Fenêtre de données. En mois/agenda on prend l'UNION (mois affiché ∪ à venir)
  // pour ne faire qu'un seul passage d'agrégation alimentant la grille ET la liste.
  let debut: string, fin: string
  if (vue === 'mois' || vue === 'agenda') {
    debut = debutMois < today ? debutMois : today
    fin = finMois > finAgenda ? finMois : finAgenda
  } else if (vue === 'semaine') {
    debut = toISODate(lundiOnOrBefore(anchor))
    fin = toISODate(addDaysUTC(parse(debut), 6))
  } else {
    debut = anchor; fin = anchor
  }

  // 1. Événements partagés (essais, quizz, Codex, lectures) → classes de l'élève
  //    (+ événements sans classe, visibles de tous). Color-codés par classe.
  const partages = (await assemblerEvenements({ debut, fin }))
    .filter((e) => (e.classe_id === null || classeIds.has(e.classe_id)) && slugs.has(SLUG_PAR_SOURCE[e.source_module]))
    .map((e): Evt => ({
      date: e.date,
      label: e.label,
      couleur: e.classe_id ? couleurs.get(e.classe_id) ?? COULEUR_NEUTRE : COULEUR_NEUTRE,
      sousTitre: e.classe_nom,
    }))

  // 2. Échéances hebdomadaires des Fragments (à rendre) du semestre, dans la fenêtre.
  //    Seulement si l'élève a accès à Fragments (la table est globale au semestre).
  const { data: semaines } = sem && slugs.has('fragments-erudition')
    ? await admin.from('fragments_semaines').select('numero, date_limite').eq('semestre_id', sem.id).eq('is_vacation', false).not('date_limite', 'is', null)
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

  // ── Liste « À venir » : événements datés ≥ aujourd'hui (sur 6 semaines),
  //    groupés par échéance (aujourd'hui / cette semaine / semaines suivantes).
  const lundiDe = (j: string) => toISODate(lundiOnOrBefore(j))
  const lundiToday = lundiDe(today)
  const jourCourt = (d: string) => sansPoint(fmt(d, { weekday: 'short', day: 'numeric', month: 'short' }))
  const debutSemaineCourt = (d: string) => sansPoint(fmt(d, { day: 'numeric', month: 'short' }))

  interface Groupe { cle: string; titre: string; estToday: boolean; items: Evt[] }
  const groupes: Groupe[] = []
  const idxParCle = new Map<string, number>()
  const aVenir = [...partages, ...fragments]
    .filter((e) => e.date >= today && e.date <= finAgenda)
    .sort((a, b) => a.date.localeCompare(b.date) || a.label.localeCompare(b.label))
  for (const e of aVenir) {
    let cle: string, titre: string
    let estToday = false
    if (e.date === today) {
      cle = 'today'; titre = `Aujourd'hui · ${jourCourt(today)}`; estToday = true
    } else {
      const m = lundiDe(e.date)
      if (m === lundiToday) { cle = 'cette-semaine'; titre = 'Cette semaine' }
      else {
        const w = infoSemaine.get(m)
        if (w?.isVacation) { cle = m; titre = w.vacanceLabel ? `(Vacances) · ${w.vacanceLabel}` : '(Vacances)' }
        else if (w?.pedagogicalNumber) { cle = m; titre = `Semaine ${w.pedagogicalNumber} · ${debutSemaineCourt(m)} →` }
        else { cle = m; titre = `Semaine du ${debutSemaineCourt(m)}` }
      }
    }
    let idx = idxParCle.get(cle)
    if (idx === undefined) { idx = groupes.length; idxParCle.set(cle, idx); groupes.push({ cle, titre, estToday, items: [] }) }
    groupes[idx].items.push(e)
  }

  // Sous-titre d'une ligne d'agenda : classe + (jour pour les items à venir).
  const sousTitreAgenda = (e: Evt, estToday: boolean) => {
    const parts: string[] = []
    if (e.sousTitre) parts.push(e.sousTitre)
    if (!estToday) parts.push(fmt(e.date, { weekday: 'long', day: 'numeric' }))
    return parts.join(' · ') || null
  }

  // Navigation (mois/semaine/jour ; agenda partage la nav mois, masquée).
  const lien = (v: Vue, d: string) => `/eleve/calendrier?vue=${v}&date=${d}`
  let prev: string, next: string, titre: string
  if (vue === 'mois' || vue === 'agenda') {
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

  // Visibilité responsive des blocs (cf. handoff). Quand la vue n'est pas explicite,
  // l'agenda s'affiche sur mobile et le mois sur ordinateur, basculés en CSS.
  const showAgenda = vueExplicite === null ? 'block sm:hidden' : vue === 'agenda' ? 'block' : 'hidden'
  const showMois = vueExplicite === null ? 'hidden sm:block' : vue === 'mois' ? 'block' : 'hidden'
  // La rangée nav+toggle doit s'afficher sur mobile uniquement pour mois/semaine/jour
  // (l'agenda n'a pas de navigation de mois). Sur ordinateur, toujours.
  const rowClass = vueExplicite === 'mois' || vueExplicite === 'semaine' || vueExplicite === 'jour' ? 'flex' : 'hidden sm:flex'
  const navInnerClass = vueExplicite === 'agenda' ? 'hidden' : 'flex'
  // « Mois » actif uniquement pour la grille ; sinon « À venir » (défaut, agenda,
  // et la vue jour qui, sur mobile, n'est atteinte que depuis l'agenda).
  const agendaActifSeg = vueExplicite !== 'mois'
  const moisActifSeg = vueExplicite === 'mois'

  // Pastille de la grille mois : point toujours, libellé masqué < sm (cases tactiles).
  const PastilleMois = ({ e }: { e: Evt }) => (
    <span className="flex items-center gap-1.5 max-w-full" title={e.sousTitre ? `${e.label} · ${e.sousTitre}` : e.label}>
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: e.couleur }} />
      <span className="hidden sm:inline text-[11px] text-encre-douce truncate">{e.label}</span>
    </span>
  )

  // Pastille des listes (vue semaine) : point + libellé toujours visibles.
  const Pastille = ({ e }: { e: Evt }) => (
    <div className="flex items-center gap-1.5" title={e.sousTitre ? `${e.label} · ${e.sousTitre}` : e.label}>
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: e.couleur }} />
      <span className="text-[11px] text-encre-douce truncate">{e.label}</span>
    </div>
  )

  // Ligne d'événement pleine largeur (agenda + panneau jour). Cible tactile ≥ 44px.
  // Lien optionnel (agenda → vue jour) ; chevron + jour seulement en agenda ;
  // liseré gauche couleur classe pour l'item du jour même.
  const LigneEvt = ({ e, estToday, chevron, lienVers }: { e: Evt; estToday?: boolean; chevron?: boolean; lienVers?: string }) => {
    const sous = chevron ? sousTitreAgenda(e, !!estToday) : e.sousTitre
    const cls = 'flex items-center gap-3 bg-surface border border-bordure rounded-xl px-3.5 py-2.5'
    const style = estToday ? { borderLeftWidth: 4, borderLeftColor: e.couleur } : undefined
    const inner = (
      <>
        {!estToday && <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: e.couleur }} />}
        <span className="flex-1 min-w-0">
          <span className="block font-corps text-encre leading-snug truncate">{e.label}</span>
          {sous && <span className="block font-ui text-xs text-muet mt-0.5 truncate">{sous}</span>}
        </span>
        {chevron && <span className="text-muet flex-shrink-0" aria-hidden>→</span>}
      </>
    )
    return lienVers
      ? <Link href={lienVers} className={cls} style={style}>{inner}</Link>
      : <div className={cls} style={style}>{inner}</div>
  }

  const evsJourSel = parJour.get(jourSel) ?? []

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-serif text-encre">Calendrier</h2>

      {/* Bascule mobile [À venir | Mois] */}
      <div className="sm:hidden flex bg-parchemin-fonce rounded-xl p-1 font-ui text-sm">
        <Link href={lien('agenda', today)} className={`flex-1 flex items-center justify-center min-h-11 px-3 rounded-lg transition-colors ${agendaActifSeg ? 'bg-surface text-encre font-medium shadow-sm' : 'text-muet'}`}>À venir</Link>
        <Link href={lien('mois', anchor)} className={`flex-1 flex items-center justify-center min-h-11 px-3 rounded-lg transition-colors ${moisActifSeg ? 'bg-surface text-encre font-medium shadow-sm' : 'text-muet'}`}>Mois</Link>
      </div>

      {/* Navigation + bascule desktop [Mois | Semaine | Jour] */}
      <div className={`${rowClass} flex-wrap items-center justify-between gap-3`}>
        <div className={`${navInnerClass} items-center gap-2`}>
          <Link href={lien(vue, prev)} aria-label="Précédent" className="inline-flex items-center justify-center min-h-11 min-w-11 sm:min-h-0 sm:min-w-0 px-2 py-1 text-sm text-muet hover:text-encre border border-bordure rounded-lg">←</Link>
          <Link href={lien(vue, today)} className="inline-flex items-center min-h-11 sm:min-h-0 px-3 py-1 text-sm text-encre-douce hover:text-encre border border-bordure rounded-lg">Aujourd&apos;hui</Link>
          <Link href={lien(vue, next)} aria-label="Suivant" className="inline-flex items-center justify-center min-h-11 min-w-11 sm:min-h-0 sm:min-w-0 px-2 py-1 text-sm text-muet hover:text-encre border border-bordure rounded-lg">→</Link>
          <h3 className="text-base font-medium text-encre ml-2 capitalize">{titre}</h3>
        </div>
        <div className="hidden sm:flex gap-1 text-sm">
          {(['mois', 'semaine', 'jour'] as Vue[]).map((v) => (
            <Link key={v} href={lien(v, anchor)} className={`px-3 py-1 rounded-lg capitalize ${vue === v ? 'bg-bouton text-surface' : 'text-encre-douce hover:bg-parchemin-fonce'}`}>{v}</Link>
          ))}
        </div>
      </div>

      {/* Légende couleurs */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muet">
        {multiClasse && cls.map((c) => (
          <span key={c.id} className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: couleurs.get(c.id) ?? COULEUR_NEUTRE }} />
            {c.nom}
          </span>
        ))}
        {slugs.has('fragments-erudition') && (
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COULEUR_FRAGMENTS }} />
            Fragment à rendre
          </span>
        )}
      </div>

      {!sem && (
        <div className="bg-surface border border-bordure rounded-xl p-6 text-sm text-muet">Aucun semestre actif pour le moment.</div>
      )}

      {/* ── Vue À VENIR (agenda) — défaut mobile ── */}
      <div className={`${showAgenda} space-y-5`}>
        {aVenir.length === 0 ? (
          <div className="bg-surface border border-bordure rounded-xl p-6 text-sm text-muet">Rien de prévu dans les prochaines semaines.</div>
        ) : (
          groupes.map((g) => (
            <div key={g.cle}>
              <div className={`font-ui text-[11px] tracking-wider uppercase ${g.estToday ? 'text-encre font-bold' : 'text-muet'}`}>{g.titre}</div>
              <div className="mt-2 space-y-2">
                {g.items.map((e, i) => <LigneEvt key={i} e={e} estToday={g.estToday} chevron lienVers={lien('jour', e.date)} />)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Vue MOIS (grille) ── */}
      <div className={showMois}>
        <div className="bg-surface border border-bordure rounded-xl overflow-hidden">
          <div className="grid grid-cols-7 border-b border-bordure text-[11px] text-muet uppercase">
            {JOURS.map((j) => <div key={j} className="px-1 py-1.5 text-center">{j}</div>)}
          </div>
          {(() => {
            const rows: string[] = []
            let c = debutMois
            while (c <= finMois) { rows.push(c); c = toISODate(addDaysUTC(parse(c), 7)) }
            return rows.map((ws) => (
              <div key={ws} className="grid grid-cols-7 border-b border-bordure last:border-0">
                {Array.from({ length: 7 }).map((_, j) => {
                  const jour = toISODate(addDaysUTC(parse(ws), j))
                  const evs = parJour.get(jour) ?? []
                  const horsMois = jour.slice(0, 7) !== anchor.slice(0, 7)
                  const vac = estVacance(jour)
                  const estSel = jour === jourSel
                  const estAuj = jour === today
                  const labelJour = fmt(jour, { weekday: 'long', day: 'numeric', month: 'long' })
                  return (
                    <div key={jour} className={[
                      'relative min-h-12 sm:min-h-[5.5rem] border-r border-bordure last:border-0 transition-colors sm:hover:bg-parchemin-fonce',
                      vac ? 'bg-parchemin-fonce' : '',
                      horsMois ? 'opacity-40' : '',
                      estSel ? 'bg-encre rounded-lg sm:bg-transparent sm:rounded-none' : '',
                    ].filter(Boolean).join(' ')}>
                      <div className="p-1 sm:p-1.5">
                        <div className={`text-center sm:text-left text-[11px] ${estSel ? 'text-surface font-bold sm:text-encre' : estAuj ? 'font-bold text-encre' : 'text-muet'}`}>{parse(jour).getUTCDate()}</div>
                        <div className="mt-1 flex flex-wrap justify-center gap-0.5 sm:block sm:space-y-0.5">
                          {evs.slice(0, 3).map((e, i) => <PastilleMois key={i} e={e} />)}
                          {evs.length > 3 && <span className={`block w-full text-center text-[10px] sm:w-auto sm:text-left ${estSel ? 'text-surface sm:text-muet' : 'text-muet'}`}>+ {evs.length - 3}</span>}
                        </div>
                      </div>
                      {/* Desktop : la case ouvre la vue jour plein écran (existant).
                          Mobile : la case sélectionne le jour ; la grille reste, le panneau dessous se met à jour. */}
                      <Link href={lien('jour', jour)} aria-label={labelJour} className="hidden sm:block absolute inset-0" />
                      <Link href={`${lien('mois', anchor)}&jour=${jour}`} aria-label={labelJour} className="sm:hidden absolute inset-0" />
                    </div>
                  )
                })}
              </div>
            ))
          })()}
        </div>

        {/* Panneau de détail du jour sélectionné — mobile seulement. */}
        <div className="sm:hidden mt-4 bg-surface border border-bordure rounded-xl p-4">
          <div className="font-ui text-[11px] tracking-wider uppercase text-encre font-bold capitalize">{fmt(jourSel, { weekday: 'long', day: 'numeric', month: 'long' })}</div>
          {evsJourSel.length === 0 ? (
            <p className="mt-2 text-sm text-muet">Rien à faire ni à rendre ce jour.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {evsJourSel.map((e, i) => <LigneEvt key={i} e={e} />)}
            </div>
          )}
        </div>
      </div>

      {/* ── Vue SEMAINE ── */}
      {vue === 'semaine' && (
        <div className="space-y-2">
          {Array.from({ length: 7 }).map((_, j) => {
            const jour = toISODate(addDaysUTC(parse(debut), j))
            const evs = parJour.get(jour) ?? []
            const vac = estVacance(jour)
            return (
              <div key={jour} className={`bg-surface border border-bordure rounded-xl px-4 py-3 ${vac ? 'bg-parchemin-fonce' : ''}`}>
                <div className="flex items-center justify-between">
                  <Link href={lien('jour', jour)} className="text-sm font-medium text-encre-douce hover:underline capitalize">{fmt(jour, { weekday: 'long', day: 'numeric', month: 'short' })}</Link>
                  {vac && <span className="text-xs text-muet">vacances</span>}
                </div>
                {evs.length > 0 && <div className="mt-2 space-y-1">{evs.map((e, i) => <Pastille key={i} e={e} />)}</div>}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Vue JOUR ── */}
      {vue === 'jour' && (
        <div className="bg-surface border border-bordure rounded-xl p-5">
          {estVacance(anchor) && <p className="text-sm text-muet mb-3">Période de vacances.</p>}
          {(parJour.get(anchor) ?? []).length === 0 ? (
            <p className="text-sm text-muet">Rien à faire ni à rendre ce jour.</p>
          ) : (
            <ul className="space-y-2">
              {(parJour.get(anchor) ?? []).map((e, i) => (
                <li key={i} className="flex flex-wrap items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: e.couleur }} />
                  <span className="text-sm text-encre-douce">{e.label}</span>
                  {e.sousTitre && <span className="text-xs text-muet">· {e.sousTitre}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
