'use client'

import { useEffect, useRef } from 'react'
import { marquerLesFichesCommeServies } from '../actions'

// ============================================================================
// C6 · L2 — « SERVIE UNE FOIS, À LA RENTRÉE » : la marque du premier passage.
// ----------------------------------------------------------------------------
// ⭐ *Consultable* est une page ; *servie une fois* est un GESTE. La marque se
//    pose quand l'élève OUVRE la page, et elle éteint la tuile de découverte du
//    tableau de bord.
//
// ⚠️ POURQUOI UN COMPOSANT CLIENT, ET PAS UNE ÉCRITURE DANS LA PAGE : un server
//    component ne doit rien écrire pendant son rendu — un préchargement, un
//    rechargement ou un `revalidate` reposerait la marque, et Next l'appellerait
//    hors du geste de l'élève. Ici l'effet ne part QUE lorsque la page est
//    réellement montée dans son navigateur.
//
// ⚠️ `didMount` PLUTÔT QUE LE SEUL TABLEAU DE DÉPENDANCES VIDE : en mode strict,
//    React monte deux fois en développement. L'action est idempotente en base
//    (elle n'écrit que si la marque est nulle), mais on ne l'appelle pas deux
//    fois pour autant.
//
// ⛔ IL NE REND RIEN. Ce n'est pas un écran, c'est une marque.
// ============================================================================

export default function MarqueDeService() {
  const dejaFait = useRef(false)
  useEffect(() => {
    if (dejaFait.current) return
    dejaFait.current = true
    void marquerLesFichesCommeServies()
  }, [])
  return null
}
