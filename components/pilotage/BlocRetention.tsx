// ============================================================================
// C6 · L1 — LE DIAGNOSTIC DE RÉTENTION, À CÔTÉ DE LA MATRICE ET AVEC SA PORTE.
// ----------------------------------------------------------------------------
// ⭐ LA CLAUSE DU « FAIT QUAND » SE PROUVE DEUX FOIS, ET LA SECONDE EST LA VRAIE :
//    (a) LE CLIC — depuis cette page, on atteint l'écran complet SANS CONNAÎTRE
//        d'identifiant ; (b) CE QU'IL MONTRE — des fragilités RÉELLES, sur des
//        quizz réellement passés.
//    ⛔ Une page qui rend « Aucune donnée de quizz » sur une base qui en porte
//       n'a pas levé la clause : c'est le symptôme des deux fils cassés.
//
// ⛔ AUCUNE LETTRE, AUCUNE CELLULE. Quazian n'écrit pas dans le profil de
//    compétences (`01-` §2 et §6, R4) : ce bloc se RANGE à côté de la grille.
//
// ⛔ ET AUCUN TROISIÈME ONGLET (`AGENTS.md` ; `07-` §2, arbitrage ①) : c'est un
//    bloc de la page, pas une entrée neuve au menu Pilotage.
// ============================================================================

import Link from 'next/link'
import type { RetentionDeLaClasse } from '@/utils/pilotage/retention-serveur'

export default function BlocRetention({ r }: { r: RetentionDeLaClasse }) {
  return (
    <section className="rounded-xl border border-bordure bg-surface p-4 space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-titre text-lg text-encre">Le diagnostic de rétention</h2>
        <Link href={r.href} className="font-ui text-sm text-encre-douce hover:text-encre underline">
          Ouvrir le diagnostic complet →
        </Link>
      </div>
      <p className="font-corps text-sm text-encre-douce max-w-3xl">
        Ce que la classe a retenu de ses cours, mesuré en continu par les quizz.{' '}
        <strong>Rien de ceci n’entre dans la grille des lettres</strong> : Quazian n’écrit pas dans
        le profil de compétences — c’est un signal de renvoi hors routeur, jamais une lettre.
      </p>

      {r.reponses === 0 ? (
        // ⚠️ Le vide dit LAQUELLE de ses raisons s'applique.
        <p className="font-ui text-xs text-muet max-w-3xl">
          {r.incidents.length > 0
            ? 'Une lecture a échoué : on ne peut pas dire si la classe n’a rien passé, ou si la base n’a rien rendu.'
            : 'Aucune réponse de quizz notée pour cette classe. Lance et ferme au moins un quizz.'}
        </p>
      ) : (
        <>
          <p className="font-ui text-xs text-muet">
            {r.eleves} élève{r.eleves > 1 ? 's' : ''} · {r.reponses} réponse
            {r.reponses > 1 ? 's' : ''} notée{r.reponses > 1 ? 's' : ''} ·{' '}
            {r.fragiles.length} concept{r.fragiles.length > 1 ? 's' : ''} fragile
            {r.fragiles.length > 1 ? 's' : ''}
          </p>
          {r.fragiles.length === 0 ? (
            <p className="font-corps text-sm text-encre-douce">
              Aucune idée fausse ni lacune relevée sur les quizz de cette classe.
            </p>
          ) : (
            <ul className="space-y-1">
              {r.fragiles.map((c) => (
                <li key={c.concept}
                  className="flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-lg bg-parchemin-fonce">
                  <span className="font-corps text-sm text-encre flex-1 min-w-0 truncate">{c.concept}</span>
                  {c.ideeFausse > 0 && (
                    <span className="font-ui text-[11px] px-2 py-0.5 rounded-full border border-retard bg-retard-teinte text-retard">
                      {c.ideeFausse} idée{c.ideeFausse > 1 ? 's' : ''} fausse{c.ideeFausse > 1 ? 's' : ''}
                    </span>)}
                  {c.lacune > 0 && (
                    <span className="font-ui text-[11px] px-2 py-0.5 rounded-full border border-attention bg-attention-teinte text-attention">
                      {c.lacune} lacune{c.lacune > 1 ? 's' : ''}
                    </span>)}
                  {c.maitrise > 0 && (
                    <span className="font-ui text-[11px] px-2 py-0.5 rounded-full border border-ok bg-ok-teinte text-ok">
                      {c.maitrise} maîtrisé{c.maitrise > 1 ? 's' : ''}
                    </span>)}
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {r.incidents.length > 0 && (
        <div className="rounded-lg border border-retard/40 bg-retard-teinte p-2">
          <ul className="space-y-0.5">
            {r.incidents.map((i) => (
              <li key={i} className="font-corps text-xs text-retard">· {i}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
