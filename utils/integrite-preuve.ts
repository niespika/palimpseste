import 'server-only'
import { createAdminClient } from '@/utils/supabase/admin'
import type { ModuleIntegrite } from '@/utils/integrite'
import type { Preuve, PreuveExercice, ChronoVue, PoseVue } from '@/components/integrite/types'
import {
  cibleDansLeMateriau, bornesTolerees, lireLesPoses, PHRASE_SOUS_LE_MATERIAU,
  RATISSAGE_PART_MATERIAU, RATISSAGE_FOIS_LA_CIBLE,
} from '@/utils/deroule/designation'
import { baliser } from '@/utils/deroule/balisage'
import { partEnPourcent, nombreDeMots } from '@/utils/integrite-exercice'

export type { Preuve }

// ════════════════════════════════════════════════════════════════════════════
// Résolveur de PREUVE pour la page Intégrité. À partir de (module, rendu_ref)
// d'un signalement, charge la photo déposée (URLs signées), le texte saisi et un
// deep-link vers l'analyse du module. Best-effort : un rendu introuvable renvoie
// une Preuve vide (l'UI affiche « rendu indisponible » sans planter). Server-only,
// tout passe par le service_role (admin) — garde de rôle prof assurée par l'appelant.
//
// ⚠ Le format de rendu_ref DIFFÈRE par module (cf. appels signalerStrikeAuto /
// signalerEnAttenteIA) :
//   • fragments : `${inscriptionId}:${semaineId}` (deux UUID) → résoudre le dépôt
//   • aletheia / codex : `${travailId}` ou `${travailId}:vf` (suffixe optionnel)
//   • exercices  : `${depotId}` — UN SEUL UUID, ET C'EST LE DÉPÔT, jamais une
//     version (C6-L1). « Un dépôt porte deux versions ; un faisceau par version
//     et un faisceau par dépôt ne comptent pas la même chose » : le faisceau se
//     lit sur LE DÉPÔT, parce que le `delta_v1_vf` a besoin des DEUX versions
//     pour exister. Aucun suffixe, donc aucun split.
// On ne fait donc JAMAIS un split(':') global : le parsing est conditionné au module.
// ════════════════════════════════════════════════════════════════════════════

type Admin = ReturnType<typeof createAdminClient>

const PREUVE_VIDE: Preuve = {
  photos: [], texte: null, surligner: [], lienAnalyse: null,
  saisieClavier: false, contexte: null, meta: { priseAt: null, nbCaracteres: 0 },
  exercice: null,
}

// `slim` : ne calcule QUE le contexte (« semaine 24 · version finale »), sans signer
// les photos storage ni produire de deep-link prof — pour la page élève qui n'affiche
// que l'explication (évite d'exposer des URLs signées / routes prof dans son payload).
interface OptsPreuve { motif?: string | null; type?: string | null; slim?: boolean }

// Nombre de caractères « utiles » d'un texte (espaces normalisés).
const nbUtiles = (t: string | null): number => (t ? t.replace(/\s+/g, ' ').trim().length : 0)

// Extrait la 1ʳᵉ sous-chaîne entre guillemets français « … » du motif (heuristique
// — les motifs des détecteurs citent la phrase fautive entre guillemets).
function extraireDuMotif(motif: string | null | undefined): string[] {
  if (!motif) return []
  const m = motif.match(/«\s*(.+?)\s*»/)
  return m ? [m[1].trim()] : []
}

// Sous-chaînes à surligner. La PRÉSENCE dans le texte est testée toléramment AU
// RENDU (accent/apostrophe-insensible, cf. PanneauPreuve) — les motifs des strikes
// algo citent la phrase normalisée alors que le texte est brut. Ici on extrait juste
// la citation du motif ; à défaut, pour un rendu « vide » (motif sans citation), le
// texte court entier (ex. « azerty . »).
function surlignage(texte: string | null, opts?: OptsPreuve): string[] {
  const cit = extraireDuMotif(opts?.motif)
  if (cit.length > 0) return cit
  const net = texte?.trim() ?? ''
  if (opts?.type === 'vide' && net.length > 0 && net.length <= 40) return [net]
  return []
}

// Signe une liste de chemins storage (best-effort, séquentiel — peu de photos).
async function signerChemins(admin: Admin, bucket: string, chemins: string[]): Promise<string[]> {
  const urls: string[] = []
  for (const chemin of chemins) {
    const { data } = await admin.storage.from(bucket).createSignedUrl(chemin, 3600)
    if (data?.signedUrl) urls.push(data.signedUrl)
  }
  return urls
}

export async function chargerPreuve(
  admin: Admin, module: ModuleIntegrite, renduRef: string, opts?: OptsPreuve,
): Promise<Preuve> {
  try {
    if (module === 'fragments') return await preuveFragments(admin, renduRef, opts)
    if (module === 'aletheia') return await preuveAletheia(admin, renduRef, opts)
    if (module === 'codex') return await preuveCodex(admin, renduRef, opts)
    if (module === 'exercices') return await preuveExercices(admin, renduRef, opts)
    return PREUVE_VIDE
  } catch (e) {
    console.error('[integrite-preuve] chargerPreuve :', e)
    return PREUVE_VIDE
  }
}

// ── Fragments : rendu_ref = `${inscriptionId}:${semaineId}` ───────────────────
async function preuveFragments(admin: Admin, renduRef: string, opts?: OptsPreuve): Promise<Preuve> {
  const sep = renduRef.indexOf(':')
  if (sep < 0) return PREUVE_VIDE
  const inscriptionId = renduRef.slice(0, sep)
  const semaineId = renduRef.slice(sep + 1)

  const { data: depot } = await admin
    .from('fragments_depots')
    .select('id, commentaire_eleve, photo_prise_at, photos:fragments_photos(storage_path, ordre), semaine:fragments_semaines(numero)')
    .eq('inscription_id', inscriptionId)
    .eq('semaine_id', semaineId)
    .maybeSingle()
  if (!depot) return PREUVE_VIDE

  const semRel = depot.semaine as unknown as { numero: number } | { numero: number }[] | null
  const numero = Array.isArray(semRel) ? (semRel[0]?.numero ?? null) : (semRel?.numero ?? null)
  const contexte = numero != null ? `dépôt · semaine ${numero}` : 'dépôt'
  if (opts?.slim) return { ...PREUVE_VIDE, contexte }

  const photosRows = ((depot.photos as { storage_path: string; ordre: number }[] | null) ?? [])
    .slice().sort((a, b) => a.ordre - b.ordre)
  const photos = await signerChemins(admin, 'fragments', photosRows.map((p) => p.storage_path))

  // Le texte de la preuve = le commentaire de l'élève (source de l'heuristique d'aveu).
  // Repli sur l'OCR de l'analyse (transcription IA des photos) si le commentaire est vide.
  let texte = (depot.commentaire_eleve as string | null) ?? null
  if (!texte?.trim()) {
    const { data: analyse } = await admin
      .from('fragments_analyses').select('transcription').eq('depot_id', depot.id as string).maybeSingle()
    texte = (analyse?.transcription as string | null)?.trim() || texte
  }

  return {
    photos, texte, surligner: surlignage(texte, opts),
    lienAnalyse: `/prof/fragments-erudition/analyse/${depot.id}`,
    saisieClavier: false,
    contexte,
    meta: { priseAt: (depot.photo_prise_at as string | null) ?? null, nbCaracteres: nbUtiles(texte) },
  }
}

// ── Aletheia : rendu_ref = `${travailId}` ou `${travailId}:vf` ; PAS de photo ──
async function preuveAletheia(admin: Admin, renduRef: string, opts?: OptsPreuve): Promise<Preuve> {
  const isVF = renduRef.endsWith(':vf')
  const travailId = isVF ? renduRef.slice(0, -3) : renduRef

  const { data: t } = await admin
    .from('aletheia_travaux')
    .select('eleve_id, semaine_index, these, arguments, accord, questions, vocabulaire, these_vf, arguments_vf, accord_vf')
    .eq('id', travailId)
    .maybeSingle()
  if (!t) return { ...PREUVE_VIDE, saisieClavier: true }

  const sem = t.semaine_index as number | null
  const contexte = `${sem != null ? `semaine ${sem}` : 'travail'}${isVF ? ' · version finale' : ''}`
  if (opts?.slim) return { ...PREUVE_VIDE, saisieClavier: true, contexte }

  const champs: Array<[string, string | null | undefined]> = isVF
    ? [['Idée principale', t.these_vf as string], ['Arguments', t.arguments_vf as string], ['Ton accord', t.accord_vf as string]]
    : [
        ['Idée principale', t.these as string], ['Arguments', t.arguments as string], ['Ton accord', t.accord as string],
        ['Questions', ((t.questions as string[] | null) ?? []).join(' · ')],
        ['Vocabulaire', ((t.vocabulaire as string[] | null) ?? []).join(' · ')],
      ]
  const texte = champs
    .filter(([, v]) => v && v.trim())
    .map(([label, v]) => `${label} : ${v!.trim()}`)
    .join('\n') || null

  return {
    photos: [], texte, surligner: surlignage(texte, opts),
    lienAnalyse: `/prof/aletheia/eleve/${t.eleve_id}`,
    saisieClavier: true,
    contexte,
    meta: { priseAt: null, nbCaracteres: nbUtiles(texte) },
  }
}

// ── Codex : rendu_ref = `${travailId}` ou `${travailId}:vf` ; photos manuscrites + OCR ─
async function preuveCodex(admin: Admin, renduRef: string, opts?: OptsPreuve): Promise<Preuve> {
  const isVF = renduRef.endsWith(':vf')
  const travailId = isVF ? renduRef.slice(0, -3) : renduRef
  const contexte = isVF ? 'version finale' : 'version 1'
  // Le contexte Codex se déduit du suffixe : en mode slim, aucune requête nécessaire.
  if (opts?.slim) return { ...PREUVE_VIDE, contexte }

  const { data: t } = await admin
    .from('codex_travaux')
    .select('photos_v1, texte_v1_ocr, photos_vf, texte_vf_ocr')
    .eq('id', travailId)
    .maybeSingle()
  if (!t) return PREUVE_VIDE

  const chemins = ((isVF ? t.photos_vf : t.photos_v1) as string[] | null) ?? []
  const photos = await signerChemins(admin, 'codex', chemins)
  const texte = ((isVF ? t.texte_vf_ocr : t.texte_v1_ocr) as string | null) ?? null

  return {
    photos, texte, surligner: surlignage(texte, opts),
    lienAnalyse: isVF ? `/prof/codex/validation/${travailId}` : `/prof/codex/travail/${travailId}/v1`,
    saisieClavier: false,
    contexte,
    meta: { priseAt: null, nbCaracteres: nbUtiles(texte) },
  }
}

// ── Exercices : rendu_ref = `${depotId}` ; le FAISCEAU d'intégrité (C6-L1) ────
/**
 * ⭐ C6-L1 — LA QUATRIÈME BRANCHE. Le module `exercices` est entré dans le canal
 *    de signalement avec le faisceau : l'atelier d'intégrité montre désormais ses
 *    lignes, et sans cette branche il rendrait « rendu indisponible » sur un
 *    dépôt qui existe.
 *
 * ⛔⛔ CE QU'ELLE MONTRE, ET CE QU'ELLE NE MONTRERA JAMAIS. « N'expose jamais à un
 *    client ce que `exercices_squelettes` et `exercices_metacognition` portent :
 *    c'est la garde la plus facile à casser et la plus coûteuse — elle donne LA
 *    GRILLE ET LES RÉPONSES » (`07-` §1). Cette branche ne lit **que la
 *    production de l'élève** — son texte saisi, ou sa transcription —, exactement
 *    comme les trois autres. ⛔ Ni squelette, ni verdict, ni métacognition, ni
 *    retour.
 *
 * ⛔ ET AUCUN DEEP-LINK. Il n'existe pas d'écran professeur pour un dépôt fait à
 *    la maison, et c'est délibéré : « le professeur ne valide rien au fil de
 *    l'eau ; il voit ce que le routeur a assigné, EN LECTURE SEULE » (`07-`
 *    §1.2). `lienAnalyse` reste donc `null` — on n'invente pas une route.
 *
 * ⚠️ Le surlignage est celui des autres branches, et il ne mordra le plus souvent
 *    sur rien : le motif d'un faisceau ÉNUMÈRE DES SIGNAUX, il ne cite aucune
 *    phrase. C'est voulu — le faisceau n'accuse pas une phrase, il converge.
 */
/** Une relation embarquée arrive tantôt en objet, tantôt en tableau d'un : on prend l'un. */
function un<T>(rel: T | T[] | null | undefined): T | null {
  if (rel == null) return null
  return Array.isArray(rel) ? (rel[0] ?? null) : rel
}

interface ExerciceEmbarque {
  lieu?: string | null
  cran?: number | null
  consigne_instanciee?: unknown
  exercices_cas?: Array<{
    ordre: number
    exercices_materiaux: { contenu?: string | null; version_corrigee?: string | null }
      | Array<{ contenu?: string | null; version_corrigee?: string | null }> | null
  }> | null
}

async function preuveExercices(
  admin: Admin, renduRef: string, opts?: OptsPreuve,
): Promise<Preuve> {
  // ⛔ Aucun `split(':')` : `rendu_ref` est l'identifiant du dépôt, nu.
  const { data: d } = await admin
    .from('exercices_depots')
    // ⚠️ UNE SEULE CHAÎNE LITTÉRALE : supabase-js type la sélection en lisant le
    //    littéral ; une concaténation lui rend un `string` et tout devient une erreur.
    .select('id, texte_v1, transcription_v1, ouvert_at, v1_remis_at, vf_remis_at, duree_taguee, restitution_a_chaud, confiance_declaree, conditions_declarees, collages_bloques, exercices(lieu, cran, consigne_instanciee, exercices_cas(ordre, exercices_materiaux(contenu, version_corrigee)))')
    .eq('id', renduRef)
    .maybeSingle()
  if (!d) return { ...PREUVE_VIDE, saisieClavier: true }

  const ex = un(d.exercices as ExerciceEmbarque | ExerciceEmbarque[] | null)
  const lieu = ex?.lieu === 'classe' ? 'classe' : ex?.lieu === 'maison' ? 'maison' : null
  const cran = typeof ex?.cran === 'number' ? ex.cran : null
  const contexte = `exercice ${lieu === 'classe' ? 'en classe' : 'à la maison'}`
    + (cran !== null ? ` · cran ${cran}` : '')
    + (d.vf_remis_at ? ' · version finale rendue' : '')
  if (opts?.slim) return { ...PREUVE_VIDE, saisieClavier: true, contexte }

  // La production de l'élève : ce qu'il a saisi, ou ce que la transcription a lu.
  const texte = ((d.texte_v1 as string | null)?.trim()
    || (d.transcription_v1 as string | null)?.trim() || null)

  const exercice = ex ? await preuveDeLExercice(admin, d as Record<string, unknown>, ex, cran, lieu, opts) : null

  return {
    photos: [],
    texte,
    surligner: surlignage(texte, opts),
    lienAnalyse: null,
    saisieClavier: !!(d.texte_v1 as string | null)?.trim(),
    contexte,
    meta: { priseAt: (d.v1_remis_at as string | null) ?? null, nbCaracteres: nbUtiles(texte) },
    exercice,
  }
}

// ── ⭐ 01/09/2026 — L'EXERCICE TEL QUE L'ÉLÈVE L'A VU ─────────────────────────
//
// ⛔⛔ CE QUE ÇA RÉPARE. Le premier ratissage reçu en production disait « la
//    zone prend 100 % du texte, soit 103,3 fois le passage visé », et le
//    panneau montrait le texte saisi. Ni le matériau, ni le passage visé, ni la
//    zone, ni la consigne — tout existait en base, rien n'était chargé. Le
//    professeur ne pouvait pas séparer une triche d'une consigne mal comprise
//    ou d'un « tout sélectionner » de téléphone.
//
// ⚠️ ON RECONSTRUIT DEPUIS CE QUI A ÉTÉ SERVI, jamais depuis l'aperçu du
//    professeur : la consigne est la `consigne_instanciee` du cas, balisée
//    comme sur l'écran élève (`baliser`), et la phrase sous le matériau est
//    celle du module pur — un seul domicile.
//
// ⚠️ LA CIBLE ET SA MARGE SE DÉRIVENT ICI, CÔTÉ SERVEUR, ET VONT AU PROFESSEUR
//    SEUL. « La version_corrigee EST la réponse aux crans 7 et 9 » : elle ne
//    descend jamais à l'écran élève, et ce panneau est une page prof.

/** Le cas que le motif nomme (« au cas 2 »), ou le premier. */
function ordreDuCas(motif: string | null | undefined): number {
  const m = motif?.match(/au cas (\d+)/)
  return m ? Number(m[1]) : 1
}

const NIVEAU_LISIBLE: Record<string, string> = { elevee: 'élevée', moyenne: 'moyenne', faible: 'faible' }

function composerLaConfiance(brut: unknown): string | null {
  if (!brut || typeof brut !== 'object' || Array.isArray(brut)) return null
  const parts = Object.entries(brut as Record<string, unknown>)
    .filter(([, v]) => typeof v === 'string')
    .map(([k, v]) => `${k.replace(/_/g, ' ')} ${NIVEAU_LISIBLE[v as string] ?? (v as string).replace(/_/g, ' ')}`)
  return parts.length ? parts.join(' · ') : null
}

async function preuveDeLExercice(
  admin: Admin, d: Record<string, unknown>, ex: ExerciceEmbarque,
  cran: number | null, lieu: 'classe' | 'maison' | null, opts?: OptsPreuve,
): Promise<PreuveExercice> {
  const ordre = ordreDuCas(opts?.motif)
  const cas = Array.isArray(ex.exercices_cas) ? ex.exercices_cas : []
  const leCas = cas.find((c) => c.ordre === ordre) ?? cas[0] ?? null
  const mat = leCas ? un(leCas.exercices_materiaux) : null
  const materiau = mat?.contenu ?? null
  const cible = materiau ? cibleDansLeMateriau(materiau, mat?.version_corrigee) : null
  const toleree = materiau && cible ? bornesTolerees(materiau, cible) : null

  const { data: metacog } = await admin
    .from('exercices_metacognition').select('credence').eq('depot_id', d.id as string).maybeSingle()
  const entrees = Array.isArray(metacog?.credence)
    ? (metacog.credence as Array<Record<string, unknown>>) : []
  const entree = entrees.find((e) => e.cas === (leCas?.ordre ?? ordre)) ?? null
  const z = entree?.zone
  const zone = Array.isArray(z) && z.length === 2 && typeof z[0] === 'number' && typeof z[1] === 'number'
    ? ([z[0], z[1]] as [number, number]) : null
  const designationDonnee = !!entree && entree.zone_at !== undefined
  let poses: PoseVue[] = lireLesPoses(entree?.poses)
  // ⚠️ Journal antérieur au 01/09 : seule la dernière pose existe. On la montre
  //    comme telle, sans prétendre qu'elle fut la seule.
  if (poses.length === 0 && designationDonnee && typeof entree?.zone_at === 'string') {
    poses = [{ zone, at: entree.zone_at, confirmee: entree.zone_confirmee === true }]
  }

  const brute = ex.consigne_instanciee
  const consigneTexte = Array.isArray(brute)
    ? String(brute[(leCas?.ordre ?? 1) - 1] ?? brute[0] ?? '')
    : String(brute ?? '')

  const chrono: ChronoVue[] = []
  const ouvertAt = d.ouvert_at as string | null
  const v1At = d.v1_remis_at as string | null
  const vfAt = d.vf_remis_at as string | null
  if (ouvertAt) chrono.push({ quoi: 'Ouverture de l’exercice', at: ouvertAt })
  for (const p of poses) {
    chrono.push({
      quoi: p.zone
        ? (p.confirmee ? 'Zone posée, confirmée par l’élève' : 'Zone posée dans le matériau')
        : '« Rien à surligner » — réponse donnée',
      at: p.at,
    })
  }
  const cond = d.conditions_declarees as { at?: string; valeur?: string } | null
  if (cond?.at) {
    chrono.push({ quoi: `Conditions déclarées : « ${(cond.valeur ?? '').replace(/_/g, ' ')} »`, at: cond.at })
  }
  if (v1At) chrono.push({ quoi: 'Remise de la v1', at: v1At })
  if (vfAt) chrono.push({ quoi: 'Remise de la version finale', at: vfAt })
  chrono.sort((a, b) => Date.parse(a.at) - Date.parse(b.at))

  const large = zone ? zone[1] - zone[0] : null
  const cibleLarge = cible ? cible[1] - cible[0] : null
  const collages = d.collages_bloques
  const cond2 = cond?.valeur ?? null

  return {
    cran, lieu,
    consigne: baliser(consigneTexte),
    avertissement: PHRASE_SOUS_LE_MATERIAU,
    materiau,
    zone, zoneConfirmee: entree?.zone_confirmee === true, designationDonnee, poses,
    cible: cible ? [cible[0], cible[1]] : null,
    toleree: toleree ? [toleree[0], toleree[1]] : null,
    partMateriau: zone && materiau ? partEnPourcent(zone, materiau.length) : null,
    foisLaCible: large !== null && cibleLarge ? Math.round((10 * large) / cibleLarge) / 10 : null,
    motsCible: cible && materiau ? nombreDeMots(materiau, cible) : null,
    barre: { part: RATISSAGE_PART_MATERIAU, fois: RATISSAGE_FOIS_LA_CIBLE },
    credence: typeof entree?.pourcentage === 'number' ? entree.pourcentage : null,
    chrono,
    restitution: (d.restitution_a_chaud as string | null)?.trim() || null,
    confiance: composerLaConfiance(d.confiance_declaree),
    conditions: cond2 ? cond2.replace(/_/g, ' ') : null,
    collagesBloques: Array.isArray(collages) ? collages.length : 0,
    dureeTaguee: (d.duree_taguee as string | null) ?? null,
  }
}
