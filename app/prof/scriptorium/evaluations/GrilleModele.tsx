'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ajouterExerciceModele, retirerExerciceModele, deplacerExerciceModele,
  regenererModele, marquerModelePret, supprimerModele,
} from './modele-actions'
import PanneauSegments from './PanneauSegments'
import type { ModeleDetail, ModeleExerciceLigne, LigneAssignationModele } from './modele-serveur'
import AssignationModeleClasses from './AssignationModeleClasses'
import { libelleSemainePeda } from '@/utils/plan-cadence'

function fmtJour(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}` // 2026-09-21 → 21/09
}

const LABELS: Record<string, string> = {
  ecriture: 'Écriture',
  lecture: 'Lecture',
  synthese: 'Synthèse',
  quiz: 'Quiz',
  examen_livre: 'Examen sur le livre',
  bac_blanc: 'Bac Blanc',
  fragment: 'Fragment',
  essai: 'Essai',
}
function libelleType(e: ModeleExerciceLigne): string {
  const base = LABELS[e.typeExercice] ?? e.typeExercice
  return e.diagnostique ? `${base} diagnostique` : base
}
// Chip de type (jetons) : lecture/examen → info (bleu Aletheia), reste → ok.
function chipClasse(e: ModeleExerciceLigne): string {
  return /lecture|examen/.test(e.typeExercice) ? 'bg-info-teinte text-info' : 'bg-ok-teinte text-ok'
}

// Même palette (ids) que TYPE_MANUEL côté serveur (gate.ts).
const TYPES_AJOUT = [
  { v: 'ecriture', label: 'Écriture (maison)' },
  { v: 'lecture', label: 'Lecture (maison)' },
  { v: 'quiz', label: 'Quiz (classe)' },
  { v: 'examen_livre', label: 'Examen sur le livre (classe)' },
  { v: 'ecriture_diag', label: 'Écriture diagnostique (classe)' },
  { v: 'lecture_diag', label: 'Lecture diagnostique (classe)' },
  { v: 'bac_blanc', label: 'Bac Blanc (classe)' },
]

type ActionFD = (fd: FormData) => Promise<{ error?: string; success?: boolean }>
interface SemaineOpt { lundi: string; label: string }

function LigneExoModele({ e, semaines }: { e: ModeleExerciceLigne; semaines: SemaineOpt[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function act(fn: ActionFD, extra?: Record<string, string>) {
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
    <div className="flex items-center gap-2.5 px-3 py-2 border-t border-bordure first:border-t-0">
      <span className={`font-ui text-[11px] font-semibold uppercase tracking-[0.04em] rounded-full px-2.5 py-0.5 flex-none ${chipClasse(e)}`}>{libelleType(e)}</span>
      <span className="font-corps text-[13px] text-muet">{e.lieu === 'maison' ? 'maison' : 'classe'}</span>
      <div className="ml-auto flex items-center gap-2 flex-none">
        <select
          defaultValue=""
          disabled={busy}
          onChange={(ev) => { const v = ev.target.value; if (v) { ev.target.value = ''; act(deplacerExerciceModele, { semaine_lundi: v }) } }}
          className="font-ui text-[12px] border border-bordure-bouton rounded bg-white px-1 py-0.5 max-w-[8rem] text-encre-douce"
          aria-label="Déplacer vers une semaine"
        >
          <option value="">Déplacer…</option>
          {semaines.filter(s => s.lundi !== e.semaineLundi).map(s => <option key={s.lundi} value={s.lundi}>{s.label}</option>)}
        </select>
        <button onClick={() => act(retirerExerciceModele)} disabled={busy} className="font-ui text-[12px] text-muet hover:text-retard disabled:opacity-50">Retirer</button>
      </div>
      {err && <span className="text-retard text-xs flex-none">{err}</span>}
    </div>
  )
}

function AjoutModele({ modeleId, lundi }: { modeleId: string; lundi: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function ajouter(type: string) {
    setErr(null); setBusy(true)
    const fd = new FormData()
    fd.set('modele_id', modeleId); fd.set('semaine_lundi', lundi); fd.set('type_exercice', type)
    const res = await ajouterExerciceModele(fd)
    setBusy(false)
    if (res.error) { setErr(res.error); return }
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5">
      <select
        defaultValue=""
        disabled={busy}
        onChange={(ev) => { if (ev.target.value) { ajouter(ev.target.value); ev.target.value = '' } }}
        className="font-ui text-[12px] border border-bordure-bouton rounded bg-white px-1.5 py-1 text-famille-eval font-semibold"
        aria-label="Ajouter un exercice à cette semaine"
      >
        <option value="">＋ Ajouter…</option>
        {TYPES_AJOUT.map(t => <option key={t.v} value={t.v}>{t.label}</option>)}
      </select>
      {err && <span className="text-retard text-xs">{err}</span>}
    </div>
  )
}

function RecalageModele({ exercices, semaines }: { exercices: ModeleExerciceLigne[]; semaines: SemaineOpt[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function act(id: string, fn: ActionFD, extra?: Record<string, string>) {
    setErr(null); setBusy(true)
    const fd = new FormData()
    fd.set('exercice_id', id)
    for (const [k, v] of Object.entries(extra ?? {})) fd.set(k, v)
    const res = await fn(fd)
    setBusy(false)
    if (res.error) { setErr(res.error); return }
    router.refresh()
  }

  return (
    <div className="bg-attention-teinte rounded-lg p-2.5 space-y-1.5">
      <p className="font-ui text-[12px] text-attention">
        {exercices.length} exercice(s) hors des semaines couvertes (la date de début ou le calendrier a changé) — déplace-les ou retire-les.
      </p>
      {exercices.map(e => (
        <div key={e.id} className="flex items-center justify-between gap-2 text-xs">
          <span className="text-encre">{libelleType(e)} <span className="text-muet">· semaine du {fmtJour(e.semaineLundi)}</span></span>
          <span className="flex items-center gap-2 flex-none">
            <select
              defaultValue=""
              disabled={busy}
              onChange={(ev) => { const v = ev.target.value; if (v) { ev.target.value = ''; act(e.id, deplacerExerciceModele, { semaine_lundi: v }) } }}
              className="font-ui text-[12px] border border-bordure-bouton rounded bg-white px-1 py-0.5 max-w-[8rem]"
              aria-label="Déplacer vers une semaine"
            >
              <option value="">Déplacer…</option>
              {semaines.map(s => <option key={s.lundi} value={s.lundi}>{s.label}</option>)}
            </select>
            <button onClick={() => act(e.id, retirerExerciceModele)} disabled={busy} className="text-muet hover:text-retard disabled:opacity-50">Retirer</button>
          </span>
        </div>
      ))}
      {err && <p className="text-retard text-xs">{err}</p>}
    </div>
  )
}

function ChangerGabaritModele({ modeleId, gabaritActuel }: { modeleId: string; gabaritActuel: string }) {
  const router = useRouter()
  const [gabarit, setGabarit] = useState(gabaritActuel)
  const [diff, setDiff] = useState<{ nbSupprimes: number; nbGeneres: number } | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function apercu() {
    setErr(null); setBusy(true)
    const res = await regenererModele(modeleId, gabarit, false)
    setBusy(false)
    if (res.error) { setErr(res.error); return }
    setDiff({ nbSupprimes: res.nbSupprimes ?? 0, nbGeneres: res.nbGeneres ?? 0 })
  }
  async function appliquer() {
    setErr(null); setBusy(true)
    const res = await regenererModele(modeleId, gabarit, true)
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
          <span className="text-encre">{diff.nbSupprimes} retiré(s), {diff.nbGeneres} généré(s) (ajouts manuels conservés)</span>
          <button onClick={appliquer} disabled={busy} className="bg-bouton-plan text-bouton-plan-texte px-2 py-0.5 rounded disabled:opacity-50">Appliquer</button>
          <button onClick={() => setDiff(null)} disabled={busy} className="text-muet hover:text-encre disabled:opacity-50">Annuler</button>
        </>
      )}
      {err && <span className="text-retard">{err}</span>}
    </div>
  )
}

export default function GrilleModele({
  modele, assignation,
}: {
  modele: ModeleDetail
  assignation?: { defautDate: string; lignes: LigneAssignationModele[] } | null
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [confirmSuppr, setConfirmSuppr] = useState(false)

  const semaines: SemaineOpt[] = modele.semaines.map(s => {
    const peda = libelleSemainePeda(s.semestreNom, s.pedaNum)
    return { lundi: s.lundi, label: `Lundi ${fmtJour(s.lundi)}${peda ? ` · ${peda}` : ''}` }
  })
  const nbExercices = modele.semaines.reduce((n, s) => n + s.exercices.length, 0)

  async function togglePret() {
    setErr(null); setBusy(true)
    const res = await marquerModelePret(modele.id, modele.statut !== 'pret')
    setBusy(false)
    if (res.error) { setErr(res.error); return }
    router.refresh()
  }

  async function supprimer() {
    setErr(null); setBusy(true)
    const res = await supprimerModele(modele.id)
    setBusy(false)
    if (res.error) { setErr(res.error); return }
    router.push('/prof/scriptorium?vue=modeles') // le modèle n'existe plus → écran de création
  }

  return (
    <div className="overflow-x-auto">
    <div className="flex border border-bordure rounded-xl overflow-hidden min-w-[860px]">
      {/* ── Gauche : identité du modèle + gabarit + assignation (parchemin) ───── */}
      <div className="w-[436px] flex-none bg-parchemin border-r border-bordure p-6 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-titre text-[25px] font-semibold text-encre leading-tight">{modele.titre}</h1>
            <p className="font-ui text-[12.5px] text-muet mt-1">
              Modèle {modele.anneeScolaire}–{modele.anneeScolaire + 1} · gabarit {modele.gabarit.toUpperCase()} · début {fmtJour(modele.dateDebut)} ·{' '}
              {modele.statut === 'pret' ? <span className="text-ok">prêt</span> : <span className="text-attention">brouillon</span>}
            </p>
          </div>
        </div>

        <ChangerGabaritModele modeleId={modele.id} gabaritActuel={modele.gabarit} />

        <div className="flex items-center gap-3">
          <button onClick={togglePret} disabled={busy} className="px-3.5 py-2 bg-bouton-plan text-bouton-plan-texte font-ui text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50">
            {busy ? '…' : modele.statut === 'pret' ? 'Repasser en brouillon' : 'Marquer prêt'}
          </button>
          {confirmSuppr ? (
            <span className="flex items-center gap-2 font-ui text-[12px]">
              <span className="text-retard">Supprimer ? (les plans assignés survivent)</span>
              <button onClick={supprimer} disabled={busy} className="text-retard hover:underline disabled:opacity-50">Oui</button>
              <button onClick={() => setConfirmSuppr(false)} disabled={busy} className="text-muet hover:text-encre disabled:opacity-50">Non</button>
            </span>
          ) : (
            <button onClick={() => setConfirmSuppr(true)} disabled={busy} className="font-ui text-[12px] text-muet hover:text-retard disabled:opacity-50">Supprimer</button>
          )}
        </div>

        {err && <p className="font-ui text-[12px] text-retard">{err}</p>}
        {modele.avisBloquant && (
          <p className="font-ui text-[12px] bg-retard-teinte text-retard px-2 py-1 rounded">⚠ Configuration des semestres incohérente (chevauchement) — corrige-la dans le Calendrier.</p>
        )}
        {modele.avis && !modele.avisBloquant && <p className="font-ui text-[12px] text-muet">{modele.avis}</p>}

        {modele.aRecaler.length > 0 && <RecalageModele exercices={modele.aRecaler} semaines={semaines} />}

        {assignation && (
          <div className="border-t border-bordure pt-4">
            <AssignationModeleClasses modeleId={modele.id} defautDate={assignation.defautDate} lignes={assignation.lignes} />
          </div>
        )}
      </div>

      {/* ── Droite : aperçu de la cadence (surface claire) ────────────────────── */}
      <div className="flex-1 min-w-0 bg-surface p-6">
        {/* C4-L2 — « les cinq segments SE CALCULENT À LA CONCEPTION D'UN PLAN
            D'ÉVALUATION, ET ILS S'Y AFFICHENT » (01- §4, couche 1). */}
        <PanneauSegments semaines={modele.semaines} />
        <div className="flex items-baseline justify-between mb-3">
          <span className="font-ui text-[11px] font-bold uppercase tracking-[0.1em] text-encre-douce">Aperçu de la cadence</span>
          <span className="font-corps italic text-[13px] text-muet-clair">≈ {nbExercices} exercice{nbExercices > 1 ? 's' : ''} sur l’année</span>
        </div>

        {modele.semaines.length === 0 ? (
          <p className="font-corps text-[15px] text-muet">Aucune semaine d’enseignement couverte — définis les semestres dans le Calendrier.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {modele.semaines.map(s => (
              <div key={s.lundi} className="border border-bordure rounded-lg bg-white overflow-hidden">
                <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-bordure">
                  <span className="font-ui text-[13px] font-semibold text-muet-clair">Lundi {fmtJour(s.lundi)}</span>
                  <span className="font-ui text-[12px] text-muet">{libelleSemainePeda(s.semestreNom, s.pedaNum)}</span>
                </div>
                {s.exercices.map(e => <LigneExoModele key={e.id} e={e} semaines={semaines} />)}
                <AjoutModele modeleId={modele.id} lundi={s.lundi} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </div>
  )
}
