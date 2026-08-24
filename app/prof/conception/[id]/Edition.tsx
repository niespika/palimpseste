'use client'

// « Corriger une instance se fait à l'écran — c'est aussi LE SEUL CHEMIN pour
//   une entrée importée » (07- §1.1 ; 08- §1 ; piège 34).

import { useActionState } from 'react'
import { editerInstance, type RetourConception } from '../actions'

const CHAMP = 'rounded-md border border-bordure-bouton bg-parchemin px-2 py-1 font-ui text-sm text-encre'

export default function Edition({
  id, paire, lieu, guide, guideExige, cranCommande, optinSeJuger, optinConfiance, cas,
  sansCran = false, consigneSeule = '',
}: {
  id: string; paire: boolean; lieu: string; guide: string | null
  guideExige: string
  cranCommande: { defaut: boolean; distracteurs: boolean; reponseAttendue: boolean }
  optinSeJuger: boolean; optinConfiance: boolean
  cas: Array<{ ordre: number; consigne: string; defaut: string | null
    distracteurs: string; reponseAttendue: string | null
    /** ⭐ C4-L14 — il se SAISIT et il se RELIT : un champ qu'on n'affiche pas se
     *  perd à la première correction, et la perte ne se voit qu'à l'écran de
     *  l'élève, des semaines plus tard. */
    pourquoiJuste: string | null
    materiau: string | null }>
  /** C4-L11 — une instance d'examen diagnostique (type `complet`) : pas de cran,
   *  donc AUCUN appui et aucun cas. Elle édite sa consigne, et rien d'autre. */
  sansCran?: boolean
  consigneSeule?: string
}) {
  const [retour, action, enCours] = useActionState<RetourConception | null, FormData>(
    editerInstance, null)
  return (
    <form action={action} className="rounded-xl border border-bordure bg-surface p-4 space-y-3">
      <input type="hidden" name="id" value={id} />
      <h2 className="font-titre text-lg text-encre">Corriger l&apos;instance</h2>
      <p className="font-ui text-xs text-encre-douce">
        <strong>Ce que vous arrêtez ici est ce que l&apos;élève lit.</strong> La réécriture porte sur
        la <em>formulation</em>, jamais sur l&apos;observable : celui-ci vient de la route.
      </p>

      <div className="flex flex-wrap items-end gap-3">
        <label className="space-y-0.5">
          <span className="block font-ui text-xs text-muet">lieu de la passation</span>
          <select name="lieu" defaultValue={lieu} className={CHAMP}>
            <option value="maison">maison</option>
            <option value="classe">classe</option>
          </select>
        </label>
        <label className="flex items-center gap-1.5 font-ui text-sm text-encre">
          <input type="checkbox" name="optin_se_juger" value="oui" defaultChecked={optinSeJuger} />
          opt-in « se juger »
        </label>
        <label className="flex items-center gap-1.5 font-ui text-sm text-encre">
          <input type="checkbox" name="optin_confiance_remise" value="oui" defaultChecked={optinConfiance} />
          opt-in confiance de remise
        </label>
      </div>

      {sansCran && (
        <fieldset className="space-y-2 rounded-md border border-bordure p-3">
          <legend className="px-1 font-ui text-xs uppercase tracking-wide text-muet-clair">
            la consigne
          </legend>
          <p className="font-ui text-xs text-muet">
            Un examen diagnostique <strong>n&apos;a pas de cran</strong> : il ne porte ni appui, ni
            défaut, ni distracteurs, ni réponse attendue. Sa consigne est tout ce qui s&apos;édite ici.
          </p>
          <textarea name="consigne" rows={3} defaultValue={consigneSeule}
            className={`${CHAMP} w-full`} required />
        </fieldset>
      )}

      {cas.map((cs, i) => (
        <fieldset key={cs.ordre} className="space-y-2 rounded-md border border-bordure p-3">
          <legend className="px-1 font-ui text-xs uppercase tracking-wide text-muet-clair">
            {paire ? `cas ${cs.ordre} — ${i === 0 ? 'traité sur indication' : 'un cas neuf, traité seul'}`
              : 'le cas'}
          </legend>
          {cs.materiau && (
            <p className="font-ui text-xs text-muet">matériau : {cs.materiau}</p>
          )}
          <textarea name={`cas_${cs.ordre}_consigne`} rows={2} defaultValue={cs.consigne}
            className={`${CHAMP} w-full`} required />
          {cranCommande.defaut && (
            <label className="block space-y-0.5">
              <span className="block font-ui text-xs text-muet">le <code>defaut</code> injecté</span>
              <input name={`cas_${cs.ordre}_defaut`} defaultValue={cs.defaut ?? ''} className={`${CHAMP} w-full`} />
            </label>
          )}
          {cranCommande.distracteurs && (
            <label className="block space-y-0.5">
              <span className="block font-ui text-xs text-muet">
                la banque de distracteurs — un par ligne, trois au minimum
              </span>
              <textarea name={`cas_${cs.ordre}_distracteurs`} rows={4}
                defaultValue={cs.distracteurs} className={`${CHAMP} w-full`} />
            </label>
          )}
          {cranCommande.reponseAttendue && (
            <label className="block space-y-0.5">
              <span className="block font-ui text-xs text-muet">la <code>reponse_attendue</code></span>
              <input name={`cas_${cs.ordre}_reponse`} defaultValue={cs.reponseAttendue ?? ''}
                className={`${CHAMP} w-full`} />
            </label>
          )}
          {cranCommande.distracteurs && (
            <label className="block space-y-0.5">
              <span className="block font-ui text-xs text-muet">
                le <code>pourquoi_juste</code> — <em>pourquoi ce candidat-là est le bon</em> ;
                l&apos;élève le lit à la correction
              </span>
              <textarea name={`cas_${cs.ordre}_pourquoi_juste`} rows={2}
                defaultValue={cs.pourquoiJuste ?? ''} className={`${CHAMP} w-full`} />
            </label>
          )}
        </fieldset>
      ))}

      {guideExige !== 'null' && (
        <label className="block space-y-0.5">
          <span className="block font-ui text-xs text-muet">
            le <code>guide</code> <strong>{guideExige}</strong>, servi <strong>avant</strong> la v1
          </span>
          <textarea name="guide" rows={2} defaultValue={guide ?? ''} className={`${CHAMP} w-full`} />
        </label>
      )}

      <button type="submit" disabled={enCours}
        className="rounded-md bg-bouton px-3.5 py-1.5 font-ui text-sm text-surface disabled:opacity-50">
        {enCours ? 'Écriture…' : 'Corriger'}
      </button>
      {retour && (
        <p className={`font-ui text-sm ${retour.ok ? 'text-ok' : 'text-retard'}`} role="status">
          {retour.message}
        </p>
      )}
    </form>
  )
}
