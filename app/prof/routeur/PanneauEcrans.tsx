// ============================================================================
// LA FENÊTRE DU BAS — les écrans de l'élève pour UN dépôt, en lecture seule.
// ----------------------------------------------------------------------------
// Serveur : charge le déroulé comme `app/prof/signalements/[depotId]` (même
// `ouvert: true`, même raison), puis confie la frise au client, qui rembobine
// sans aller-retour (`utils/deroule/rembobinage.ts` est pur).
// ============================================================================
import { lireLaPorte } from '@/utils/deroule/acces'
import { chargerLeDeroule } from '@/utils/deroule/vue'
import type { Admin } from '@/utils/routeur/acces'
import FriseDesEcrans from './FriseDesEcrans'

export default async function PanneauEcrans({ admin, depotId, eleveId, nom, resume }: {
  admin: Admin; depotId: string; eleveId: string; nom: string; resume: string
}) {
  const porte = await lireLaPorte(admin)
  // ⚠️ `ouvert: true` À DESSEIN : la porte `exercices_actif` commande les ÉLÈVES ;
  //    le professeur doit voir l'écran même quand le module est éteint.
  // ⚠️ `sansFermeture` : une semaine COMPTÉE (C10-L1) réduit la vue de l'élève à
  //    rien ; le professeur, lui, rejoue ce qui a été servi (audit du 14/09).
  const vue = await chargerLeDeroule(admin, depotId, eleveId,
    { ouvert: true, delaiVfJours: porte.delaiVfJours, sansFermeture: true })
  if (!vue) {
    return (
      <p className="px-4 py-6 font-corps text-encre-douce">
        Ce dépôt n’a pas d’écran de maison à rendre : il est <strong>retiré</strong>, ou c’est une{' '}
        <strong>passation en classe</strong>, qui a son propre flux.
      </p>
    )
  }
  // ⚠️ `key` : la frise garde son index d'écran ; sans remontage, l'index de
  //    l'exercice précédent déborde la suite du suivant (audit du 14/09).
  return <FriseDesEcrans key={vue.depotId} vue={vue} nom={nom} resume={resume} />
}
