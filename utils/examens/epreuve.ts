// ============================================================================
// CODEX — L'ÉPREUVE MINUTÉE : LE TEMPS, SANS BASE. 24/09/2026.
// ----------------------------------------------------------------------------
// Demande de Louis (24/09), pour l'examen 1HLP du 29/09 :
//   « Il faut prévoir que l'épreuve dure X min, mais que la relecture dure un
//     temps aussi, qui n'est plus un temps où l'élève écrit. Le prof doit
//     spécifier tout ça dans la préparation de l'épreuve. »
//   « Il faut que le dépôt soit possible à partir de la moitié de l'épreuve, de
//     manière automatique. »
//   « Un timer qui indique combien de temps il reste environ par incrément de
//     10 min, puis de 5 min, puis de minute. »
//
// Ce module est PUR : aucune base, aucun réseau, aucune horloge — l'instant
// « maintenant » est TOUJOURS un argument. C'est ce qui le rend testable, et ce
// qui fait que le serveur (ouverture automatique) et les deux écrans (projection,
// tablette) calculent LA MÊME frise à partir des mêmes trois valeurs.
//
// ⭐ LA FRISE, EN QUATRE PHASES :
//      avant ──(lancement)── rédaction ──(X)── relecture ──(X+Y)── fin
//    et, au milieu de la rédaction, l'OUVERTURE AUTOMATIQUE DU DÉPÔT, à ⌈X/2⌉.
// ⛔ RIEN NE SE FERME À LA FIN : la clôture reste le geste du professeur
//    (`02-` §6.D, étape 11 bis). « fin » est un AFFICHAGE, pas un état en base.
// ============================================================================

export const MINUTE = 60_000

/** Les bornes des deux durées — les MÊMES que la contrainte `exercices_epreuve_chk`. */
export const BORNES_REDACTION = { min: 5, max: 300 } as const
export const BORNES_RELECTURE = { min: 0, max: 120 } as const
/** La borne des consignes pratiques — la même que la contrainte. */
export const CONSIGNES_PRATIQUES_MAX = 2000

export type PhaseEpreuve = 'avant' | 'redaction' | 'relecture' | 'fin'

export interface ReglageEpreuve {
  /** L'instant du lancement (ISO), ou null tant que le professeur n'a pas lancé. */
  debut: string | null
  /**
   * L'instant de l'ouverture automatique du dépôt (ISO), POSÉ AU LANCEMENT
   * (`epreuve_ouverture_at`) et jamais recalculé : un « +5 min » prolonge la fin,
   * il ne déplace pas une heure déjà annoncée à la classe. Absent : calculé.
   */
  ouverture?: string | null
  /** La durée de RÉDACTION X, en minutes. */
  redactionMin: number
  /** La durée de RELECTURE Y, en minutes (0 = pas de temps de relecture). */
  relectureMin: number
}

export interface EtatEpreuve {
  phase: PhaseEpreuve
  /** Les instants de la frise, en ms — null tant que l'épreuve n'est pas lancée. */
  debutMs: number | null
  ouvertureMs: number | null
  finRedactionMs: number | null
  finRelectureMs: number | null
  /** L'heure de l'ouverture automatique est-elle passée ? */
  ouvertureVenue: boolean
  /** Le temps restant DANS LA PHASE COURANTE (rédaction ou relecture), sinon null. */
  restantMs: number | null
}

/**
 * L'ouverture automatique du dépôt : la MOITIÉ du temps de rédaction (90 min →
 * 45 ; 45 min → 23, à la minute pleine supérieure), puis L'INSTANT arrondi à la
 * minute pleine supérieure. Arrondi deux fois, pour que l'heure annoncée
 * (« le dépôt ouvrira à 10 h 46 ») soit EXACTEMENT celle où il s'ouvre, et
 * jamais avant la moitié : lancée à 10:00:40, l'épreuve de 90 min ouvre son
 * dépôt à 10:46:00, pas à 10:45:40 affiché « 10 h 45 » (revue du 24/09).
 */
export function ouvertureAutomatique(debutMs: number, redactionMin: number): number {
  return Math.ceil((debutMs + Math.ceil(redactionMin / 2) * MINUTE) / MINUTE) * MINUTE
}

/** Où en est l'épreuve à l'instant `maintenantMs`. */
export function etatDeLEpreuve(r: ReglageEpreuve, maintenantMs: number): EtatEpreuve {
  const debutMs = r.debut ? Date.parse(r.debut) : NaN
  if (!Number.isFinite(debutMs)) {
    return {
      phase: 'avant', debutMs: null, ouvertureMs: null, finRedactionMs: null,
      finRelectureMs: null, ouvertureVenue: false, restantMs: null,
    }
  }
  const posee = r.ouverture ? Date.parse(r.ouverture) : NaN
  const ouvertureMs = Number.isFinite(posee) ? posee : ouvertureAutomatique(debutMs, r.redactionMin)
  const finRedactionMs = debutMs + r.redactionMin * MINUTE
  const finRelectureMs = finRedactionMs + Math.max(0, r.relectureMin) * MINUTE
  const base = {
    debutMs, ouvertureMs, finRedactionMs, finRelectureMs,
    ouvertureVenue: maintenantMs >= ouvertureMs,
  }
  if (maintenantMs < finRedactionMs) {
    return { ...base, phase: 'redaction', restantMs: finRedactionMs - maintenantMs }
  }
  if (maintenantMs < finRelectureMs) {
    return { ...base, phase: 'relecture', restantMs: finRelectureMs - maintenantMs }
  }
  return { ...base, phase: 'fin', restantMs: null }
}

/**
 * Le temps restant, par PALIERS : au-delà de 30 min, par dizaines ; de 30 à
 * 10 min, par cinq ; sous 10 min, à la minute.
 *
 * ⭐ ARRONDI VERS LE HAUT, et c'est un choix : la valeur affichée est TOUJOURS
 *    une borne vraie (« moins de 40 min »), et chaque palier apparaît à
 *    l'instant EXACT où il devient vrai — « 30 min » s'affiche quand il reste
 *    30 min pile, comme le professeur l'annoncerait à voix haute. Un arrondi vers
 *    le bas afficherait « 30 » quand il en reste 39 : il pousserait la classe à
 *    se presser pour rien.
 */
export function palierMinutes(restantMs: number): number {
  if (!(restantMs > 0)) return 0
  const min = restantMs / MINUTE
  if (min > 30) return Math.ceil(min / 10) * 10
  if (min > 10) return Math.ceil(min / 5) * 5
  return Math.ceil(min)
}

/** « 45 min », « 1 h », « 1 h 20 », « 2 h 05 ». */
export function libelleDuree(minutes: number): string {
  const m = Math.max(0, Math.round(minutes))
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const r = m % 60
  return r === 0 ? `${h} h` : `${h} h ${String(r).padStart(2, '0')}`
}

/**
 * L'heure murale, DANS LE FUSEAU du professeur (`calendrier_params.fuseau`),
 * à la québécoise : « 10 h 07 ». ⚠️ Jamais le fuseau du navigateur : le poste du
 * projecteur peut être réglé autrement, et un serveur tourne en UTC.
 */
export function heureMurale(ms: number, fuseau: string): string {
  return new Intl.DateTimeFormat('fr-CA', {
    hour: '2-digit', minute: '2-digit', timeZone: fuseau,
  }).format(new Date(ms))
}

/**
 * Lit une durée saisie (champ de formulaire) : un entier dans ses bornes, ou
 * `null` si le champ est vide. Toute autre saisie est un REFUS nommé — jamais
 * une valeur corrigée en silence.
 */
export function lireDuree(
  brut: unknown, bornes: { min: number; max: number },
): { ok: true; valeur: number | null } | { ok: false; message: string } {
  const s = typeof brut === 'string' ? brut.trim() : brut == null ? '' : String(brut)
  if (s === '') return { ok: true, valeur: null }
  if (!/^\d+$/.test(s)) return { ok: false, message: `« ${s} » n’est pas un nombre entier de minutes.` }
  const n = Number(s)
  if (n < bornes.min || n > bornes.max) {
    return { ok: false, message: `La durée doit être comprise entre ${bornes.min} et ${bornes.max} minutes.` }
  }
  return { ok: true, valeur: n }
}

// ─────────────────────────────────────────────────────────────────────────────
// LES TEXTES — en UN endroit, pour que Louis les relise d'un coup d'œil.
// Ce que lit la CLASSE (projection) et ce que lit l'ÉLÈVE (tablette).
// ⚠️ « Tout texte élève […] se montre à Louis avant d'être tenu pour fait. »
// ─────────────────────────────────────────────────────────────────────────────

export const TEXTES_EPREUVE = {
  /** Projection — avant le lancement : le sujet reste caché. */
  projectionAvant: 'L’épreuve n’a pas encore commencé.',
  /** Projection — rédaction, dépôt pas encore ouvert. `{heure}` = l'ouverture. */
  projectionAvantOuverture:
    'Le dépôt ouvrira à {heure}. À partir de cette heure-là, si tu as fini d’écrire, tu pourras '
    + 'photographier ta copie dans Codex, puis relire le texte que la machine aura lu.',
  /** Projection — rédaction, dépôt ouvert. */
  projectionDepotOuvert:
    'Le dépôt est ouvert. Si tu as fini d’écrire, photographie ta copie dans Codex, puis relis '
    + 'le texte que la machine a lu et corrige ce qu’elle a mal lu.',
  /** Projection — relecture. */
  projectionRelecture:
    'La rédaction est terminée : pose ton stylo. Photographie ta copie dans Codex, puis relis le '
    + 'texte que la machine a lu et corrige ce qu’elle a mal lu.',
  /** Projection — fin. */
  projectionFin:
    'Le temps de relecture est écoulé. Si ce n’est pas déjà fait, valide ta copie maintenant.',
  /** Projection — fin, quand AUCUN temps de relecture n'a été fixé (Y = 0). */
  projectionFinSansRelecture:
    'La rédaction est terminée : pose ton stylo. Photographie ta copie dans Codex, relis le texte '
    + 'que la machine a lu, puis valide-le.',

  /** Tablette — l'épreuve est préparée, pas encore lancée. */
  eleveAvant:
    'L’épreuve n’a pas encore commencé. Ton professeur va la lancer en classe : le sujet '
    + 's’affichera alors ici, sans que tu aies besoin de recharger la page.',
  /** Tablette — lancée, dépôt pas encore ouvert. `{heure}` = l'ouverture. */
  eleveEnCours:
    'Le dépôt ouvrira à {heure}. À partir de cette heure-là, si tu as fini d’écrire, tu pourras '
    + 'photographier ta copie, puis la relire. Cette page s’ouvrira toute seule : tu n’as pas '
    + 'besoin de la recharger.',
} as const

/**
 * La CONFIRMATION avant « Valider ma copie », sur un examen de Codex — demande
 * de Louis, 24/09 : « une demande de confirmation qui demande à l'élève
 * notamment s'il a bien relu l'orthographe et la grammaire, et si tout a été
 * bien justifié, etc. ».
 * ⚠️ Un RAPPEL, pas une garde : rien n'est enregistré de ce qui est coché, et
 *    le serveur ne l'exige pas (une case ne prouve pas une relecture).
 */
export const CONFIRMATION_AVANT_VALIDATION = {
  titre: 'Avant de valider ta copie',
  intro: 'Une fois validée, ta copie ne bouge plus : c’est ce texte-là que ton professeur lira. '
    + 'Vérifie chacun de ces points, puis coche-le.',
  // ⭐ 24/09 — le point « chacune de mes idées est justifiée » est RETIRÉ sur
  //    commentaire de Louis (planche des maquettes) : « se juger », à l'écran
  //    suivant, pose déjà la question de la justification.
  points: [
    'J’ai relu l’orthographe et la grammaire : les accords, les conjugaisons et la ponctuation.',
    'J’ai comparé ce texte à ma copie papier, et j’ai corrigé ce que la machine avait mal lu.',
  ],
  valider: 'Je valide ma copie',
  retour: 'Je retourne relire',
} as const

/** Remplace `{heure}` dans un texte. */
export function avecHeure(texte: string, heure: string): string {
  return texte.replace('{heure}', heure)
}
