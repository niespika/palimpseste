// Une copie reste modifiable tant que son retour n'a pas été enregistré.
// La V1 devient immuable après le retour 1 ; la VF après le retour final.
export function phasesDiagnostic(statut: string): { v1: boolean; vf: boolean } {
  return {
    v1: ['FEEDBACK1_READY', 'VF_SUBMITTED', 'FEEDBACK2_READY', 'DONE'].includes(statut),
    vf: ['FEEDBACK2_READY', 'DONE'].includes(statut),
  }
}

// Validation des sorties de mesure : une absence de mesure n'est jamais une note.
import type { InventaireDiagnostic, NiveauxDiagnostic, ReferenceChapitre } from '@/app/eleve/modules/aletheia/types'
import { lettreVersNote } from '../notation'

function objet(x: unknown): Record<string, unknown> {
  if (!x || typeof x !== 'object' || Array.isArray(x)) throw new Error('Objet diagnostic invalide.')
  return x as Record<string, unknown>
}
function liste(x: unknown): string[] {
  if (!Array.isArray(x) || x.some(v => typeof v !== 'string' || !v.trim())) throw new Error('Liste diagnostique invalide.')
  return x.map(v => (v as string).trim())
}

export function lettreNiveau(x: unknown): number {
  if (typeof x !== 'string') throw new Error('Lettre diagnostique absente.')
  // Variantes reconnues entièrement, jamais une lettre trouvée au milieu d'un mot.
  const m = /^(?:niveau\s+)?([A-E])(?:\s*\([^()]+\))?$/i.exec(x.trim())
  if (!m) throw new Error('Lettre diagnostique invalide.')
  return lettreVersNote(m[1].toUpperCase())!
}

export function parseInventaire(x: unknown): InventaireDiagnostic {
  const o = objet(x)
  if (typeof o.these_eleve !== 'string' || typeof o.note !== 'string' || typeof o.these_mal_definie !== 'boolean') throw new Error('Inventaire diagnostique incomplet.')
  const resultat: InventaireDiagnostic = {
    these_eleve: o.these_eleve.trim(), note: o.note.trim(), these_mal_definie: o.these_mal_definie,
    arguments_captes: liste(o.arguments_captes), arguments_rates: liste(o.arguments_rates), arguments_deformes: liste(o.arguments_deformes),
  }
  // Une copie sans idée reste mesurable, mais l'inventaire doit le constater.
  if (!resultat.these_eleve && !resultat.note && !resultat.arguments_captes.length && !resultat.arguments_rates.length && !resultat.arguments_deformes.length) throw new Error('Inventaire diagnostique vide.')
  if (o.fragment_reference != null) {
    if (typeof o.fragment_reference !== 'string' || !o.fragment_reference.trim()) throw new Error('Référence du fragment invalide.')
    resultat.fragment_reference = o.fragment_reference.trim()
  }
  if (o.fil != null) {
    const f = objet(o.fil)
    resultat.fil = { captes: liste(f.captes), rates: liste(f.rates), deformes: liste(f.deformes) }
  }
  return resultat
}

export function exigerReference(ref: ReferenceChapitre | null): asserts ref is ReferenceChapitre {
  if (!ref?.these_canonique.trim() || !ref.arguments_cles.length || ref.arguments_cles.some(a => !a.trim())) throw new Error('Référence de la séance indisponible ou incomplète : diagnostic à reprendre après préparation de la fiche.')
}

export function parseNiveaux(x: unknown, argumentsApplicables = true, theseObligatoire = false): NiveauxDiagnostic {
  const o = objet(x)
  if (typeof o.these_mal_definie !== 'boolean') throw new Error('Applicabilité de la thèse absente.')
  if (theseObligatoire && o.these_mal_definie) throw new Error('Cet axe de compréhension doit être mesuré.')
  if (o.these_mal_definie && o.niveau_these !== null) throw new Error('Niveau fourni pour une thèse non applicable.')
  // L'applicabilité de cet axe est fixée par la question posée, jamais par le modèle.
  // Si le modèle propose malgré tout une lettre, elle est écartée sans devenir une mesure.
  return {
    these_mal_definie: o.these_mal_definie,
    niveau_these: o.these_mal_definie ? null : lettreNiveau(o.niveau_these),
    niveau_arguments: argumentsApplicables ? lettreNiveau(o.niveau_arguments) : null,
  }
}
