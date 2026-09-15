// ============================================================================
// C4 · L2 — LE PILOTAGE DU PROFESSEUR : trois écrans, un seul `?vue=`.
// ----------------------------------------------------------------------------
// « Les écrans de pilotage : les BUDGETS PAR ÉLÈVE, l'ÉCRAN EN LECTURE SEULE de
//   ce que le routeur a assigné — le professeur ne valide rien au fil de l'eau ;
//   il voit, et il peut écraser par override —, et les COMPTEURS D'ASSIDUITÉ. »
//
// ⚠️ LE QUATRIÈME ÉCRAN DU LOT N'EST PAS ICI : le panneau des cinq segments vit
//    À LA CONCEPTION D'UN PLAN D'ÉVALUATION — « c'est là que le professeur voit
//    ce que son calendrier produit » (`01-` §4, couche 1).
//
// ⚠️ CET ÉCRAN NE SE FERME PAS DERRIÈRE `routeur_actif` : cet interrupteur
//    commande LE MOTEUR, pas le professeur qui pilote. Il se LIT pour être MONTRÉ.
// ============================================================================

import Link from 'next/link'
import LibelleSuivi from '@/components/nav/LibelleSuivi'
import { garderProf } from '@/utils/routeur/acces'
import { chargerBudgets, chargerAssiduite } from './serveur'
import VueBudgets from './VueBudgets'
import VueAssiduite from './VueAssiduite'
import VueSuivi from './VueSuivi'
import PanneauEcrans from './PanneauEcrans'
import { chargerSuivi } from './suivi-serveur'
import { lireFuseau } from '@/utils/fuseau-serveur'
import { jourDansFuseau } from '@/utils/fuseau'
import { lundiDe } from './serveur'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

const VUES = ['budgets', 'assignation', 'assiduite'] as const
type Vue = (typeof VUES)[number]

const ONGLETS: Array<{ vue: Vue; label: string; sous: string }> = [
  { vue: 'budgets', label: 'Budgets', sous: 'le plancher, le plafond et le quota de chaque élève' },
  // ⭐ 14/09 — L'ASSIGNATION REFAITE (décision de Louis, sans interrupteur : « ce
  //    travail remplace l'onglet assignation, il fait la même chose et plus »).
  //    Classes → élèves → exercices → les écrans de l'élève ; le retrait reste.
  { vue: 'assignation', label: 'Assignation', sous: 'ce que chaque élève fait cette semaine, et comment ça se passe' },
  { vue: 'assiduite', label: 'Assiduité', sous: 'la semaine des classes, et qui la fait' },
]

export default async function RouteurPage({
  searchParams,
}: {
  searchParams: Promise<{ vue?: string; semaine?: string; classe?: string; eleve?: string; depot?: string }>
}) {
  const { admin, routeurActif } = await garderProf()
  const sp = await searchParams
  const vue: Vue = (VUES as readonly string[]).includes(sp.vue ?? '') ? (sp.vue as Vue) : 'budgets'

  const [budgets, assiduite, suivi] = await Promise.all([
    vue === 'budgets' ? chargerBudgets(admin) : null,
    vue === 'assiduite' ? chargerAssiduite(admin, sp.semaine) : null,
    vue === 'assignation' ? (async () => {
      const fuseau = await lireFuseau()
      // ⚠️ `2026-13-45` passe une regex de forme et fait lever `toISOString` : on
      //    exige une date que `Date.parse` accepte (audit du 14/09).
      const valide = /^\d{4}-\d{2}-\d{2}$/.test(sp.semaine ?? '') && !Number.isNaN(Date.parse(`${sp.semaine}T00:00:00Z`))
      const lundi = valide ? lundiDe(sp.semaine!) : lundiDe(jourDansFuseau(new Date(), fuseau))
      return chargerSuivi(admin, { cycleLundi: lundi, classeId: sp.classe ?? null, fuseau })
    })() : null,
  ])
  const eleveDuDepot = suivi?.classe?.eleves.find((e) => e.id === sp.eleve
    && e.exercices.some((x) => x.depotId === sp.depot)) ?? null
  const exerciceDuDepot = eleveDuDepot?.exercices.find((x) => x.depotId === sp.depot) ?? null
  const resumeDuDepot = exerciceDuDepot
    ? [exerciceDuDepot.objet ?? exerciceDuDepot.observable ?? 'exercice', exerciceDuDepot.cran != null ? `cran ${exerciceDuDepot.cran}` : null]
      .filter(Boolean).join(' · ')
    : ''

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="font-ui text-[11px] uppercase tracking-[0.14em] text-muet">
          Pilotage · Routeur
        </p>
        <h1 className="font-titre text-3xl text-encre">Le routeur</h1>
        <p className="font-corps text-encre-douce max-w-3xl">
          Ce que le routeur décide pour chaque élève, et ce que vous pouvez y changer.
          {' '}<strong className="text-encre">Vous ne validez rien au fil de l’eau</strong> : vous
          voyez, et vous pouvez retirer.
        </p>
      </header>

      {/* `07-` §5 — l'interrupteur se LIT pour être MONTRÉ, jamais pour fermer. */}
      {!routeurActif && (
        <p className="rounded border border-bordure bg-attention-teinte/60 px-4 py-3 font-corps
                      text-sm text-encre-douce">
          <strong className="font-ui text-attention">Le routeur est éteint.</strong>{' '}
          <code className="font-ui text-xs">routeur_actif</code> est à <strong>OFF</strong> : rien
          n’est assigné automatiquement, et le professeur planifie. Ces écrans, eux, restent
          ouverts — ils préparent l’allumage.
        </p>
      )}

      <nav className="flex flex-wrap gap-1 border-b border-bordure" aria-label="Vues du routeur">
        {ONGLETS.map((o) => (
          <Link
            key={o.vue}
            href={`/prof/routeur?vue=${o.vue}`}
            aria-current={vue === o.vue ? 'page' : undefined}
            className={`relative px-4 py-2 font-ui text-sm border-b-2 -mb-px transition-colors ${
              vue === o.vue
                ? 'border-liseret text-encre'
                : 'border-transparent text-muet hover:text-encre-douce'}`}
          >
            <LibelleSuivi>{o.label}</LibelleSuivi>
          </Link>
        ))}
      </nav>

      <p className="font-corps text-sm text-muet -mt-3">
        {ONGLETS.find((o) => o.vue === vue)?.sous}
      </p>

      {budgets && <VueBudgets charge={budgets} />}
      {assiduite && <VueAssiduite charge={assiduite} classeDemandee={sp.classe} />}
      {suivi && (
        <VueSuivi charge={suivi} eleveInitial={sp.eleve ?? null} depotId={eleveDuDepot && sp.depot ? sp.depot : null}
          ecrans={eleveDuDepot && sp.depot ? (
            <Suspense fallback={<p className="px-4 py-6 font-ui text-sm text-muet">Les écrans de {eleveDuDepot.nom} se chargent…</p>}>
              <PanneauEcrans admin={admin} depotId={sp.depot} eleveId={eleveDuDepot.id} nom={eleveDuDepot.nom} resume={resumeDuDepot} />
            </Suspense>
          ) : null} />
      )}
    </div>
  )
}
