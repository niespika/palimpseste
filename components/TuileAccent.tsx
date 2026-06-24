'use client'

import { createContext, useContext } from 'react'

// ----------------------------------------------------------------------------
// Contexte d'accent des <Tuile>.
//   • Hors module (tableaux de bord généraux) : false → la tuile garde son code
//     couleur d'état (vert = ok / neutre / rouge = souci) et son anneau sépia.
//   • À l'intérieur d'un monde de module (poser <TuileAccentModule> dans le
//     layout du module) : true → le bord gauche et l'anneau de sélection/focus
//     adoptent le pigment du module ; le rouge reste réservé aux vrais soucis.
// ----------------------------------------------------------------------------

const TuileAccentContext = createContext(false)

export function TuileAccentModule({ children }: { children: React.ReactNode }) {
  return <TuileAccentContext.Provider value={true}>{children}</TuileAccentContext.Provider>
}

export function useTuileAccent() {
  return useContext(TuileAccentContext)
}
