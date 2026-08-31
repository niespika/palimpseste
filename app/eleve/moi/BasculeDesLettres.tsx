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
//    à ON, `profil_provisoire` à faux, et ce choix.
//
// ⭐⭐ DÉCISION DE LOUIS, 29/08 — L'INTERRUPTEUR RESTE À SA PLACE MÊME QUAND IL
//    NE PEUT RIEN LEVER. Il était jusqu'ici ABSENT sous la garde
//    `laBasculeAUnSens` ; il est désormais **DÉSACTIVÉ et porte « Rien à
//    afficher »**. Un interrupteur qui disparaît laisse croire qu'il n'existe
//    pas ; un interrupteur grisé dit qu'il n'y a rien à lever.
//    ⚠️ C'est l'état de la rentrée, et il est MESURÉ : en production, au 30/08,
//       **0 lettre affichable sur 372 cellules** (élève × compétence) — les 171
//       lignes de `competences_niveaux` sont toutes `profil_provisoire = true`.
//
// ⛔ ET L'ÉLÈVE N'APPREND JAMAIS LE NOM D'UN INTERRUPTEUR (`07-` §5) : « Rien à
//    afficher », jamais « porte fermée » ni « profil_provisoire ». Le POURQUOI
//    est dit une seule fois, par la page, avec la phrase de `lettreVisible()`.
//
// ⚠️ CIBLE TACTILE ≥ 44 px : c'est le `<button>` ENTIER qui est tapable — la
//    pastille ET son libellé —, avec `min-h-[44px]` et non la seule pastille de
//    20 px de haut.
// ============================================================================

export default function BasculeDesLettres(
  { initial, active }: { initial: boolean; active: boolean },
) {
  const [affichees, setAffichees] = useState(initial)
  const [enCours, demarrer] = useTransition()

  // ⛔ `active` est le verdict des DEUX AUTRES conditions, calculé par la page à
  //    partir de `lettreVisible()`. Ce composant ne le recalcule pas.
  const pousse = active && affichees

  return (
    <button
      type="button"
      role="switch"
      aria-checked={pousse}
      aria-label={active ? 'Afficher mes lettres' : 'Mes lettres — rien à afficher'}
      disabled={!active || enCours}
      onClick={() => {
        const suivant = !affichees
        setAffichees(suivant)
        demarrer(() => { void basculerLesLettres(suivant) })
      }}
      className="inline-flex items-center gap-2 min-h-[44px] px-1 -mx-1 rounded-lg
                 disabled:cursor-default enabled:hover:bg-parchemin-fonce transition-colors"
    >
      <span
        aria-hidden
        className={`relative w-[34px] h-5 rounded-full border shrink-0 transition-colors
          ${pousse ? 'bg-bouton-valider border-bouton-valider' : 'bg-parchemin-fonce border-bordure-bouton'}`}
      >
        <span
          className={`absolute top-[2px] w-3.5 h-3.5 rounded-full transition-all
            ${pousse ? 'left-[16px] bg-bouton-valider-texte' : 'left-[2px] bg-surface'}`}
        />
      </span>
      <span className={`font-ui text-xs whitespace-nowrap
        ${active ? 'text-encre-douce' : 'text-muet-clair'}`}>
        {active ? 'Mes lettres' : 'Rien à afficher'}
      </span>
    </button>
  )
}
