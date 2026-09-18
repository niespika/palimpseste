'use client'

import { useState } from 'react'
import FormulaireEvenement from './FormulaireEvenement'

// Le bouton « Ajouter un évènement » du calendrier prof (agenda de classe, 18/09).
// Il n'est rendu que porte ouverte (la page décide).
export default function BoutonAjouterEvenement({
  classes, couleurs, dateDefaut, classesPreselection,
}: {
  classes: { id: string; nom: string }[]
  couleurs: Record<string, string>
  dateDefaut: string
  classesPreselection?: string[]
}) {
  const [ouvert, setOuvert] = useState(false)
  if (!ouvert) {
    return (
      <button onClick={() => setOuvert(true)} className="px-3 py-1 text-sm text-encre-douce hover:text-encre border border-bordure rounded-lg">
        ＋ Ajouter un évènement
      </button>
    )
  }
  return (
    <div className="w-full">
      <FormulaireEvenement classes={classes} couleurs={couleurs} dateDefaut={dateDefaut}
        classesPreselection={classesPreselection} onFermer={() => setOuvert(false)} />
    </div>
  )
}
