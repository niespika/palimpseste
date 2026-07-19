'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ChampDate from '@/app/prof/calendrier/config/ChampDate'
import { assignerParcoursClasse, retirerParcoursClasse, publierHoraire } from '../actions'
import type { LigneAssignation, ApercuFrise } from './frise-serveur'

function fmtJour(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}` // 2026-09-21 → 21/09
}

function ApercuBloc({ apercu }: { apercu: ApercuFrise }) {
  return (
    <div className="mt-2 space-y-1.5">
      {apercu.avisBloquant && (
        <p className="text-xs bg-retard-teinte text-retard px-2 py-1 rounded">
          ⚠ Configuration des semestres incohérente (chevauchement) — corrige-la dans le Calendrier.
        </p>
      )}
      {apercu.snap && (
        <p className="text-xs text-muet">
          Date ramenée à la semaine d’enseignement du {fmtJour(apercu.snap.dateRamenee)} (la date saisie tombait en vacances / hors semestre).
        </p>
      )}
      {apercu.avis && !apercu.avisBloquant && (
        <p className="text-xs text-muet">{apercu.avis}</p>
      )}
      {apercu.nbNonPlanifiable > 0 && (
        <p className="text-xs bg-retard-teinte text-retard px-2 py-1 rounded">
          {apercu.nbNonPlanifiable} semaine(s) non planifiable(s) — au-delà de l’année scolaire. Raccourcis le parcours ou définis le semestre suivant.
        </p>
      )}
      {apercu.nbADefinir > 0 && (
        <p className="text-xs bg-attention-teinte text-attention px-2 py-1 rounded">
          {apercu.nbADefinir} semaine(s) « à définir » — semestre de l’année scolaire pas encore créé.
        </p>
      )}
      <div className="max-h-40 overflow-y-auto border border-bordure rounded divide-y divide-bordure">
        {apercu.semaines.map(s => (
          <div key={s.semaine} className="flex items-center justify-between px-2.5 py-1.5 font-corps text-[13px]">
            <span className="text-muet">Sem. {s.semaine}</span>
            {s.statut === 'definie' && s.dateReelle ? (
              <span className="text-encre">
                {fmtJour(s.dateReelle)} <span className="text-muet">· {s.semestreNom} · sem. {s.pedaDansSemestre}</span>
              </span>
            ) : s.statut === 'a_definir' ? (
              <span className="text-attention">à définir</span>
            ) : (
              <span className="text-retard">non planifiable</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/** Pastille d'état d'une classe assignée : publié ✓ / planifié en VERT (jeton ok) ;
 *  sans date en gris. Visible aussi bien repliée que dépliée. */
function StatutPill({ ligne }: { ligne: LigneAssignation }) {
  if (ligne.snapshot || ligne.dateDebut) {
    return (
      <span className="font-ui text-[11px] font-semibold uppercase tracking-[0.05em] bg-ok-teinte text-ok rounded-full px-2.5 py-0.5 flex-none">
        {ligne.snapshot ? 'publié ✓' : 'planifié'}
      </span>
    )
  }
  return <span className="font-corps italic text-[13px] text-muet-clair flex-none">sans date</span>
}

function LigneRow({
  parcoursId, ligne, ouvert, onToggle,
}: {
  parcoursId: string
  ligne: LigneAssignation
  ouvert: boolean
  onToggle: () => void
}) {
  const router = useRouter()
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [avis, setAvis] = useState<string | null>(null)

  async function assigner(date: string | null) {
    setErreur(null); setAvis(null); setChargement(true)
    const res = await assignerParcoursClasse(parcoursId, ligne.classeId, date)
    setChargement(false)
    if (res.bloque || res.error) { setErreur(res.error ?? 'Enregistrement refusé.'); return }
    if (res.avis) setAvis(res.avis)
    router.refresh()
  }

  async function retirer() {
    setErreur(null); setChargement(true)
    const res = await retirerParcoursClasse(parcoursId, ligne.classeId)
    setChargement(false)
    if (res.error) { setErreur(res.error); return }
    router.refresh()
  }

  async function onSubmitDate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const date = (fd.get('dateDebut') as string) || null
    await assigner(date)
  }

  async function publier() {
    setErreur(null); setAvis(null); setChargement(true)
    const res = await publierHoraire(parcoursId, ligne.classeId)
    setChargement(false)
    if (res.error) { setErreur(res.error); return }
    router.refresh()
  }

  // ── Classe NON assignée : une ligne + bouton Assigner (indépendant du repli,
  //    ce qui évite un état incohérent juste après « Retirer l'assignation »). ──
  if (!ligne.assigned) {
    return (
      <div className="flex items-center gap-2.5 border border-bordure rounded-xl bg-white px-3.5 py-3 flex-wrap">
        <span className="text-muet-clair">▸</span>
        <span className="font-corps text-[16px] font-semibold text-encre flex-1 min-w-0 truncate">{ligne.nom}</span>
        <button
          onClick={() => assigner(null)}
          disabled={chargement}
          className="font-ui text-[12px] font-semibold bg-bouton-parcours text-bouton-parcours-texte rounded-lg px-3 py-1.5 hover:opacity-90 disabled:opacity-50"
        >
          {chargement ? '…' : 'Assigner'}
        </button>
        {erreur && <p className="text-retard text-xs w-full">{erreur}</p>}
      </div>
    )
  }

  // ── Classe assignée, repliée : nom + pastille d'état (verte). ─────────────────
  if (!ouvert) {
    return (
      <button onClick={onToggle} className="flex items-center gap-2.5 border border-bordure rounded-xl bg-white px-3.5 py-3 text-left w-full hover:border-puce transition-colors">
        <span className="text-muet-clair">▸</span>
        <span className="font-corps text-[16px] font-semibold text-encre flex-1 min-w-0 truncate">{ligne.nom}</span>
        <StatutPill ligne={ligne} />
      </button>
    )
  }

  // ── Ligne dépliée : date + aperçu des échéances + publication ───────────────
  return (
    <div className="border-[1.5px] border-puce rounded-xl bg-white overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center gap-2.5 px-3.5 py-3 border-b border-bordure text-left">
        <span className="text-pigment">▾</span>
        <span className="font-corps text-[16px] font-semibold text-encre flex-1 min-w-0 truncate">{ligne.nom}</span>
        <StatutPill ligne={ligne} />
      </button>

      <div className="px-3.5 py-3">
        <form onSubmit={onSubmitDate} className="space-y-1.5">
          <label className="block font-ui text-[12px] text-muet">Début pour cette classe</label>
          <div className="flex items-end gap-2">
            <div className="flex-1"><ChampDate name="dateDebut" defaultValue={ligne.dateDebut ?? ''} ariaLabel="Date de début du parcours pour cette classe" /></div>
            <button type="submit" disabled={chargement} className="font-ui text-[12px] bg-bouton-parcours text-bouton-parcours-texte px-3 py-2 rounded-lg hover:opacity-90 disabled:opacity-50">
              {chargement ? '…' : 'Planifier'}
            </button>
          </div>
        </form>

        {erreur && <p className="text-retard text-xs mt-2">{erreur}</p>}
        {avis && <p className="text-attention text-xs mt-2">{avis}</p>}

        {ligne.apercu && <ApercuBloc apercu={ligne.apercu} />}
        {!ligne.apercu && (
          <p className="text-xs text-muet mt-2">Aucune date — pose une date de début pour voir les échéances réelles.</p>
        )}

        {/* État de publication (texte) : date de publication + à jour / décalage. */}
        {ligne.apercu && ligne.snapshot && (
          <div className="mt-2 space-y-1">
            <p className="text-xs text-muet">
              Horaire publié{ligne.snapshot.genereLe ? ` le ${fmtJour(ligne.snapshot.genereLe.slice(0, 10))}` : ''} (v{ligne.snapshot.version}).
            </p>
            {ligne.diff && ligne.diff.nbChanges > 0 ? (
              <p className="text-xs bg-attention-teinte text-attention px-2 py-1 rounded">
                ⚠ {ligne.diff.nbChanges} échéance(s) ont changé depuis la publication (le calendrier a été modifié). Re-publie pour figer le nouvel horaire.
              </p>
            ) : (
              <p className="text-xs text-ok">✓ Horaire à jour.</p>
            )}
          </div>
        )}

        {/* Publier l'horaire (noyer) + Retirer l'assignation (ocre) sur la même ligne. */}
        <div className="mt-3 border-t border-bordure pt-3 flex items-center gap-2 flex-wrap">
          {ligne.apercu && (
            <button onClick={publier} disabled={chargement} className="font-ui text-[12px] font-semibold bg-bouton-parcours text-bouton-parcours-texte px-3 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50">
              {chargement ? '…' : ligne.snapshot ? 'Re-publier l’horaire' : 'Publier l’horaire'}
            </button>
          )}
          <button onClick={retirer} disabled={chargement} className="ml-auto font-ui text-[12px] font-semibold bg-bouton-plan text-bouton-plan-texte px-3 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50">
            Retirer l’assignation
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AssignationClasses({ parcoursId, lignes }: { parcoursId: string; lignes: LigneAssignation[] }) {
  // Une seule classe dépliée à la fois : par défaut la classe déjà assignée (celle
  // qu'on travaille) ; sinon aucune.
  const premiereAssignee = lignes.find(l => l.assigned)?.classeId ?? null
  const [classeOuverte, setClasseOuverte] = useState<string | null>(premiereAssignee)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="font-ui text-[11px] font-bold uppercase tracking-[0.1em] text-encre-douce">Assigner à une classe</span>
        {classeOuverte && (
          <button onClick={() => setClasseOuverte(null)} className="font-ui text-[12px] text-muet hover:text-encre">Tout replier</button>
        )}
      </div>
      {lignes.length === 0 ? (
        <p className="text-sm text-muet">Aucune classe pour l’instant.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {lignes.map(l => (
            <LigneRow
              key={l.classeId}
              parcoursId={parcoursId}
              ligne={l}
              ouvert={classeOuverte === l.classeId}
              onToggle={() => setClasseOuverte(prev => (prev === l.classeId ? null : l.classeId))}
            />
          ))}
        </div>
      )}
    </div>
  )
}
