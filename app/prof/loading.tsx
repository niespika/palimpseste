// Frontière d'attente de l'espace — elle est posée À L'INTÉRIEUR du layout du
// rôle : l'en-tête, le sélecteur de classe et la barre d'onglets restent en
// place et cliquables pendant que la page suivante se rend. Sans ce fichier,
// Next gardait l'écran PRÉCÉDENT affiché, intact, jusqu'au retour du serveur —
// le clic ne produisait aucun pixel, d'où les élèves qui recliquent.

import EcranDAttente from '@/components/EcranDAttente'

export default function Chargement() {
  return <EcranDAttente />
}
