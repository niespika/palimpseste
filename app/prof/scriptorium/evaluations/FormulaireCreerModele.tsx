'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ChampDate from '@/app/prof/calendrier/config/ChampDate'
import { creerModele } from './modele-actions'

const GABARITS = [
  {
    v: 'tc', label: 'Tronc commun',
    desc: '1 exercice/sem · écriture → écriture → lecture',
    cadence: ['ecriture', 'ecriture', 'lecture'] as const,
    note: '≈ 1 exercice par semaine d’enseignement.',
  },
  {
    v: 'hlp', label: 'HLP',
    desc: 'même cycle · fragments & lecture à part',
    cadence: ['ecriture', 'ecriture', 'lecture'] as const,
    note: 'Fragments et lecture de livre suivent leur propre échéancier.',
  },
  {
    v: 'vierge', label: 'Vierge',
    desc: 'aucun exercice généré — tout à la main',
    cadence: [] as const,
    note: 'Rien n’est posé : tu ajoutes chaque exercice manuellement.',
  },
] as const

type Gabarit = (typeof GABARITS)[number]['v']

// Chip de type pour l'aperçu de la cadence (jetons : écriture = ok, lecture = info).
function ChipCadence({ type }: { type: 'ecriture' | 'lecture' }) {
  const lecture = type === 'lecture'
  return (
    <span className={`font-ui text-[11px] font-semibold uppercase tracking-[0.04em] rounded-full px-2.5 py-0.5 ${lecture ? 'bg-info-teinte text-info' : 'bg-ok-teinte text-ok'}`}>
      {lecture ? 'Lecture' : 'Écriture'}
    </span>
  )
}

export default function FormulaireCreerModele({ defautDate }: { defautDate: string | null }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [gabarit, setGabarit] = useState<Gabarit | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErreur(null)
    setLoading(true)
    const res = await creerModele(new FormData(e.currentTarget))
    setLoading(false)
    if (res.error) { setErreur(res.error); return }
    if (res.id) router.push(`/prof/scriptorium?vue=modeles&modele=${res.id}`)
    else router.refresh()
  }

  const gSel = GABARITS.find(g => g.v === gabarit) ?? null
  // Aperçu illustratif : 6 semaines du motif de cadence (avant création, dates réelles inconnues).
  const apercu = gSel ? Array.from({ length: 6 }, (_, i) => gSel.cadence[i % (gSel.cadence.length || 1)]).filter(Boolean) : []

  return (
    <div className="overflow-x-auto">
    <div className="flex border border-bordure rounded-xl overflow-hidden min-w-[860px]">
      {/* ── Gauche : formulaire (parchemin chaud) ────────────────────────────── */}
      <form onSubmit={handleSubmit} className="w-[436px] flex-none bg-parchemin border-r border-bordure p-6 flex flex-col gap-4">
        <div className="flex items-end justify-between gap-4">
          <h1 className="font-titre text-[25px] font-semibold text-encre leading-tight">Nouveau plan<br />d’évaluation</h1>
          <div className="w-[150px] flex-none">
            <label className="block font-ui text-[12px] text-muet mb-1">Date de début</label>
            <ChampDate name="date_debut" defaultValue={defautDate ?? ''} ariaLabel="Date de début du modèle" />
          </div>
        </div>

        <div>
          <label className="block font-ui text-[12px] text-muet mb-1">Titre</label>
          <input
            name="titre"
            required
            placeholder="ex. Terminale tronc commun — 2026"
            className="w-full border border-bordure-bouton rounded-lg bg-white px-3 py-2 font-corps text-[15px] text-encre focus:outline-none focus:ring-2 focus:ring-famille-eval"
          />
        </div>

        <fieldset className="flex flex-col gap-1.5">
          <legend className="font-ui text-[12px] text-muet mb-1.5">Gabarit de cadence</legend>
          {GABARITS.map(g => {
            const sel = gabarit === g.v
            return (
              <label
                key={g.v}
                className={`flex items-start gap-2.5 border rounded-lg px-3 py-2.5 cursor-pointer transition-colors ${sel ? 'border-[1.5px] border-famille-eval bg-attention-teinte' : 'border-bordure bg-surface hover:border-encre-douce'}`}
              >
                <input type="radio" name="gabarit" value={g.v} required onChange={() => setGabarit(g.v)} className="mt-1 accent-famille-eval" />
                <span>
                  <span className="font-corps text-[15px] font-semibold text-encre">{g.label}</span>
                  <span className="block font-ui text-[12.5px] text-muet">{g.desc}</span>
                </span>
              </label>
            )
          })}
        </fieldset>

        {!defautDate && (
          <p className="font-ui text-[12px] text-attention">
            Aucun semestre à venir défini — définis les semestres de la rentrée dans le Calendrier.
          </p>
        )}
        {erreur && <p className="font-ui text-[12px] text-retard">{erreur}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-auto self-start px-4 py-2.5 bg-bouton-plan text-bouton-plan-texte font-ui text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Création…' : 'Créer le modèle (brouillon)'}
        </button>
      </form>

      {/* ── Droite : aperçu de la cadence (surface claire) ────────────────────── */}
      <div className="flex-1 min-w-0 bg-surface p-6">
        <div className="flex items-baseline justify-between mb-3">
          <span className="font-ui text-[11px] font-bold uppercase tracking-[0.1em] text-encre-douce">Aperçu de la cadence</span>
          {gSel && <span className="font-corps italic text-[13px] text-muet-clair">{gSel.v === 'vierge' ? 'aucun exercice' : 'motif du gabarit'}</span>}
        </div>

        {!gSel ? (
          <p className="font-corps italic text-[15px] text-muet-clair">Choisis un gabarit pour visualiser la cadence que le modèle va poser, semaine par semaine.</p>
        ) : apercu.length === 0 ? (
          <p className="font-corps text-[15px] text-muet">{gSel.note}</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {apercu.map((t, i) => (
              <div key={i} className="flex items-center gap-3 bg-white border border-bordure rounded-lg px-3.5 py-2.5">
                <span className="font-ui text-[13px] font-semibold text-muet-clair w-16 flex-none">Sem. {i + 1}</span>
                <ChipCadence type={t as 'ecriture' | 'lecture'} />
                <span className="font-corps text-[13px] text-muet-clair">{t === 'lecture' ? 'classe' : 'maison'}</span>
              </div>
            ))}
            <p className="font-corps italic text-[13px] text-muet-clair mt-1">
              {gSel.note} L’aperçu détaillé (dates réelles) s’affiche une fois le modèle créé.
            </p>
          </div>
        )}
      </div>
    </div>
    </div>
  )
}
