// ----------------------------------------------------------------------------
// Un petit carillon de fin — synthétisé au vol (Web Audio), aucun fichier audio,
// aucun droit à payer. Louis : « un son rigolo, un truc genre Mary Poppins » →
// une ritournelle sautillante de six notes, timbre triangle un peu cuivré,
// avec un pouic final. ⚠️ Un AudioContext ne joue qu'après un geste de
// l'utilisateur ; le clic « Commencer l'enregistrement » le fournit.
// ----------------------------------------------------------------------------

const RITOURNELLE: Array<[number, number]> = [
  // [fréquence Hz, durée s] — do mi sol do' (haut) puis un petit trille
  [523.25, 0.14], [659.25, 0.14], [783.99, 0.14], [1046.5, 0.28],
  [880.0, 0.12], [1046.5, 0.12], [1174.66, 0.36],
]

export function jouerCarillonFin(): void {
  if (typeof window === 'undefined') return
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctx) return
  try {
    const ctx = new Ctx()
    void ctx.resume?.()
    const sortie = ctx.createGain()
    sortie.gain.value = 0.35
    sortie.connect(ctx.destination)
    let t = ctx.currentTime + 0.02
    for (const [freq, duree] of RITOURNELLE) {
      const osc = ctx.createOscillator()
      const env = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, t)
      env.gain.setValueAtTime(0.0001, t)
      env.gain.exponentialRampToValueAtTime(1, t + 0.02)
      env.gain.exponentialRampToValueAtTime(0.0001, t + duree)
      osc.connect(env)
      env.connect(sortie)
      osc.start(t)
      osc.stop(t + duree + 0.02)
      t += duree
    }
    // Le pouic : un glissando descendant, façon sifflet de music-hall.
    const pouic = ctx.createOscillator()
    const envP = ctx.createGain()
    pouic.type = 'sine'
    pouic.frequency.setValueAtTime(1600, t + 0.05)
    pouic.frequency.exponentialRampToValueAtTime(500, t + 0.45)
    envP.gain.setValueAtTime(0.0001, t + 0.05)
    envP.gain.exponentialRampToValueAtTime(0.8, t + 0.08)
    envP.gain.exponentialRampToValueAtTime(0.0001, t + 0.5)
    pouic.connect(envP)
    envP.connect(sortie)
    pouic.start(t + 0.05)
    pouic.stop(t + 0.55)
    setTimeout(() => { void ctx.close() }, (t - ctx.currentTime + 1) * 1000)
  } catch {
    // Pas de son : l'arrêt automatique suffit.
  }
}
