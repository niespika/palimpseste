'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  validerPlan, supprimerPlan, marquerConcu, retirerExercice,
  deplacerExercice, ajouterExercice, recalerExercice, regenererPlan, fixerJourExercice,
} from './actions'
import PanneauSegments from './PanneauSegments'
import type { PlanDetail, ExerciceLigne } from './plan-serveur'
import type { Panoptique, SemainePanoptique } from './panoptique-serveur'
import { libelleSemainePeda } from '@/utils/plan-cadence'
import {
  BandeLectures, BandeReflets, LigneSynthese, BandeauHorsFrise,
} from './panoptique-bandes'
import ReglageFragments from './ReglageFragments'

function fmtJour(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}` // 2026-09-21 → 21/09
}
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
function fmtLong(iso: string): string {
  return `${Number(iso.slice(8, 10))} ${MOIS[Number(iso.slice(5, 7)) - 1]}`
}

// Semaine panoptique vide (classe/semaine sans bande) — évite les gardes partout.
const SEM_VIDE = (lundi: string): SemainePanoptique => ({
  lundi, dimanche: lundi, semestreNom: null, pedaDansSemestre: null,
  enseignements: [], exercices: [], lectures: [], essais: [],
  fragmentAttendu: false, budget: { min: 0, max: 0, cibleMin: null, cibleMax: null, depasse: false }, estVacances: false,
})

const LABELS: Record<string, string> = {
  ecriture: 'Écriture', lecture: 'Lecture', synthese: 'Synthèse', quiz: 'Quiz',
  examen_livre: 'Examen sur le livre', bac_blanc: 'Bac Blanc', fragment: 'Fragment', essai: 'Essai',
}
function libelleType(e: ExerciceLigne): string {
  const base = LABELS[e.typeExercice] ?? e.typeExercice
  return e.diagnostique ? `${base} diagnostique` : base
}

const TYPES_AJOUT = [
  { v: 'ecriture', label: 'Écriture (maison)' },
  { v: 'lecture', label: 'Lecture (maison)' },
  { v: 'quiz', label: 'Quiz (classe)' },
  { v: 'examen_livre', label: 'Examen sur le livre (classe)' },
  { v: 'ecriture_diag', label: 'Écriture diagnostique (classe)' },
  { v: 'lecture_diag', label: 'Lecture diagnostique (classe)' },
  { v: 'bac_blanc', label: 'Bac Blanc (classe)' },
]

interface Semaine { lundi: string; label: string }

// Statut d'un exercice → { pastille (couleur dot), badge }.
function statutInfo(e: ExerciceLigne): { dot: string; label: string; ton: 'ok' | 'retard' | 'dore' } {
  if (e.statut === 'concu') return { dot: 'bg-ok', label: 'conçu', ton: 'ok' }
  if (e.enRetard) return { dot: 'bg-retard', label: 'en retard', ton: 'retard' }
  return { dot: 'bg-dore', label: 'à concevoir', ton: 'dore' }
}
function BadgeStatut({ e }: { e: ExerciceLigne }) {
  const s = statutInfo(e)
  const cls = s.ton === 'ok' ? 'bg-ok-teinte text-ok' : s.ton === 'retard' ? 'bg-retard-teinte text-retard' : 'bg-attention-teinte text-attention'
  return (
    <span className={`font-ui text-[11px] font-semibold uppercase tracking-[0.05em] rounded-full px-2.5 py-0.5 ${cls}`}>
      {s.label}{s.ton === 'ok' ? ' ✓' : ''}
    </span>
  )
}

function LigneExercice({ e, semaines, joursCours }: { e: ExerciceLigne; semaines: Semaine[]; joursCours: { iso: string; label: string }[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function act(fn: (fd: FormData) => Promise<{ error?: string; success?: boolean }>, extra?: Record<string, string>) {
    setErr(null); setBusy(true)
    const fd = new FormData()
    fd.set('exercice_id', e.id)
    for (const [k, v] of Object.entries(extra ?? {})) fd.set(k, v)
    const res = await fn(fd)
    setBusy(false)
    if (res.error) { setErr(res.error); return }
    router.refresh()
  }

  return (
    <div className="flex items-center gap-3 border border-bordure rounded-xl bg-white px-4 py-3 flex-wrap">
      <span className="font-corps text-[16px] font-semibold text-encre">{libelleType(e)}</span>
      <span className="font-corps text-[14px] text-muet">
        {e.lieu === 'maison' ? 'maison' : 'classe'} · à rendre {fmtJour(e.echeance)}
      </span>
      {/* Caler le jour (§5.6) : exercices EN CLASSE, quel que soit le statut. */}
      {e.lieu === 'classe' && (joursCours.length > 0 || e.jourPrevu) && (
        <select
          value={e.jourPrevu ?? ''}
          disabled={busy}
          onChange={(ev) => act(fixerJourExercice, { jour: ev.target.value })}
          className="font-ui text-[12px] border border-bordure-bouton rounded-lg bg-white px-2 py-1 text-encre-douce max-w-[9rem]"
          aria-label="Caler le jour de l’exercice en classe"
        >
          <option value="">jour à caler</option>
          {e.jourPrevu && !joursCours.some(j => j.iso === e.jourPrevu) && (
            <option value={e.jourPrevu}>{fmtJour(e.jourPrevu)} (hors cours)</option>
          )}
          {joursCours.map(j => <option key={j.iso} value={j.iso}>{j.label} {fmtJour(j.iso)}</option>)}
        </select>
      )}
      <span className="ml-auto flex items-center gap-2.5 flex-none">
        <BadgeStatut e={e} />
        {e.statut !== 'concu' && (
          <>
            <select
              defaultValue=""
              disabled={busy}
              onChange={(ev) => { const v = ev.target.value; if (v) { ev.target.value = ''; act(deplacerExercice, { semaine_lundi: v }) } }}
              className="font-ui text-[12px] border border-bordure-bouton rounded bg-white px-1 py-0.5 max-w-[7rem] text-encre-douce"
              aria-label="Déplacer vers une semaine"
            >
              <option value="">Déplacer…</option>
              {semaines.filter(s => s.lundi !== e.semaineLundi).map(s => <option key={s.lundi} value={s.lundi}>{s.label}</option>)}
            </select>
            {e.statut === 'a_concevoir' && (
              e.typeExercice === 'quiz' ? (
                <Link href={`/prof/quazian/quizz?exercice=${e.id}`} className="font-ui text-[12px] text-famille-eval hover:underline">Concevoir →</Link>
              ) : (
                <button onClick={() => act(marquerConcu)} disabled={busy} className="font-ui text-[12px] text-encre-douce hover:text-encre disabled:opacity-50">Conçu</button>
              )
            )}
            <button onClick={() => act(retirerExercice)} disabled={busy} className="font-ui text-[12px] text-muet hover:text-retard disabled:opacity-50">Retirer</button>
          </>
        )}
      </span>
      {err && <span className="text-retard text-xs w-full">{err}</span>}
    </div>
  )
}

function AjoutSemaine({ planId, lundi }: { planId: string; lundi: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function ajouter(type: string) {
    setErr(null); setBusy(true)
    const fd = new FormData()
    fd.set('plan_id', planId); fd.set('semaine_lundi', lundi); fd.set('type_exercice', type)
    const res = await ajouterExercice(fd)
    setBusy(false)
    if (res.error) { setErr(res.error); return }
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2 mt-2.5">
      <select
        defaultValue=""
        disabled={busy}
        onChange={(ev) => { if (ev.target.value) { ajouter(ev.target.value); ev.target.value = '' } }}
        className="font-ui text-[13px] font-semibold border border-bordure-bouton rounded-lg bg-white px-2 py-1.5 text-famille-eval"
        aria-label="Ajouter un exercice à cette semaine"
      >
        <option value="">＋ Ajouter un exercice…</option>
        {TYPES_AJOUT.map(t => <option key={t.v} value={t.v}>{t.label}</option>)}
      </select>
      {err && <span className="text-retard text-xs">{err}</span>}
    </div>
  )
}

function Recalage({ exercices }: { exercices: ExerciceLigne[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function recaler(id: string, action: 'reporter' | 'annuler') {
    setErr(null); setBusy(true)
    const fd = new FormData(); fd.set('exercice_id', id); fd.set('action', action)
    const res = await recalerExercice(fd)
    setBusy(false)
    if (res.error) { setErr(res.error); return }
    router.refresh()
  }

  return (
    <div className="bg-attention-teinte rounded-lg p-2.5 space-y-1.5">
      <p className="font-ui text-[12px] text-attention">
        {exercices.length} exercice(s) à recaler : leur semaine ne tombe plus dans un semestre (le calendrier a changé).
      </p>
      {exercices.map(e => (
        <div key={e.id} className="flex items-center justify-between gap-2 text-xs">
          <span className="text-encre">{libelleType(e)} <span className="text-muet">· semaine du {fmtJour(e.semaineLundi)}</span></span>
          <span className="flex items-center gap-2 flex-none">
            <button onClick={() => recaler(e.id, 'reporter')} disabled={busy} className="text-encre-douce hover:text-encre disabled:opacity-50">Reporter</button>
            <button onClick={() => recaler(e.id, 'annuler')} disabled={busy} className="text-muet hover:text-retard disabled:opacity-50">Annuler</button>
          </span>
        </div>
      ))}
      {err && <p className="text-retard text-xs">{err}</p>}
    </div>
  )
}

function ChangerGabarit({ planId, gabaritActuel }: { planId: string; gabaritActuel: string }) {
  const router = useRouter()
  const [gabarit, setGabarit] = useState(gabaritActuel)
  const [diff, setDiff] = useState<{ nbSupprimes: number; nbGeneres: number } | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function apercu() {
    setErr(null); setBusy(true)
    const res = await regenererPlan(planId, gabarit, false)
    setBusy(false)
    if (res.error) { setErr(res.error); return }
    setDiff({ nbSupprimes: res.nbSupprimes ?? 0, nbGeneres: res.nbGeneres ?? 0 })
  }
  async function appliquer() {
    setErr(null); setBusy(true)
    const res = await regenererPlan(planId, gabarit, true)
    setBusy(false)
    if (res.error) { setErr(res.error); return }
    setDiff(null); router.refresh()
  }

  return (
    <div className="flex items-center gap-2 flex-wrap font-ui text-[12px]">
      <span className="text-muet">Gabarit :</span>
      <select value={gabarit} onChange={(e) => { setGabarit(e.target.value); setDiff(null) }} className="border border-bordure-bouton rounded bg-white px-1.5 py-0.5">
        <option value="tc">TC</option>
        <option value="hlp">HLP</option>
        <option value="vierge">Vierge</option>
      </select>
      {!diff ? (
        <button onClick={apercu} disabled={busy} className="text-encre-douce hover:text-encre disabled:opacity-50">Voir l’impact</button>
      ) : (
        <>
          <span className="text-encre">{diff.nbSupprimes} retiré(s), {diff.nbGeneres} généré(s) dès aujourd’hui (conçus/manuels/passé conservés)</span>
          <button onClick={appliquer} disabled={busy} className="bg-bouton-plan text-bouton-plan-texte px-2 py-0.5 rounded disabled:opacity-50">Appliquer</button>
          <button onClick={() => setDiff(null)} disabled={busy} className="text-muet hover:text-encre disabled:opacity-50">Annuler</button>
        </>
      )}
      {err && <span className="text-retard">{err}</span>}
    </div>
  )
}

/** Contexte parcours (« ce que la classe vit ») en une ligne teintée noyer. */
function ContexteParcours({ items }: { items: SemainePanoptique['enseignements'] }) {
  if (items.length === 0) return null
  return (
    <div className="border-l-[3px] border-pigment bg-parchemin rounded-r-lg px-4 py-3 mb-4">
      <div className="font-ui text-[10px] font-bold uppercase tracking-[0.08em] text-muet mb-1">Enseigné cette semaine · via le parcours</div>
      <div className="font-corps text-[15px] text-encre-douce">
        {items.map((e, i) => {
          const tranche = e.ref === 'livre' && e.tranche && (e.tranche.debut != null || e.tranche.fin != null)
            ? ` (S${e.tranche.debut ?? '?'}→S${e.tranche.fin ?? '?'})` : ''
          return (
            <span key={i}>
              {e.ref === 'texte' ? 'Texte' : e.ref === 'cours' ? 'Cours' : 'Lecture'} « {e.titre} »
              {tranche && <span className="text-muet-clair">{tranche}</span>}
              {i < items.length - 1 ? ' · ' : ''}
            </span>
          )
        })}
      </div>
    </div>
  )
}

export default function GrillePlan({ plan, panoptique }: { plan: PlanDetail; panoptique: Panoptique | null }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [confirmSuppr, setConfirmSuppr] = useState(false)
  const [semaineSel, setSemaineSel] = useState<string | null>(plan.semaines[0]?.lundi ?? null)

  const semaines: Semaine[] = plan.semaines.map(s => {
    const peda = libelleSemainePeda(s.semestreNom, s.pedaNum)
    return { lundi: s.lundi, label: `Lundi ${fmtJour(s.lundi)}${peda ? ` · ${peda}` : ''}` }
  })
  const panoParLundi = new Map<string, SemainePanoptique>((panoptique?.semaines ?? []).map(s => [s.lundi, s]))

  // Bilan d'avancement (exercices non annulés).
  let nbConcu = 0, nbConcevoir = 0, nbRetard = 0
  for (const s of plan.semaines) for (const e of s.exercices) {
    if (e.statut === 'annule') continue
    if (e.statut === 'concu') nbConcu++
    else if (e.enRetard) nbRetard++
    else nbConcevoir++
  }
  const total = nbConcu + nbConcevoir + nbRetard
  const pct = (n: number) => (total > 0 ? (n / total) * 100 : 0)

  const idxSel = plan.semaines.findIndex(s => s.lundi === semaineSel)
  const semSel = idxSel >= 0 ? plan.semaines[idxSel] : null
  const panoSel = semSel ? (panoParLundi.get(semSel.lundi) ?? SEM_VIDE(semSel.lundi)) : null
  const synthesesSel = panoSel ? panoSel.exercices.filter(e => e.source === 'synthese_parcours') : []

  async function valider() {
    setErr(null); setBusy(true)
    const fd = new FormData(); fd.set('plan_id', plan.id)
    const res = await validerPlan(fd)
    setBusy(false)
    if (res.error) { setErr(res.error); return }
    router.refresh()
  }
  async function supprimer() {
    setErr(null); setBusy(true)
    const fd = new FormData(); fd.set('plan_id', plan.id)
    const res = await supprimerPlan(fd)
    setBusy(false)
    if (res.error) { setErr(res.error); return }
    router.push('/prof/scriptorium?vue=parcours') // le plan n'existe plus → retour à l'accueil
  }

  return (
    <div>
      {/* Barre de contenu : retour + identité + Valider. */}
      <div className="flex items-center gap-3 flex-wrap mb-3">
        <Link href="/prof/scriptorium?vue=parcours" className="font-ui text-[13px] text-muet hover:text-encre">← Toutes les classes</Link>
        <span className="w-px h-4 bg-bordure-bouton" />
        <span className="font-corps text-[16px] font-semibold text-encre">{plan.classeNom} — Plan {plan.anneeScolaire}–{plan.anneeScolaire + 1}</span>
        <span className="font-ui text-[13px] text-muet">
          {plan.gabarit.toUpperCase()} · {plan.statut === 'valide' ? 'validé' : 'brouillon'}
          {plan.modeleTitre ? ` · issu de « ${plan.modeleTitre} »` : ''}
        </span>
        <span className="ml-auto flex items-center gap-2.5">
          {confirmSuppr ? (
            <span className="flex items-center gap-2 font-ui text-[12px]">
              <span className="text-retard">{plan.statut === 'valide' ? 'Supprimer ce plan validé ?' : 'Supprimer ce brouillon ?'}</span>
              <button onClick={supprimer} disabled={busy} className="text-retard font-semibold hover:underline disabled:opacity-50">Oui</button>
              <button onClick={() => setConfirmSuppr(false)} disabled={busy} className="text-muet hover:text-encre disabled:opacity-50">Non</button>
            </span>
          ) : (
            <button onClick={() => setConfirmSuppr(true)} disabled={busy} className="font-ui text-[12px] font-semibold bg-retard-teinte text-retard px-3.5 py-2 rounded-lg hover:opacity-90 disabled:opacity-50">Supprimer</button>
          )}
          {/* Valider disponible même après validation (re-valider un plan modifié). */}
          <button onClick={valider} disabled={busy} className="px-4 py-2 bg-bouton-valider text-bouton-valider-texte font-ui text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50">
            {busy ? '…' : plan.statut === 'valide' ? 'Re-valider' : 'Valider le plan'}
          </button>
        </span>
      </div>

      {err && <p className="text-xs text-retard mb-2">{err}</p>}
      {plan.avisBloquant && (
        <p className="text-xs bg-retard-teinte text-retard px-2 py-1 rounded mb-2">⚠ Configuration des semestres incohérente (chevauchement) — corrige-la dans le Calendrier.</p>
      )}
      {plan.avis && !plan.avisBloquant && <p className="text-xs text-muet mb-2">{plan.avis}</p>}
      {plan.aRecaler.length > 0 && <div className="mb-2"><Recalage exercices={plan.aRecaler} /></div>}
      {panoptique && panoptique.horsFrise.length > 0 && <div className="mb-2"><BandeauHorsFrise semaines={panoptique.horsFrise} /></div>}

      {/* Desktop (≥ ~1024px) : sous cette largeur, défilement horizontal (filet mobile). */}
      <div className="overflow-x-auto">
      <div className="flex border border-bordure rounded-xl overflow-hidden min-w-[860px]">
        {/* ── Gauche : bilan + liste des semaines (parchemin) ─────────────────── */}
        <div className="w-[344px] flex-none bg-parchemin border-r border-bordure flex flex-col">
          <div className="p-5 border-b border-bordure flex flex-col gap-2.5">
            <span className="font-ui text-[11px] font-bold uppercase tracking-[0.1em] text-encre-douce">Avancement du plan</span>
            <div className="flex items-baseline gap-2">
              <span className="font-titre text-[34px] font-bold text-encre leading-none">{total}</span>
              <span className="font-corps text-[15px] text-muet">exercice{total > 1 ? 's' : ''}</span>
            </div>
            <div className="flex h-2.5 rounded-full overflow-hidden bg-surface">
              {nbConcu > 0 && <span className="bg-ok" style={{ width: `${pct(nbConcu)}%` }} />}
              {nbConcevoir > 0 && <span className="bg-dore" style={{ width: `${pct(nbConcevoir)}%` }} />}
              {nbRetard > 0 && <span className="bg-retard" style={{ width: `${pct(nbRetard)}%` }} />}
            </div>
            <div className="flex gap-3.5 font-corps text-[13px] text-encre-douce">
              <span className="flex items-center gap-1.5 whitespace-nowrap"><span className="w-2.5 h-2.5 rounded-full bg-ok" /> {nbConcu} conçus</span>
              <span className="flex items-center gap-1.5 whitespace-nowrap"><span className="w-2.5 h-2.5 rounded-full bg-dore" /> {nbConcevoir} à concevoir</span>
              <span className="flex items-center gap-1.5 whitespace-nowrap"><span className="w-2.5 h-2.5 rounded-full bg-retard" /> {nbRetard} en retard</span>
            </div>
          </div>

          <div className="p-4 flex flex-col gap-1.5 flex-1">
            {/* Réglages du plan sur une ligne, au-dessus des semaines. */}
            <div className="flex items-center gap-x-3 gap-y-1 flex-wrap pb-2.5 mb-1 border-b border-bordure">
              <ChangerGabarit planId={plan.id} gabaritActuel={plan.gabarit} />
              {panoptique?.plan && <ReglageFragments planId={plan.id} valeur={panoptique.compterFragments} />}
            </div>
            <span className="font-ui text-[11px] font-bold uppercase tracking-[0.1em] text-muet-clair px-1 pb-0.5">Les semaines</span>
            {plan.semaines.length === 0 ? (
              <p className="font-corps text-[14px] text-muet px-1">Aucune semaine couverte — définis les semestres dans le Calendrier.</p>
            ) : plan.semaines.map(s => {
              const exos = s.exercices.filter(e => e.statut !== 'annule')
              // Les synthèses de parcours (ancrage='parcours') vivent dans la panoptique,
              // pas dans s.exercices → les inclure pour que le rail reflète tout le travail.
              const synth = (panoParLundi.get(s.lundi)?.exercices ?? []).filter(e => e.source === 'synthese_parcours')
              const labels = [...new Set(exos.map(e => LABELS[e.typeExercice] ?? e.typeExercice))]
              if (synth.length > 0) labels.push('Synthèse')
              const resume = labels.join(' · ') || '—'
              const dots = [
                ...exos.slice(0, 4).map(e => ({ k: e.id, c: statutInfo(e).dot })),
                ...synth.map(e => ({ k: e.id, c: e.etat === 'concu' || e.etat === 'realise' ? 'bg-ok' : e.etat === 'en_retard' ? 'bg-retard' : 'bg-dore' })),
              ].slice(0, 5)
              const sel = semaineSel === s.lundi
              return (
                <button
                  key={s.lundi}
                  onClick={() => setSemaineSel(s.lundi)}
                  aria-pressed={sel}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors ${sel ? 'border-[1.5px] border-famille-eval bg-attention-teinte' : 'border border-bordure bg-surface hover:border-encre-douce'}`}
                >
                  <span className={`font-ui text-[12px] font-semibold w-[46px] flex-none ${sel ? 'text-famille-eval' : 'text-muet-clair'}`}>{fmtJour(s.lundi)}</span>
                  <span className={`font-corps text-[14px] flex-1 min-w-0 truncate ${sel ? 'text-encre font-semibold' : 'text-encre-douce'}`}>{resume}</span>
                  <span className="flex gap-1 flex-none">
                    {dots.map(d => <span key={d.k} className={`w-2 h-2 rounded-full ${d.c}`} />)}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Droite : détail de la semaine sélectionnée (surface claire) ─────── */}
        <div className="flex-1 min-w-0 bg-surface p-6">
          {/* C4-L2 — le panneau des cinq segments, à la conception du plan. */}
          <PanneauSegments semaines={plan.semaines} />
          {!semSel || !panoSel ? (
            <p className="font-corps text-[15px] text-muet">Sélectionne une semaine à gauche.</p>
          ) : (
            <>
              <div className="flex items-baseline gap-3 mb-4 flex-wrap">
                <h1 className="font-titre text-[25px] font-semibold text-encre">Semaine du {fmtLong(semSel.lundi)}</h1>
                <span className="font-corps italic text-[14px] text-muet">Sem. {idxSel + 1}</span>
                {panoSel.budget.depasse && (
                  <span className="ml-auto font-ui text-[11px] font-semibold uppercase tracking-[0.05em] bg-retard-teinte text-retard rounded-full px-3 py-1">budget dépassé</span>
                )}
              </div>

              <ContexteParcours items={panoSel.enseignements} />

              <div className="font-ui text-[11px] font-bold uppercase tracking-[0.1em] text-muet-clair mb-2.5">Exercices à évaluer</div>
              {semSel.exercices.length === 0 && synthesesSel.length === 0 ? (
                <p className="font-corps italic text-[14px] text-muet-clair">Aucun exercice cette semaine.</p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {semSel.exercices.map(e => <LigneExercice key={e.id} e={e} semaines={semaines} joursCours={semSel.joursCours} />)}
                  {synthesesSel.map(e => (
                    <div key={e.id} className="border border-bordure rounded-xl bg-white px-1"><LigneSynthese exo={e} /></div>
                  ))}
                </div>
              )}
              <AjoutSemaine planId={plan.id} lundi={semSel.lundi} />

              {/* Pied : ce que la classe vit (lecture seule). */}
              {(panoSel.lectures.length > 0 || panoSel.essais.length > 0 || panoSel.fragmentAttendu) && (
                <div className="border-t border-dashed border-bordure-bouton mt-5 pt-3">
                  <BandeLectures items={panoSel.lectures} />
                  <BandeReflets essais={panoSel.essais} fragmentAttendu={panoSel.fragmentAttendu} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
      </div>
    </div>
  )
}
