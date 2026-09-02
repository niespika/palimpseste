'use client'
// ============================================================================
// C6 · L4 — CE QUE LA PAGE DE L'ESSAI MONTRE DE LA CHAÎNE DE MESURE, pour une
//            classe : l'état des dépôts, le clic qui met en file, la porte vers
//            la correction.
// ----------------------------------------------------------------------------
// ⚠️ Le retour propre de Fragments (lettres, /20) est au tableau, en dessous ;
//    il ne bouge pas. Ceci est l'AUTRE retour — et l'écran dit qu'il y en a deux.
// ============================================================================

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { declencherMesureEssai } from '../../essai-actions'

export interface EtatChaine {
  exerciceId: string
  depots: number
  ouverts: number
  remis: number
  retoursPublies: number
  mesures: number
}

export default function ChaineEssai(
  { epreuveId, classeId, etat, sansPlan }: { epreuveId: string; classeId: string; etat: EtatChaine | null; sansPlan: boolean },
) {
  const router = useRouter()
  const [enCours, setEnCours] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)

  async function declencher() {
    setEnCours(true); setMessage(null); setErreur(null)
    const r = await declencherMesureEssai(epreuveId, classeId)
    setEnCours(false)
    if ('error' in r && r.error) { setErreur(r.error); return }
    const d = r as { misEnFile?: number; dejaEnFile?: number; sansCopie?: number }
    setMessage(`${d.misEnFile ?? 0} copie${(d.misEnFile ?? 0) > 1 ? 's' : ''} mise${(d.misEnFile ?? 0) > 1 ? 's' : ''} en file`
      + ` · ${d.dejaEnFile ?? 0} déjà en file · ${d.sansCopie ?? 0} sans copie transcrite.`
      + ' Le traitement est différé : il tourne au fil de la file.')
    router.refresh()
  }

  return (
    <div className="bg-surface border border-bordure rounded-xl px-5 py-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muet uppercase tracking-wide">Chaîne de mesure — le second retour</p>
          <p className="text-sm text-encre-douce mt-1">
            Cet essai a <strong className="text-encre">deux retours</strong> : les lettres et la note de Fragments, au
            tableau ci-dessous ; et la mesure des compétences — Expression, Argumentation, Structure —, que tu
            corriges et publies à part. Le profil de compétences de l’élève ne lit que la seconde.
          </p>
        </div>
      </div>

      {!etat ? (
        <p className="text-sm text-muet">
          {sansPlan
            ? 'Cette classe n’a pas de plan d’évaluation validé : l’essai n’est pas branché à la chaîne de mesure. Crée et valide son plan (Scriptorium), puis réassigne l’essai.'
            : 'Cet essai n’est pas branché à la chaîne de mesure pour cette classe (assigné avant le branchement). Réassigne-le à la classe pour le brancher.'}
        </p>
      ) : (
        <>
          <p className="text-sm text-muet">
            {etat.depots} dépôt{etat.depots > 1 ? 's' : ''} · {etat.ouverts} ouvert{etat.ouverts > 1 ? 's' : ''}
            {' · '}{etat.remis} cop{etat.remis > 1 ? 'ies transcrites' : 'ie transcrite'}
            {' · '}{etat.mesures} mesure{etat.mesures > 1 ? 's' : ''}
            {' · '}{etat.retoursPublies} retour{etat.retoursPublies > 1 ? 's' : ''} publié{etat.retoursPublies > 1 ? 's' : ''}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={declencher}
              disabled={enCours || etat.remis === 0}
              title={etat.remis === 0 ? 'Aucune copie transcrite pour l’instant' : 'Mettre en file de mesure les copies transcrites'}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-bouton text-surface hover:opacity-90 disabled:opacity-50"
            >
              {enCours ? '…' : 'Déclencher la mesure'}
            </button>
            <Link
              href={`/prof/fragments-erudition/passation/${etat.exerciceId}`}
              className="text-sm text-encre-douce underline hover:text-encre"
            >
              Corriger et publier les retours de la chaîne →
            </Link>
          </div>
          {message && <p className="text-sm text-ok">{message}</p>}
        </>
      )}
      {erreur && <p className="text-sm text-retard">{erreur}</p>}
    </div>
  )
}
