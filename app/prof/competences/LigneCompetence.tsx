'use client'

// Une ligne de l'écran des statuts. Elle montre CE QUE LA FICHE PORTE, et le
// geste par lequel un statut se pose — le seul.
//
// ⚠️ Le Monitoring passe par la même ligne, avec son AVERTISSEMENT et sa
//    CONFIRMATION avant `evaluee` (07- §1.4 ; competences/monitoring.md §6 et
//    §8 ; piège 4). « Ici, le geste et sa garde. »

import { useActionState, useState } from 'react'
import { poserStatut, type Retour } from './actions'

const STATUTS = [
  ['differee', 'differee', 'La compétence ne mesure rien.'],
  ['mesuree_silencieusement', 'mesuree silencieusement',
    'On mesure, on ne rend aucun verdict à l’élève. C’est le défaut de sécurité.'],
  ['evaluee', 'evaluee',
    'La compétence rend un verdict à l’élève, et devient active dans toutes les classes.'],
] as const

export default function LigneCompetence({
  competence, nom, fiche, blocsCorrespondance, versionCorrespondance,
  statutCourant, lignesEleves, statutPoseLe, avertissement,
}: {
  competence: string
  nom: string
  fiche: { version: string; statut: string; nomFichier: string; deposeeLe: string } | null
  blocsCorrespondance: number
  versionCorrespondance: string | null
  statutCourant: string[]
  lignesEleves: number
  statutPoseLe: string | null
  avertissement?: string
}) {
  const [retour, action, enCours] = useActionState<Retour | null, FormData>(poserStatut, null)
  const [choix, setChoix] = useState<string>(statutCourant[0] ?? 'mesuree_silencieusement')
  const [confirme, setConfirme] = useState(false)

  const estMonitoring = competence === 'monitoring'
  const sansFiche = !fiche
  // Les DEUX planchers mécaniques, dits à l'écran — et gardés en base.
  const sansCorrespondance = !estMonitoring && blocsCorrespondance === 0
  const evalueeFermee = sansFiche || sansCorrespondance
  const demandeConfirmation = estMonitoring && choix === 'evaluee'

  return (
    <li className="py-3 space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="font-titre text-base text-encre">{nom}</h3>
        <p className="font-ui text-xs text-muet">
          {fiche
            ? <>fiche <code>{fiche.nomFichier}</code> · <strong>v{fiche.version}</strong> ·
              {' '}{fiche.statut} · déposée le {fiche.deposeeLe}</>
            : <span className="text-retard">aucune fiche déposée — la compétence est
              {' '}<code>differee</code>, et ne peut pas être autre chose</span>}
        </p>
      </div>

      <p className="font-ui text-xs text-encre-douce">
        {estMonitoring
          ? <>Pas de correspondance, et c&apos;est la règle : elle vit dans la fiche de
            {' '}<em>chaque compétence</em>, et le Monitoring n&apos;en a pas.</>
          : blocsCorrespondance > 0
            ? <>Correspondance : <strong>{blocsCorrespondance} observable(s)</strong>
              {' '}en version {versionCorrespondance}{' '}— c&apos;est elle que le retour et la
              phase « se juger » lisent.</>
            : <span className="text-attention">Correspondance absente : la compétence n&apos;est
              pas déclarable <code>evaluee</code>.</span>}
      </p>

      <p className="font-ui text-xs text-muet">
        {/* ⭐ LE STATUT EST GLOBAL, et le libellé le dit maintenant. Il affichait
            « N ligne(s) d’élève » du temps où il était stocké par élève — ce qui
            laissait croire qu’un élève de plus demanderait un geste de plus.
            C’était vrai, et c’était le défaut : les inscrits d’après la pose
            n’avaient aucune ligne. (`utils/statut-recette.ts`) */}
        {statutCourant.length === 0
          ? 'Aucun statut posé.'
          : statutCourant.length === 1
            ? <>Statut : <strong>{statutCourant[0]}</strong> · s’applique aux
              {' '}{lignesEleves} élève(s) inscrit(s) <em>et à tous ceux qui s’inscriront</em>
              {statutPoseLe ? <> · posé le {statutPoseLe}</> : <> · <span className="text-attention">
                sans date</span></>}</>
            : <span className="text-retard">Deux statuts pour une seule compétence :
              {' '}{statutCourant.join(', ')} — à reposer.</span>}
      </p>

      <form action={action} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="competence" value={competence} />
        {demandeConfirmation && <input type="hidden" name="confirme" value={confirme ? 'oui' : 'non'} />}
        <select
          name="statut" value={choix}
          onChange={(e) => { setChoix(e.target.value); setConfirme(false) }}
          className="rounded-md border border-bordure-bouton bg-parchemin px-2 py-1 font-ui text-sm text-encre"
        >
          {STATUTS.map(([v, libelle]) => (
            <option key={v} value={v} disabled={v === 'evaluee' && evalueeFermee}>{libelle}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={enCours || (demandeConfirmation && !confirme)
            || (choix === 'evaluee' && evalueeFermee)}
          className="rounded-md bg-bouton px-3 py-1 font-ui text-sm text-surface disabled:opacity-50"
        >
          {enCours ? 'Écriture…' : 'Poser ce statut'}
        </button>
        <span className="font-ui text-xs text-muet">
          {STATUTS.find(([v]) => v === choix)?.[2]}
        </span>
      </form>

      {/* L'AVERTISSEMENT, puis la CONFIRMATION. Dans cet ordre, et jamais autrement. */}
      {demandeConfirmation && avertissement && (
        <div className="rounded-lg border border-attention bg-attention-teinte px-3 py-2 space-y-2">
          <p className="font-ui text-sm text-encre">{avertissement}</p>
          <label className="flex items-center gap-2 font-ui text-sm text-encre">
            <input type="checkbox" checked={confirme} onChange={(e) => setConfirme(e.target.checked)} />
            J&apos;ai lu cet avertissement et je confirme le passage à <code>evaluee</code>.
          </label>
        </div>
      )}

      {retour && (
        <p className={`font-ui text-sm ${retour.ok ? 'text-ok' : 'text-retard'}`} role="status">
          {retour.message}
        </p>
      )}
    </li>
  )
}
