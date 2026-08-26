'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deplacerDepotVersExercice } from '@/app/prof/examens-diagnostiques/actions'

// ---------------------------------------------------------------------------
// RÉUNIR DEUX CONCEPTIONS DU MÊME EXAMEN.
//
// Un même examen conçu DEUX FOIS pour une classe éparpille les copies entre les
// deux instances (constaté sur 1HLP le 25/08 : seize d'un côté, une de l'autre).
// Ce bandeau ne s'affiche que si une autre conception IDENTIQUE POUR LA MESURE
// existe pour la même classe — la comparaison est faite côté serveur, sur tous
// les champs qui entrent dans le jugement, jamais « à l'œil sur le titre ».
//
// ⚠️ Les copies partent UNE PAR UNE, et chacune repasse par les trois refus de
//    `deplacerDepotVersExercice` (identité, chaîne déjà tournée, dépôt déjà là).
//    Une copie qui ne peut pas bouger n'empêche donc pas les autres, et le
//    compte rendu dit laquelle a résisté et pourquoi. Un déplacement en masse
//    qui s'arrête à la première résistance laisserait un état à moitié fait
//    sans dire lequel.
// ---------------------------------------------------------------------------

export interface CopieADeplacer { depotId: string; nom: string }

export default function ReunirCopies({
  copies,
  cibleId,
}: {
  copies: CopieADeplacer[]
  cibleId: string
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [rapport, setRapport] = useState<string[] | null>(null)

  async function reunir() {
    setBusy(true)
    setRapport(null)
    const lignes: string[] = []
    let deplacees = 0
    for (const c of copies) {
      const fd = new FormData()
      fd.set('depot_id', c.depotId)
      fd.set('exercice_cible_id', cibleId)
      try {
        const res = await deplacerDepotVersExercice(null, fd)
        if (res.ok) { deplacees++; lignes.push(`✓ ${c.nom} — déplacée`) }
        else lignes.push(`✗ ${c.nom} — ${res.message}${res.details?.length ? ` (${res.details.join(' · ')})` : ''}`)
      } catch (e) {
        lignes.push(`✗ ${c.nom} — ${e instanceof Error ? e.message : 'échec'}`)
      }
    }
    setBusy(false)
    setRapport(lignes)
    if (deplacees > 0) router.refresh()
  }

  if (copies.length === 0) return null

  return (
    <div className="rounded-xl border border-bordure bg-parchemin-fonce px-4 py-3 mb-4">
      <p className="font-corps text-sm text-encre">
        Une autre conception <strong>identique</strong> de cet examen existe pour cette classe.
        Les copies déposées ici peuvent la rejoindre.
      </p>
      <p className="font-ui text-[12.5px] text-muet mt-1">
        {copies.length} copie{copies.length > 1 ? 's' : ''} déplaçable
        {copies.length > 1 ? 's' : ''}. Une copie déjà mesurée par la chaîne ne bouge plus.
      </p>
      <button
        type="button"
        onClick={reunir}
        disabled={busy}
        className="mt-2.5 font-ui text-[13px] font-semibold text-encre-douce bg-surface border border-puce rounded-lg px-3 py-1.5 hover:bg-parchemin disabled:opacity-50"
      >
        {busy ? 'Déplacement…' : `Déplacer vers l’autre conception`}
      </button>
      {rapport && (
        <ul className="mt-2.5 space-y-0.5">
          {rapport.map((l, i) => (
            <li key={i} className={`font-ui text-[12.5px] ${l.startsWith('✓') ? 'text-ok' : 'text-retard'}`}>{l}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
