'use client'

// LE DÉPÔT DES DÉMONSTRATIONS — par COMPÉTENCE et par GRAIN.
//
// « Le professeur les fabrique hors de la plateforme, comme son corpus ;
//   l'écran du déroulé les sert, il n'en fabrique aucune — ABSENTE, LE TEMPS 1
//   S'EN PASSE ET LE PROFESSEUR EN EST AVERTI, rien ne s'engendre à sa place.
//   L'avertissement se pose ICI MÊME, à l'écran du dépôt : AUCUN CANAL NEUF »
//   (07- §2 ; piège 20).
//
// Elles entrent par le MÊME FICHIER d'import, en cinquième banque : cet onglet
// montre ce qui est là et ce qui manque — il ne fabrique rien.

const COMPETENCES = ['expression', 'argumentation', 'structure',
  'connaissance', 'synthese', 'questionnement'] as const
const GRAINS = ['micro', 'meso', 'macro'] as const
// L'appariement du 06- §2, dérivé en base (`demonstrations_formes`) et rappelé
// ici pour le seul affichage : « une forme inattendue pour son grain est
// SIGNALÉE, jamais refusée », et le signalement vient du contrôle, pas d'ici.
const ATTENDU: Record<string, string> = { micro: 'exemple', meso: 'modelage', macro: 'checklist' }

export interface LigneDemo {
  id: string; competence: string; grain: string
  forme: string; theme: string; statut: string; signalements: string[]
}

export default function Demonstrations({ demonstrations }: { demonstrations: LigneDemo[] }) {
  const par = new Map<string, LigneDemo[]>()
  for (const d of demonstrations) {
    const cle = `${d.competence}|${d.grain}`
    par.set(cle, [...(par.get(cle) ?? []), d])
  }
  const manquants: string[] = []
  for (const c of COMPETENCES) {
    for (const g of GRAINS) if (!par.has(`${c}|${g}`)) manquants.push(`${c} · ${g}`)
  }

  return (
    <div className="space-y-4">
      {/* L'AVERTISSEMENT D'ABSENCE — ici même, aucun canal neuf. */}
      {manquants.length > 0 && (
        <div className="rounded-lg border border-attention bg-attention-teinte px-3 py-2 space-y-1">
          <p className="font-ui text-sm text-encre">
            <strong>{manquants.length} couple(s) compétence × grain sans démonstration.</strong>{' '}
            Le temps 1 s&apos;en passera, et rien ne s&apos;engendrera à leur place : les
            démonstrations se fabriquent hors de la plateforme et arrivent par le fichier
            d&apos;import, en cinquième banque.
          </p>
          <p className="font-ui text-xs text-encre-douce">{manquants.join(' · ')}</p>
        </div>
      )}

      <section className="rounded-xl border border-bordure bg-surface p-4 space-y-3">
        <h2 className="font-titre text-lg text-encre">Ce qui est déposé, par compétence et par grain</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full font-ui text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muet-clair">
                <th className="py-1.5 pr-4">Compétence</th>
                {GRAINS.map((g) => (
                  <th key={g} className="px-2 py-1.5">
                    {g} <span className="normal-case text-muet">· {ATTENDU[g]}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-bordure">
              {COMPETENCES.map((c) => (
                <tr key={c}>
                  <th scope="row" className="py-2 pr-4 text-left font-normal text-encre">{c}</th>
                  {GRAINS.map((g) => {
                    const l = par.get(`${c}|${g}`) ?? []
                    return (
                      <td key={g} className="px-2 py-2 align-top">
                        {l.length === 0
                          ? <span className="text-muet">—</span>
                          : (
                            <ul className="space-y-0.5">
                              {l.map((d) => (
                                <li key={d.id} className="text-encre-douce text-xs">
                                  <strong>{d.forme}</strong> — {d.theme}
                                  {d.statut !== 'valide' && <span className="text-attention"> · {d.statut}</span>}
                                  {d.signalements.map((s, i) => (
                                    <span key={i} className="block text-info">{s}</span>
                                  ))}
                                </li>
                              ))}
                            </ul>
                          )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="font-ui text-xs text-muet">
          L&apos;appariement forme × grain du <code>06-</code> §2 est <em>rappelé</em> en tête de
          colonne ; une forme inattendue pour son grain est <strong>signalée, jamais refusée</strong> —
          la règle pédagogique vit au <code>06-</code>, et c&apos;est là qu&apos;elle se discute.
        </p>
      </section>
    </div>
  )
}
