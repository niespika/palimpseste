'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ajouterExerciceModele, retirerExerciceModele, deplacerExerciceModele,
  regenererModele, marquerModelePret, supprimerModele,
} from './modele-actions'
import type { ModeleDetail, ModeleExerciceLigne } from './modele-serveur'
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
    <div className="flex items-center justify-between gap-2 px-2 py-1.5 text-xs border-t border-bordure first:border-t-0">
      <div className="flex items-center gap-2 min-w-0 flex-wrap">
        <span className="text-encre">{libelleType(e)}</span>
        <span className="text-muet">· {e.lieu === 'maison' ? 'maison' : 'classe'}</span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <select
          defaultValue=""
          disabled={busy}
          onChange={(ev) => { const v = ev.target.value; if (v) { ev.target.value = ''; act(deplacerExerciceModele, { semaine_lundi: v }) } }}
          className="text-xs border border-bordure rounded bg-surface px-1 py-0.5 max-w-[8rem]"
          aria-label="Déplacer vers une semaine"
        >
          <option value="">Déplacer…</option>
          {semaines.filter(s => s.lundi !== e.semaineLundi).map(s => <option key={s.lundi} value={s.lundi}>{s.label}</option>)}
        </select>
        <button onClick={() => act(retirerExerciceModele)} disabled={busy} className="text-muet hover:text-retard disabled:opacity-50">Retirer</button>
      </div>
      {err && <span className="text-retard flex-shrink-0">{err}</span>}
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
    <div className="bg-attention-teinte rounded p-2 space-y-1.5">
      <p className="text-xs text-attention">
        {exercices.length} exercice(s) hors des semaines couvertes (la date de début ou le calendrier a changé) — déplace-les ou retire-les.
      </p>
      {exercices.map(e => (
        <div key={e.id} className="flex items-center justify-between gap-2 text-xs">
          <span className="text-encre">{libelleType(e)} <span className="text-muet">· semaine du {fmtJour(e.semaineLundi)}</span></span>
          <span className="flex items-center gap-2 flex-shrink-0">
            <select
              defaultValue=""
              disabled={busy}
              onChange={(ev) => { const v = ev.target.value; if (v) { ev.target.value = ''; act(e.id, deplacerExerciceModele, { semaine_lundi: v }) } }}
              className="text-xs border border-bordure rounded bg-surface px-1 py-0.5 max-w-[8rem]"
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
          <span className="text-encre">{diff.nbSupprimes} retiré(s), {diff.nbGeneres} généré(s) (exercices ajoutés à la main conservés)</span>
          <button onClick={appliquer} disabled={busy} className="bg-bouton text-surface px-2 py-0.5 rounded disabled:opacity-50">Appliquer</button>
          <button onClick={() => setDiff(null)} disabled={busy} className="text-muet hover:text-encre disabled:opacity-50">Annuler</button>
        </>
      )}
      {err && <span className="text-retard">{err}</span>}
    </div>
  )
}

export default function GrilleModele({ modele }: { modele: ModeleDetail }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [confirmSuppr, setConfirmSuppr] = useState(false)

  const semaines: SemaineOpt[] = modele.semaines.map(s => {
    const peda = libelleSemainePeda(s.semestreNom, s.pedaNum)
    return { lundi: s.lundi, label: `Lundi ${fmtJour(s.lundi)}${peda ? ` · ${peda}` : ''}` }
  })

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
    router.push('/prof/scriptorium?vue=modeles') // le modèle n'existe plus → retour à la liste
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h3 className="text-sm font-medium text-encre">{modele.titre}</h3>
          <p className="text-xs text-muet">
            Modèle {modele.anneeScolaire}–{modele.anneeScolaire + 1} · gabarit {modele.gabarit.toUpperCase()} · début {fmtJour(modele.dateDebut)} ·{' '}
            {modele.statut === 'pret' ? <span className="text-ok">prêt</span> : <span className="text-attention">brouillon</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {confirmSuppr ? (
            <span className="flex items-center gap-2 text-xs">
              <span className="text-retard">Supprimer ce modèle ? (les plans déjà assignés survivent)</span>
              <button onClick={supprimer} disabled={busy} className="text-retard hover:underline disabled:opacity-50">Oui</button>
              <button onClick={() => setConfirmSuppr(false)} disabled={busy} className="text-muet hover:text-encre disabled:opacity-50">Non</button>
            </span>
          ) : (
            <button onClick={() => setConfirmSuppr(true)} disabled={busy} className="text-xs text-muet hover:text-retard disabled:opacity-50">Supprimer</button>
          )}
          <button onClick={togglePret} disabled={busy} className="px-3 py-2 bg-bouton text-surface text-sm rounded-lg hover:opacity-90 disabled:opacity-50">
            {busy ? '…' : modele.statut === 'pret' ? 'Repasser en brouillon' : 'Marquer prêt'}
          </button>
        </div>
      </div>
      {err && <p className="text-xs text-retard">{err}</p>}

      {modele.avisBloquant && (
        <p className="text-xs bg-retard-teinte text-retard px-2 py-1 rounded">⚠ Configuration des semestres incohérente (chevauchement) — corrige-la dans le Calendrier.</p>
      )}
      {modele.avis && !modele.avisBloquant && <p className="text-xs text-muet">{modele.avis}</p>}

      <ChangerGabaritModele modeleId={modele.id} gabaritActuel={modele.gabarit} />

      {modele.aRecaler.length > 0 && <RecalageModele exercices={modele.aRecaler} semaines={semaines} />}

      <div className="border border-bordure rounded-lg divide-y divide-bordure">
        {modele.semaines.length === 0 ? (
          <p className="text-sm text-muet p-3">Aucune semaine d’enseignement couverte — définis les semestres dans le Calendrier.</p>
        ) : (
          modele.semaines.map((s) => (
            <div key={s.lundi} className="p-2">
              <div className="flex items-center justify-between gap-2 text-xs mb-1">
                <span className="text-encre-douce">Lundi {fmtJour(s.lundi)}</span>
                <span className="text-muet">{libelleSemainePeda(s.semestreNom, s.pedaNum)}</span>
              </div>
              {s.exercices.length > 0 && (
                <div className="border border-bordure rounded mb-1">
                  {s.exercices.map((e) => <LigneExoModele key={e.id} e={e} semaines={semaines} />)}
                </div>
              )}
              <AjoutModele modeleId={modele.id} lundi={s.lundi} />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
