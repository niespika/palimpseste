'use client'

// =========================================================================
// components/nav/OngletsFragmentsEleve.tsx
// C8·L3 — les onglets élève de Fragments ont deux particularités que la config
// statique ne peut pas porter :
//   • une PASTILLE d'état par onglet (ce que disaient les tuiles supprimées) ;
//   • un QUATRIÈME onglet « Synthèse », seulement si un bilan est publié.
// Les deux dépendent de la base. L'état est chargé une seule fois par
// <FournisseurEtatFragmentsEleve> (coquille /eleve) — ce composant ne fait que
// le lire et laisse le RENDU à l'appelant : la Barre 2 (desktop) et la sous-nav
// mobile n'ont pas le même habillage.
// =========================================================================

import { ONGLET_SYNTHESE_ELEVE, type SousOnglet } from './configModules'
import { useEtatFragmentsEleve } from './EtatFragmentsEleve'
import type { EtatOnglet } from '@/utils/fragments-etat-eleve'

/** Pastille à afficher sur un onglet ; `null` = rien (état neutre ou pas encore chargé). */
export type PastilleOnglet = (onglet: SousOnglet) => EtatOnglet | null

export default function OngletsFragmentsEleve({
  base,
  rendu,
}: {
  base: SousOnglet[]
  rendu: (onglets: SousOnglet[], pastille: PastilleOnglet) => React.ReactNode
}) {
  const etat = useEtatFragmentsEleve()

  const onglets = etat?.synthese ? [...base, ONGLET_SYNTHESE_ELEVE] : base

  const pastille: PastilleOnglet = (o) => {
    if (!etat) return null
    const e = o.vue === 'ecrit' ? etat.ecrit : o.vue === 'oral' ? etat.oral : o.vue === 'essai' ? etat.essai : null
    return e && e.couleur !== 'neutre' ? e : null
  }

  return <>{rendu(onglets, pastille)}</>
}

/** Couleur de la pastille — jetons de la charte, jamais de hex en dur. */
export function classePastille(couleur: EtatOnglet['couleur']): string {
  return couleur === 'rouge' ? 'bg-retard' : 'bg-ok'
}
