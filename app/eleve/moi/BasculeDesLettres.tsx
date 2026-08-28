'use client'

import { useState, useTransition } from 'react'
import { basculerLesLettres } from './actions'

// ============================================================================
// C6 · L2 — LE CHOIX DE L'ÉLÈVE D'AFFICHER SES LETTRES.
// ----------------------------------------------------------------------------
// `06-Palimpseste.md` §5 : « C'EST L'ÉLÈVE QUI CHOISIT D'EN VOIR PLUS : celui
// qui veut autre chose que des mots peut AFFICHER LUI-MÊME ses courbes de
// progression et le reste. LE SYSTÈME NE LE DÉCIDE PAS POUR LUI. »
//
// ⛔ « UN DÉFAUT À "AFFICHÉ" N'EST PAS UN CHOIX » : la bascule part de MASQUÉ, et
//    la colonne qui la porte est nullable sans défaut — NULL vaut masqué.
//
// ⚠️ ELLE NE SUFFIT JAMAIS SEULE. Les lettres demandent TROIS conditions
//    (`utils/eleve/profil.ts`, `lettreVisible`) : `competences_affichage_actif`
//    à ON, `profil_provisoire` à faux, et ce choix. Quand l'une des deux
//    premières manque, ce composant n'est même pas rendu — la page dit alors ce
//    qu'il en est, ⛔ **sans jamais nommer un interrupteur** (`07-` §5).
// ============================================================================

export default function BasculeDesLettres({ initial }: { initial: boolean }) {
  const [affichees, setAffichees] = useState(initial)
  const [enCours, demarrer] = useTransition()

  return (
    <button
      type="button"
      aria-pressed={affichees}
      disabled={enCours}
      onClick={() => {
        const suivant = !affichees
        setAffichees(suivant)
        demarrer(() => { void basculerLesLettres(suivant) })
      }}
      className="font-ui text-xs text-encre-douce border border-bordure rounded-full px-3 py-1.5
                 hover:bg-parchemin-fonce transition-colors disabled:opacity-50"
    >
      {affichees ? 'Masquer mes lettres' : 'Afficher mes lettres'}
    </button>
  )
}
