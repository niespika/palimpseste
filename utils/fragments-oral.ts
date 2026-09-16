// ----------------------------------------------------------------------------
// Vestigia · la présentation orale — règles pures (durée, messages du tirage).
// Mesuré en prod le 15/09 : deux classes portent le module, `1HLP` (niveau
// '1ere') et `THLP` (niveau 'terminale'). Louis : « en Première HLP la
// présentation dure 3 min, en Terminale HLP 4 minutes ».
// ----------------------------------------------------------------------------

/** Durée réglementaire de la présentation, en secondes, selon `classes.niveau`. */
export function dureeOralSecondes(niveau: string | null | undefined): number {
  const n = (niveau ?? '').trim().toLowerCase()
  if (n === '1ere' || n === '1ère' || n === 'premiere' || n === 'première') return 180
  return 240
}

export function formaterDuree(s: number): string {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

/** Les petits mots qui tombent sous le nom tiré — un ton pince-sans-rire. */
export const MESSAGES_TIRAGE: readonly string[] = [
  'Le destin a parlé. Il n’a pas l’air désolé.',
  'Ce n’est pas personnel. C’est mathématique.',
  'Les dés sont jetés. Ils sont retombés sur toi.',
  'Bonne nouvelle : tu n’as plus à te demander si ce sera toi.',
  'Le hasard fait bien les choses. Pour nous, en tout cas.',
  'Aucune pondération n’a été maltraitée pendant ce tirage.',
  'L’algorithme t’a choisi. Il ne revient jamais sur ses décisions.',
  'Respire. Ça passe vite. Enfin, pour nous.',
  'Le sort en est jeté — et il porte ton nom.',
  'Tu avais une chance sur plusieurs. C’était celle-là.',
  'Le silence que tu entends, c’est le soulagement des autres.',
  'On a hésité longuement. Environ quatre millisecondes.',
]

/** Un message par tirage, sans jamais répéter le précédent tant qu’il en reste d’autres. */
export function messageTirage(precedent: string | null, alea: () => number = Math.random): string {
  const choix = MESSAGES_TIRAGE.filter(m => m !== precedent)
  const source = choix.length > 0 ? choix : MESSAGES_TIRAGE
  const i = Math.min(source.length - 1, Math.max(0, Math.floor(alea() * source.length)))
  return source[i]
}

/**
 * La cadence du défilement des noms, en millisecondes entre deux noms : rapide
 * d’abord, puis qui ralentit jusqu’à s’arrêter sur le gagnant. `etape` va de 0
 * à `total - 1`.
 */
export function cadenceDefilement(etape: number, total: number): number {
  if (total <= 1) return 80
  const t = etape / (total - 1)
  return Math.round(60 + 460 * t * t)
}

/**
 * La suite des noms affichés pendant le ralenti : `nbEtapes` noms pris dans
 * `candidats` en tournant, et le dernier est toujours le gagnant.
 */
export function suiteDuRalenti(candidats: readonly string[], gagnant: string, nbEtapes = 14): string[] {
  if (candidats.length === 0) return [gagnant]
  const suite: string[] = []
  const depart = Math.max(0, candidats.indexOf(gagnant))
  for (let k = nbEtapes - 1; k >= 1; k--) {
    suite.push(candidats[((depart - k) % candidats.length + candidats.length) % candidats.length])
  }
  suite.push(gagnant)
  return suite
}
