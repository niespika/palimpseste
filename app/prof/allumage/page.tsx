// ============================================================================
// L'ALLUMAGE — L'ÉCRAN DES SIX INTERRUPTEURS (`07-` §5).
// ----------------------------------------------------------------------------
// « Trois interrupteurs AU PROFESSEUR, et non un seul. Un interrupteur unique
//   rendait le diagnostic impossible sans tout allumer. » Le §5 confie ces
//   gestes au professeur depuis C4-L1 — et jusqu'ici RIEN NE LES SERVAIT :
//   `poserPassationClasse` porte le commentaire « ouvrir et refermer sont des
//   gestes du professeur ; ceci existe pour la recette », et il fallait une
//   requête en base pour basculer quoi que ce soit.
//
// ⚠️ CET ÉCRAN NE SE FERME DERRIÈRE AUCUN DES SIX, et c'est structurel : un
//    écran d'allumage gardé par un interrupteur qu'il commande serait une porte
//    fermée à clé de l'intérieur. Sa seule garde est `garderProf`.
//
// ⚠️ ET IL N'EN EST PAS UN SEPTIÈME : il n'ajoute aucun drapeau, il sert ceux
//    que le §5 déclare. La liste est close.
// ============================================================================

import { garderProf } from '@/utils/routeur/acces'
import { lireLesInterrupteurs, FICHES_ORDONNEES } from '@/utils/allumage'
import EnTeteMobileProf from '@/components/EnTeteMobileProf'
import VueAllumage from './VueAllumage'

export const dynamic = 'force-dynamic'

export default async function AllumagePage() {
  const { admin } = await garderProf()
  const etat = await lireLesInterrupteurs(admin)

  return (
    <div className="space-y-6">
      {/* Sous 640 px, la Barre 2 est cachée : chaque écran porte son titre. */}
      <EnTeteMobileProf titre="L’allumage" retourHref="/prof" />

      <header className="space-y-2 hidden sm:block">
        <p className="font-ui text-[11px] uppercase tracking-[0.14em] text-muet">
          Pilotage · Allumage
        </p>
        <h1 className="font-titre text-3xl text-encre">L’allumage</h1>
        <p className="font-corps text-encre-douce max-w-3xl">
          Les six interrupteurs de la plateforme, et ce que chacun ouvre.
          {' '}<strong className="text-encre">Ils ne sont pas de même nature</strong> : trois
          répondent à des questions qui sont les vôtres, trois disent où en est le chantier.
        </p>
      </header>

      <VueAllumage charge={{ etat, fiches: FICHES_ORDONNEES }} />
    </div>
  )
}
