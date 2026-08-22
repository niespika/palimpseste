'use client'
// ============================================================================
// C4 · L2 — L'ÉCRAN D'ASSIDUITÉ (`06-` §5).
// ----------------------------------------------------------------------------
// « La plateforme produit DEUX MESURES, ET RIEN DE PLUS » — le taux d'inactivité
// par classe, et le pourcentage par élève. Plus « UNE VUE FINE, QUI N'EST PAS UNE
// MESURE » : la frise à trois couleurs, et le tableau qui dit QUI.
//
// « Les agrégats disent la TENDANCE ; la frise dit la DISTRIBUTION ; le tableau
//   dit QUI. » — une classe où tous sont à 70 % et une classe où 70 % sont à
//   100 % pendant que 30 % sont à 0 % manquent le contrat l'une comme l'autre, et
//   n'appellent pas la même réponse.
//
// ⚠️ « AUCUNE NOTE, NULLE PART, SOUS AUCUNE FORME. » Et « un écran n'affiche un
//    nombre que si ce nombre compte quelque chose » : aucune « confiance »
//    agrégée ici, rien qu'un décompte réel.
//
// ⚠️ La BORNE HAUTE de la frise EST le seuil de la semaine faite, et la moitié
//    comme lui est un RÉGLAGE — les deux se lisent en configuration, jamais en dur.
// ============================================================================

import type { ChargeAssiduite } from './serveur'

const pct = (x: number | null) => (x === null ? '—' : `${Math.round(x * 100)} %`)

export default function VueAssiduite({
  charge, classeDemandee,
}: { charge: ChargeAssiduite; classeDemandee?: string }) {
  const classes = charge.classes
  const active = classes.find((c) => c.id === classeDemandee) ?? classes[0]

  return (
    <div className="space-y-5">
      {charge.incidents.length > 0 && (
        <ul className="rounded border border-retard/40 bg-retard-teinte/40 px-4 py-3 font-ui text-sm
                       text-encre-douce space-y-1">
          {charge.incidents.map((i) => <li key={i}>⚠ {i}</li>)}
        </ul>
      )}

      <p className="font-corps text-sm text-encre-douce max-w-3xl">
        Une semaine est <strong>faite</strong> quand l’élève a rendu au moins{' '}
        <strong>{pct(charge.seuils.semaineFaite)}</strong> de ses exercices assignés ; la classe a
        fait la sienne quand <strong>{pct(charge.seuils.contratDeClasse)}</strong> de ses élèves ont
        fait la leur.{' '}
        {charge.seuilsParDefaut && (
          <span className="text-attention">
            ⚠ Ces seuils sont ceux de démarrage : la configuration ne les porte pas encore.
          </span>
        )}
      </p>

      {charge.collecteVide && (
        <p className="rounded border border-bordure bg-parchemin px-4 py-6 text-center font-corps
                      text-encre-douce">
          Aucun compte d’assiduité en base.
          <span className="block mt-1 font-ui text-xs text-muet">
            La collecte démarre à la rentrée — un semestre ne se recompte pas après coup ; les
            écrans, eux, peuvent attendre.
          </span>
        </p>
      )}

      {classes.length > 1 && (
        <nav className="flex flex-wrap gap-2" aria-label="Classes">
          {classes.map((c) => (
            <a key={c.id} href={`/prof/routeur?vue=assiduite&classe=${c.id}`}
              aria-current={c.id === active?.id ? 'page' : undefined}
              className={`rounded border px-3 py-1.5 font-ui text-xs ${
                c.id === active?.id
                  ? 'border-liseret bg-parchemin-fonce text-encre'
                  : 'border-bordure-bouton bg-parchemin text-encre-douce hover:bg-parchemin-fonce'}`}>
              {c.nom}
            </a>
          ))}
        </nav>
      )}

      {active && (
        <>
          <section className="space-y-2">
            <h2 className="font-titre text-xl text-encre">{active.nom} — la frise des semaines</h2>
            <p className="font-ui text-xs text-muet">
              <Pastille bande="vert" /> semaine faite, du seuil à 100 % ·{' '}
              <Pastille bande="orange" /> au moins {pct(charge.seuils.borneBasseFrise)} sans
              atteindre le seuil · <Pastille bande="rouge" /> sous{' '}
              {pct(charge.seuils.borneBasseFrise)}
            </p>

            {active.semaines.length === 0 ? (
              <p className="font-corps text-sm text-muet">Aucune semaine comptée.</p>
            ) : (
              <div className="overflow-x-auto">
                <div className="flex gap-1 min-w-max pb-2">
                  {active.semaines.map((s) => (
                    <a key={s.cycleLundi}
                      href={`/prof/routeur?vue=assiduite&classe=${active.id}&semaine=${s.cycleLundi}`}
                      title={`${s.cycleLundi} — ${s.vert} vert · ${s.orange} orange · ${s.rouge} rouge`}
                      className={`w-10 shrink-0 rounded border ${
                        s.cycleLundi === active.semaineAffichee
                          ? 'border-liseret' : 'border-bordure'}`}>
                      <span className="flex h-16 w-full flex-col-reverse overflow-hidden rounded-[2px]">
                        <Barre part={s.rouge / (s.eleves || 1)} bande="rouge" />
                        <Barre part={s.orange / (s.eleves || 1)} bande="orange" />
                        <Barre part={s.vert / (s.eleves || 1)} bande="vert" />
                      </span>
                      <span className="block border-t border-bordure/60 py-0.5 text-center font-ui
                                       text-[9px] text-muet">
                        {s.cycleLundi.slice(5)}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* « Le professeur est averti quand le contrat n'est pas rempli » —
                un avertissement, JAMAIS une action automatique. */}
            {active.semaines.filter((s) => !s.contratRempli && s.avertissement).slice(-3)
              .map((s) => (
                <p key={s.cycleLundi}
                  className="rounded border border-attention/40 bg-attention-teinte/40 px-3 py-2
                             font-ui text-xs text-encre-douce">
                  <strong className="text-attention">{s.cycleLundi}</strong> — {s.avertissement}
                </p>
              ))}
          </section>

          <section className="space-y-2">
            <h2 className="font-titre text-lg text-encre">
              Élève par élève{active.semaineAffichee ? ` — semaine du ${active.semaineAffichee}` : ''}
            </h2>
            {active.tableau.length === 0 ? (
              <p className="font-corps text-sm text-muet">Rien à détailler pour cette semaine.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] border-collapse font-ui text-sm">
                  <thead>
                    <tr className="border-b border-bordure text-left text-xs uppercase
                                   tracking-wide text-muet">
                      <th className="py-2 pr-3 font-normal">Élève</th>
                      <th className="py-2 pr-3 font-normal text-right">Rendus</th>
                      <th className="py-2 pr-3 font-normal text-right">Assignés</th>
                      <th className="py-2 font-normal text-right">Complétion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {active.tableau.map((l) => (
                      <tr key={l.eleveId} className="border-b border-bordure/50">
                        <td className="py-2 pr-3 text-encre">
                          <Pastille bande={l.bande} /> {l.nom}
                        </td>
                        <td className="py-2 pr-3 text-right text-encre-douce">{l.termines}</td>
                        <td className="py-2 pr-3 text-right text-encre-douce">{l.assignes}</td>
                        <td className="py-2 text-right text-encre">
                          {l.completion === null
                            ? <span className="text-muet" title="Aucun exercice assigné : la
                                semaine est faite par construction">— faite</span>
                            : pct(l.completion)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}

const FOND: Record<'vert' | 'orange' | 'rouge', string> = {
  vert: 'bg-ok', orange: 'bg-attention', rouge: 'bg-retard',
}

function Barre({ part, bande }: { part: number; bande: 'vert' | 'orange' | 'rouge' }) {
  if (part <= 0) return null
  return <span className={FOND[bande]} style={{ height: `${part * 100}%` }} />
}

function Pastille({ bande }: { bande: 'vert' | 'orange' | 'rouge' }) {
  return <span className={`inline-block h-2 w-2 rounded-full align-middle ${FOND[bande]}`} />
}
