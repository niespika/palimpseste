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

export interface CopieADeplacer { depotId: string; nom: string; remise: boolean }

export default function ReunirCopies({
  copies,
  cibleId,
}: {
  copies: CopieADeplacer[]
  cibleId: string
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [confirme, setConfirme] = useState(false)
  const [rapport, setRapport] = useState<string[] | null>(null)
  const remises = copies.filter((c) => c.remise).length

  async function reunir() {
    setBusy(true)
    setRapport(null)
    const lignes: string[] = []
    let deplacees = 0
    for (const c of copies.filter((x) => x.remise)) {
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
    setConfirme(false)
    setRapport(lignes)
    if (deplacees > 0) router.refresh()
  }

  if (remises === 0) return null

  return (
    <div className="rounded-xl border border-bordure bg-parchemin-fonce px-4 py-3 mb-4">
      <p className="font-corps text-sm text-encre">
        Une autre conception <strong>identique</strong> de cet examen existe pour cette classe.
        Ce qui est déposé ici peut la rejoindre.
      </p>
      {/* ⚠️ On dit DEUX nombres, et c'est le correctif : `copies` porte TOUS les
          dépôts de la classe, assignations nues comprises. Annoncer « 25 copies »
          là où deux élèves seulement ont remis quelque chose faisait croire à un
          geste anodin sur une poignée de lignes. */}
      <p className="font-ui text-[12.5px] text-muet mt-1">
        <strong>{copies.length}</strong> dépôt{copies.length > 1 ? 's' : ''} rattaché
        {copies.length > 1 ? 's' : ''} à cet exercice, dont <strong>{remises}</strong> copie
        {remises > 1 ? 's' : ''} remise{remises > 1 ? 's' : ''}. Seules les copies remises
        partent — déplacer des assignations vides n’accomplirait rien. Une copie déjà mesurée
        par la chaîne ne bouge pas.
      </p>
      {/* Confirmation EN PAGE, jamais `confirm()` (patron `TableauLive.tsx`) : le
          dialogue natif est muet dans un aperçu embarqué, et le bouton paraît mort.
          Deux temps parce qu'un seul clic déplacerait ici vingt-cinq lignes. */}
      {!confirme ? (
        <button
          type="button"
          onClick={() => setConfirme(true)}
          disabled={busy}
          className="mt-2.5 font-ui text-[13px] font-semibold text-encre-douce bg-surface border border-puce rounded-lg px-3 py-1.5 hover:bg-parchemin disabled:opacity-50"
        >
          Déplacer vers l’autre conception…
        </button>
      ) : (
        <div className="mt-2.5 flex items-center gap-3 flex-wrap">
          <span className="font-ui text-[12.5px] text-retard">
            Déplacer {remises} copie{remises > 1 ? 's' : ''} remise{remises > 1 ? 's' : ''} vers
            l’autre conception ?
          </span>
          <button
            type="button"
            onClick={reunir}
            disabled={busy}
            className="font-ui text-[13px] font-semibold bg-retard-teinte text-retard px-3.5 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {busy ? 'Déplacement…' : 'Oui, déplacer'}
          </button>
          <button
            type="button"
            onClick={() => setConfirme(false)}
            disabled={busy}
            className="font-ui text-[13px] text-muet hover:text-encre disabled:opacity-50"
          >
            Annuler
          </button>
        </div>
      )}
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
