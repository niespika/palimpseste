// Frontière d'attente du module — posée à l'intérieur de son layout, donc la
// sous-nav du module SURVIT à l'attente (une frontière unique à la racine de
// l'espace l'aurait effacée avec le reste). Le layout pose data-module : la
// plume écrit ici à l'encre du module.

import EcranDAttente from '@/components/EcranDAttente'

export default function Chargement() {
  return <EcranDAttente />
}
