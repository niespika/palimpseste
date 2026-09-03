// ============================================================================
// LA COPIE ANNOTÉE — CE QUE LES SQUELETTES ET LE RETOUR DISENT DE LA COPIE,
// ramené à UNE forme : l'annotation.
// Module PUR. Aucun `server-only`, aucune base, aucune I/O, aucune horloge.
// ----------------------------------------------------------------------------
// Trois sources, rien n'est regénéré, rien n'est payé :
//   · le RETOUR (`exercices_retours.texte`) — les points, chacun ancré ;
//   · P1 (`exercices_squelettes.artefact_extraction`) — les observables DANS LES
//     MOTS DE L'ÉLÈVE, aux champs que chaque fiche déclare verbatim ;
//   · P2 (`exercices_squelettes.artefact_jugement`) — le verdict, test par test,
//     qui se RATTACHE à l'observable qu'il juge (« cette justification échoue au
//     test de distinction »).
//
// ⭐ LE PLACEMENT PASSE PAR `retrouverCitation`, LE CODE DE LA CHAÎNE. Ce que
//    le retour a réparé se retrouve ici ; ce qu'il a écarté ne se surligne pas.
//    Une citation introuvable va dans `nonRetrouvees` — JAMAIS « à côté »
//    (`utils/deroule/renvoi.ts` : « surligner à côté serait pire »).
//
// ⚠️ LES FORMES DE P1/P2 SONT CELLES LUES EN PRODUCTION LE 03/09 (281
//    squelettes). Chaque lecteur est TOLÉRANT : un champ absent ne casse rien,
//    et un filet générique (`citationsDeP1`) rattrape toute citation verbatim
//    qu'un lecteur spécifique n'aurait pas vue — pour qu'un instrument qui
//    change de forme dégrade l'écran, jamais ne le vide.
// ============================================================================

import type { Competence, PointRetour } from '../chaine/types'
import { COMPETENCES } from '../chaine/types'
import { citationsDeP1, estUnPlaceholder } from '../chaine/fidelite-p1'
import { retrouverCitation } from '../chaine/citation-approchee'
import { phrasesDeLaCopie } from '../chaine/branchements/expression'

export type Famille = Competence | 'retour'
export type Nature = 'reussite' | 'point_de_travail' | 'defaut' | 'observation'

export interface Verdict {
  /** Ce que le juge a fait — « échoue au test « distinction » », « rétrogradée ». */
  titre: string
  raison: string
}

export interface Annotation {
  id: string
  famille: Famille
  /** « E3 », « St2 », « R1 » — posé APRÈS le placement, dans l'ordre du texte. */
  numero: string
  titre: string
  /** Les mots de l'élève (ou du texte d'auteur, voir `source`). `null` : rien à surligner. */
  citation: string | null
  source: 'copie' | 'texte_support' | null
  /** Le texte du point, la note de P1, la raison. */
  detail: string | null
  /** Les champs REFORMULÉS que la fiche ne déclare pas verbatim — montrés, jamais surlignés. */
  champs: Array<{ nom: string; valeur: string }>
  verdicts: Verdict[]
  nature: Nature
  /** Vide quand la citation ne se retrouve pas — ou qu'il n'y en a pas. */
  intervalles: Array<[number, number]>
  methode: 'exact' | 'normalise' | 'approche' | null
}

export interface EnTeteCompetence {
  competence: Competence
  lettre: string | null
  confiance: string | null
  niveau: string | null
  profil: string | null
  grades: Array<{ nom: string; valeur: string }>
  cePlafonne: string | null
  levier: string | null
  justification: string | null
  /** P1 a été écrit, P2 refusé : le squelette existe sans jugement (17 sur 281 en prod). */
  sansJugement: boolean
}

export interface CompetenceAnnotee {
  competence: Competence
  enTete: EnTeteCompetence
  /** Placées, ou sans citation (une idée directrice « absente » est un observable). */
  annotations: Annotation[]
  /** Une citation existe, le code ne la retrouve pas dans la copie. */
  nonRetrouvees: Annotation[]
}

export interface RetourAnnote {
  moment: string
  publie: boolean
  edite: boolean
  annotations: Annotation[]
  nonRetrouvees: Annotation[]
  feedForward: string | null
}

export interface CopieAnnotee {
  competences: CompetenceAnnotee[]
  retour: RetourAnnote | null
  /** Toutes, pour l'écran : les couches à poser sur la copie. */
  toutes: Annotation[]
}

export const PREFIXE: Record<Famille, string> = {
  expression: 'E', argumentation: 'A', structure: 'St', connaissance: 'C',
  synthese: 'Sy', questionnement: 'Q', retour: 'R',
}

export const NOM_FAMILLE: Record<Famille, string> = {
  expression: 'Expression', argumentation: 'Argumentation', structure: 'Structure',
  connaissance: 'Connaissance', synthese: 'Synthèse', questionnement: 'Questionnement',
  retour: 'Retour de la machine',
}

/** Les étiquettes du catalogue d'Expression, en clair. Hors liste : le code, sans `_`. */
const ETIQUETTES_EXPRESSION: Record<string, string> = {
  mot_impropre: 'mot impropre', repetition_pauvre: 'répétition pauvre',
  mot_generique: 'mot générique', phrase_surchargee: 'phrase surchargée',
  periphrase_vague: 'périphrase vague', rupture_construction: 'rupture de construction',
  registre_oral: 'registre oral', savant_plaque: 'mot savant plaqué',
  referent_flou: 'référent flou', ouverture_monotone: 'ouverture monotone',
  accord_brouillant: 'accord brouillant', moule_repete: 'moule répété',
  formule: 'formule', mot_juste: 'mot juste', variation: 'variation',
}

function enClair(code: unknown): string {
  const c = str(code)
  return ETIQUETTES_EXPRESSION[c] ?? c.replace(/_/g, ' ')
}

// ── petites lectures tolérantes ─────────────────────────────────────────────

type Obj = Record<string, unknown>
const obj = (v: unknown): Obj => (v && typeof v === 'object' && !Array.isArray(v) ? v as Obj : {})
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
const str = (v: unknown): string => (typeof v === 'string' ? v : v == null ? '' : String(v))
/** Une citation UTILE : une chaîne non vide qui n'est pas un placeholder (`[absente]`, `aucune`). */
const cite = (v: unknown): string | null =>
  (typeof v === 'string' && !estUnPlaceholder(v) ? v : null)
const champ = (nom: string, v: unknown): Array<{ nom: string; valeur: string }> => {
  const s = Array.isArray(v) ? v.map(str).filter(Boolean).join(', ') : str(v)
  return s.trim() === '' || estUnPlaceholder(s) ? [] : [{ nom, valeur: s }]
}

interface Brouillon {
  titre: string
  citation: string | null
  source?: 'copie' | 'texte_support'
  detail?: string | null
  champs?: Array<{ nom: string; valeur: string }>
  verdicts?: Verdict[]
  nature?: Nature
  /** Clé de rattachement des verdicts de P2 (numéro d'unité, `entre` d'une jointure…). */
  cle?: string
}

// ── les six lecteurs ────────────────────────────────────────────────────────

function lireExpression(extraction: unknown, jugement: unknown, production: string): Brouillon[] {
  const p1 = obj(obj(extraction).p1)
  const p2 = obj(jugement)
  const out: Brouillon[] = []
  const phrases = phrasesDeLaCopie(production)

  for (const f of arr(p1.faits)) {
    const fo = obj(f)
    for (const c of arr(fo.citations)) {
      const co = obj(c)
      const citation = cite(co.citation)
      const phrase = typeof co.phrase === 'number' ? co.phrase : null
      out.push({
        titre: enClair(fo.type), citation, nature: 'defaut',
        cle: `fait:${str(fo.type)}:${phrase ?? ''}:${citation ?? ''}`,
        champs: phrase != null ? [{ nom: 'phrase', valeur: String(phrase) }] : [],
      })
    }
  }
  for (const r of arr(p1.reussites)) {
    const ro = obj(r)
    const citation = cite(ro.citation)
    const phrase = typeof ro.phrase === 'number' ? ro.phrase : null
    out.push({
      titre: `réussite · ${enClair(ro.type)}`, citation, nature: 'reussite',
      cle: `reussite:${str(ro.type)}:${phrase ?? ''}:${citation ?? ''}`,
      champs: phrase != null ? [{ nom: 'phrase', valeur: String(phrase) }] : [],
    })
  }
  // Les phrases désignées par leur NUMÉRO : on reprend la phrase elle-même,
  // avec la MÊME segmentation que P1 (`phrasesDeLaCopie`).
  const parNumero: Array<[string, string]> = [
    ['phrases_perdues', 'phrase perdue'], ['phrases_sans_attache', 'phrase sans attache'],
    ['phrases_a_reconstruire', 'phrase à reconstruire'],
  ]
  for (const [cleP1, titre] of parNumero) {
    for (const p of arr(p1[cleP1])) {
      const po = typeof p === 'number' ? { phrase: p } : obj(p)
      const num = typeof po.phrase === 'number' ? po.phrase : null
      const citation = cite(po.citation) ?? (num != null ? phrases.get(num) ?? null : null)
      out.push({
        titre, citation, nature: 'defaut', detail: str(po.raison ?? po.note) || null,
        champs: num != null ? [{ nom: 'phrase', valeur: String(num) }] : [],
      })
    }
  }
  // P2 — ce qu'il REJETTE se rattache au fait ou à la réussite jugés.
  for (const e of arr(p2.etiquettes_rejetees)) {
    const eo = obj(e)
    const cible = out.find((b) => b.cle === `fait:${str(eo.type)}:${typeof eo.phrase === 'number' ? eo.phrase : ''}:${cite(eo.citation) ?? ''}`)
      ?? out.find((b) => b.cle?.startsWith('fait:') && b.citation != null && b.citation === cite(eo.citation))
    const v: Verdict = { titre: 'étiquette rejetée par le juge', raison: str(eo.raison) }
    if (cible) (cible.verdicts ??= []).push(v)
    else out.push({ titre: `${enClair(eo.type)} · rejetée`, citation: cite(eo.citation), nature: 'observation', verdicts: [v] })
  }
  for (const r of arr(p2.reussites_rejetees)) {
    const ro = obj(r)
    const cible = out.find((b) => b.cle === `reussite:${str(ro.type)}:${typeof ro.phrase === 'number' ? ro.phrase : ''}:${cite(ro.citation) ?? ''}`)
      ?? out.find((b) => b.cle?.startsWith('reussite:') && b.citation != null && b.citation === cite(ro.citation))
    const v: Verdict = { titre: `réussite rejetée au test « ${enClair(ro.test) || '?'} »`, raison: str(ro.raison) }
    if (cible) { (cible.verdicts ??= []).push(v); cible.nature = 'observation' }
    else out.push({ titre: `réussite · ${enClair(ro.type)} · rejetée`, citation: cite(ro.citation), nature: 'observation', verdicts: [v] })
  }
  return out
}

function lireArgumentation(extraction: unknown, jugement: unknown): Brouillon[] {
  const p1 = obj(obj(extraction).p1)
  const p2 = obj(jugement)
  const out: Brouillon[] = []
  arr(p1.unites).forEach((u, i) => {
    const uo = obj(u)
    const garant = cite(uo.garant_cite)
    const liaison = cite(uo.liaison_citee)
    const statut = str(uo.statut_du_lien)
    out.push({
      titre: `unité ${i + 1}${statut ? ` · lien ${statut}` : ''}`,
      citation: garant ?? liaison,
      detail: str(uo.note) || null,
      nature: 'observation',
      cle: `unite:${i + 1}`,
      champs: [
        ...champ('thèse', uo.these),
        ...champ('preuve offerte', uo.preuve_offerte),
        ...(garant ? champ('liaison', liaison) : champ('garant', garant)),
      ],
    })
  })
  arr(p1.objections).forEach((o, i) => {
    const oo = obj(o)
    out.push({
      titre: `objection ${i + 1}`,
      citation: cite(oo.citation) ?? cite(oo.objection_citee) ?? cite(oo.cite),
      detail: str(oo.note) || null, nature: 'observation',
      champs: [...champ('réponse', oo.reponse), ...champ('statut', oo.statut)],
    })
  })
  for (const r of arr(obj(p2.crible).requalifications)) {
    const ro = obj(r)
    const cible = out.find((b) => b.cle === `unite:${str(ro.unite)}`)
    const v: Verdict = {
      titre: `échoue au test « ${enClair(ro.test) || '?'} »${ro.vers ? ` → ${str(ro.vers)}` : ''}`,
      raison: str(ro.raison),
    }
    if (cible) { (cible.verdicts ??= []).push(v); cible.nature = 'defaut' }
    else out.push({ titre: `unité ${str(ro.unite)} · requalifiée`, citation: null, nature: 'defaut', verdicts: [v], champs: champ('thèse', ro.these) })
  }
  return out
}

function lireStructure(extraction: unknown, jugement: unknown): Brouillon[] {
  const p1 = obj(obj(extraction).p1)
  const p2 = obj(jugement)
  const out: Brouillon[] = []
  for (const b of arr(p1.blocs)) {
    const bo = obj(b)
    out.push({
      titre: `${str(bo.num) || 'bloc'} · ${str(bo.role) || 'bloc'}`,
      citation: cite(bo.idee_directrice_citee),
      nature: 'observation',
      champs: [
        ...champ('objet', bo.objet),
        ...champ('position de l’idée', bo.position_idee),
        ...champ('correspondance à l’annonce', bo.correspondance_annonce),
        ...(cite(bo.idee_directrice_citee) ? [] : [{ nom: 'idée directrice', valeur: 'absente' }]),
      ],
    })
  }
  for (const j of arr(p1.jointures)) {
    const jo = obj(j)
    const texte = cite(jo.texte_cite)
    out.push({
      titre: `jointure ${str(jo.entre) || ''}`.trim(),
      citation: texte ?? cite(jo.debut_bloc_suivant),
      nature: 'observation',
      cle: `jointure:${str(jo.entre)}`,
      champs: [
        ...champ('relation nommée', jo.relation_nommee),
        ...champ('gestes', jo.gestes),
        ...champ('fin du bloc précédent', jo.fin_bloc_precedent),
        ...(texte ? champ('début du bloc suivant', jo.debut_bloc_suivant) : []),
      ],
    })
  }
  const promesse = obj(p1.promesse)
  if (Object.keys(promesse).length) {
    out.push({
      titre: 'annonce de plan',
      citation: cite(promesse.annonce_de_plan),
      nature: 'observation',
      champs: [
        ...champ('problème posé', promesse.probleme_pose),
        ...champ('thèse annoncée', promesse.these_annoncee),
        ...(cite(promesse.annonce_de_plan) ? [] : [{ nom: 'annonce', valeur: 'absente' }]),
      ],
    })
  }
  for (const r of arr(obj(p2.crible).retrogradations)) {
    const ro = obj(r)
    const cible = out.find((b) => b.cle === `jointure:${str(ro.entre)}`)
    const v: Verdict = { titre: 'jointure rétrogradée', raison: str(ro.raison) }
    if (cible) { (cible.verdicts ??= []).push(v); cible.nature = 'defaut' }
    else out.push({ titre: `jointure ${str(ro.entre)} · rétrogradée`, citation: null, nature: 'defaut', verdicts: [v] })
  }
  return out
}

function lireSynthese(extraction: unknown, jugement: unknown): Brouillon[] {
  const ex = obj(extraction)
  const p1a = obj(ex.p1a), p1b = obj(ex.p1b)
  const out: Brouillon[] = []
  const alignement = new Map<string, Obj>()
  for (const a of arr(p1b.alignement)) { const ao = obj(a); alignement.set(str(ao.u), ao) }
  for (const u of arr(p1a.unites)) {
    const uo = obj(u)
    const al = alignement.get(str(uo.u))
    out.push({
      titre: `unité ${str(uo.u)}`,
      citation: cite(uo.citation), nature: 'observation', cle: `u:${str(uo.u)}`,
      champs: [
        ...champ('segments du texte', uo.segments),
        ...(al ? champ('opération', `${str(al.operation)}${arr(al.correspond_a).length ? ` (↔ ${arr(al.correspond_a).map(str).join(', ')})` : ''}`) : []),
      ],
    })
  }
  if (cite(p1a.these_citee)) out.push({ titre: 'thèse citée', citation: cite(p1a.these_citee), nature: 'observation' })
  for (const a of arr(p1a.apports)) {
    const ao = obj(a)
    out.push({
      titre: 'apport · terme', citation: cite(ao.terme_cite), nature: 'observation',
      cle: `apport:${str(ao.terme_cite)}`,
      champs: [...champ('déploiement', ao.deploiement), ...champ('unités recouvertes', ao.unites_recouvertes)],
    })
    for (const d of arr(ao.deploiement)) {
      const s = cite(d)
      if (s && !estUnPlaceholder(s) && s.includes(' ')) out.push({ titre: 'apport · déploiement', citation: s, nature: 'observation' })
    }
  }
  for (const r of arr(p1a.rapports)) {
    const ro = obj(r)
    out.push({
      titre: `rapport${arr(ro.entre).length ? ` entre ${arr(ro.entre).map(str).join(' et ')}` : ''}${ro.nature ? ` · ${str(ro.nature)}` : ''}`,
      citation: cite(ro.citation), nature: 'observation',
    })
  }
  for (const c of arr(obj(jugement).crible)) {
    const co = obj(c)
    const cible = out.find((b) => b.cle === `apport:${str(co.terme_cite)}`)
    const v: Verdict = { titre: `verdict : ${str(co.verdict) || '?'}`, raison: str(co.raison) }
    if (cible) { (cible.verdicts ??= []).push(v); if (str(co.verdict) === 'decoratif') cible.nature = 'defaut' }
    else out.push({ titre: 'apport · jugé', citation: cite(co.terme_cite), nature: 'observation', verdicts: [v] })
  }
  return out
}

function lireQuestionnement(extraction: unknown, jugement: unknown): Brouillon[] {
  const p1 = obj(obj(extraction).p1)
  const out: Brouillon[] = []
  if (Object.keys(p1).length) {
    out.push({
      titre: 'question posée', citation: cite(p1.question_posee), nature: 'observation',
      champs: [
        ...champ('forme', p1.forme_question), ...champ('enjeu', p1.enjeu),
        ...champ('notions en tension', p1.notions_en_tension),
        ...champ('note', p1.note_enjeu), ...champ('note', p1.note_notions_en_tension),
      ],
    })
    out.push({
      titre: 'réponse concurrente', citation: cite(p1.reponse_concurrente_citee), nature: 'observation',
      champs: [...champ('réponses concurrentes', p1.reponses_concurrentes), ...champ('note', p1.note_reponses_concurrentes)],
    })
  }
  for (const r of arr(p1.recadrages)) {
    const ro = obj(r)
    out.push({
      titre: `recadrage${ro.type ? ` · ${str(ro.type).replace(/_/g, ' ')}` : ''}`,
      citation: cite(ro.cite), nature: 'defaut',
      champs: [...champ('reprise', ro.reprise), ...champ('déplacement', ro.deplacement)],
    })
  }
  rattacherGenerique(out, arr(obj(jugement).crible))
  return out
}

function lireConnaissance(extraction: unknown, jugement: unknown): Brouillon[] {
  const p1 = obj(obj(extraction).p1)
  const out: Brouillon[] = []
  arr(p1.unites_mobilisees).forEach((u, i) => {
    const uo = obj(u)
    const reste = Object.entries(uo).filter(([k]) => k !== 'citation')
    out.push({
      titre: `unité mobilisée ${i + 1}`, citation: cite(uo.citation), nature: 'observation',
      champs: reste.flatMap(([k, v]) => champ(k.replace(/_/g, ' '), v)),
    })
  })
  rattacherGenerique(out, arr(obj(jugement).crible))
  return out
}

/** Un crible de forme inconnue : on rattache par la citation, sinon on l'expose tel quel. */
function rattacherGenerique(out: Brouillon[], crible: unknown[]): void {
  for (const c of crible) {
    const co = obj(c)
    const citation = cite(co.cite) ?? cite(co.citation) ?? cite(co.terme_cite)
    const v: Verdict = {
      titre: str(co.test) ? `test « ${enClair(co.test)} »` : (str(co.verdict) ? `verdict : ${str(co.verdict)}` : 'crible'),
      raison: str(co.raison),
    }
    const cible = citation ? out.find((b) => b.citation === citation) : undefined
    if (cible) (cible.verdicts ??= []).push(v)
    else if (v.raison || citation) out.push({ titre: 'jugé au crible', citation, nature: 'observation', verdicts: [v] })
  }
}

const LECTEURS: Record<Competence, (e: unknown, j: unknown, production: string) => Brouillon[]> = {
  expression: lireExpression,
  argumentation: (e, j) => lireArgumentation(e, j),
  structure: (e, j) => lireStructure(e, j),
  synthese: (e, j) => lireSynthese(e, j),
  questionnement: (e, j) => lireQuestionnement(e, j),
  connaissance: (e, j) => lireConnaissance(e, j),
}

function enTete(competence: Competence, jugement: unknown, lettre: string | null): EnTeteCompetence {
  const p2 = obj(jugement)
  const grades = Object.entries(obj(p2.grades)).map(([nom, v]) => ({ nom, valeur: str(v) }))
  return {
    competence, lettre,
    confiance: str(p2.confiance) || null,
    niveau: str(p2.niveau) || null,
    profil: str(p2.profil) || null,
    grades,
    cePlafonne: str(p2.ce_qui_plafonne) || null,
    levier: str(p2.levier) || null,
    justification: str(p2.justification_ancree) || null,
    sansJugement: jugement == null || Object.keys(p2).length === 0,
  }
}

// ── le placement, et la numérotation ────────────────────────────────────────

/**
 * ⭐ UNE CITATION RÉPÉTÉE SE PLACE À SON OCCURRENCE SUIVANTE. « En effet » cité
 *    deux fois par l'ouverture monotone (deux phrases) se posait deux fois sur la
 *    première — vu sur le dépôt de décor du 03/09. On cherche d'abord APRÈS la
 *    dernière occurrence servie à la même citation ; à défaut, on reprend du
 *    début (P1 peut citer deux fois le même mot pour deux faits distincts).
 */
function placer(
  production: string, citation: string | null, source: 'copie' | 'texte_support' | null,
  deja: Map<string, number>,
): { intervalles: Array<[number, number]>; methode: Annotation['methode'] } {
  if (!citation || source === 'texte_support') return { intervalles: [], methode: null }
  const depuis = deja.get(citation) ?? 0
  let exact = production.indexOf(citation, depuis)
  if (exact < 0 && depuis > 0) exact = production.indexOf(citation)
  if (exact >= 0) {
    deja.set(citation, exact + citation.length)
    return { intervalles: [[exact, exact + citation.length]], methode: 'exact' }
  }
  const r = retrouverCitation(production, citation)
  if ('echec' in r) return { intervalles: [], methode: null }
  return { intervalles: r.intervalles.filter(([d, f]) => f > d), methode: r.methode }
}

function finaliser(famille: Famille, brouillons: Brouillon[], production: string)
  : { placees: Annotation[]; nonRetrouvees: Annotation[] } {
  const deja = new Map<string, number>()
  const toutes = brouillons.map((b, i): Annotation => {
    const source = b.source ?? (b.citation ? 'copie' : null)
    const { intervalles, methode } = placer(production, b.citation, source, deja)
    return {
      id: `${famille}:${i}`, famille, numero: '', titre: b.titre,
      citation: b.citation, source, detail: b.detail ?? null,
      champs: b.champs ?? [], verdicts: b.verdicts ?? [], nature: b.nature ?? 'observation',
      intervalles, methode,
    }
  })
  // Dans l'ordre du texte : les placées d'abord, puis celles sans citation, puis
  // les introuvables — chacune numérotée, pour que la carte se nomme.
  const rang = (a: Annotation) => (a.intervalles.length ? a.intervalles[0]![0] : Number.MAX_SAFE_INTEGER)
  const placees = toutes.filter((a) => a.intervalles.length || !a.citation || a.source === 'texte_support')
    .sort((a, b) => rang(a) - rang(b))
  const nonRetrouvees = toutes.filter((a) => a.citation && !a.intervalles.length && a.source !== 'texte_support')
  let n = 0
  for (const a of [...placees, ...nonRetrouvees]) a.numero = `${PREFIXE[famille]}${++n}`
  return { placees, nonRetrouvees }
}

export interface SqueletteLu {
  competence: string
  extraction: unknown
  jugement: unknown
}

export interface EntreeAnnotation {
  /** La copie telle que la chaîne l'a lue (`production()` de `utils/chaine/contexte.ts`). */
  production: string
  squelettes: SqueletteLu[]
  /** Les lettres mesurées, par compétence (`competences_mesures.lettre_equivalente`). */
  lettres: Partial<Record<Competence, string | null>>
  retour: {
    moment: string
    points: PointRetour[]
    publie: boolean
    edite: boolean
    feedForward: string | null
  } | null
}

export function annoterLaCopie(e: EntreeAnnotation): CopieAnnotee {
  const competences: CompetenceAnnotee[] = []
  for (const s of e.squelettes) {
    if (!(COMPETENCES as readonly string[]).includes(s.competence)) continue
    const competence = s.competence as Competence
    const brouillons = LECTEURS[competence](s.extraction, s.jugement, e.production)
    // ⭐ LE FILET : toute citation verbatim que le lecteur n'a pas reprise.
    const vues = new Set(brouillons.map((b) => b.citation).filter(Boolean))
    for (const c of citationsDeP1(competence, s.extraction)) {
      if (vues.has(c.citation)) continue
      vues.add(c.citation)
      brouillons.push({ titre: c.ou.replace(/^p1[ab]?\./, '').replace(/_/g, ' '), citation: c.citation, nature: 'observation' })
    }
    const { placees, nonRetrouvees } = finaliser(competence, brouillons, e.production)
    competences.push({
      competence,
      enTete: enTete(competence, s.jugement, e.lettres[competence] ?? null),
      annotations: placees, nonRetrouvees,
    })
  }
  competences.sort((a, b) => COMPETENCES.indexOf(a.competence) - COMPETENCES.indexOf(b.competence))

  let retour: RetourAnnote | null = null
  if (e.retour) {
    const brouillons: Brouillon[] = e.retour.points.map((p) => ({
      titre: `${p.competence === 'monitoring' ? 'Monitoring' : NOM_FAMILLE[p.competence] ?? p.competence} · ${p.nature === 'reussite' ? 'réussite' : 'à travailler'}`,
      citation: p.ancrage?.citation ?? null,
      source: p.ancrage?.source,
      detail: p.texte,
      nature: p.nature,
    }))
    const { placees, nonRetrouvees } = finaliser('retour', brouillons, e.production)
    retour = {
      moment: e.retour.moment, publie: e.retour.publie, edite: e.retour.edite,
      annotations: placees, nonRetrouvees, feedForward: e.retour.feedForward,
    }
  }

  const toutes = [
    ...competences.flatMap((c) => [...c.annotations, ...c.nonRetrouvees]),
    ...(retour ? [...retour.annotations, ...retour.nonRetrouvees] : []),
  ]
  return { competences, retour, toutes }
}
