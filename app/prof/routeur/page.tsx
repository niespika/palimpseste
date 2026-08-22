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

import { garderProf } from '@/utils/routeur/acces'
import { chargerBudgets, chargerAssignation, chargerAssiduite } from './serveur'
import VueBudgets from './VueBudgets'
import VueAssignation from './VueAssignation'
import VueAssiduite from './VueAssiduite'

export const dynamic = 'force-dynamic'

const VUES = ['budgets', 'assignation', 'assiduite'] as const
type Vue = (typeof VUES)[number]

const ONGLETS: Array<{ vue: Vue; label: string; sous: string }> = [
  { vue: 'budgets', label: 'Budgets', sous: 'le plancher, le plafond et le quota de chaque élève' },
  { vue: 'assignation', label: 'Assignation', sous: 'ce que le routeur a posé cette semaine' },
  { vue: 'assiduite', label: 'Assiduité', sous: 'la semaine des classes, et qui la fait' },
]

export default async function RouteurPage({
  searchParams,
}: {
  searchParams: Promise<{ vue?: string; semaine?: string; classe?: string }>
}) {
  const { admin, routeurActif } = await garderProf()
  const sp = await searchParams
  const vue: Vue = (VUES as readonly string[]).includes(sp.vue ?? '') ? (sp.vue as Vue) : 'budgets'

  const [budgets, assignation, assiduite] = await Promise.all([
    vue === 'budgets' ? chargerBudgets(admin) : null,
    vue === 'assignation' ? chargerAssignation(admin, sp.semaine) : null,
    vue === 'assiduite' ? chargerAssiduite(admin, sp.semaine) : null,
  ])

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
          <a
            key={o.vue}
            href={`/prof/routeur?vue=${o.vue}`}
            aria-current={vue === o.vue ? 'page' : undefined}
            className={`px-4 py-2 font-ui text-sm border-b-2 -mb-px transition-colors ${
              vue === o.vue
                ? 'border-liseret text-encre'
                : 'border-transparent text-muet hover:text-encre-douce'}`}
          >
            {o.label}
          </a>
        ))}
      </nav>

      <p className="font-corps text-sm text-muet -mt-3">
        {ONGLETS.find((o) => o.vue === vue)?.sous}
      </p>

      {budgets && <VueBudgets charge={budgets} />}
      {assignation && <VueAssignation charge={assignation} />}
      {assiduite && <VueAssiduite charge={assiduite} classeDemandee={sp.classe} />}
    </div>
  )
}
