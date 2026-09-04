'use client'

import { useEffect } from 'react'
import { ouvrirSeanceAction } from './actions'

// À la première visite d'une séance (porte ouverte), on pose l'heure d'ouverture — c'est le
// début du temps réel de la séance. Un effet, une fois, silencieux.
export default function OuvertureSeance({ livreId, semaine }: { livreId: string; semaine: number }) {
  useEffect(() => { void ouvrirSeanceAction(livreId, semaine) }, [livreId, semaine])
  return null
}
