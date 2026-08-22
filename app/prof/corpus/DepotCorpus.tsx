'use client'

// Le dépôt d'un fichier d'import, et LE RAPPORT — « les trois verdicts arrivent
// au même endroit », et « un signalement qui ne s'affiche nulle part est un
// contrôle qui se tait » (08- §7 ; piège 21).

import { useActionState } from 'react'
import { importerCorpus, type RetourCorpus } from './actions'

function Bloc({ titre, lignes, ton }: {
  titre: string; lignes: string[]; ton: 'refus' | 'blocage' | 'signal' | 'compte'
}) {
  if (!lignes.length) return null
  const classe = ton === 'refus' ? 'border-retard bg-retard-teinte'
    : ton === 'blocage' ? 'border-attention bg-attention-teinte'
    : ton === 'signal' ? 'border-info bg-info-teinte'
    : 'border-bordure bg-parchemin'
  return (
    <div className={`rounded-lg border px-3 py-2 ${classe}`}>
      <p className="font-ui text-xs uppercase tracking-wide text-muet-clair">{titre}</p>
      <ul className="mt-1 list-disc space-y-0.5 pl-5 font-ui text-sm text-encre">
        {lignes.map((l, i) => <li key={i}>{l}</li>)}
      </ul>
    </div>
  )
}

export default function DepotCorpus() {
  const [etat, action, enCours] = useActionState<RetourCorpus | null, FormData>(importerCorpus, null)
  return (
    <section className="rounded-xl border border-bordure bg-surface p-4 space-y-3">
      <h2 className="font-titre text-lg text-encre">Déposer un fichier d&apos;import</h2>
      <p className="font-ui text-sm text-encre-douce max-w-3xl">
        Un seul fichier, un seul objet JSON, UTF-8. Les cinq banques —
        {' '}<em>textes, sujets, matériaux, exercices, démonstrations</em> — sont facultatives et
        se lisent dans cet ordre. <strong>Redéposer le même fichier ne crée rien</strong> : une
        entrée dont l&apos;<code>id</code>{' '}existe est ignorée, et le compte des ignorées
        s&apos;affiche banque par banque.
      </p>
      <form action={action} className="flex flex-wrap items-center gap-3">
        <input
          type="file" name="fichier" accept=".json,application/json" required
          className="font-ui text-sm text-encre-douce file:mr-3 file:rounded-md file:border
                     file:border-bordure-bouton file:bg-parchemin-fonce file:px-3 file:py-1.5
                     file:font-ui file:text-sm file:text-encre"
        />
        <button
          type="submit" disabled={enCours}
          className="rounded-md bg-bouton px-3.5 py-1.5 font-ui text-sm text-surface disabled:opacity-60"
        >
          {enCours ? 'Contrôle…' : 'Déposer'}
        </button>
      </form>

      {etat && (
        <div className="space-y-2" role="status">
          <p className={`font-ui text-sm ${etat.ok ? 'text-ok' : 'text-retard'}`}>{etat.message}</p>
          <Bloc titre="Ce qui est entré" lignes={etat.comptes ?? []} ton="compte" />
          <Bloc titre="Refus — l’entrée n’entre pas ; le refus est réparable" lignes={etat.refus ?? []} ton="refus" />
          <Bloc titre="Blocages — l’entrée est entrée, elle attend que vous tranchiez" lignes={etat.blocages ?? []} ton="blocage" />
          <Bloc titre="Signalements — ils s’affichent, ils n’arrêtent rien" lignes={etat.signalements ?? []} ton="signal" />
        </div>
      )}
    </section>
  )
}
