'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { assignerParcoursClasse, retirerParcoursClasse } from '../actions'
import type { LigneAssignation } from './frise-serveur'

// Panneau d'assignation du MODÈLE : qui suit ce parcours, et rien d'autre.
// La DATE DE DÉBUT et la PUBLICATION de l'horaire ont déménagé dans le PARCOURS DE
// LA CLASSE (grille d'instance) — c'est là que la grille datée est sous les yeux, et
// que se règlent aussi les décalages. Ici on ne fait plus qu'ouvrir la porte ; la
// pastille dit où en est chaque classe, et le lien y conduit.

function fmtJour(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}` // 2026-09-21 → 21/09
}

/** Pastille d'état : publié ✓ / planifié (vert) ; assignée sans date en gris. */
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

function LigneRow({ parcoursId, ligne }: { parcoursId: string; ligne: LigneAssignation }) {
  const router = useRouter()
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  async function assigner() {
    setErreur(null); setChargement(true)
    // Aucune date ici : l'assignation ouvre l'accès, la planification vient ensuite.
    const res = await assignerParcoursClasse(parcoursId, ligne.classeId, null)
    setChargement(false)
    if (res.bloque || res.error) { setErreur(res.error ?? 'Enregistrement refusé.'); return }
    router.refresh()
  }

  async function retirer() {
    if (!confirm(
      `Retirer « ${ligne.nom} » de ce parcours ? Le parcours de la classe (ses ajustements et ses « vus ») est perdu.`,
    )) return
    setErreur(null); setChargement(true)
    const res = await retirerParcoursClasse(parcoursId, ligne.classeId)
    setChargement(false)
    if (res.error) { setErreur(res.error); return }
    router.refresh()
  }

  if (!ligne.assigned) {
    return (
      <div className="flex items-center gap-2.5 border border-bordure rounded-xl bg-white px-3.5 py-3 flex-wrap">
        <span className="text-muet-clair">▸</span>
        <span className="font-corps text-[16px] font-semibold text-encre flex-1 min-w-0 truncate">{ligne.nom}</span>
        <button
          onClick={assigner}
          disabled={chargement}
          className="font-ui text-[12px] font-semibold bg-bouton-parcours text-bouton-parcours-texte rounded-lg px-3 py-1.5 hover:opacity-90 disabled:opacity-50"
        >
          {chargement ? '…' : 'Assigner'}
        </button>
        {erreur && <p className="text-retard text-xs w-full">{erreur}</p>}
      </div>
    )
  }

  const lienInstance = ligne.parcoursClasseId
    ? `/prof/scriptorium?vue=classes&classe=${ligne.classeId}&instance=${ligne.parcoursClasseId}`
    : null

  return (
    <div className="border border-bordure rounded-xl bg-white px-3.5 py-3 space-y-2">
      <div className="flex items-center gap-2.5 flex-wrap">
        <span className="text-muet-clair" aria-hidden>▸</span>
        <span className="font-corps text-[16px] font-semibold text-encre flex-1 min-w-0 truncate">{ligne.nom}</span>
        {!ligne.suitModele && (
          <span
            className="font-ui text-[11px] bg-parchemin-fonce text-muet rounded-full px-2.5 py-0.5 flex-none"
            title="Cette classe ne suit plus le modèle : ce que tu ajoutes, retires ou déplaces ici n'y descend pas. Se règle dans le parcours de la classe."
          >
            ne suit plus le modèle
          </span>
        )}
        <StatutPill ligne={ligne} />
      </div>

      <p className="font-ui text-[12px] text-muet">
        {ligne.dateDebut
          ? <>Débute le {fmtJour(ligne.dateDebut)}{ligne.snapshot ? ` · horaire publié (v${ligne.snapshot.version})` : ''}.</>
          : <>Pas encore datée — la date se pose dans le parcours de la classe.</>}
      </p>
      {ligne.snapshot && ligne.diff && ligne.diff.nbChanges > 0 && (
        <p className="text-xs bg-attention-teinte text-attention px-2 py-1 rounded">
          ⚠ {ligne.diff.nbChanges} échéance(s) ont changé depuis la publication.
        </p>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        {lienInstance && (
          <Link
            href={lienInstance}
            className="font-ui text-[12px] font-semibold text-pigment hover:opacity-80"
          >
            {ligne.dateDebut ? 'Ouvrir le parcours de la classe →' : 'Poser la date →'}
          </Link>
        )}
        <button
          onClick={retirer}
          disabled={chargement}
          className="ml-auto font-ui text-[12px] text-muet hover:text-retard disabled:opacity-50"
        >
          Retirer l’assignation
        </button>
      </div>
      {erreur && <p className="text-retard text-xs">{erreur}</p>}
    </div>
  )
}

export default function AssignationClasses({ parcoursId, lignes }: { parcoursId: string; lignes: LigneAssignation[] }) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <span className="font-ui text-[11px] font-bold uppercase tracking-[0.1em] text-encre-douce">Assigner à une classe</span>
        <p className="font-ui text-[12px] text-muet mt-1">
          Assigner ouvre le parcours à la classe. La <b>date</b>, les <b>décalages</b> et la
          <b> publication</b> se règlent ensuite dans le parcours de la classe. Ce que tu ajoutes,
          retires ou déplaces ici, dans le modèle, <b>suit chaque classe</b> — sauf ce qu’elle a déjà vu.
        </p>
      </div>
      {lignes.length === 0 ? (
        <p className="text-sm text-muet">Aucune classe pour l’instant.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {lignes.map(l => (
            <LigneRow key={l.classeId} parcoursId={parcoursId} ligne={l} />
          ))}
        </div>
      )}
    </div>
  )
}
