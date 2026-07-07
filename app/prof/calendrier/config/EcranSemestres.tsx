'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Semestre } from '@/types/calendrier'
import { formatJour } from '@/utils/fuseau'
import {
  creerSemestre,
  modifierSemestre,
  definirSemestreActif,
  supprimerSemestre,
  archiverSemestre,
  restaurerSemestre,
} from './actions'
import ChampDate from './ChampDate'

export type SemestreInfo = Semestre & {
  anneeScolaire: string
  totalSemaines: number
  nbVacances: number
  semaineCourante: number
  termine: boolean
}

const INPUT =
  'w-full px-3 py-2 border border-bordure rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pigment'
const fmt = (d: string) => formatJour(d, { day: 'numeric', month: 'short', year: 'numeric' })
const fmtJour = (d: string) => formatJour(d, { day: 'numeric', month: 'long' })

// ── Formulaire création / édition (module-level → conserve l'état de ChampDate) ──
function FormulaireSemestre({
  s,
  busy,
  onSubmit,
  onCancel,
  onDelete,
}: {
  s?: SemestreInfo
  busy: boolean
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  onCancel: () => void
  onDelete?: () => void
}) {
  return (
    <form onSubmit={onSubmit} className="bg-surface border border-bordure rounded-xl p-4 space-y-3">
      {!s && <h4 className="text-sm font-medium text-encre">Nouveau semestre</h4>}
      <input name="name" defaultValue={s?.name} required placeholder="Nom — ex. : Semestre 1" className={INPUT} />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-muet mb-1">Début (lundi de S1)</label>
          <ChampDate name="start_date" defaultValue={s?.start_date} ariaLabel="Date de début" />
        </div>
        <div>
          <label className="block text-xs font-medium text-muet mb-1">Fin</label>
          <ChampDate name="end_date" defaultValue={s?.end_date} ariaLabel="Date de fin" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button type="submit" disabled={busy} className="bg-bouton text-surface px-4 py-2 rounded-lg text-sm hover:opacity-90 disabled:opacity-50">
          {busy ? '…' : s ? 'Enregistrer' : 'Créer'}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-encre-douce hover:bg-parchemin-fonce rounded-lg">
          Annuler
        </button>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            disabled={busy}
            className="ml-auto font-ui text-[13px] text-retard hover:opacity-80 underline disabled:opacity-50"
          >
            Supprimer
          </button>
        )}
      </div>
    </form>
  )
}

// ── Carte d'un semestre vivant (vue) ────────────────────────────────────────────
function CarteVivant({
  s,
  busy,
  onEdit,
  onSetActif,
  onArchive,
}: {
  s: SemestreInfo
  busy: boolean
  onEdit: () => void
  onSetActif: () => void
  onArchive: () => void
}) {
  const pct = s.totalSemaines > 0 ? Math.round((s.semaineCourante / s.totalSemaines) * 100) : 0
  const actif = s.is_active
  return (
    <div
      className={`bg-surface rounded-xl px-5 py-4 flex items-start gap-4 ${
        actif ? 'border-[1.5px] border-ok' : s.termine ? 'border border-bordure opacity-80' : 'border border-bordure'
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className={`font-semibold text-encre ${actif ? 'text-[17px]' : 'text-base'}`}>{s.name}</span>
          {actif ? (
            <span className="font-ui text-[11px] font-bold uppercase tracking-wide text-ok bg-ok-teinte rounded-full px-2.5 py-0.5">
              actif
            </span>
          ) : s.termine ? (
            <span className="font-ui text-[11px] font-semibold uppercase tracking-wide text-muet bg-parchemin-fonce rounded-full px-2.5 py-0.5">
              terminé
            </span>
          ) : (
            <span className="font-ui text-[11px] font-semibold uppercase tracking-wide text-encre-douce bg-parchemin-fonce rounded-full px-2.5 py-0.5">
              à venir
            </span>
          )}
        </div>

        {actif && s.totalSemaines > 0 && (
          <div className="flex h-1.5 rounded-full overflow-hidden max-w-[440px] mt-2.5 bg-bordure">
            <div className="bg-ok" style={{ width: `${pct}%` }} />
          </div>
        )}

        <div className="text-[13px] text-muet mt-1.5">
          {actif && s.semaineCourante > 0 && `semaine ${s.semaineCourante} / ${s.totalSemaines} · `}
          {fmt(s.start_date)} → {fmt(s.end_date)}
          {!actif && ` · ${s.totalSemaines} semaine${s.totalSemaines > 1 ? 's' : ''}`}
          {actif && s.nbVacances > 0 && ` · ${s.nbVacances} période${s.nbVacances > 1 ? 's' : ''} de vacances`}
        </div>

        {/* Semestre actif ET terminé : on ne peut pas l'archiver tant qu'il reste
            la référence active — explique la marche à suivre plutôt que de laisser
            l'utilisateur chercher un bouton « Archiver » absent. */}
        {actif && s.termine && (
          <div className="text-[12.5px] italic text-attention mt-1.5">
            {`Terminé le ${fmtJour(s.end_date)} — définis un autre semestre actif pour pouvoir l’archiver.`}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 flex-none font-ui text-[13px]">
        {!actif && (
          <button onClick={onSetActif} disabled={busy} className="text-muet hover:text-encre underline disabled:opacity-50">
            Définir actif
          </button>
        )}
        {!actif && (
          <button onClick={onArchive} disabled={busy} className="text-muet hover:text-encre underline disabled:opacity-50">
            Archiver
          </button>
        )}
        <button onClick={onEdit} className="text-muet hover:text-encre underline">
          Éditer
        </button>
      </div>
    </div>
  )
}

export default function EcranSemestres({ semestres }: { semestres: SemestreInfo[] }) {
  const router = useRouter()
  const [ongletArchives, setOngletArchives] = useState(false)
  const [creation, setCreation] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [bannieresMasquees, setBannieresMasquees] = useState<Set<string>>(new Set())

  const vivants = semestres.filter((s) => !s.archived_at)
  const archives = semestres.filter((s) => s.archived_at)
  // Actif d'abord, puis l'ordre reçu (start_date décroissant).
  const vivantsTries = [...vivants].sort((a, b) => (b.is_active ? 1 : 0) - (a.is_active ? 1 : 0))

  // Bandeau proactif : premier semestre terminé, non actif, non archivé, non masqué.
  const aArchiver = vivants.find((s) => s.termine && !s.is_active && !bannieresMasquees.has(s.id))

  async function agir(fn: () => Promise<{ error?: string }>) {
    setBusy(true)
    setErreur(null)
    const res = await fn()
    setBusy(false)
    if (res.error) return setErreur(res.error)
    router.refresh()
  }

  async function handleCreer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setBusy(true)
    setErreur(null)
    const res = await creerSemestre({
      name: f.get('name') as string,
      start_date: f.get('start_date') as string,
      end_date: f.get('end_date') as string,
    })
    setBusy(false)
    if (res.error) return setErreur(res.error)
    setCreation(false)
    router.refresh()
  }

  async function handleModifier(e: React.FormEvent<HTMLFormElement>, id: string) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setBusy(true)
    setErreur(null)
    const res = await modifierSemestre(id, {
      name: f.get('name') as string,
      start_date: f.get('start_date') as string,
      end_date: f.get('end_date') as string,
    })
    setBusy(false)
    if (res.error) return setErreur(res.error)
    setEditId(null)
    router.refresh()
  }

  function handleSupprimer(id: string, nom: string) {
    if (!confirm(`Supprimer définitivement le semestre « ${nom} » ? (préfère « Archiver » pour le masquer sans le détruire)`)) return
    agir(() => supprimerSemestre(id))
  }

  // Archives groupées par année scolaire (récentes d'abord).
  const parAnnee = new Map<string, SemestreInfo[]>()
  for (const s of archives) {
    const arr = parAnnee.get(s.anneeScolaire) ?? []
    arr.push(s)
    parAnnee.set(s.anneeScolaire, arr)
  }
  const anneesTriees = [...parAnnee.keys()].sort().reverse()

  return (
    <div className="space-y-4">
      {/* Segmented control : année courante / archives */}
      <div className="flex justify-end">
        <div className="inline-flex gap-[3px] border border-bordure-bouton rounded-[9px] p-[3px] bg-parchemin-fonce">
          <button
            type="button"
            onClick={() => setOngletArchives(false)}
            className={`font-ui text-[13px] px-3.5 py-1.5 rounded-md whitespace-nowrap ${
              !ongletArchives ? 'bg-surface border border-bordure-bouton text-encre font-bold' : 'text-muet font-medium'
            }`}
          >
            En cours
          </button>
          <button
            type="button"
            onClick={() => setOngletArchives(true)}
            className={`font-ui text-[13px] px-3.5 py-1.5 rounded-md whitespace-nowrap ${
              ongletArchives ? 'bg-surface border border-bordure-bouton text-encre font-bold' : 'text-muet font-medium'
            }`}
          >
            Archives · {archives.length}
          </button>
        </div>
      </div>

      {erreur && <p className="text-retard text-sm">{erreur}</p>}

      {ongletArchives ? (
        // ── Onglet Archives ──
        archives.length === 0 ? (
          <p className="text-sm text-muet">Aucun semestre archivé.</p>
        ) : (
          <div className="space-y-5">
            {anneesTriees.map((annee) => (
              <div key={annee}>
                <div className="font-ui text-[11px] font-semibold uppercase tracking-[0.14em] text-muet-clair mb-2">
                  {annee}
                </div>
                <div className="space-y-2">
                  {parAnnee.get(annee)!.map((s) => (
                    <div key={s.id} className="bg-surface border border-bordure rounded-xl px-5 py-3.5 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-encre">{s.name}</div>
                        <div className="text-[13px] text-muet mt-0.5">
                          {fmt(s.start_date)} → {fmt(s.end_date)} · {s.totalSemaines} semaine
                          {s.totalSemaines > 1 ? 's' : ''}
                        </div>
                      </div>
                      <button
                        onClick={() => agir(() => restaurerSemestre(s.id))}
                        disabled={busy}
                        className="font-ui text-[13px] text-muet hover:text-encre underline flex-none disabled:opacity-50"
                      >
                        Restaurer
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        // ── Onglet année courante ──
        <>
          {aArchiver && (
            <div className="flex items-center gap-3 flex-wrap bg-attention-teinte rounded-xl px-[18px] py-3" style={{ border: '1px solid #D9BE8C' }}>
              <span className="text-base">🗄</span>
              <span className="text-[15px] flex-1 min-w-0" style={{ color: '#6B5436' }}>
                « {aArchiver.name} » est terminé depuis le {fmtJour(aArchiver.end_date)}.
              </span>
              <button
                onClick={() => agir(() => archiverSemestre(aArchiver.id))}
                disabled={busy}
                className="font-ui text-[13px] font-semibold text-encre-douce bg-surface border border-puce rounded-lg px-3.5 py-1.5 whitespace-nowrap flex-none hover:bg-parchemin disabled:opacity-50"
              >
                Archiver
              </button>
              <button
                onClick={() => setBannieresMasquees((prev) => new Set(prev).add(aArchiver.id))}
                className="font-ui text-[13px] text-muet whitespace-nowrap"
                style={{ textDecoration: 'underline dotted' }}
              >
                plus tard
              </button>
            </div>
          )}

          {vivants.length === 0 && !creation && (
            <p className="text-sm text-muet">Aucun semestre. Crée le premier ci-dessous.</p>
          )}

          <div className="space-y-2.5">
            {vivantsTries.map((s) =>
              editId === s.id ? (
                <FormulaireSemestre
                  key={s.id}
                  s={s}
                  busy={busy}
                  onSubmit={(e) => handleModifier(e, s.id)}
                  onCancel={() => setEditId(null)}
                  onDelete={s.is_active ? undefined : () => handleSupprimer(s.id, s.name)}
                />
              ) : (
                <CarteVivant
                  key={s.id}
                  s={s}
                  busy={busy}
                  onEdit={() => setEditId(s.id)}
                  onSetActif={() => agir(() => definirSemestreActif(s.id))}
                  onArchive={() => agir(() => archiverSemestre(s.id))}
                />
              )
            )}
          </div>

          {creation ? (
            <FormulaireSemestre busy={busy} onSubmit={handleCreer} onCancel={() => setCreation(false)} />
          ) : (
            <button
              onClick={() => setCreation(true)}
              className="font-ui text-[15px] font-medium bg-bouton text-surface px-5 py-2.5 rounded-[10px] hover:opacity-90"
            >
              + Nouveau semestre
            </button>
          )}
        </>
      )}
    </div>
  )
}
