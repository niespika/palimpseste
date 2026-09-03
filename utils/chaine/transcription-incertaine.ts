/**
 * ⭐ 02/09/2026 — LA TRANSCRIPTION EST EN AMONT DE TOUT, et la chaîne ne le
 * disait pas.
 *
 * Les 67 dépôts de production sont des PHOTOS : la chaîne juge, cite et fait
 * citer une transcription d'OCR. `confiance_ocr_v1` — l'accord des deux passes
 * — vaut 0,958 en médiane, mais 7 dépôts sur 71 sont sous 0,80 et le pire est
 * à 0,25. Sur ceux-là, « tu écris » montre à l'élève ce que la machine a lu, et
 * la lettre mesure une reconstruction.
 *
 * ⚠️ ALERTE, PAS PORTE. Rien n'est bloqué : bloquer changerait ce que l'élève
 * reçoit et naîtrait derrière un interrupteur (règle du projet). La ligne va au
 * bilan et, en abrégé, au `dernier_message` que le professeur lit — c'est lui
 * qui a la photo sous les yeux.
 */
import type { Version } from './types'

export const PREFIXE_TRANSCRIPTION = 'TRANSCRIPTION INCERTAINE'

export function alerteTranscriptionIncertaine(a: {
  version: Version
  origine: { transcrite: boolean; confiance: number | null }
  seuil: number
}): string | null {
  if (!a.origine.transcrite) return null
  const c = a.origine.confiance
  if (c == null) {
    return `${PREFIXE_TRANSCRIPTION} (${a.version}) : confiance NULLE — une seule passe d'OCR a `
      + 'abouti, l\'accord des deux n\'a pas pu être mesuré ; la mesure et les citations portent '
      + 'sur une reconstruction de la copie'
  }
  if (c >= a.seuil) return null
  return `${PREFIXE_TRANSCRIPTION} (${a.version}) : confiance ${c.toFixed(2)} sous le seuil `
    + `${a.seuil.toFixed(2)} — la mesure et les citations portent sur une reconstruction de la `
    + 'copie que la machine a mal lue'
}

/** L'abrégé du résumé de job : « , transcription incertaine (0,53) ». */
export function motifDeTranscription(alertes: readonly string[]): string {
  const a = alertes.find((x) => x.startsWith(PREFIXE_TRANSCRIPTION))
  if (!a) return ''
  const m = a.match(/confiance (\d\.\d\d|NULLE)/)
  return `, transcription incertaine (${m ? m[1]!.replace('.', ',').toLowerCase() : '?'})`
}
