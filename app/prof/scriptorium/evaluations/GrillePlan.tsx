'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  validerPlan, supprimerPlan, marquerConcu, retirerExercice,
  deplacerExercice, ajouterExercice, recalerExercice, regenererPlan, propagerPlan,
} from './actions'
import type { PlanDetail, ExerciceLigne } from './plan-serveur'
import type { Panoptique, SemainePanoptique } from './panoptique-serveur'
import { libelleSemainePeda } from '@/utils/plan-cadence'
import {
  BandeEnseignements, BandeLectures, BandeReflets, ChipBudget, LigneSynthese, BandeauHorsFrise,
} from './panoptique-bandes'
import ReglageFragments from './ReglageFragments'

function fmtJour(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}` // 2026-09-21 → 21/09
}

// Semaine panoptique vide (classe/semaine sans bande) — évite les gardes partout.
const SEM_VIDE = (lundi: string): SemainePanoptique => ({
  lundi, dimanche: lundi, semestreNom: null, pedaDansSemestre: null,
  enseignements: [], exercices: [], lectures: [], essais: [],
  fragmentAttendu: false, budget: { min: 0, max: 0, cibleMin: null, cibleMax: null, depasse: false }, estVacances: false,
})

const LABELS: Record<string, string> = {
  ecriture: 'Écriture',
  lecture: 'Lecture',
  synthese: 'Synthèse',
  quiz: 'Quiz',
  examen_livre: 'Examen sur le livre',
  fragment: 'Fragment',
  essai: 'Essai',
}
function libelleType(e: ExerciceLigne): string {
  const base = LABELS[e.typeExercice] ?? e.typeExercice
  return e.diagnostique ? `${base} diagnostique` : base
}

// Types manuellement ajoutables (semaine-ancrés).
const TYPES_AJOUT = [
  { v: 'ecriture', label: 'Écriture (maison)' },
  { v: 'lecture', label: 'Lecture (maison)' },
  { v: 'quiz', label: 'Quiz (classe)' },
  { v: 'examen_livre', label: 'Examen sur le livre (classe)' },
]

interface Semaine { lundi: string; label: string }

function LigneExercice({ e, semaines }: { e: ExerciceLigne; semaines: Semaine[] }) {
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

  const badge =
    e.statut === 'concu' ? <span className="bg-ok-teinte text-ok px-1.5 py-0.5 rounded">conçu</span>
      : e.enRetard ? <span className="bg-retard-teinte text-retard px-1.5 py-0.5 rounded">en retard</span>
        : <span className="bg-attention-teinte text-attention px-1.5 py-0.5 rounded">à concevoir</span>

  return (
    <div className="flex items-center justify-between gap-2 px-2 py-1.5 text-xs border-t border-bordure first:border-t-0">
      <div className="flex items-center gap-2 min-w-0 flex-wrap">
        <span className="text-encre">{libelleType(e)}</span>
        <span className="text-muet">· {e.lieu === 'maison' ? 'maison' : 'classe'}</span>
        <span className="text-muet">· à rendre {fmtJour(e.echeance)}{e.lieu === 'classe' && !e.jourPrevu ? ' (jour à caler)' : ''}</span>
        {badge}
      </div>
      {e.statut !== 'concu' && (
        <div className="flex items-center gap-2 flex-shrink-0">
          <select
            defaultValue=""
            disabled={busy}
            onChange={(ev) => { const v = ev.target.value; if (v) { ev.target.value = ''; act(deplacerExercice, { semaine_lundi: v }) } }}
            className="text-xs border border-bordure rounded bg-surface px-1 py-0.5 max-w-[8rem]"
            aria-label="Déplacer vers une semaine"
          >
            <option value="">Déplacer…</option>
            {semaines.filter(s => s.lundi !== e.semaineLundi).map(s => <option key={s.lundi} value={s.lundi}>{s.label}</option>)}
          </select>
          {e.statut === 'a_concevoir' && (
            // Quiz : `concu` est DÉRIVÉ (Q4) → on conçoit dans Quazian (pré-rempli), pas
            // de « Conçu » manuel. Autres types (pas d'écran dédié) : relais V4 manuel.
            e.typeExercice === 'quiz' ? (
              <Link href={`/prof/quazian/quizz?exercice=${e.id}`} className="text-pigment hover:underline">Concevoir →</Link>
            ) : (
              <button onClick={() => act(marquerConcu)} disabled={busy} className="text-encre-douce hover:text-encre disabled:opacity-50">Conçu</button>
            )
          )}
          <button onClick={() => act(retirerExercice)} disabled={busy} className="text-muet hover:text-retard disabled:opacity-50">Retirer</button>
        </div>
      )}
      {err && <span className="text-retard flex-shrink-0">{err}</span>}
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
    <div className="flex items-center gap-2 px-2 py-1 text-xs">
      <select
        defaultValue=""
        disabled={busy}
        onChange={(ev) => { if (ev.target.value) { ajouter(ev.target.value); ev.target.value = '' } }}
        className="text-xs border border-bordure rounded bg-surface px-1 py-0.5 text-muet"
        aria-label="Ajouter un exercice à cette semaine"
      >
        <option value="">+ Ajouter…</option>
        {TYPES_AJOUT.map(t => <option key={t.v} value={t.v}>{t.label}</option>)}
      </select>
      {err && <span className="text-retard">{err}</span>}
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
    <div className="bg-attention-teinte rounded p-2 space-y-1.5">
      <p className="text-xs text-attention">
        {exercices.length} exercice(s) à recaler : leur semaine ne tombe plus dans un semestre (le calendrier a changé).
      </p>
      {exercices.map(e => (
        <div key={e.id} className="flex items-center justify-between gap-2 text-xs">
          <span className="text-encre">{libelleType(e)} <span className="text-muet">· semaine du {fmtJour(e.semaineLundi)}</span></span>
          <span className="flex items-center gap-2 flex-shrink-0">
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
    <div className="flex items-center gap-2 flex-wrap text-xs">
      <span className="text-muet">Changer de gabarit :</span>
      <select value={gabarit} onChange={(e) => { setGabarit(e.target.value); setDiff(null) }} className="border border-bordure rounded bg-surface px-1 py-0.5">
        <option value="tc">TC</option>
        <option value="hlp">HLP</option>
        <option value="vierge">Vierge</option>
      </select>
      {!diff ? (
        <button onClick={apercu} disabled={busy} className="text-encre-douce hover:text-encre disabled:opacity-50">Voir l’impact</button>
      ) : (
        <>
          <span className="text-encre">{diff.nbSupprimes} retiré(s), {diff.nbGeneres} généré(s) à partir d’aujourd’hui (conçus/manuels/passé conservés)</span>
          <button onClick={appliquer} disabled={busy} className="bg-bouton text-surface px-2 py-0.5 rounded disabled:opacity-50">Appliquer</button>
          <button onClick={() => setDiff(null)} disabled={busy} className="text-muet hover:text-encre disabled:opacity-50">Annuler</button>
        </>
      )}
      {err && <span className="text-retard">{err}</span>}
    </div>
  )
}

function Propagation({ planId, candidats }: { planId: string; candidats: { classeId: string; nom: string }[] }) {
  const router = useRouter()
  const [sel, setSel] = useState<Set<string>>(new Set(candidats.map(c => c.classeId)))
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  function toggle(id: string) {
    setSel(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n })
  }
  async function propager() {
    setErr(null); setMsg(null); setBusy(true)
    const res = await propagerPlan(planId, [...sel])
    setBusy(false)
    if (res.error) { setErr(res.error); return }
    setMsg(`${res.crees ?? 0} plan(s) créé(s)${res.ignores ? `, ${res.ignores} ignoré(s)` : ''}.`)
    router.refresh()
  }

  return (
    <div className="border border-bordure rounded-lg p-3 space-y-2">
      <p className="text-sm font-medium text-encre">Propager ce plan (même type pédagogique)</p>
      <p className="text-xs text-muet">Crée un plan INDÉPENDANT (copie du gabarit) pour chaque classe cochée — chacune diverge ensuite librement.</p>
      <div className="space-y-1">
        {candidats.map(c => (
          <label key={c.classeId} className="flex items-center gap-2 text-sm text-encre">
            <input type="checkbox" checked={sel.has(c.classeId)} onChange={() => toggle(c.classeId)} />
            {c.nom}
          </label>
        ))}
      </div>
      <button onClick={propager} disabled={busy || sel.size === 0} className="text-xs bg-bouton text-surface px-3 py-1.5 rounded hover:opacity-90 disabled:opacity-50">
        {busy ? '…' : `Propager à ${sel.size} classe(s)`}
      </button>
      {msg && <p className="text-xs text-ok">{msg}</p>}
      {err && <p className="text-xs text-retard">{err}</p>}
    </div>
  )
}

export default function GrillePlan({ plan, candidats, panoptique }: { plan: PlanDetail; candidats: { classeId: string; nom: string }[]; panoptique: Panoptique | null }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [confirmSuppr, setConfirmSuppr] = useState(false)

  const semaines: Semaine[] = plan.semaines.map(s => {
    const peda = libelleSemainePeda(s.semestreNom, s.pedaNum)
    return { lundi: s.lundi, label: `Lundi ${fmtJour(s.lundi)}${peda ? ` · ${peda}` : ''}` }
  })

  // Bandes panoptique par lundi (enseignements/lectures/reflets/budget/synthèses).
  const panoParLundi = new Map<string, SemainePanoptique>((panoptique?.semaines ?? []).map(s => [s.lundi, s]))

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
    router.push('/prof/scriptorium?vue=evaluations') // le plan n'existe plus → retour à la liste
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h3 className="text-sm font-medium text-encre">{plan.classeNom} — Plan {plan.anneeScolaire}–{plan.anneeScolaire + 1}</h3>
          <p className="text-xs text-muet">
            Gabarit {plan.gabarit.toUpperCase()} · début {fmtJour(plan.dateDebut)} ·{' '}
            {plan.statut === 'valide' ? <span className="text-ok">validé</span> : <span className="text-attention">brouillon</span>}
            {plan.typePedagogique ? <span className="text-muet"> · type {plan.typePedagogique.toUpperCase()}</span> : null}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {confirmSuppr ? (
            <span className="flex items-center gap-2 text-xs">
              <span className="text-retard">
                {plan.statut === 'valide' ? 'Supprimer ce plan validé et tous ses exercices ?' : 'Supprimer ce brouillon ?'}
              </span>
              <button onClick={supprimer} disabled={busy} className="text-retard hover:underline disabled:opacity-50">Oui</button>
              <button onClick={() => setConfirmSuppr(false)} disabled={busy} className="text-muet hover:text-encre disabled:opacity-50">Non</button>
            </span>
          ) : (
            <button onClick={() => setConfirmSuppr(true)} disabled={busy} className="text-xs text-muet hover:text-retard disabled:opacity-50">Supprimer</button>
          )}
          {plan.statut === 'brouillon' && (
            <button onClick={valider} disabled={busy} className="px-3 py-2 bg-bouton text-surface text-sm rounded-lg hover:opacity-90 disabled:opacity-50">
              {busy ? '…' : 'Valider le plan'}
            </button>
          )}
        </div>
      </div>
      {err && <p className="text-xs text-retard">{err}</p>}

      {plan.avisBloquant && (
        <p className="text-xs bg-retard-teinte text-retard px-2 py-1 rounded">⚠ Configuration des semestres incohérente (chevauchement) — corrige-la dans le Calendrier.</p>
      )}
      {plan.avis && !plan.avisBloquant && <p className="text-xs text-muet">{plan.avis}</p>}

      <div className="flex items-center gap-4 flex-wrap">
        <ChangerGabarit planId={plan.id} gabaritActuel={plan.gabarit} />
        {panoptique?.plan && <ReglageFragments planId={plan.id} valeur={panoptique.compterFragments} />}
      </div>

      {plan.aRecaler.length > 0 && <Recalage exercices={plan.aRecaler} />}
      {panoptique && panoptique.horsFrise.length > 0 && <BandeauHorsFrise semaines={panoptique.horsFrise} />}

      <div className="border border-bordure rounded-lg divide-y divide-bordure">
        {plan.semaines.length === 0 ? (
          <p className="text-sm text-muet p-3">Aucune semaine d’enseignement couverte — définis les semestres dans le Calendrier.</p>
        ) : (
          plan.semaines.map((s) => {
            const pano = panoParLundi.get(s.lundi) ?? SEM_VIDE(s.lundi)
            const syntheses = pano.exercices.filter((e) => e.source === 'synthese_parcours')
            return (
              <div key={s.lundi} className="p-2">
                <div className="flex items-center justify-between gap-2 text-xs mb-1">
                  <span className="text-encre-douce">Lundi {fmtJour(s.lundi)}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-muet">{libelleSemainePeda(s.semestreNom, s.pedaNum)}</span>
                    {panoptique && <ChipBudget semaine={pano} />}
                  </span>
                </div>
                <BandeEnseignements items={pano.enseignements} />
                {(s.exercices.length > 0 || syntheses.length > 0) && (
                  <div className="border border-bordure rounded mb-1">
                    {s.exercices.map((e) => <LigneExercice key={e.id} e={e} semaines={semaines} />)}
                    {syntheses.map((e) => <LigneSynthese key={e.id} exo={e} />)}
                  </div>
                )}
                <BandeLectures items={pano.lectures} />
                <BandeReflets essais={pano.essais} fragmentAttendu={pano.fragmentAttendu} />
                <AjoutSemaine planId={plan.id} lundi={s.lundi} />
              </div>
            )
          })
        )}
      </div>

      {candidats.length > 0 && <Propagation planId={plan.id} candidats={candidats} />}
    </div>
  )
}
