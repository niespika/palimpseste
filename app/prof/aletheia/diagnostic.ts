// Utilitaires diagnostic partagés serveur + client (PAS de `server-only`) : le
// graphe de progression (`GrapheProgression.tsx`, 'use client') et la fiche élève
// prof (server) lisent les mêmes niveaux et la même palette par livre.
import type { DiagnosticTravail } from '@/app/eleve/modules/aletheia/types'

// Niveau retenu par axe : VF si présent (réponse au feedback), sinon V1.
// « mal définie » → pas de niveau (gap dans la courbe, connectNulls=false).
export function niveauThese(d: DiagnosticTravail | undefined): number | null {
  if (!d) return null
  if (d.niveau_these_vf != null) return d.these_mal_definie_vf ? null : d.niveau_these_vf
  if (d.niveau_these_v1 != null) return d.these_mal_definie_v1 ? null : d.niveau_these_v1
  return null
}

export function niveauArgs(d: DiagnosticTravail | undefined): number | null {
  if (!d) return null
  return d.niveau_arguments_vf ?? d.niveau_arguments_v1
}

// Une couleur par livre (courbe + liseré de carte + légende), dans l'ordre, en
// commençant par l'outremer (pigment du monde Aletheia). Valeurs = jetons charte
// (Recharts exige des couleurs littérales ; seul endroit où un hex est toléré).
export const PALETTE_LIVRES = [
  '#2C4A7C', // pigment outremer
  '#B8893B', // accent or
  '#B4452F', // minium
  '#5A7DAE', // outremer clair
  '#8A6F4E', // muet doré
] as const

export function couleurLivre(index: number): string {
  return PALETTE_LIVRES[index % PALETTE_LIVRES.length]
}
