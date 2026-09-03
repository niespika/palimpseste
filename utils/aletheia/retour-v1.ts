// ============================================================================
// ALETHEIA · E5 — LE RETOUR V1 RECOMPOSÉ. Module PUR (aucune base, aucune I/O).
// ----------------------------------------------------------------------------
// Ce que le lot change dans le retour socratique, porte `aletheia_etayage_actif` ouverte :
//  · une bulle de RAPPEL en tête (l'élève a dit, sans relire, l'idée de la séance
//    précédente ; l'IA la juge contre la fiche N−1, jamais contre l'aval) — D1 ;
//  · des relances qui DÉSIGNENT un passage clé par identifiant (E4), avec un libellé
//    « ce que tu cherches » — jamais un extrait produit par le modèle ;
//  · un budget de 300 mots pour tout le retour hors passages (526 mesurés avant) ;
//  · un `terme_canonique` (lemme) par mot de vocabulaire, pour Quazian — D9.
// Porte fermée : blocs vides ⇒ prompt d'avant à l'octet près, `relances` reste une
// liste de chaînes.
// ============================================================================

/** Une relance : la question, et (E5) le passage qu'elle désigne. */
export interface RelanceDetail {
  question: string
  /** Identifiant d'un passage clé de la fiche (`k12-2`), ou null. */
  passage: string | null
  /** Ce que l'élève cherche, en clair (≤ 12 mots), ou null. */
  libelle: string | null
}

export interface RappelJuge {
  verdict: 'juste' | 'partiel' | 'a_cote'
  /** Une phrase : ce qui manque ou ce qui est juste. */
  phrase: string
}

export interface DefinitionVocabulaireE5 {
  terme: string
  definition: string
  /** Lemme, masculin singulier, sans article, minuscules ; absent porte fermée. */
  terme_canonique?: string
}

export const BUDGET_MOTS_RETOUR_V1 = 300

// ── Blocs de prompt (placeholders `{bloc_rappel}` et `{bloc_passages}` du tronc V1) ──

export function blocRappel(ficheN1: { these_canonique: string; synthese_modele: string } | null, rappel: string | null): string {
  if (!rappel || !rappel.trim()) return ''
  const these = ficheN1?.these_canonique?.trim() || '(thèse indisponible)'
  const synthese = ficheN1?.synthese_modele?.trim() || '(synthèse indisponible)'
  return `
## Rappel de la séance PRÉCÉDENTE (E5 — exception NOMMÉE à l'ancrage strict : ce bloc, et lui seul, regarde la séance d'avant)
Avant de lire, l'élève a écrit de mémoire, sans relire, ce qu'il retenait de la séance précédente :
<<<RAPPEL
{rappel_eleve}
RAPPEL>>>
Ce que la fiche de la séance précédente dit (CONFIDENTIEL, ne pas recopier) — thèse : ${these} — synthèse montrée à l'élève : ${synthese}
Juge le rappel contre CETTE fiche seulement, jamais contre la suite du livre, en une bulle courte : "verdict" ∈ "juste" | "partiel" | "a_cote", "phrase" = UNE phrase qui dit ce qui est juste ou ce qui manque, sans annoncer la séance d'aujourd'hui. Cette bulle n'est PAS une relance. Ajoute au JSON de réponse la clé "rappel": { "verdict": "…", "phrase": "…" }.
`
}

export function blocPassages(passages: readonly { id: string; libelle: string; role: string }[]): string {
  const liste = passages.length
    ? passages.map(p => `- ${p.id} (${p.role}) : ${p.libelle}`).join('\n')
    : '(aucun passage clé pour cette semaine : "passage" = null partout)'
  return `
## Passages clés de la semaine (E5 — identifiants à DÉSIGNER, jamais à recopier)
${liste}
Chaque relance sur l'idée principale et les arguments DÉSIGNE le passage qu'elle vise : rends chaque entrée de "relances" comme un objet { "question": "…", "passage": "<identifiant ci-dessus ou null>", "libelle_a_trouver": "ce que l'élève doit chercher, ≤ 12 mots, le LIEU jamais la réponse" }. Un identifiant inconnu vaut null. Tu ne recopies AUCUN extrait : l'écran montrera ou fera chercher le passage à la place.
⛔ BUDGET : ${BUDGET_MOTS_RETOUR_V1} mots AU TOTAL pour relances + accord + réponses + définitions (les passages ne comptent pas) — c'est une limite DURE, pas une indication : au-delà, l'élève ne lit plus. Pour y tenir : chaque relance ≤ 45 mots (une seule question, pas deux), l'accord ≤ 60 mots, chaque réponse à une question ≤ 50 mots, chaque définition ≤ 25 mots ; deux relances valent mieux que trois. Compte avant de rendre.
Pour chaque mot de vocabulaire, ajoute "terme_canonique" : le lemme (masculin singulier, sans article, minuscules), ex. « apolliniennes » → "apollinien".
`
}

// ── Lecture tolérante de la sortie du modèle ─────────────────────────────────

/** Relances : chaînes (d'avant) ou objets (E5). Rend les deux formes alignées. */
export function lireRelances(x: unknown, idsConnus?: ReadonlySet<string>): { relances: string[]; detail: RelanceDetail[] } {
  if (!Array.isArray(x)) return { relances: [], detail: [] }
  const detail: RelanceDetail[] = []
  for (const r of x) {
    if (typeof r === 'string') { if (r.trim()) detail.push({ question: r, passage: null, libelle: null }); continue }
    const o = r as { question?: unknown; passage?: unknown; libelle_a_trouver?: unknown; libelle?: unknown } | null
    const q = typeof o?.question === 'string' ? o.question.trim() : ''
    if (!q) continue
    let passage = typeof o?.passage === 'string' && o.passage.trim() ? o.passage.trim() : null
    if (passage && idsConnus && !idsConnus.has(passage)) passage = null
    const lib = typeof o?.libelle_a_trouver === 'string' ? o.libelle_a_trouver : typeof o?.libelle === 'string' ? o.libelle : ''
    detail.push({ question: q, passage, libelle: lib.trim() || null })
  }
  return { relances: detail.map(d => d.question), detail }
}

export function lireRappel(x: unknown): RappelJuge | null {
  const o = x as { verdict?: unknown; phrase?: unknown } | null
  if (!o || typeof o.phrase !== 'string' || !o.phrase.trim()) return null
  const v = typeof o.verdict === 'string' ? o.verdict.trim().toLowerCase().replace(/[\s-]/g, '_') : ''
  const verdict: RappelJuge['verdict'] = v === 'juste' ? 'juste' : v === 'partiel' ? 'partiel' : 'a_cote'
  return { verdict, phrase: o.phrase.trim() }
}

/** Nombre de mots du retour (relances + accord + réponses + définitions), pour le journal de budget. */
export function motsDuRetour(r: { relances: string[]; accord: string | null; reponses_questions: string[]; vocabulaire: { definition: string }[] }): number {
  const tout = [...r.relances, r.accord ?? '', ...r.reponses_questions, ...r.vocabulaire.map(v => v.definition)].join(' ')
  return tout.split(/\s+/).filter(w => /[\p{L}\p{N}]/u.test(w)).length
}

// ── Lemme (D9) ───────────────────────────────────────────────────────────────

export function normaliserLemme(s: string | null | undefined): string {
  return (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/^(l'|le |la |les |un |une |des |d')/, '').replace(/[^a-z0-9]+/g, ' ').trim()
}

function distance(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)] as number[])
  for (let j = 1; j <= b.length; j++) dp[0][j] = j
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
    dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
  }
  return dp[a.length][b.length]
}

/** Racine grossière : le lemme sans sa marque de genre/nombre (« apolliniennes » → « apollinien », « dionysiaques » → « dionysiaqu »). */
function racine(s: string): string {
  return s.replace(/(?:nes|ne|es|s|e)$/, '')
}

/**
 * Deux lemmes « égaux » : même racine (genre et nombre effacés). « apollinien /
 * apolliniennes » ⇒ égaux ; « apollinien / apollinisme », « sophiste / sophisme »,
 * « chœur / cœur » ⇒ distincts. ⚠️ Pas de tolérance aux fautes de frappe : sur un
 * préfixe commun de 6 lettres, une édition suffit à confondre sophiste et sophisme
 * (mesuré au test) — le garde-fou du spec (« préfixe 6 + distance ≤ 2 ») fusionnerait
 * des concepts distincts. La distance reste disponible pour un usage prof (suggestion).
 */
export function memeLemme(a: string, b: string): boolean {
  const x = normaliserLemme(a), y = normaliserLemme(b)
  if (!x || !y) return false
  return x === y || racine(x) === racine(y)
}

/** Distance d'édition entre deux lemmes normalisés (pour suggérer une fusion, jamais pour la décider). */
export function distanceLemmes(a: string, b: string): number { return distance(normaliserLemme(a), normaliserLemme(b)) }

/** Remplace chaque `{nom}` de `blocs` dans le tronc (absent ⇒ inchangé) ; un bloc vide efface le placeholder. */
export function assemblerBlocs(tronc: string, blocs: Record<string, string>): string {
  let s = tronc
  for (const [nom, bloc] of Object.entries(blocs)) s = s.split(`{${nom}}`).join(bloc)
  return s
}

/** Le lemme retenu pour une carte : celui du modèle s'il est plausible, sinon le terme lui-même. */
export function lemmeDeCarte(terme: string, canonique?: string | null): string {
  const c = normaliserLemme(canonique)
  const t = normaliserLemme(terme)
  // Plausible : non vide, un seul mot ou deux, et qui partage au moins 3 lettres de tête avec le terme (sinon le modèle a dérivé).
  if (c && c.split(' ').length <= 2 && t.slice(0, 3) === c.slice(0, 3)) return c
  return t
}
