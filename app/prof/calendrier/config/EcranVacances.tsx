'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Semestre, Holiday } from '@/types/calendrier'
import type { SemaineGrille } from '@/utils/calendrier-grille'
import { creerHoliday, modifierHoliday, supprimerHoliday, regenererSemaines } from './actions'
import { formatJour } from '@/utils/fuseau'
import ChampDate from './ChampDate'

const INPUT =
  'w-full px-3 py-2 border border-bordure rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pigment'

const fmt = (d: string) => formatJour(d, { day: 'numeric', month: 'short' })

// Une période enrichie du nombre de semaines pédagogiques qu'elle retire
// réellement (calculé côté serveur depuis la grille).
type HolidayInfo = Holiday & { semaines: number }

// Regroupe les semaines de vacances consécutives d'une même période en une pilule,
// en retenant le NOMBRE de semaines couvertes (`semaines`) pour dimensionner la
// pilule à la même largeur que le nombre de tuiles de semaine correspondant.
type Jeton =
  | { type: 'semaine'; numero: number | null; key: string }
  | { type: 'vacances'; label: string; semaines: number; key: string }

function jetonsDepuisBande(bande: SemaineGrille[]): Jeton[] {
  const out: Jeton[] = []
  let i = 0
  while (i < bande.length) {
    const w = bande[i]
    if (!w.isVacation) {
      out.push({ type: 'semaine', numero: w.pedagogicalNumber, key: `s${w.start}` })
      i++
    } else {
      const label = w.vacanceLabel
      let j = i
      while (j < bande.length && bande[j].isVacation && bande[j].vacanceLabel === label) j++
      out.push({ type: 'vacances', label: label ?? 'Vacances', semaines: j - i, key: `v${w.start}` })
      i = j
    }
  }
  return out
}

// Dimensions d'une tuile de semaine (px), pour aligner la largeur des pilules de
// vacances sur le nombre de tuiles couvertes : n tuiles = n·TUILE + (n−1)·GAP.
const TUILE = 30
const GAP = 6
const largeurVacances = (n: number) => n * TUILE + (n - 1) * GAP

// Libellé court pour la bande : « Vacance de printemps » → « Vac. printemps ».
const libelleCourt = (l: string) =>
  l.replace(/^vacances?\s+(de\s+la\s+|de\s+l'|de\s+|d'|du\s+|des\s+)?/i, 'Vac. ')

export default function EcranVacances({
  semestres,
  selectedId,
  holidays,
  bande,
}: {
  semestres: Semestre[]
  selectedId: string | null
  holidays: HolidayInfo[]
  bande: SemaineGrille[]
}) {
  const router = useRouter()
  const [editId, setEditId] = useState<string | null>(null)
  const [ajout, setAjout] = useState(false)
  const [busy, setBusy] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [genMsg, setGenMsg] = useState<string | null>(null)

  if (semestres.length === 0) {
    return <p className="text-sm text-muet">Crée d&apos;abord un semestre.</p>
  }

  const jetons = jetonsDepuisBande(bande)
  const nbPeda = bande.filter((w) => !w.isVacation).length

  async function handleRegenerer() {
    if (!selectedId) return
    setBusy(true)
    setErreur(null)
    setGenMsg(null)
    const res = await regenererSemaines(selectedId)
    setBusy(false)
    if (res.error) return setErreur(res.error)
    const d = res.data!
    const parts = [`${d.ajoutees} ajoutée(s)`, `${d.revues} mise(s) à jour`]
    if (d.horsCalendrier > 0) parts.push(`${d.horsCalendrier} hors calendrier (conservée(s))`)
    setGenMsg(`Semaines régénérées : ${parts.join(', ')}.`)
    router.refresh()
  }

  async function handleCreer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedId) return
    setBusy(true)
    setErreur(null)
    const form = e.currentTarget
    const f = new FormData(form)
    const res = await creerHoliday({
      semester_id: selectedId,
      label: f.get('label') as string,
      start_date: f.get('start_date') as string,
      end_date: f.get('end_date') as string,
    })
    setBusy(false)
    if (res.error) return setErreur(res.error)
    form.reset()
    setAjout(false)
    router.refresh()
  }

  async function handleModifier(e: React.FormEvent<HTMLFormElement>, id: string) {
    e.preventDefault()
    setBusy(true)
    setErreur(null)
    const f = new FormData(e.currentTarget)
    const res = await modifierHoliday(id, {
      label: f.get('label') as string,
      start_date: f.get('start_date') as string,
      end_date: f.get('end_date') as string,
    })
    setBusy(false)
    if (res.error) return setErreur(res.error)
    setEditId(null)
    router.refresh()
  }

  async function handleSupprimer(id: string, label: string) {
    if (!confirm(`Supprimer « ${label} » ?`)) return
    setBusy(true)
    setErreur(null)
    const res = await supprimerHoliday(id)
    setBusy(false)
    if (res.error) return setErreur(res.error)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {/* Sélecteur de semestre (si plusieurs) — aligné à droite. */}
      {semestres.length > 1 && (
        <div className="flex justify-end">
          <select
            value={selectedId ?? ''}
            onChange={(e) => router.push(`/prof/calendrier/config?section=vacances&sem=${e.target.value}`)}
            className="bg-surface border border-bordure-bouton rounded-lg px-3 py-1.5 text-[13px] font-ui font-semibold text-encre"
          >
            {semestres.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.is_active ? ' (actif)' : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {erreur && <p className="text-retard text-sm">{erreur}</p>}

      {/* Liste des périodes */}
      <div className="space-y-2.5">
        {holidays.map((h) =>
          editId === h.id ? (
            <form
              key={h.id}
              onSubmit={(e) => handleModifier(e, h.id)}
              className="bg-surface border border-bordure rounded-xl p-4 space-y-3"
            >
              <input name="label" defaultValue={h.label} required placeholder="Libellé" className={INPUT} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muet mb-1">Début</label>
                  <ChampDate name="start_date" defaultValue={h.start_date} ariaLabel="Date de début" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muet mb-1">Fin</label>
                  <ChampDate name="end_date" defaultValue={h.end_date} ariaLabel="Date de fin" />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={busy} className="bg-bouton text-surface px-4 py-2 rounded-lg text-sm hover:opacity-90 disabled:opacity-50">
                  Enregistrer
                </button>
                <button type="button" onClick={() => setEditId(null)} className="px-4 py-2 text-sm text-encre-douce hover:bg-parchemin-fonce rounded-lg">
                  Annuler
                </button>
              </div>
            </form>
          ) : (
            <div
              key={h.id}
              className="bg-surface border border-bordure rounded-xl px-5 py-3.5 flex items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="text-[15.5px] font-semibold text-encre truncate">{h.label}</div>
                <div className="text-[13px] text-muet mt-0.5">
                  {fmt(h.start_date)} → {fmt(h.end_date)} ·{' '}
                  {h.semaines > 0 ? (
                    `${h.semaines} semaine${h.semaines > 1 ? 's' : ''}`
                  ) : (
                    <span className="italic text-muet-clair">n&apos;enlève aucune semaine pédagogique</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setEditId(h.id)}
                className="font-ui text-[13px] text-muet hover:text-encre underline flex-none"
              >
                Éditer
              </button>
              <button
                onClick={() => handleSupprimer(h.id, h.label)}
                disabled={busy}
                className="font-ui text-[13px] text-retard hover:opacity-80 underline disabled:opacity-50 flex-none"
              >
                Supprimer
              </button>
            </div>
          )
        )}

        {/* Ajouter une période */}
        {ajout ? (
          <form onSubmit={handleCreer} className="bg-surface border border-bordure rounded-xl p-4 space-y-3">
            <input name="label" required placeholder="Libellé — ex. : Vacances de Noël" className={INPUT} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muet mb-1">Début</label>
                <ChampDate name="start_date" ariaLabel="Date de début" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muet mb-1">Fin</label>
                <ChampDate name="end_date" ariaLabel="Date de fin" />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={busy} className="bg-bouton text-surface px-4 py-2 rounded-lg text-sm hover:opacity-90 disabled:opacity-50">
                {busy ? '…' : 'Ajouter'}
              </button>
              <button type="button" onClick={() => setAjout(false)} className="px-4 py-2 text-sm text-encre-douce hover:bg-parchemin-fonce rounded-lg">
                Annuler
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setAjout(true)}
            className="w-full flex items-center gap-2.5 px-5 py-3 rounded-xl border-[1.5px] border-dashed border-puce bg-[#F9F5EC] hover:bg-parchemin transition-colors"
          >
            <span className="font-ui text-[15px] font-semibold text-encre-douce">＋</span>
            <span className="text-[15px] text-encre-douce">Ajouter une période</span>
            <span className="ml-auto italic text-[13px] text-muet-clair">libellé · début · fin</span>
          </button>
        )}
      </div>

      {/* Bloc « Semaines du semestre » */}
      <div className="bg-parchemin-fonce border border-bordure rounded-xl px-5 py-[18px]">
        <div className="flex items-baseline gap-2.5 flex-wrap mb-1">
          <span className="text-[15px] font-semibold text-encre">Semaines du semestre</span>
          <span className="text-[13px] font-semibold text-ok">
            {nbPeda} semaine{nbPeda > 1 ? 's' : ''} ✔
          </span>
          <span className="ml-auto italic text-[12.5px] text-muet-clair">
            numérotées en continu, en sautant les vacances
          </span>
        </div>

        {jetons.length === 0 ? (
          <p className="text-sm text-muet my-3">
            Aucune semaine — vérifie les dates du semestre sélectionné.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5 items-center my-3.5">
            {jetons.map((j) =>
              j.type === 'semaine' ? (
                <span
                  key={j.key}
                  className="w-[30px] h-[30px] rounded-[7px] bg-surface border border-bordure flex items-center justify-center font-ui text-[12.5px] font-semibold text-encre-douce"
                >
                  {j.numero}
                </span>
              ) : (
                <span
                  key={j.key}
                  title={`${j.label} · ${j.semaines} semaine${j.semaines > 1 ? 's' : ''}`}
                  className="flex items-center justify-center h-[30px] px-1.5 rounded-[7px] overflow-hidden"
                  style={{
                    width: largeurVacances(j.semaines),
                    background: 'repeating-linear-gradient(45deg,#E4D9C4 0 4px,#F1EADB 4px 8px)',
                    border: '1px dashed #C9BBA0',
                  }}
                >
                  {/* 1 semaine = simple tuile hachurée (largeur = 1 tuile) ; à partir
                      de 2 semaines, la largeur laisse la place au libellé court. */}
                  {j.semaines >= 2 && (
                    <span
                      className="italic text-[11px] text-muet truncate"
                      style={{ textShadow: '0 1px 1px rgba(251,248,241,.85)' }}
                    >
                      {libelleCourt(j.label)}
                    </span>
                  )}
                </span>
              )
            )}
          </div>
        )}

        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={handleRegenerer}
            disabled={busy}
            className="font-ui text-sm font-medium bg-surface text-encre-douce border border-puce rounded-lg px-4 py-2 hover:bg-parchemin disabled:opacity-50"
          >
            {busy ? '…' : 'Régénérer les semaines'}
          </button>
          <span className="inline-flex items-center gap-3 text-[12.5px] text-muet">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-[15px] h-[15px] rounded bg-surface border border-bordure inline-block" /> semaine
              pédagogique
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="w-[15px] h-[15px] rounded inline-block"
                style={{
                  background: 'repeating-linear-gradient(45deg,#E4D9C4 0 3px,#F1EADB 3px 6px)',
                  border: '1px dashed #C9BBA0',
                }}
              />{' '}
              vacances
            </span>
          </span>
        </div>
        {genMsg && <p className="text-ok text-sm mt-2">{genMsg}</p>}
      </div>
    </div>
  )
}
