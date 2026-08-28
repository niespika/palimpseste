import 'server-only'
import { createAdminClient } from '@/utils/supabase/admin'
import type { ModuleIntegrite } from '@/utils/integrite'
import type { Preuve } from '@/components/integrite/types'

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
async function preuveExercices(
  admin: Admin, renduRef: string, opts?: OptsPreuve,
): Promise<Preuve> {
  // ⛔ Aucun `split(':')` : `rendu_ref` est l'identifiant du dépôt, nu.
  const { data: d } = await admin
    .from('exercices_depots')
    .select('id, texte_v1, transcription_v1, v1_remis_at, vf_remis_at, exercices(lieu)')
    .eq('id', renduRef)
    .maybeSingle()
  if (!d) return { ...PREUVE_VIDE, saisieClavier: true }

  const rel = d.exercices as { lieu?: string | null } | Array<{ lieu?: string | null }> | null
  const lieu = (Array.isArray(rel) ? rel[0]?.lieu : rel?.lieu) ?? null
  const contexte = `exercice ${lieu === 'classe' ? 'en classe' : 'à la maison'}`
    + (d.vf_remis_at ? ' · version finale rendue' : '')
  if (opts?.slim) return { ...PREUVE_VIDE, saisieClavier: true, contexte }

  // La production de l'élève : ce qu'il a saisi, ou ce que la transcription a lu.
  const texte = ((d.texte_v1 as string | null)?.trim()
    || (d.transcription_v1 as string | null)?.trim() || null)

  return {
    photos: [],
    texte,
    surligner: surlignage(texte, opts),
    lienAnalyse: null,
    saisieClavier: !!(d.texte_v1 as string | null)?.trim(),
    contexte,
    meta: { priseAt: (d.v1_remis_at as string | null) ?? null, nbCaracteres: nbUtiles(texte) },
  }
}
