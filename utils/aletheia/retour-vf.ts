// ============================================================================
// ALETHEIA · E7 — LE RETOUR FINAL AGI (module PUR, aucun appel réseau).
// ----------------------------------------------------------------------------
// Ce que l'appel VF rend en PLUS porte ouverte (spec § 6.4 et § 6.5) :
//  · `nuances_detail` : chaque nuance désigne la phrase de l'élève (verbatim) et le
//    passage clé qui la tranche, avec un verdict et une note ; UNE nuance de priorité 1 ;
//  · `amont_paires` : chaque lien amont est une PAIRE de passages clés (courant, amont) ;
//  · `synthese_couverture` : la synthèse modèle, numérotée par phrases, jugée présente /
//    partielle / absente dans la version finale de l'élève.
// Et ce que le code fait de ces sorties : lecture tolérante par identifiants connus,
// comparaison du surlignage de l'élève à la couverture (D8), budget de la nuance.
// ⛔ Le modèle ne produit jamais un offset ni une pivot : seulement des identifiants ;
//    les pivots viennent de la fiche.
// ============================================================================
import { decouperEnPhrases, repererMasques, rendreTranche } from './decoupage'

export type VerdictNuance = 'confirme' | 'infirme' | 'precise'
export interface NuanceDetail {
  /** Phrase (ou bout de phrase) de la version FINALE de l'élève, recopiée mot pour mot. */
  extrait_eleve: string
  /** Identifiant d'un passage clé de CETTE semaine (`k3-2`), ou null quand rien ne tranche. */
  passage: string | null
  verdict: VerdictNuance
  /** ≤ 40 mots. */
  note: string
  /** 1 = la nuance dépliée en tête ; les autres sont repliées. */
  priorite: number
}
export interface PaireAmont { passage_courant: string; passage_amont: string; relation: string }
export type EtatCouverture = 'present' | 'partiel' | 'absent'
export interface CouvertureSynthese { id: string; etat: EtatCouverture }
export interface PhraseSynthese { id: string; texte: string }

/** Ce que l'élève a FAIT sur le retour final (colonne `retour_vf_agi`). */
export interface GestesRetourFinal {
  nuance?: { surlignage: string[]; verdict_code: string; essais: number }
  amont?: { index: number; choix: string; juste: boolean }[]
}
/** La comparaison de la synthèse (colonne `comparaison_synthese`). */
export interface ComparaisonSynthese {
  surlignage: string[]
  reperes: string[]
  manques: string[]
  deja_la: string[]
  message: string
  at: string
}

/** Nuance prioritaire + note : ≤ 80 mots (spec § 6.4). */
export const BUDGET_NUANCE_MOTS = 80
export const NOTE_NUANCE_MOTS = 40
/** Nombre de propositions offertes à C et au-dessus pour choisir le passage amont (la bonne comprise). */
export const OPTIONS_AMONT = 4

const mots = (s: string) => s.trim() ? s.trim().split(/\s+/).length : 0

// ── La synthèse numérotée ────────────────────────────────────────────────────

/** La synthèse modèle découpée en phrases `y{semaine}-{n}`, par LE découpeur unique. */
export function phrasesSynthese(semaine: number, synthese: string): PhraseSynthese[] {
  const texte = synthese ?? ''
  if (!texte.trim()) return []
  const masques = repererMasques(texte)
  return decouperEnPhrases(texte, masques)
    .map(b => rendreTranche(texte, b, masques).trim())
    .filter(t => t.length > 0)
    .map((t, i) => ({ id: `y${semaine}-${i + 1}`, texte: t }))
}

// ── Le bloc de prompt ────────────────────────────────────────────────────────

export interface PassageAmontRef { id: string; semaine: number; libelle: string }

/** Le bloc `{bloc_passages_vf}` : passages de la semaine, passages amont, synthèse numérotée, et les trois tâches. */
export function blocPassagesVf(
  courants: readonly { id: string; libelle: string; role: string }[],
  amont: readonly PassageAmontRef[],
  synthese: readonly PhraseSynthese[],
): string {
  if (courants.length === 0 && synthese.length === 0) return ''
  const l: string[] = ['', '## Repères pour POINTER le texte (E7) — identifiants seulement, jamais de recopie']
  if (courants.length) {
    l.push(`Passages clés de la semaine (identifiant · rôle — ce qu'on y trouve) :`)
    for (const p of courants) l.push(`- ${p.id} · ${p.role} — ${p.libelle}`)
  }
  if (amont.length) {
    l.push(`Passages clés des semaines précédentes (déjà lues) :`)
    for (const p of amont) l.push(`- ${p.id} · semaine ${p.semaine} — ${p.libelle}`)
  }
  if (synthese.length) {
    l.push(`La synthèse modèle, phrase par phrase :`)
    for (const s of synthese) l.push(`[${s.id}] ${s.texte}`)
  }
  l.push('')
  l.push(`Tâches SUPPLÉMENTAIRES, à ajouter au même objet JSON :`)
  if (courants.length) {
    l.push(`6. NUANCES DÉTAILLÉES (nuances_detail) : pour CHAQUE point de nuances_et_erreurs, un objet { "extrait_eleve": la phrase de la version FINALE concernée, recopiée MOT POUR MOT (sans balise), "passage": l'identifiant du passage clé de CETTE semaine qui tranche (ou null si aucun), "verdict": "confirme" (le texte confirme ce que dit l'élève) | "infirme" (le texte dit le contraire) | "precise" (le texte ajoute ce qui manque), "note": ≤ ${NOTE_NUANCE_MOTS} mots, la marche suivante, "priorite": 1, 2, 3… }. UNE SEULE nuance de priorité 1 : la plus utile à l'élève, qui désigne un passage.`)
    if (amont.length) l.push(`7. ARCHITECTURE EN PAIRES (architecture_amont_paires) : chaque lien de architecture_amont devient { "passage_courant": identifiant de CETTE semaine, "passage_amont": identifiant d'une semaine PRÉCÉDENTE, "relation": ≤ 12 mots (« reprend », « répond à », « contredit »…) }. Seulement des liens réels ; liste vide sinon.`)
  }
  if (synthese.length) {
    l.push(`${courants.length ? (amont.length ? 8 : 7) : 6}. COUVERTURE DE LA SYNTHÈSE (synthese_couverture) : pour CHAQUE phrase [y…] de la synthèse modèle, { "id": "y…", "etat": "present" (la version FINALE de l'élève le dit) | "partiel" (en partie, ou de travers) | "absent" (elle ne le dit pas) }.`)
  }
  l.push(`Ces objets s'ajoutent à la réponse JSON, sans rien retirer de ce qui est demandé plus haut.`)
  l.push('')
  return l.join('\n')
}

// ── Lecture tolérante des sorties ────────────────────────────────────────────

const txt = (x: unknown) => (typeof x === 'string' ? x.trim() : '')

export function lireNuances(x: unknown, idsCourants: ReadonlySet<string>): NuanceDetail[] {
  if (!Array.isArray(x)) return []
  const out: NuanceDetail[] = []
  for (const n of x as unknown[]) {
    if (!n || typeof n !== 'object') continue
    const o = n as Record<string, unknown>
    const extrait = txt(o.extrait_eleve)
    if (!extrait) continue
    const p = txt(o.passage)
    const verdict = o.verdict === 'infirme' || o.verdict === 'precise' ? o.verdict : 'confirme'
    const prio = Number(o.priorite)
    out.push({ extrait_eleve: extrait, passage: p && idsCourants.has(p) ? p : null, verdict, note: txt(o.note), priorite: Number.isFinite(prio) && prio >= 1 ? Math.round(prio) : 99 })
  }
  // Une seule priorité 1 : la première nuance qui désigne un passage, à défaut la première.
  out.sort((a, b) => a.priorite - b.priorite)
  const tete = out.findIndex(n => n.passage)
  if (tete > 0) { const [n] = out.splice(tete, 1); out.unshift(n) }
  out.forEach((n, i) => { n.priorite = i + 1 })
  return out
}

export function lirePaires(x: unknown, idsCourants: ReadonlySet<string>, idsAmont: ReadonlySet<string>): PaireAmont[] {
  if (!Array.isArray(x)) return []
  const vues = new Set<string>()
  const out: PaireAmont[] = []
  for (const n of x as unknown[]) {
    if (!n || typeof n !== 'object') continue
    const o = n as Record<string, unknown>
    const c = txt(o.passage_courant), a = txt(o.passage_amont)
    if (!idsCourants.has(c) || !idsAmont.has(a) || vues.has(`${c}>${a}`)) continue
    vues.add(`${c}>${a}`)
    out.push({ passage_courant: c, passage_amont: a, relation: txt(o.relation).split(/\s+/).slice(0, 14).join(' ') })
  }
  return out
}

export function lireCouverture(x: unknown, idsSynthese: readonly string[]): CouvertureSynthese[] {
  const parId = new Map<string, EtatCouverture>()
  if (Array.isArray(x)) for (const n of x as unknown[]) {
    if (!n || typeof n !== 'object') continue
    const o = n as Record<string, unknown>
    const id = txt(o.id)
    const etat = o.etat === 'partiel' || o.etat === 'absent' ? o.etat : o.etat === 'present' ? 'present' : null
    if (id && etat) parId.set(id, etat)
  }
  // Une phrase non jugée compte comme présente : on ne reproche jamais à l'élève ce qu'on n'a pas mesuré.
  return idsSynthese.map(id => ({ id, etat: parId.get(id) ?? 'present' }))
}

// ── La comparaison par surlignage (D8) ───────────────────────────────────────

/** Le surlignage de l'élève (phrases de la synthèse) contre la couverture jugée. */
export function comparerSynthese(couverture: readonly CouvertureSynthese[], selection: readonly string[]): Omit<ComparaisonSynthese, 'at'> {
  const sel = new Set(selection)
  const absentes = couverture.filter(c => c.etat === 'absent').map(c => c.id)
  const reperes = absentes.filter(id => sel.has(id))
  const manques = absentes.filter(id => !sel.has(id))
  const deja_la = couverture.filter(c => c.etat === 'present' && sel.has(c.id)).map(c => c.id)
  let message: string
  if (absentes.length === 0) message = sel.size === 0 ? 'Ta version disait déjà tout ce que dit cette synthèse.' : 'Ta version disait déjà tout cela — rien ne te manquait.'
  else if (manques.length === 0) message = reperes.length === 1 ? 'Tu as repéré ce qui manquait à ta version.' : `Tu as repéré les ${reperes.length} manques de ta version.`
  else if (reperes.length === 0) message = absentes.length === 1 ? 'Ce qui manquait à ta version t’a échappé : c’est la phrase mise en évidence.' : `Les ${absentes.length} manques de ta version t’ont échappé : ce sont les phrases mises en évidence.`
  else message = `Tu as repéré ${reperes.length} des ${absentes.length} manques ; ${manques.length === 1 ? 'celui-ci t’a échappé' : 'ceux-ci t’ont échappé'}.`
  if (deja_la.length) message += deja_la.length === 1 ? ' Celle que tu as surlignée en plus, tu l’avais déjà.' : ` Les ${deja_la.length} autres, tu les avais déjà.`
  return { surlignage: [...sel], reperes, manques, deja_la, message }
}

/** Mots de la nuance prioritaire (extrait exclu : il est de l'élève) + sa note. */
export function motsNuance(n: NuanceDetail | null | undefined): number {
  return n ? mots(n.note) : 0
}

/** Les propositions offertes pour choisir le passage amont : la bonne + jusqu'à trois autres, dans l'ordre du livre. */
export function optionsAmont(bonne: PassageAmontRef, tous: readonly PassageAmontRef[], graine: number): PassageAmontRef[] {
  const autres = tous.filter(p => p.id !== bonne.id)
  // Départ tiré de la graine, puis on prend à la suite (déterministe, pas de tri du modèle).
  const depart = autres.length ? Math.abs(graine) % autres.length : 0
  const pris = [...autres.slice(depart), ...autres.slice(0, depart)].slice(0, OPTIONS_AMONT - 1)
  return [...pris, bonne].sort((a, b) => a.semaine - b.semaine || a.id.localeCompare(b.id))
}
