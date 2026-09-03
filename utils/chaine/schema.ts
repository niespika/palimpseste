// ============================================================================
// C4 · L5 — LA VALIDATION STRICTE DU SCHÉMA DE SORTIE.
// ----------------------------------------------------------------------------
// « Validation stricte du schéma de sortie — une sortie non conforme est
//   REJETÉE ET RELANCÉE, jamais interprétée. »        — `01-` §12, défense 2
//
// Volontairement minuscule et sans dépendance : un validateur qui « répare »
// (coercition, valeur par défaut, clé inconnue tolérée) est exactement ce que la
// défense interdit. Ici, tout ce qui n'est pas déclaré est un REFUS, avec son
// motif — et c'est le motif qui part au journal, jamais la sortie.
//
// ⚠️ Le refus n'a pas de valeur de repli. `CONTRAT-MODULES.md` §3 : « une valeur
//    illisible rend une alerte, pas une valeur par défaut ».
// ============================================================================

export type Forme =
  | { type: 'nul' }
  | { type: 'texte'; min?: number; max?: number }
  | { type: 'nombre'; min?: number; max?: number; entier?: boolean }
  | { type: 'booleen' }
  | { type: 'enum'; valeurs: ReadonlyArray<string | number> }
  | { type: 'liste'; de: Forme; min?: number; max?: number }
  | { type: 'objet'; champs: Record<string, Forme>; optionnels?: readonly string[] }
  /**
   * Un objet dont on ne connaît pas les clés — le relevé d'une fiche, dont la
   * forme fait foi À LA FICHE (`03-` §1) et que ce module n'a pas à déclarer.
   *
   * ⚠️ À NE PAS confondre avec `{ type: 'objet', champs: {} }`, qui veut dire
   *    « l'objet VIDE, et rien d'autre » — la garde des clés inconnues refuse
   *    alors TOUT. C'est la distinction qui manquait, et elle bloquait la chaîne
   *    entière le jour où une compétence s'ouvre.
   */
  | { type: 'objet_libre' }
  /**
   * ⭐ 02/09/2026 — LA FORME QUI MANQUAIT ENTRE LES DEUX. `objet` refuse toute clé
   * inconnue — et « la garde des clés inconnues REFUSAIT TOUTE SORTIE DE P2 »
   * le jour où une compétence s'est ouverte ; `objet_libre` n'exige rien — et un
   * P1 qui rend `{}` passait, puis « aucune unité → Absent » écrivait une lettre.
   * `objet_ouvert` EXIGE ses champs et TOLÈRE le reste : la forme d'une fiche
   * fait foi à la fiche, mais son squelette a des clés sans lesquelles rien ne
   * se lit, et celles-là se réclament — et se relancent.
   */
  | { type: 'objet_ouvert'; champs: Record<string, Forme>; optionnels?: readonly string[] }
  | { type: 'ou'; formes: readonly Forme[] }
  /**
   * C4-L4 — une sortie qui n'est PAS du JSON, et qui n'a pas à l'être.
   *
   * Le prompt de transcription impose son propre format de réponse — « d'abord
   * la transcription seule : texte brut, sans balise de code » —, et « le corps
   * de ses règles se conserve tel quel » (manifeste C4-L4 ; `06-` §4) : lui
   * demander du JSON serait réécrire une règle verrouillée.
   *
   * ⚠️ « Brut » ne veut pas dire « non validé » : le refus porte sur ce qu'on
   *    peut exiger sans toucher au prompt — une réponse non vide, et pas de
   *    balise de code. Une transcription vide est un échec, pas une copie vide :
   *    une copie vide se voit sur la photo, elle ne se déduit pas d'un silence.
   */
  | { type: 'texte_brut'; min?: number }

export interface Refus {
  chemin: string
  motif: string
}

export type Verdict<T> =
  | { ok: true; valeur: T }
  | { ok: false; refus: Refus[] }

function valide(v: unknown, forme: Forme, chemin: string, refus: Refus[]): void {
  switch (forme.type) {
    case 'nul': {
      if (v !== null) refus.push({ chemin, motif: `attendu null, reçu ${typeName(v)}` })
      return
    }
    case 'texte': {
      if (typeof v !== 'string') { refus.push({ chemin, motif: `attendu un texte, reçu ${typeName(v)}` }); return }
      if (forme.min != null && v.length < forme.min) refus.push({ chemin, motif: `texte trop court (${v.length} < ${forme.min})` })
      if (forme.max != null && v.length > forme.max) refus.push({ chemin, motif: `texte trop long (${v.length} > ${forme.max})` })
      return
    }
    case 'nombre': {
      if (typeof v !== 'number' || !Number.isFinite(v)) { refus.push({ chemin, motif: `attendu un nombre, reçu ${typeName(v)}` }); return }
      if (forme.entier && !Number.isInteger(v)) refus.push({ chemin, motif: 'attendu un entier' })
      if (forme.min != null && v < forme.min) refus.push({ chemin, motif: `hors borne basse (${v} < ${forme.min})` })
      if (forme.max != null && v > forme.max) refus.push({ chemin, motif: `hors borne haute (${v} > ${forme.max})` })
      return
    }
    case 'booleen': {
      if (typeof v !== 'boolean') refus.push({ chemin, motif: `attendu un booléen, reçu ${typeName(v)}` })
      return
    }
    case 'enum': {
      if (!forme.valeurs.includes(v as string | number)) {
        refus.push({ chemin, motif: `valeur hors liste fermée : ${JSON.stringify(v)} — attendu ${JSON.stringify(forme.valeurs)}` })
      }
      return
    }
    case 'liste': {
      if (!Array.isArray(v)) { refus.push({ chemin, motif: `attendu une liste, reçu ${typeName(v)}` }); return }
      if (forme.min != null && v.length < forme.min) refus.push({ chemin, motif: `liste trop courte (${v.length} < ${forme.min})` })
      if (forme.max != null && v.length > forme.max) refus.push({ chemin, motif: `liste trop longue (${v.length} > ${forme.max})` })
      v.forEach((x, i) => valide(x, forme.de, `${chemin}[${i}]`, refus))
      return
    }
    case 'objet': {
      if (v === null || typeof v !== 'object' || Array.isArray(v)) {
        refus.push({ chemin, motif: `attendu un objet, reçu ${typeName(v)}` }); return
      }
      const obj = v as Record<string, unknown>
      const optionnels = new Set(forme.optionnels ?? [])
      for (const [cle, sous] of Object.entries(forme.champs)) {
        // ⚠️ `in` REMONTE LA CHAÎNE DE PROTOTYPES — `'toString' in {}` vaut vrai.
        //    Un modèle qui rendrait `{"toString": "…"}` passerait alors la garde
        //    des clés inconnues, et la consigne injectée voyagerait jusqu'au
        //    document de P2 puis à `artefact_extraction`.
        if (!Object.hasOwn(obj, cle) || obj[cle] === undefined) {
          if (!optionnels.has(cle)) refus.push({ chemin: joindre(chemin, cle), motif: 'champ manquant' })
          continue
        }
        valide(obj[cle], sous, joindre(chemin, cle), refus)
      }
      // Une clé inconnue n'est pas tolérée : c'est le vecteur d'une consigne
      // injectée qui voyagerait jusqu'au retour affiché (`01-` §12).
      for (const cle of Object.keys(obj)) {
        if (!Object.hasOwn(forme.champs, cle)) {
          refus.push({ chemin: joindre(chemin, cle), motif: 'clé inconnue du schéma' })
        }
      }
      return
    }
    case 'objet_ouvert': {
      if (v === null || typeof v !== 'object' || Array.isArray(v)) {
        refus.push({ chemin, motif: `attendu un objet, reçu ${typeName(v)}` }); return
      }
      const obj = v as Record<string, unknown>
      const optionnels = new Set(forme.optionnels ?? [])
      for (const [cle, sous] of Object.entries(forme.champs)) {
        if (!Object.hasOwn(obj, cle) || obj[cle] === undefined) {
          if (!optionnels.has(cle)) refus.push({ chemin: joindre(chemin, cle), motif: 'champ manquant' })
          continue
        }
        valide(obj[cle], sous, joindre(chemin, cle), refus)
      }
      return
    }
    case 'objet_libre': {
      if (v === null || typeof v !== 'object' || Array.isArray(v)) {
        refus.push({ chemin, motif: `attendu un objet, reçu ${typeName(v)}` })
      }
      return
    }
    case 'ou': {
      for (const f of forme.formes) {
        const essai: Refus[] = []
        valide(v, f, chemin, essai)
        if (essai.length === 0) return
      }
      refus.push({ chemin, motif: 'ne satisfait aucune des formes admises' })
      return
    }
    case 'texte_brut': {
      if (typeof v !== 'string') {
        refus.push({ chemin, motif: `attendu un texte, reçu ${typeName(v)}` })
        return
      }
      if (v.trim() === '') {
        refus.push({ chemin, motif: 'réponse vide — une transcription vide est un échec, pas une copie vide' })
        return
      }
      if (forme.min != null && v.trim().length < forme.min) {
        refus.push({ chemin, motif: `réponse trop courte (${v.trim().length} < ${forme.min})` })
      }
      return
    }
  }
}

function joindre(chemin: string, cle: string): string {
  return chemin ? `${chemin}.${cle}` : cle
}

function typeName(v: unknown): string {
  if (v === null) return 'null'
  if (Array.isArray(v)) return 'liste'
  return typeof v
}

/** Valide une valeur DÉJÀ décodée. Aucune coercition, aucune valeur par défaut. */
export function valider<T = unknown>(valeur: unknown, forme: Forme): Verdict<T> {
  const refus: Refus[] = []
  valide(valeur, forme, '', refus)
  return refus.length ? { ok: false, refus } : { ok: true, valeur: valeur as T }
}

/**
 * Décode puis valide la sortie brute d'un modèle. Le décodage tolère la clôture
 * ```json que les modèles ajoutent parfois — c'est du transport, pas du contenu ;
 * tout le reste est refusé.
 */
export function validerSortie<T = unknown>(brut: string, forme: Forme): Verdict<T> {
  // C4-L4 — une sortie déclarée brute ne se décode PAS : « texte brut, sans
  // balise de code » est le format que le prompt de transcription impose, et
  // son corps est verrouillé. On retire seulement la clôture ```…``` si un
  // modèle en a ajouté une malgré la consigne : c'est du transport.
  if (forme.type === 'texte_brut') {
    const sansCloture = brut.replace(/^\s*```[a-z]*\s*\n?/, '').replace(/\n?```\s*$/, '')
    return valider<T>(sansCloture, forme)
  }
  const nu = brut.replace(/^\s*```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '').trim()
  let decode: unknown
  try {
    decode = JSON.parse(nu)
  } catch (e) {
    return { ok: false, refus: [{ chemin: '', motif: `JSON illisible : ${(e as Error).message}` }] }
  }
  return valider<T>(decode, forme)
}

/** Le motif d'un refus, en une ligne — ce qui part au journal et à la relance. */
export function direRefus(refus: Refus[]): string {
  return refus.map((r) => (r.chemin ? `${r.chemin} : ${r.motif}` : r.motif)).join(' · ')
}
