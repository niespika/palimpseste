'use server'

import { after } from 'next/server'
import { revalidatePath } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { PROMPT_CAPSTONE_DEFAUT, PROMPT_REFERENCE_DEFAUT } from '@/utils/aletheia-retours'
import type { Capstone, ReferenceChapitre } from '@/app/eleve/modules/aletheia/types'
import { reassemblerLivre, type Signet } from './decoupe-utils'
import {
  validerPlages, decouperPlages, reporterVus, vuVersContenu,
  type PlageSection, type AncienElementVu,
} from '@/utils/scriptorium-sections'
import { resoudreFrisePourDate } from './parcours/frise-serveur'
import { decalerDepuis, type Decalages } from '@/utils/frise-enseignement'
import {
  partagerCopies, reassignerPositions, suitLOrdreDuModele, memeCible, type CopieDeModele,
} from '@/utils/parcours-propagation'
import { lireGatePlanActif } from '@/utils/plan-exercices'
import {
  hookSyntheseAjoutCreneau, hookSyntheseAssignClasse, hookSyntheseRetraitCreneau,
  hookSyntheseRetraitClasse, hookSyntheseSuppressionParcours,
  ouvrirSyntheseCours, couperSyntheseCours,
} from '@/utils/plan-synthese-hooks'
import { lireReglagesRag } from '@/utils/scriptorium-rag'
import {
  CLES_EDITABLES, MAX_CARACTERES_SECTION, normaliserSection,
  type CleSectionEditable, type OverridesPromptTuteur,
} from '@/utils/scriptorium-prompt-tuteur'
import { genererSyntheseClasse, lundiSemaineEcoulee } from '@/utils/scriptorium-synthese-rag'
import { jourDansFuseau } from '@/utils/fuseau'
import { cleDAppariement } from '@/utils/fabrique/notions'
import { lireFuseau } from '@/utils/fuseau-serveur'
import { normaliserRetours } from '@/utils/passation/transcription-calcul'

// ── Import PDF « découpé en semaines » : seuils & garde-fous (SPEC) ──────────
const IMPORT_MAX_PAGES = 600      // refus au-delà (décision produit)
const IMPORT_SEUIL_SCAN = 0.7     // > 70 % de pages quasi vides ⇒ PDF probablement scanné
const IMPORT_SEUIL_CHARS = 3      // page « vide » si < 3 caractères utiles
const IMPORT_TTL_MS = 24 * 60 * 60 * 1000  // purge des imports orphelins (sessions abandonnées)
const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function verifierProf() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'prof') throw new Error('Accès refusé')
  return { supabase, userId: user.id }
}

// ── Unités (conteneurs, créées à la volée) ──────────────────────────────────

export async function creerUnite(label: string): Promise<{ id?: string; error?: string }> {
  const { supabase } = await verifierProf()
  const { data: derniere } = await supabase
    .from('scriptorium_unites')
    .select('ordre')
    .order('ordre', { ascending: false })
    .limit(1)
    .maybeSingle()
  const ordre = (derniere?.ordre ?? 0) + 1

  const { data, error } = await supabase
    .from('scriptorium_unites')
    .insert({ label: label || `Unité ${ordre}`, ordre })
    .select('id')
    .single()
  if (error) return { error: error.message }
  revalidatePath('/prof/scriptorium')
  return { id: data.id }
}

// ── Extraction de texte (PDF / DOCX / TXT) ──────────────────────────────────

async function extraireTexte(buffer: Buffer, mimeType: string, nomFichier: string): Promise<string | null> {
  const ext = nomFichier.split('.').pop()?.toLowerCase()

  if (mimeType === 'application/pdf' || ext === 'pdf') {
    try {
      const { extractText } = await import('unpdf')
      const { text } = await extractText(new Uint8Array(buffer))
      return (Array.isArray(text) ? text.join('\n') : text).trim() || null
    } catch (err) {
      console.error('[scriptorium] PDF extraction error:', err)
      return null
    }
  }

  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    ext === 'docx'
  ) {
    try {
      const mammoth = await import('mammoth')
      const result = await mammoth.extractRawText({ buffer })
      return result.value.trim() || null
    } catch {
      return null
    }
  }

  if (mimeType === 'text/plain' || ext === 'txt') {
    return buffer.toString('utf-8').trim() || null
  }

  return null
}

function estImage(mimeType: string, nom: string): boolean {
  const ext = nom.split('.').pop()?.toLowerCase()
  return mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif'].includes(ext ?? '')
}

async function uploaderBuffer(
  userId: string, documentId: string, buffer: Buffer, ext: string, contentType: string,
): Promise<{ path?: string; error?: string }> {
  const admin = createAdminClient()
  const storagePath = `${userId}/${documentId}/${Date.now()}.${ext}`
  const { error } = await admin.storage.from('scriptorium').upload(storagePath, buffer, {
    contentType: contentType || 'application/octet-stream',
    upsert: false,
  })
  if (error) return { error: error.message }
  return { path: storagePath }
}

async function uploaderFichier(userId: string, documentId: string, fichier: File): Promise<{ path?: string; error?: string }> {
  const ext = fichier.name.split('.').pop()?.toLowerCase() || 'bin'
  const buffer = Buffer.from(await fichier.arrayBuffer())
  return uploaderBuffer(userId, documentId, buffer, ext, fichier.type)
}

// ── Contenu (item multi-classes : unité + semaine + corps) ──────────────────

export async function ajouterContenu(formData: FormData) {
  const { supabase, userId } = await verifierProf()

  let uniteId = (formData.get('uniteId') as string) || ''
  const nouvelleUnite = (formData.get('nouvelleUnite') as string)?.trim() || ''
  const semaineRaw = formData.get('semaine') as string
  const semaine = semaineRaw ? Number(semaineRaw) : null
  const nom = (formData.get('nom') as string)?.trim()
  let texte = (formData.get('texte') as string)?.trim() || null
  const legende = (formData.get('legende') as string)?.trim() || null
  // cours (leçon) ou texte (texte d'étude — source pour Quazian), au sein d'une unité.
  const objetType = (formData.get('objetType') as string) === 'texte' ? 'texte' : 'cours'
  const classeIds = formData.getAll('classeIds').map(c => c as string).filter(Boolean)
  const fichier = formData.get('fichier') as File | null

  if (!nom) return { error: 'Donne un nom au contenu.' }
  if (classeIds.length === 0) return { error: 'Assigne au moins une classe.' }

  // Unité : existante ou créée à la volée.
  if (!uniteId && nouvelleUnite) {
    const res = await creerUnite(nouvelleUnite)
    if (res.error || !res.id) return { error: res.error ?? 'Création d\'unité impossible' }
    uniteId = res.id
  }
  if (!uniteId) return { error: 'Choisis ou crée une unité.' }

  // Fichier optionnel : image → pièce jointe ; document texte → extraction.
  let fichierImage: File | null = null
  if (fichier && fichier.size > 0) {
    if (estImage(fichier.type, fichier.name)) {
      fichierImage = fichier
    } else {
      const buffer = Buffer.from(await fichier.arrayBuffer())
      const extrait = await extraireTexte(buffer, fichier.type, fichier.name)
      if (extrait) texte = [texte, extrait].filter(Boolean).join('\n\n')
    }
  }

  const { data: doc, error } = await supabase
    .from('scriptorium_documents')
    .insert({
      unite_id: uniteId,
      type: objetType,
      titre: nom,
      texte_extrait: texte,
      legende,
      semaine,
      created_by: userId,
    })
    .select('id')
    .single()
  if (error || !doc) return { error: error?.message ?? 'Erreur' }

  // Assignation multi-classes.
  const { error: errClasses } = await supabase
    .from('scriptorium_document_classes')
    .insert(classeIds.map(classe_id => ({ document_id: doc.id, classe_id })))
  if (errClasses) return { error: errClasses.message }

  // Image jointe le cas échéant.
  if (fichierImage) {
    const up = await uploaderFichier(userId, doc.id, fichierImage)
    if (up.path) {
      await supabase.from('scriptorium_contenu_images').insert({ document_id: doc.id, fichier_ref: up.path, legende })
    }
  }

  revalidatePath('/prof/scriptorium')
  return { success: true }
}

// ── Import PDF « découpé en semaines » (SPEC) ────────────────────────────────
// L'upload du PDF passe par URL signée DIRECTE → Supabase : une server action ne
// peut pas recevoir > 4,5 Mo (limite Vercel, tous plans). Le texte est extrait UNE
// fois (page par page), stocké transitoirement dans scriptorium_imports, puis purgé
// à la création du livre. Le PDF lui-même n'est jamais conservé (texte seul).

// Extraction PAGE PAR PAGE : index i = texte de la page i+1 (null si illisible).
// Contrairement à extraireTexte (un seul bloc), on garde la frontière des pages.
async function extrairePagesPdf(buffer: Buffer): Promise<string[] | null> {
  try {
    const { extractText } = await import('unpdf')
    const { text } = await extractText(new Uint8Array(buffer), { mergePages: false })
    return Array.isArray(text) ? text : [text]
  } catch (err) {
    console.error('[scriptorium] extraction PDF page par page :', err)
    return null
  }
}

// Texte d'une borne à la LIGNE près : de (dp,dl) à (fp,fl), 1-based, ligne de fin
// INCLUSE. Les lignes suivent les retours du texte extrait (split '\n'), identiques
// côté client (qui choisit les bornes) et serveur (qui coupe) → mêmes index.
function texteEntreBornes(pages: string[], dp: number, dl: number, fp: number, fl: number): string {
  const morceaux: string[] = []
  for (let p = dp; p <= fp; p++) {
    const lignes = (pages[p - 1] ?? '').split('\n')
    const debut = p === dp ? dl - 1 : 0
    const fin = p === fp ? fl : lignes.length
    morceaux.push(lignes.slice(debut, fin).join('\n'))
  }
  // Filtre les morceaux vides (page intermédiaire blanche) → pas de ligne blanche parasite.
  return morceaux.filter(m => m.length > 0).join('\n')
}

// Signets / table des matières du PDF (métadonnée). Renvoie [{titre, page, niveau}]
// ou null si absent/illisible. Best-effort : toute erreur → null (jamais bloquant).
interface SignetItem { title?: string; dest?: string | unknown[] | null; items?: SignetItem[] }
async function extraireSignets(buffer: Buffer): Promise<{ titre: string; page: number; niveau: number }[] | null> {
  try {
    const { getDocumentProxy } = await import('unpdf')
    const pdf = await getDocumentProxy(new Uint8Array(buffer))
    const outline = (await pdf.getOutline()) as SignetItem[] | null
    if (!outline || outline.length === 0) return null
    const out: { titre: string; page: number; niveau: number }[] = []
    const resoudrePage = async (dest: SignetItem['dest']): Promise<number> => {
      try {
        let ref: unknown = Array.isArray(dest) ? dest[0] : null
        if (typeof dest === 'string') { const d = await pdf.getDestination(dest); ref = Array.isArray(d) ? d[0] : null }
        if (ref == null) return 0
        return (await pdf.getPageIndex(ref as Parameters<typeof pdf.getPageIndex>[0])) + 1
      } catch { return 0 }
    }
    const parcourir = async (items: SignetItem[], niveau: number): Promise<void> => {
      for (const it of items) {
        if (it.title) out.push({ titre: String(it.title).slice(0, 300), page: await resoudrePage(it.dest), niveau })
        if (Array.isArray(it.items) && it.items.length) await parcourir(it.items, niveau + 1)
      }
    }
    await parcourir(outline, 0)
    return out.length ? out : null
  } catch (err) {
    console.error('[scriptorium] extraction signets :', err)
    return null
  }
}

// Purge best-effort des imports > 24 h de ce prof (onglet fermé en cours de route).
async function purgerImportsOrphelins(admin: Admin, userId: string): Promise<void> {
  try {
    const seuil = new Date(Date.now() - IMPORT_TTL_MS).toISOString()
    await admin.from('scriptorium_imports').delete().eq('user_id', userId).lt('created_at', seuil)
    const { data: objets } = await admin.storage.from('scriptorium').list(`imports/${userId}`, { limit: 1000 })
    const vieux = (objets ?? [])
      .filter(o => typeof o.created_at === 'string' && o.created_at < seuil)
      .map(o => `imports/${userId}/${o.name}`)
    if (vieux.length > 0) await admin.storage.from('scriptorium').remove(vieux)
  } catch (err) {
    console.error('[scriptorium] purge imports orphelins :', err)
  }
}

// 1) Préparer l'URL signée pour que le navigateur dépose le PDF directement.
export async function creerUploadImportPdf(): Promise<{ importId?: string; path?: string; token?: string; error?: string }> {
  const { userId } = await verifierProf()
  const admin = createAdminClient()
  const importId = crypto.randomUUID()
  const path = `imports/${userId}/${importId}.pdf`
  const { data, error } = await admin.storage.from('scriptorium').createSignedUploadUrl(path)
  if (error || !data) return { error: error?.message ?? 'Impossible de préparer le dépôt du PDF.' }
  return { importId, path: data.path, token: data.token }
}

// 2) Analyser le PDF déposé : compte de pages, détection scan, extraction UNE fois
// (persistée). Le chemin est reconstruit côté serveur (jamais fourni par le client).
export async function analyserPdfImport(importId: string): Promise<{
  totalPages?: number; scanne?: boolean; pagesVides?: number; pagesVidesPct?: number; tropLong?: boolean; error?: string
}> {
  const { userId } = await verifierProf()
  if (!RE_UUID.test(importId)) return { error: "Identifiant d'import invalide." }
  const admin = createAdminClient()
  const path = `imports/${userId}/${importId}.pdf`

  const { data: blob, error: errDl } = await admin.storage.from('scriptorium').download(path)
  if (errDl || !blob) return { error: 'PDF introuvable (le dépôt a peut-être échoué). Réessaie.' }

  const buffer = Buffer.from(await blob.arrayBuffer())
  const pages = await extrairePagesPdf(buffer)
  if (!pages || pages.length === 0) return { error: 'PDF illisible : aucune page exploitable.' }
  const signets = await extraireSignets(buffer)   // métadonnée parquée (table des matières du PDF)

  const totalPages = pages.length
  const pagesVides = pages.filter(p => (p ?? '').trim().length < IMPORT_SEUIL_CHARS).length
  const pagesVidesPct = pagesVides / totalPages

  const { error: errUp } = await admin.from('scriptorium_imports').upsert(
    { import_id: importId, user_id: userId, total_pages: totalPages, pages, signets, created_at: new Date().toISOString() },
    { onConflict: 'import_id' },
  )
  if (errUp) return { error: errUp.message }

  after(() => purgerImportsOrphelins(admin, userId))
  return { totalPages, scanne: pagesVidesPct > IMPORT_SEUIL_SCAN, pagesVides, pagesVidesPct, tropLong: totalPages > IMPORT_MAX_PAGES }
}

// 3) Charger le texte du PDF page par page (pour le navigateur de découpe). Envoyé
// UNE fois au prof ; le repérage des bornes se fait ensuite côté client, sans
// aller-retour. Les lignes (split '\n') sont identiques côté client et serveur.
export async function chargerPagesImport(importId: string): Promise<{ pages?: string[]; signets?: Signet[] | null; error?: string }> {
  const { userId } = await verifierProf()
  if (!RE_UUID.test(importId)) return { error: 'Import invalide.' }
  const admin = createAdminClient()
  const { data: row } = await admin
    .from('scriptorium_imports')
    .select('pages, signets').eq('import_id', importId).eq('user_id', userId).maybeSingle()
  const pages = (row?.pages as string[] | undefined) ?? null
  if (!pages || pages.length === 0) return { error: 'Import expiré — re-dépose le PDF.' }
  // Signets (table des matières du PDF) : métadonnée utilisée par le navigateur pour
  // styler les titres. Best-effort — absente sur les PDF sans signets.
  return { pages, signets: (row?.signets as Signet[] | undefined) ?? null }
}

// 4) Abandonner un import (changement de mode, fermeture, après création).
export async function supprimerImportPdf(importId: string): Promise<{ success?: boolean }> {
  const { userId } = await verifierProf()
  if (!RE_UUID.test(importId)) return { success: true }
  const admin = createAdminClient()
  await admin.storage.from('scriptorium').remove([`imports/${userId}/${importId}.pdf`])
  await admin.from('scriptorium_imports').delete().eq('import_id', importId).eq('user_id', userId)
  return { success: true }
}

// ── Livre (Aletheia Lot 1) ──────────────────────────────────────────────────
// Un livre = une unité `type='livre'` (label = titre, + date_debut, nb_semaines).
// Chaque semaine = un document de cette unité : titre, chapitres, index `semaine`
// et un texte d'ancrage IA. Deux modes de saisie de ce texte :
//   • 'par_semaine' (historique) : un fichier PDF/DOCX/TXT par semaine, extrait
//     puis STOCKÉ dans le bucket Scriptorium (fichier_ref) — jamais exposé élève ;
//   • 'pdf_decoupe' (SPEC) : un seul PDF déposé en amont (scriptorium_imports), que
//     l'on découpe par bornes page+ligne → texte seul (fichier_ref reste null).
// Classes assignées AU NIVEAU DU LIVRE (scriptorium_unite_classes, Lot 2).
export async function ajouterLivre(formData: FormData) {
  const { supabase, userId } = await verifierProf()

  const titre = (formData.get('titre') as string)?.trim()
  const nbSemaines = Number(formData.get('nbSemaines') as string)
  const dateDebut = (formData.get('dateDebut') as string) || null
  const classeIds = formData.getAll('classeIds').map(c => c as string).filter(Boolean)
  const auteur = (formData.get('auteur') as string)?.trim() || null

  if (!titre) return { error: 'Donne un titre au livre.' }
  if (!Number.isInteger(nbSemaines) || nbSemaines < 1 || nbSemaines > 52)
    return { error: 'Indique un nombre de semaines valide (1–52).' }
  if (!dateDebut) return { error: 'Indique une date de début.' }
  if (classeIds.length === 0) return { error: 'Assigne au moins une classe.' }
  const mode = (formData.get('mode') as string) === 'pdf_decoupe' ? 'pdf_decoupe' : 'par_semaine'

  // Le livre est une unité, placée après les unités existantes.
  const { data: derniere } = await supabase
    .from('scriptorium_unites')
    .select('ordre')
    .order('ordre', { ascending: false })
    .limit(1)
    .maybeSingle()
  const ordre = (derniere?.ordre ?? 0) + 1

  const { data: livre, error: errLivre } = await supabase
    .from('scriptorium_unites')
    .insert({ label: titre, ordre, type: 'livre', date_debut: dateDebut, nb_semaines: nbSemaines, auteur })
    .select('id')
    .single()
  if (errLivre || !livre) return { error: errLivre?.message ?? 'Création du livre impossible.' }

  // Création quasi-atomique : pas de transaction multi-tables côté Supabase REST,
  // donc on nettoie nous-mêmes si une étape échoue → pas de livre orphelin. On
  // supprime les documents AVANT l'unité (sans dépendre d'un cascade unite_id non
  // garanti) ; supprimer un document cascade vers ses classes et images (Lot 6).
  const cheminsUploades: string[] = []
  const semainesSansTexte: number[] = []
  let importIdAClean: string | null = null
  const admin = createAdminClient()
  // L'import PDF transitoire est nettoyé dans TOUS les cas (succès comme rollback).
  const nettoyerImport = async () => {
    if (!importIdAClean) return
    await admin.storage.from('scriptorium').remove([`imports/${userId}/${importIdAClean}.pdf`])
    await admin.from('scriptorium_imports').delete().eq('import_id', importIdAClean).eq('user_id', userId)
  }
  const annuler = async (msg: string) => {
    if (cheminsUploades.length > 0) await admin.storage.from('scriptorium').remove(cheminsUploades)
    await supabase.from('scriptorium_documents').delete().eq('unite_id', livre.id)
    await supabase.from('scriptorium_unites').delete().eq('id', livre.id)
    await nettoyerImport()
    return { error: msg }
  }

  // Mode 'pdf_decoupe' : on charge le texte (page par page) déposé transitoirement
  // dans scriptorium_imports, et on découpe par plages. Le PDF n'est pas conservé.
  let pagesImport: string[] | null = null
  if (mode === 'pdf_decoupe') {
    const importId = (formData.get('importId') as string) || ''
    if (!RE_UUID.test(importId)) return annuler('Import PDF manquant ou invalide — re-dépose le PDF.')
    importIdAClean = importId
    const { data: row } = await admin
      .from('scriptorium_imports')
      .select('pages, signets').eq('import_id', importId).eq('user_id', userId).maybeSingle()
    pagesImport = (row?.pages as string[] | undefined) ?? null
    if (!pagesImport || pagesImport.length === 0) return annuler('Import introuvable ou expiré — re-dépose le PDF.')
    if (pagesImport.length > IMPORT_MAX_PAGES) return annuler(`PDF trop long (${pagesImport.length} pages, maximum ${IMPORT_MAX_PAGES}).`)
    // Parque les signets (table des matières) sur le livre — métadonnée pour plus tard.
    if (row?.signets) await supabase.from('scriptorium_unites').update({ signets: row.signets }).eq('id', livre.id)
  }

  const bornesVues: { s: number; e: number }[] = []  // bornes déjà prises (page+ligne encodées) — chevauchement, trous autorisés

  // Une semaine = un document de cette unité (texte d'ancrage + titre + chapitres).
  for (let n = 1; n <= nbSemaines; n++) {
    let titreSem: string
    let chapitres: string | null
    let texteExtrait: string | null = null
    let buffer: Buffer | null = null   // mode 'par_semaine' seulement
    let pdf: File | null = null        // mode 'par_semaine' seulement

    if (mode === 'pdf_decoupe') {
      titreSem = (formData.get(`decoupe_${n}_titre`) as string)?.trim() || `Séance ${n}`
      chapitres = (formData.get(`decoupe_${n}_chapitres`) as string)?.trim() || null
      // Bornes à la ligne près : début (page+ligne) → fin (page+ligne), fin INCLUSE.
      const dp = Number(formData.get(`decoupe_${n}_debutPage`))
      const dl = Number(formData.get(`decoupe_${n}_debutLigne`))
      const fp = Number(formData.get(`decoupe_${n}_finPage`))
      const fl = Number(formData.get(`decoupe_${n}_finLigne`))
      const total = pagesImport!.length
      if (![dp, dl, fp, fl].every(v => Number.isInteger(v))) return annuler(`Semaine ${n} : marque un début et une fin.`)
      if (dp < 1 || fp > total || dp > fp) return annuler(`Semaine ${n} : bornes hors du PDF (pages 1–${total}).`)
      const lignesDp = (pagesImport![dp - 1] ?? '').split('\n').length
      const lignesFp = (pagesImport![fp - 1] ?? '').split('\n').length
      if (dl < 1 || dl > lignesDp || fl < 1 || fl > lignesFp) return annuler(`Semaine ${n} : ligne hors de la page.`)
      const debutPos = dp * 100000 + dl
      const finPos = fp * 100000 + fl
      if (debutPos > finPos) return annuler(`Semaine ${n} : le début est après la fin.`)
      // Chevauchement testé contre toutes les bornes déjà prises (ordre indifférent ; trous autorisés).
      if (bornesVues.some(b => debutPos <= b.e && b.s <= finPos)) return annuler(`Semaine ${n} : ses bornes en chevauchent une autre.`)
      bornesVues.push({ s: debutPos, e: finPos })
      texteExtrait = texteEntreBornes(pagesImport!, dp, dl, fp, fl).trim() || null
    } else {
      titreSem = (formData.get(`semaine_${n}_titre`) as string)?.trim() || `Séance ${n}`
      chapitres = (formData.get(`semaine_${n}_chapitres`) as string)?.trim() || null
      pdf = formData.get(`semaine_${n}_pdf`) as File | null
      // Le buffer du PDF est lu UNE fois (extraction + upload).
      if (pdf && pdf.size > 0) {
        buffer = Buffer.from(await pdf.arrayBuffer())
        try {
          texteExtrait = await extraireTexte(buffer, pdf.type, pdf.name)
        } catch (err) {
          console.error(`[scriptorium] extraction PDF semaine ${n} :`, err)
        }
      }
    }

    // Ancrage IA Aletheia : CHAQUE semaine doit avoir un texte exploitable. Sans texte,
    // le retour IA est impossible → on bloquera la création après la boucle (rollback).
    if (!texteExtrait || !texteExtrait.trim()) semainesSansTexte.push(n)

    const { data: doc, error: errDoc } = await supabase
      .from('scriptorium_documents')
      .insert({
        unite_id: livre.id,
        type: 'texte_source',
        titre: titreSem,
        semaine: n,
        chapitres,
        texte_extrait: texteExtrait,
        created_by: userId,
      })
      .select('id')
      .single()
    if (errDoc || !doc) return annuler(errDoc?.message ?? `Erreur sur la semaine ${n}.`)

    // Mode 'par_semaine' uniquement : on stocke le PDF (ancrage IA, réservé serveur).
    // En mode 'pdf_decoupe', texte seul → fichier_ref reste null (pas d'upload).
    if (mode !== 'pdf_decoupe' && buffer && pdf) {
      const ext = pdf.name.split('.').pop()?.toLowerCase() || 'pdf'
      const up = await uploaderBuffer(userId, doc.id, buffer, ext, pdf.type)
      if (up.error || !up.path) return annuler(`Téléversement du PDF de la semaine ${n} impossible : ${up.error ?? 'inconnu'}`)
      cheminsUploades.push(up.path)
      const { error: errRef } = await supabase.from('scriptorium_documents').update({ fichier_ref: up.path }).eq('id', doc.id)
      if (errRef) return annuler(errRef.message)
    }
  }

  // Blocage strict : aucun livre Aletheia ne part avec une semaine sans ancrage
  // texte — sinon le retour IA est cassé pour l'élève sur cette semaine. Rollback complet.
  if (semainesSansTexte.length > 0) {
    return annuler(
      `Impossible de créer le livre : pas de texte exploitable pour la/les semaine(s) ${semainesSansTexte.join(', ')}. ` +
      `Le retour IA d'Aletheia en a besoin. ` +
      (mode === 'pdf_decoupe'
        ? `Vérifie les bornes (début et fin) de chaque semaine, ou utilise un PDF dont le texte est sélectionnable (pas un scan).`
        : `Fournis pour ces semaines un PDF dont le texte est sélectionnable (PDF déjà océrisé s'il s'agit d'un scan), puis réessaie.`),
    )
  }

  // Assignation AU NIVEAU DU LIVRE : un seul jeu de classes pour tout le livre
  // (source de vérité du planning élève — cf. scriptorium_unite_classes, Lot 2).
  const { error: errClasses } = await supabase
    .from('scriptorium_unite_classes')
    .insert(classeIds.map(classe_id => ({ unite_id: livre.id, classe_id })))
  if (errClasses) return annuler(errClasses.message)

  // Carte d'architecture + référence par chapitre : générées DÈS la préparation
  // (SPEC §1), en arrière-plan. Le prof n'est pas bloqué ; il vérifiera/éditera.
  await lancerGenerationArtefactsLivre(admin, livre.id as string)

  // Succès : l'import PDF transitoire n'a plus de raison d'être.
  await nettoyerImport()

  revalidatePath('/prof/scriptorium')
  return { success: true }
}

// Réassigner les classes d'un livre (au niveau du livre). Remplace tout le jeu.
export async function reassignerClassesLivre(uniteId: string, classeIds: string[]) {
  const { supabase } = await verifierProf()
  await supabase.from('scriptorium_unite_classes').delete().eq('unite_id', uniteId)
  if (classeIds.length > 0) {
    const { error } = await supabase
      .from('scriptorium_unite_classes')
      .insert(classeIds.map(classe_id => ({ unite_id: uniteId, classe_id })))
    if (error) return { error: error.message }
  }
  revalidatePath('/prof/scriptorium')
  return { success: true }
}

// Édition d'un livre = MÊME logique que la création, en RE-DÉCOUPE : on réassemble le
// texte des semaines dans l'ordre (semaine asc), le prof redéplace les bornes de ligne
// dans le navigateur, et on recoupe. Ne modifie pas le texte lui-même et ne régénère
// PAS la carte/référence (régénération à la demande). Auteur (niveau livre) au passage.
export async function modifierLivreComplet(
  livreId: string,
  auteur: string,
  semaines: { id: string; titre: string; chapitres: string; debutLigne: number; finLigne: number }[],
  nbLignesAttendu: number,
): Promise<{ success?: boolean; error?: string }> {
  const { supabase } = await verifierProf()

  // Réassemblage côté serveur, IDENTIQUE au client. Départage par `id` (uuid) en plus
  // de `semaine` → ordre déterministe même si deux documents partagent un numéro.
  const { data: docs } = await supabase
    .from('scriptorium_documents')
    .select('id, semaine, texte_extrait')
    .eq('unite_id', livreId).not('semaine', 'is', null)
    .order('semaine', { ascending: true })
    .order('id', { ascending: true })
  const { texte } = reassemblerLivre((docs ?? []).map(d => (d.texte_extrait as string | null) ?? ''))
  const lignes = texte.split('\n')

  // Garde anti-dérive (TOCTOU) : si le texte du livre a changé depuis l'ouverture de
  // l'éditeur, les index de ligne du prof ne valent plus rien → refus AVANT toute écriture.
  if (lignes.length !== nbLignesAttendu) {
    return { error: 'Le livre a changé depuis l\'ouverture de l\'éditeur. Recharge la page et recommence.' }
  }

  // Pré-validation GLOBALE avant toute écriture (atomicité comme à la création).
  for (const s of semaines) {
    if (!Number.isInteger(s.debutLigne) || !Number.isInteger(s.finLigne) || s.debutLigne < 1 || s.finLigne > lignes.length || s.debutLigne > s.finLigne) {
      return { error: `Semaine « ${(s.titre ?? '').trim() || 'Semaine'} » : bornes invalides.` }
    }
    if (!lignes.slice(s.debutLigne - 1, s.finLigne).join('\n').trim()) {
      return { error: `La semaine « ${(s.titre ?? '').trim() || 'Semaine'} » serait vide — l'ancrage IA en a besoin.` }
    }
  }
  // Ordre du livre + non-chevauchement : dans l'ordre reçu (= ordre des semaines), chaque
  // semaine doit commencer après la fin de la précédente. Defense-in-depth (+ client).
  for (let i = 1; i < semaines.length; i++) {
    if (semaines[i].debutLigne <= semaines[i - 1].finLigne) {
      return { error: 'Les semaines doivent rester dans l\'ordre du livre, sans se chevaucher.' }
    }
  }

  const { error: eU } = await supabase
    .from('scriptorium_unites')
    .update({ auteur: auteur.trim() || null })
    .eq('id', livreId).eq('type', 'livre')
  if (eU) return { error: eU.message }

  for (const s of semaines) {
    const texteSem = lignes.slice(s.debutLigne - 1, s.finLigne).join('\n').trim()
    const { error } = await supabase
      .from('scriptorium_documents')
      .update({ titre: (s.titre ?? '').trim() || 'Semaine', chapitres: (s.chapitres ?? '').trim() || null, texte_extrait: texteSem })
      .eq('id', s.id).eq('unite_id', livreId)   // scoping : le document appartient bien à ce livre
    if (error) return { error: error.message }
  }

  revalidatePath('/prof/scriptorium')
  return { success: true }
}

export async function modifierContenu(formData: FormData) {
  const { supabase } = await verifierProf()
  const id = formData.get('id') as string
  const nom = (formData.get('nom') as string)?.trim()
  const semaineRaw = formData.get('semaine') as string
  const semaine = semaineRaw ? Number(semaineRaw) : null
  const texte = (formData.get('texte') as string)?.trim() || null
  const chapitres = (formData.get('chapitres') as string)?.trim() || null
  const uniteId = (formData.get('uniteId') as string) || undefined
  // cours/texte : présent seulement pour le contenu d'unité (masqué pour les
  // documents de livre, type='texte_source' qu'on ne doit pas écraser).
  const objetType = formData.get('objetType') as string | null

  if (!nom) return { error: 'Le nom est requis.' }

  const maj: Record<string, unknown> = { titre: nom, semaine, texte_extrait: texte, chapitres }
  if (uniteId) maj.unite_id = uniteId
  if (objetType === 'cours' || objetType === 'texte') maj.type = objetType

  const { error } = await supabase.from('scriptorium_documents').update(maj).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/prof/scriptorium')
  return { success: true }
}

export async function reassignerClasses(documentId: string, classeIds: string[]) {
  const { supabase } = await verifierProf()
  await supabase.from('scriptorium_document_classes').delete().eq('document_id', documentId)
  if (classeIds.length > 0) {
    const { error } = await supabase
      .from('scriptorium_document_classes')
      .insert(classeIds.map(classe_id => ({ document_id: documentId, classe_id })))
    if (error) return { error: error.message }
  }
  revalidatePath('/prof/scriptorium')
  return { success: true }
}

export async function supprimerContenu(id: string) {
  const { supabase } = await verifierProf()
  const admin = createAdminClient()

  // Collecter les fichiers (image legacy + images enfants) avant suppression.
  const [{ data: doc }, { data: images }] = await Promise.all([
    supabase.from('scriptorium_documents').select('fichier_ref').eq('id', id).maybeSingle(),
    supabase.from('scriptorium_contenu_images').select('fichier_ref').eq('document_id', id),
  ])

  const { error } = await supabase.from('scriptorium_documents').delete().eq('id', id)
  if (error) return { error: error.message }

  const chemins = [
    ...(doc?.fichier_ref ? [doc.fichier_ref] : []),
    ...((images ?? []).map(i => i.fichier_ref as string)),
  ]
  if (chemins.length > 0) await admin.storage.from('scriptorium').remove(chemins)

  revalidatePath('/prof/scriptorium')
  return { success: true }
}

// ── Bibliothèque de contenus réutilisables (Textes & Cours) — Parcours L2 ────
// Items de PREMIÈRE CLASSE (table scriptorium_contenus) : AUCUN lien unité /
// semaine / classe (ces dimensions vivront sur les créneaux de parcours, L4).
// Réutilisent les helpers d'extraction/upload/images ci-dessus. Suffixe « Biblio »
// tant que l'ancien jeu (scriptorium_documents) COEXISTE — avant la migration
// L7/L8 qui retirera les unités. Après migration, l'ancien jeu ne servira plus
// que pour les documents de livre (édités via modifierLivreComplet). Cf. SPEC §7.6.

// ⭐⭐ C4-L16 — CE QUE LE COURS DÉCLARE TRAITER, lu du formulaire.
//   Le champ neuf est `scriptorium_contenus.notions` : notions du programme au
//   tronc commun, thèmes ou chapitres du semestre en HLP — UN SEUL champ, une
//   liste de mots LIBRES, « parce que deux champs feraient deux domiciles pour
//   la même relation » (`07-` §2, C4-L16 ; `08-` §3).
//
// ⚠️ LE FORMULAIRE POSTE DEUX CHOSES, ET C'EST VOULU : les `notion` cochées
//   parmi celles que LA BANQUE CONNAÎT — « on ne rattache pas en tapant, on
//   rattache en choisissant » —, et un `notions_libres` pour ce que la banque ne
//   connaît pas encore. ⛔ Le champ reste LIBRE : le `07-` §2 retire
//   explicitement à ce lot « la liste fermée des notions du programme », qui
//   serait une donnée de référentiel et n'existe nulle part.
//
// ⭐ LE DÉDOUBLONNAGE SE FAIT SUR LA CLÉ D'APPARIEMENT, PAS SUR LA CHAÎNE : sans
//   quoi cocher « la vérité » et taper « La Vérité » poserait DEUX notions qui
//   n'en font qu'une pour le routeur. On garde le libellé ÉCRIT EN PREMIER —
//   c'est lui que le professeur relira.
function notionsDuFormulaire(formData: FormData): string[] {
  const brutes = [
    ...formData.getAll('notion').map(String),
    // Une par ligne, ou séparées par des virgules / points-virgules.
    ...String(formData.get('notions_libres') ?? '').split(/[\n,;]+/),
  ]
  const vues = new Set<string>()
  const out: string[] = []
  for (const b of brutes) {
    const libelle = b.trim()
    const cle = cleDAppariement(libelle)
    if (cle === '' || vues.has(cle)) continue
    vues.add(cle)
    out.push(libelle)
  }
  return out
}

// Crée un texte ou un cours. `type` (caché) ∈ {texte, cours}. Un fichier image est
// attaché (scriptorium_contenu_images) ; un document PDF/DOCX/TXT est extrait dans texte.
// `aTexte` permet au client d'enchaîner sur l'éditeur de sections (RAG L2) quand un
// cours vient d'être importé avec un corps de texte.
export async function creerContenu(formData: FormData): Promise<{ id?: string; aTexte?: boolean; error?: string }> {
  const { supabase, userId } = await verifierProf()
  const type = (formData.get('type') as string) === 'texte' ? 'texte' : 'cours'
  const titre = (formData.get('titre') as string)?.trim()
  const auteur = (formData.get('auteur') as string)?.trim() || null
  let texte = normaliserRetours(String(formData.get('texte') ?? '')).trim() || null
  const chapitres = (formData.get('chapitres') as string)?.trim() || null
  const legende = (formData.get('legende') as string)?.trim() || null
  const fichier = formData.get('fichier') as File | null

  if (!titre) return { error: 'Donne un titre au contenu.' }

  // Fichier optionnel : image → pièce jointe ; document texte → extraction (texte seul).
  let fichierImage: File | null = null
  if (fichier && fichier.size > 0) {
    if (estImage(fichier.type, fichier.name)) {
      fichierImage = fichier
    } else {
      const buffer = Buffer.from(await fichier.arrayBuffer())
      const extrait = await extraireTexte(buffer, fichier.type, fichier.name)
      if (extrait) texte = [texte, extrait].filter(Boolean).join('\n\n')
    }
  }

  // ⭐ C4-L16 — seul un COURS déclare ce qu'il traite. Un texte de la
  //   bibliothèque n'a pas ce rôle : son rattachement passe par le
  //   `plan_de_lecture` (`08-` §2), et le champ resterait vide à l'écran.
  const notions = type === 'cours' ? notionsDuFormulaire(formData) : []

  const { data: contenu, error } = await supabase
    .from('scriptorium_contenus')
    .insert({ type, titre, auteur, texte_extrait: texte, chapitres, notions, created_by: userId })
    .select('id')
    .single()
  if (error || !contenu) return { error: error?.message ?? 'Création impossible.' }

  if (fichierImage) {
    const up = await uploaderFichier(userId, contenu.id as string, fichierImage)
    if (up.error || !up.path) {
      // Le contenu est créé ; seule l'image a échoué → on journalise (parité avec
      // l'ancien flux : pas de rollback du contenu pour une image ratée).
      console.error('[scriptorium] creerContenu : upload image échoué', up.error)
    } else {
      const { error: eImg } = await supabase
        .from('scriptorium_contenu_images')
        .insert({ contenu_id: contenu.id, fichier_ref: up.path, legende })
      if (eImg) console.error('[scriptorium] creerContenu : insert image échoué', eImg.message)
    }
  }

  revalidatePath('/prof/scriptorium')
  return { id: contenu.id as string, aTexte: !!texte }
}

export async function modifierContenuBiblio(formData: FormData): Promise<{ success?: boolean; needsConfirm?: boolean; nbSections?: number; error?: string }> {
  const { supabase } = await verifierProf()
  const id = formData.get('id') as string
  const titre = (formData.get('titre') as string)?.trim()
  const auteur = (formData.get('auteur') as string)?.trim() || null
  const texte = normaliserRetours(String(formData.get('texte') ?? '')).trim() || null
  const chapitres = (formData.get('chapitres') as string)?.trim() || null
  const force = formData.get('force') === '1'

  if (!id || !RE_UUID.test(id)) return { error: 'Identifiant manquant.' }
  if (!titre) return { error: 'Le titre est requis.' }

  // Garde L2 : changer le TEXTE d'un cours découpé invalide ses sections (chacune
  // stocke sa part du texte — la partition ne correspond plus). Confirmation
  // explicite → la découpe est EFFACÉE et les instances re-matérialisées en
  // « cours entier » (vus agrégés) ; le prof redécoupe ensuite s'il veut.
  const { data: actuel } = await supabase
    .from('scriptorium_contenus').select('type, texte_extrait').eq('id', id).maybeSingle()
  if (!actuel) return { error: 'Contenu introuvable.' }
  let effacerDecoupe = false
  if (actuel.type === 'cours' && (actuel.texte_extrait as string | null ?? '').trim() !== (texte ?? '')) {
    const { data: secs } = await supabase
      .from('scriptorium_contenu_sections').select('id').eq('contenu_id', id)
    const nbSections = (secs ?? []).length
    if (nbSections > 0) {
      if (!force) return { needsConfirm: true, nbSections }
      effacerDecoupe = true
    }
  }

  // ⭐ C4-L16 — les notions ne bougent QUE pour un cours. Sur un texte, on ne
  //   touche pas la colonne : l'écran n'en montre pas, et écrire `[]` effacerait
  //   silencieusement ce qu'un autre chemin y aurait mis.
  const champs: Record<string, unknown> = {
    titre, auteur, texte_extrait: texte, chapitres, updated_at: new Date().toISOString(),
  }
  if (actuel.type === 'cours') champs.notions = notionsDuFormulaire(formData)

  const { error } = await supabase
    .from('scriptorium_contenus')
    .update(champs)
    .eq('id', id)
  if (error) return { error: error.message }
  if (effacerDecoupe) {
    const res = await remplacerDecoupe(supabase, id, texte ?? '', [])
    if (res.error) return { error: `Texte modifié, mais découpe non effacée : ${res.error}` }
  }
  revalidatePath('/prof/scriptorium')
  return { success: true }
}

// SOFT-DELETE SEUL (schema-S7) : on NE purge PAS les créneaux référents (ils sont
// conservés « contenu retiré », restaurables) et on GARDE les fichiers Storage
// (restauration possible). Une purge dure éventuelle nettoierait le Storage.
export async function supprimerContenuBiblio(id: string): Promise<{ success?: boolean; error?: string }> {
  const { supabase } = await verifierProf()
  if (!RE_UUID.test(id)) return { error: 'Identifiant invalide.' }
  const { error } = await supabase
    .from('scriptorium_contenus')
    .update({ supprime_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/prof/scriptorium')
  return { success: true }
}

// Restauration (schema-S7) : réactive le contenu partout (y compris ses créneaux).
export async function restaurerContenuBiblio(id: string): Promise<{ success?: boolean; error?: string }> {
  const { supabase } = await verifierProf()
  if (!RE_UUID.test(id)) return { error: 'Identifiant invalide.' }
  const { error } = await supabase
    .from('scriptorium_contenus')
    .update({ supprime_at: null })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/prof/scriptorium')
  return { success: true }
}

// Suppression DÉFINITIVE d'un contenu de la corbeille (soft-deleté uniquement) :
// retire ses créneaux référents (les « contenu retiré » disparaissent des parcours),
// puis la ligne (cascade sur ses images) + les fichiers Storage. IRRÉVERSIBLE.
export async function purgerContenuBiblio(id: string): Promise<{ success?: boolean; error?: string }> {
  const { supabase } = await verifierProf()
  const admin = createAdminClient()
  if (!RE_UUID.test(id)) return { error: 'Identifiant invalide.' }

  const { data: c } = await supabase.from('scriptorium_contenus').select('supprime_at').eq('id', id).maybeSingle()
  if (!c) return { error: 'Contenu introuvable.' }
  if (!c.supprime_at) return { error: 'Ce contenu n’est pas dans la corbeille (mets-le d’abord en corbeille).' }

  // Plan d'évaluation (§9.2-7) — indépendant du gate (des lignes créées gate ON survivent
  // à un rollback et tireraient une 23503 brute ici) ; TOLÉRANT si la table/colonne n'existe
  // pas encore (migration non jouée = aucune FK à heurter → on ignore l'erreur et on saute).
  // (c) ≥1 séance Codex ancrée sur ce contenu (directement ou via une synthèse) → REFUS :
  const { data: sessAncree, error: eSess } = await supabase
    .from('codex_sessions').select('id').eq('contenu_id', id).limit(1).maybeSingle()
  if (!eSess && sessAncree) {
    return { error: 'Ce cours a des séances Codex — purge impossible. Une séance est de l’historique élève et n’est pas détachée.' }
  }

  // (c bis) ≥1 carte Quazian ancrée sur ce contenu (C7·L1) → REFUS. Sa FK est en
  // ON DELETE RESTRICT à dessein : en cascade, la purge emporterait en silence les
  // `quazian_card_states`, c'est-à-dire l'historique de révision des élèves. Le
  // refus explicite vaut mieux qu'une 23503 brute. TOLÉRANT si la colonne n'existe
  // pas encore (migration c7_quazian_contenus.sql non jouée → rien à heurter).
  const { data: carteAncree, error: eCarte } = await supabase
    .from('quazian_flashcards').select('id').eq('contenu_id', id).limit(1).maybeSingle()
  if (!eCarte && carteAncree) {
    return { error: 'Ce contenu a des cartes Quazian — purge impossible. Archive ou supprime ses cartes depuis Quazian d’abord.' }
  }
  if (!eSess) {
    // (a) exercices bras `semaine` référant ce contenu (matière facultative) → détacher
    //     (le CHECK d'ancrage interdit contenu_id null sur une synthèse, d'où le split).
    await supabase.from('scriptorium_exercices_planifies')
      .update({ contenu_id: null, updated_at: new Date().toISOString() })
      .eq('contenu_id', id).eq('ancrage', 'semaine')
    // (b) lignes synthèse de ce cours (TOUTES : a_concevoir/annule/soft-deletées — l'index
    //     partiel ne les voit pas mais la FK RESTRICT, si ; sans session, garanti par (c)) →
    //     DELETE dur (contenu et créneaux disparaissent : anti-résurrection sans objet).
    await supabase.from('scriptorium_exercices_planifies')
      .delete().eq('contenu_id', id).eq('type_exercice', 'synthese')
  }

  // Fichiers Storage à nettoyer (collectés AVANT le delete qui cascade les images).
  const { data: imgs } = await supabase.from('scriptorium_contenu_images').select('fichier_ref').eq('contenu_id', id)
  // Créneaux référents d'abord (FK contenu_id ON DELETE RESTRICT) — modèle ET
  // instances (RAG L1 ; les éléments d'instance cascadent avec leur créneau, ce
  // qui libère aussi les sections du contenu, référencées en RESTRICT).
  await supabase.from('scriptorium_parcours_creneaux').delete().eq('contenu_id', id)
  await supabase.from('scriptorium_parcours_classe_creneaux').delete().eq('contenu_id', id)
  const { error } = await supabase.from('scriptorium_contenus').delete().eq('id', id) // cascade → images
  if (error) return { error: error.message }
  const chemins = (imgs ?? []).map(i => i.fichier_ref as string).filter(Boolean)
  if (chemins.length) await admin.storage.from('scriptorium').remove(chemins)

  revalidatePath('/prof/scriptorium')
  return { success: true }
}

// ── Sections d'un cours — RAG L2 (SPEC_scriptorium_rag.md, décision 3 amendée) ─
// Découpe MANUELLE à la ligne (pas de proposition IA — abandonnée sur les livres).
// Une sauvegarde remplace TOUTES les sections du contenu et RE-MATÉRIALISE les
// éléments des créneaux d'instance référents (« re-découpe consciente ») : le
// « vu » est reporté par correspondance exacte de titre, un cours entier vu
// diffuse à toutes les sections (utils/scriptorium-sections, testé). Pas de
// transaction multi-tables (REST) : l'ordre des étapes (éléments → sections →
// insertion → re-matérialisation) évite toute FK bloquante, et un échec en
// cours de route laisse un état rattrapable en re-sauvant la découpe.

// Charge les créneaux d'instance référençant un contenu + leurs éléments actuels
// (avec le titre des sections référencées) — socle des re-matérialisations.
async function chargerReferentsContenu(supabase: SupabaseClient, contenuId: string): Promise<{
  creneaux: { id: string; semaine: number }[]
  anciensParCreneau: Map<string, AncienElementVu[]>
}> {
  const { data: crens } = await supabase
    .from('scriptorium_parcours_classe_creneaux')
    .select('id, semaine')
    .eq('ref_type', 'contenu').eq('contenu_id', contenuId)
  const creneaux = (crens ?? []).map(c => ({ id: c.id as string, semaine: c.semaine as number }))
  const anciensParCreneau = new Map<string, AncienElementVu[]>()
  if (creneaux.length === 0) return { creneaux, anciensParCreneau }

  const [{ data: els }, { data: secs }] = await Promise.all([
    supabase.from('scriptorium_parcours_classe_elements')
      .select('creneau_id, ref_type, section_id, vu_at, vu_par')
      .in('creneau_id', creneaux.map(c => c.id))
      .order('semaine', { ascending: true }).order('ordre', { ascending: true }),
    supabase.from('scriptorium_contenu_sections').select('id, titre').eq('contenu_id', contenuId),
  ])
  const titreSection = new Map((secs ?? []).map(s => [s.id as string, s.titre as string]))
  for (const e of els ?? []) {
    const cid = e.creneau_id as string
    const arr = anciensParCreneau.get(cid) ?? []
    arr.push({
      refType: e.ref_type === 'section' ? 'section' : 'contenu',
      titre: e.section_id ? (titreSection.get(e.section_id as string) ?? null) : null,
      vuAt: (e.vu_at as string | null) ?? null,
      vuPar: (e.vu_par as string | null) ?? null,
    })
    anciensParCreneau.set(cid, arr)
  }
  return { creneaux, anciensParCreneau }
}

// Remplace la découpe d'un cours (delete + insert des sections) et re-matérialise
// les éléments des instances référentes avec report des « vus ». `plages` vides =
// effacer la découpe (retour à un élément 'contenu' entier par créneau).
async function remplacerDecoupe(
  supabase: SupabaseClient,
  contenuId: string,
  texte: string,
  plages: PlageSection[],
): Promise<{ error?: string }> {
  const { creneaux, anciensParCreneau } = await chargerReferentsContenu(supabase, contenuId)

  // 1. Les éléments d'abord (FK section_id RESTRICT), puis les anciennes sections.
  if (creneaux.length > 0) {
    const { error: eDelEl } = await supabase
      .from('scriptorium_parcours_classe_elements')
      .delete().in('creneau_id', creneaux.map(c => c.id))
    if (eDelEl) return { error: eDelEl.message }
  }
  const { error: eDelSec } = await supabase
    .from('scriptorium_contenu_sections').delete().eq('contenu_id', contenuId)
  if (eDelSec) return { error: eDelSec.message }

  // 2. Nouvelles sections — dérivation CANONIQUE côté serveur (le client n'envoie
  // que les plages ; le texte de chaque section vient du texte_extrait actuel,
  // l'ordre est celui du texte — tri par début dans decouperPlages).
  const derivees = decouperPlages(texte, plages)
  let inserees: { id: string; ordre: number; titre: string }[] = []
  if (derivees.length > 0) {
    const { data, error: eIns } = await supabase
      .from('scriptorium_contenu_sections')
      .insert(derivees.map(s => ({ contenu_id: contenuId, ordre: s.ordre, niveau: s.niveau, titre: s.titre, texte: s.texte })))
      .select('id, ordre, titre')
    if (eIns || !data) return { error: eIns?.message ?? 'Insertion des sections impossible.' }
    inserees = data
      .map(s => ({ id: s.id as string, ordre: s.ordre as number, titre: s.titre as string }))
      .sort((a, b) => a.ordre - b.ordre)
  }

  // 3. Re-matérialisation des éléments, créneau par créneau, avec report des vus.
  const elements: Record<string, unknown>[] = []
  for (const cr of creneaux) {
    const anciens = anciensParCreneau.get(cr.id) ?? []
    if (inserees.length > 0) {
      const vus = reporterVus(anciens, inserees.map(s => s.titre))
      inserees.forEach((s, i) => elements.push({
        creneau_id: cr.id, ref_type: 'section', section_id: s.id,
        semaine: cr.semaine, ordre: s.ordre,
        vu_at: vus[i]?.vuAt ?? null, vu_par: vus[i]?.vuPar ?? null,
      }))
    } else {
      const v = vuVersContenu(anciens)
      elements.push({
        creneau_id: cr.id, ref_type: 'contenu', semaine: cr.semaine, ordre: 1,
        vu_at: v?.vuAt ?? null, vu_par: v?.vuPar ?? null,
      })
    }
  }
  if (elements.length > 0) {
    const { error: eEl } = await supabase.from('scriptorium_parcours_classe_elements').insert(elements)
    if (eEl) return { error: eEl.message }
  }
  return {}
}

/**
 * Sauvegarde la découpe d'un cours (RAG L2). `plages` = {début, fin} de lignes
 * (1-based, incluses) + titre + niveau ; un §§ peut être imbriqué dans un §
 * (le chapitre ne garde alors que ses lignes PROPRES), chevauchement PARTIEL
 * interdit, trous tolérés (lignes hors section = écartées de la matière) ;
 * vides = effacer la découpe.
 * Garde TOCTOU : `nbLignesVues` = nombre de lignes du texte servi à l'éditeur.
 * Re-découpe consciente : si des instances référencent ce cours, exiger `force`
 * (le client affiche la confirmation avec `nbInstances`).
 */
export async function sauvegarderSections(
  contenuId: string,
  plages: PlageSection[],
  nbLignesVues: number,
  force = false,
): Promise<{ success?: boolean; needsConfirm?: boolean; nbInstances?: number; error?: string }> {
  const { supabase } = await verifierProf()
  if (!RE_UUID.test(contenuId)) return { error: 'Identifiant invalide.' }

  const { data: c } = await supabase
    .from('scriptorium_contenus').select('type, texte_extrait, supprime_at').eq('id', contenuId).maybeSingle()
  if (!c || c.supprime_at) return { error: 'Cours introuvable.' }
  if (c.type !== 'cours') return { error: 'Seuls les cours se découpent en sections.' }
  const texte = (c.texte_extrait as string | null) ?? ''
  if (plages.length > 0 && !texte.trim()) return { error: 'Ce cours n’a pas de texte à découper.' }

  // Garde anti-dérive (TOCTOU, patron découpe livre) : le texte doit être celui
  // servi à l'éditeur — sinon les numéros de ligne ne signifient plus rien.
  const nbLignes = texte.split('\n').length
  if (plages.length > 0 && nbLignesVues !== nbLignes) {
    return { error: 'Le texte du cours a changé depuis l’ouverture de l’éditeur — recharge la page.' }
  }
  const invalide = validerPlages(plages, nbLignes)
  if (invalide) return { error: invalide }

  // Re-découpe CONSCIENTE (SPEC L2) : des instances vivent sur ce cours →
  // confirmation explicite avant de re-matérialiser leurs éléments.
  const { data: refs } = await supabase
    .from('scriptorium_parcours_classe_creneaux')
    .select('parcours_classe_id')
    .eq('ref_type', 'contenu').eq('contenu_id', contenuId)
  const nbInstances = new Set((refs ?? []).map(r => r.parcours_classe_id as string)).size
  if (nbInstances > 0 && !force) return { needsConfirm: true, nbInstances }

  const res = await remplacerDecoupe(supabase, contenuId, texte, plages)
  if (res.error) return { error: res.error }
  revalidatePath('/prof/scriptorium')
  return { success: true }
}

export async function ajouterImageContenu(formData: FormData): Promise<{ success?: boolean; error?: string }> {
  const { supabase, userId } = await verifierProf()
  const contenuId = formData.get('contenuId') as string
  const legende = (formData.get('legende') as string)?.trim() || null
  const fichier = formData.get('fichier') as File | null

  if (!RE_UUID.test(contenuId)) return { error: 'Contenu invalide.' }
  if (!fichier || fichier.size === 0) return { error: 'Aucune image fournie.' }
  if (!estImage(fichier.type, fichier.name)) return { error: 'Le fichier doit être une image.' }

  const up = await uploaderFichier(userId, contenuId, fichier)
  if (up.error || !up.path) return { error: up.error ?? 'Upload impossible.' }

  const { data: dernier } = await supabase
    .from('scriptorium_contenu_images')
    .select('ordre')
    .eq('contenu_id', contenuId)
    .order('ordre', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { error } = await supabase.from('scriptorium_contenu_images').insert({
    contenu_id: contenuId,
    fichier_ref: up.path,
    legende,
    ordre: (dernier?.ordre ?? 0) + 1,
  })
  if (error) return { error: error.message }
  revalidatePath('/prof/scriptorium')
  return { success: true }
}

export async function supprimerImageContenu(imageId: string): Promise<{ success?: boolean; error?: string }> {
  const { supabase } = await verifierProf()
  const admin = createAdminClient()
  const { data: img } = await supabase
    .from('scriptorium_contenu_images')
    .select('fichier_ref')
    .eq('id', imageId)
    .maybeSingle()

  const { error } = await supabase.from('scriptorium_contenu_images').delete().eq('id', imageId)
  if (error) return { error: error.message }
  if (img?.fichier_ref) await admin.storage.from('scriptorium').remove([img.fichier_ref as string])
  revalidatePath('/prof/scriptorium')
  return { success: true }
}

// ── Suppression d'une unité / d'un livre (archive + purge ciblée) ────────────
// « Supprimer » NE supprime PAS la ligne scriptorium_unites : ses dépendances
// sont en ON DELETE CASCADE (aletheia_travaux = travail élève + retours IA,
// codex_sessions = synthèse, quazian_flashcards = cartes) → un vrai DELETE
// détruirait précisément ce qu'on veut préserver. On garde la coquille (masquée
// via supprime_at) et on purge UNIQUEMENT le contenu prof + les artefacts IA
// Scriptorium (carte d'architecture + fiche de lecture). Tout passe par le client
// admin : aucune policy DELETE prof n'est versionnée → un DELETE via le client RLS
// échouerait en silence (0 ligne, pas d'erreur).
export async function supprimerUnite(uniteId: string): Promise<{ success?: boolean; error?: string }> {
  await verifierProf()
  if (!RE_UUID.test(uniteId)) return { error: 'Identifiant invalide.' }
  const admin = createAdminClient()

  const { data: unite } = await admin.from('scriptorium_unites').select('id').eq('id', uniteId).maybeSingle()
  if (!unite) return { error: 'Unité introuvable.' }

  // 1. Masquer la coquille EN PREMIER (opération critique : la carte disparaît). La ligne
  //    SURVIT → aucune cascade ne peut atteindre travail élève / Codex / Quazian. Si ce seul
  //    UPDATE échoue, on s'arrête AVANT toute purge → pas d'état « vidé mais encore visible ».
  const { error: errMasque } = await admin
    .from('scriptorium_unites').update({ supprime_at: new Date().toISOString() }).eq('id', uniteId)
  if (errMasque) return { error: errMasque.message }

  // 2. Détacher les classes → bloque tout nouveau dépôt et retire l'accès élève.
  await admin.from('scriptorium_unite_classes').delete().eq('unite_id', uniteId)

  // ── Purge ciblée du contenu (best-effort, idempotent : l'unité est déjà masquée). ──
  // Documents de l'unité + fichiers Storage (images enfants + PDF d'ancrage legacy),
  // collectés AVANT de vider les fichier_ref (sinon la référence est perdue → orphelins).
  const { data: docs } = await admin.from('scriptorium_documents').select('id, fichier_ref').eq('unite_id', uniteId)
  const docIds = (docs ?? []).map(d => d.id as string)
  if (docIds.length) await admin.from('scriptorium_document_classes').delete().in('document_id', docIds)

  let images: { fichier_ref: string | null }[] = []
  if (docIds.length) {
    const { data } = await admin.from('scriptorium_contenu_images').select('fichier_ref').in('document_id', docIds)
    images = (data ?? []) as { fichier_ref: string | null }[]
  }
  const chemins = [
    ...((docs ?? []).map(d => d.fichier_ref as string | null).filter(Boolean) as string[]),
    ...(images.map(i => i.fichier_ref).filter(Boolean) as string[]),
  ]

  // 3. Artefacts IA Scriptorium (niveau livre, AUCUNE donnée élève) : carte + fiche de lecture.
  await admin.from('aletheia_capstone').delete().eq('scriptorium_livre_id', uniteId)
  await admin.from('aletheia_livre_reference').delete().eq('scriptorium_livre_id', uniteId)

  // 4. Images de contenu (lignes + fichiers Storage). Un échec Storage n'est pas bloquant
  //    (au pire des octets orphelins, jamais de donnée à préserver) mais on le journalise.
  if (docIds.length) await admin.from('scriptorium_contenu_images').delete().in('document_id', docIds)
  if (chemins.length) {
    const { error: errRemove } = await admin.storage.from('scriptorium').remove(chemins)
    if (errRemove) console.error('[scriptorium] supprimerUnite : purge Storage incomplète', errRemove)
  }

  // 5. Vider le contenu prof des documents — on GARDE les coquilles : préserve les titres
  //    de semaines (consultation du travail élève) et la liaison Quazian scriptorium_doc_id
  //    (NO ACTION : supprimer un document échouerait si une carte préservée le pointe encore).
  //    Le travail élève (aletheia_travaux) référence la semaine par index, pas par FK → intact.
  if (docIds.length) {
    await admin.from('scriptorium_documents')
      .update({ texte_extrait: null, chapitres: null, legende: null, fichier_ref: null })
      .eq('unite_id', uniteId)
  }

  revalidatePath('/prof/scriptorium')
  revalidatePath('/prof/quazian')
  revalidatePath('/prof/codex')
  revalidatePath('/prof/aletheia')
  return { success: true }
}

export async function ajouterImage(formData: FormData) {
  const { supabase, userId } = await verifierProf()
  const documentId = formData.get('documentId') as string
  const legende = (formData.get('legende') as string)?.trim() || null
  const fichier = formData.get('fichier') as File | null

  if (!fichier || fichier.size === 0) return { error: 'Aucune image fournie.' }
  if (!estImage(fichier.type, fichier.name)) return { error: 'Le fichier doit être une image.' }

  const up = await uploaderFichier(userId, documentId, fichier)
  if (up.error || !up.path) return { error: up.error ?? 'Upload impossible' }

  const { data: dernier } = await supabase
    .from('scriptorium_contenu_images')
    .select('ordre')
    .eq('document_id', documentId)
    .order('ordre', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { error } = await supabase.from('scriptorium_contenu_images').insert({
    document_id: documentId,
    fichier_ref: up.path,
    legende,
    ordre: (dernier?.ordre ?? 0) + 1,
  })
  if (error) return { error: error.message }
  revalidatePath('/prof/scriptorium')
  return { success: true }
}

export async function supprimerImage(imageId: string) {
  const { supabase } = await verifierProf()
  const admin = createAdminClient()
  const { data: img } = await supabase
    .from('scriptorium_contenu_images')
    .select('fichier_ref')
    .eq('id', imageId)
    .maybeSingle()

  const { error } = await supabase.from('scriptorium_contenu_images').delete().eq('id', imageId)
  if (error) return { error: error.message }
  if (img?.fichier_ref) await admin.storage.from('scriptorium').remove([img.fichier_ref])
  revalidatePath('/prof/scriptorium')
  return { success: true }
}

export async function getUrlSignee(storagePath: string): Promise<string | null> {
  await verifierProf()
  const admin = createAdminClient()
  const { data } = await admin.storage.from('scriptorium').createSignedUrl(storagePath, 3600)
  return data?.signedUrl ?? null
}

// ── Aletheia : carte d'architecture + référence (générées à la préparation) ──
type Admin = ReturnType<typeof createAdminClient>

// Pose la carte en PENDING (réinitialise son flag d'amendement) + lance la génération IA.
async function lancerGenerationCapstone(admin: Admin, livreId: string): Promise<void> {
  await admin.from('aletheia_capstone').upsert(
    { scriptorium_livre_id: livreId, statut: 'PENDING', contenu: null, erreur_at: null, amende_par_prof: false, updated_at: new Date().toISOString() },
    { onConflict: 'scriptorium_livre_id' })
  after(async () => { const mod = await import('@/utils/aletheia-retours'); await mod.genererCapstone(livreId) })
}

// Pose la référence en PENDING (réinitialise son flag d'amendement) + lance la génération IA.
async function lancerGenerationReference(admin: Admin, livreId: string): Promise<void> {
  await admin.from('aletheia_livre_reference').upsert(
    { scriptorium_livre_id: livreId, statut: 'PENDING', contenu: null, erreur_at: null, amende_par_prof: false, updated_at: new Date().toISOString() },
    { onConflict: 'scriptorium_livre_id' })
  after(async () => { const mod = await import('@/utils/aletheia-retours'); await mod.genererReferenceLivre(livreId) })
}

// Création du livre : génère carte ET référence (en arrière-plan).
async function lancerGenerationArtefactsLivre(admin: Admin, livreId: string): Promise<void> {
  await lancerGenerationCapstone(admin, livreId)
  await lancerGenerationReference(admin, livreId)
}

// Régénération IA de la CARTE seule. Confirmation si elle a été amendée à la main.
export async function regenererCarteLivre(livreId: string, force = false): Promise<{ success?: boolean; needsConfirm?: boolean; error?: string }> {
  await verifierProf()
  const admin = createAdminClient()
  const { data: cap } = await admin.from('aletheia_capstone').select('amende_par_prof').eq('scriptorium_livre_id', livreId).maybeSingle()
  if (cap?.amende_par_prof && !force) return { needsConfirm: true }
  await lancerGenerationCapstone(admin, livreId)
  revalidatePath('/prof/scriptorium')
  return { success: true }
}

// Régénération IA de la RÉFÉRENCE seule. Confirmation si elle a été amendée à la main.
export async function regenererReferenceLivre(livreId: string, force = false): Promise<{ success?: boolean; needsConfirm?: boolean; error?: string }> {
  await verifierProf()
  const admin = createAdminClient()
  const { data: ref } = await admin.from('aletheia_livre_reference').select('amende_par_prof').eq('scriptorium_livre_id', livreId).maybeSingle()
  if (ref?.amende_par_prof && !force) return { needsConfirm: true }
  await lancerGenerationReference(admin, livreId)
  revalidatePath('/prof/scriptorium')
  return { success: true }
}

// Édition manuelle de la carte par le prof : marque amende_par_prof (anti-écrasement).
export async function enregistrerCarteLivre(livreId: string, contenu: Capstone): Promise<{ success?: boolean; error?: string }> {
  await verifierProf()
  const fil = (contenu?.fil_conducteur ?? '').trim()
  const noeuds = Array.isArray(contenu?.noeuds)
    ? contenu.noeuds.filter(n => n && typeof n.chapitre === 'string' && typeof n.idee === 'string').map(n => ({ chapitre: n.chapitre, idee: n.idee }))
    : []
  const liens = Array.isArray(contenu?.liens)
    ? contenu.liens.filter(l => l && typeof l.de === 'string' && typeof l.vers === 'string' && typeof l.relation === 'string').map(l => ({ de: l.de, vers: l.vers, relation: l.relation }))
    : []
  if (!fil && noeuds.length === 0) return { error: 'La carte ne peut pas être vide.' }

  const admin = createAdminClient()
  const { error } = await admin.from('aletheia_capstone').upsert(
    { scriptorium_livre_id: livreId, contenu: { fil_conducteur: fil, noeuds, liens }, statut: 'READY', erreur_at: null, amende_par_prof: true, updated_at: new Date().toISOString() },
    { onConflict: 'scriptorium_livre_id' })
  if (error) return { error: error.message }
  revalidatePath('/prof/scriptorium')
  return { success: true }
}

// Amendement d'UNE fiche de semaine (vue livre). La fusion se fait CÔTÉ SERVEUR
// dans le contenu EN BASE (jamais depuis l'instantané du client) : pas de perte de
// mise à jour entre deux onglets. Trois gardes :
//  1. génération PENDING → refus (un upsert repasserait la ligne en READY et le
//     compare-and-set du job after() jetterait silencieusement la génération) ;
//  2. verrou optimiste : l'updated_at vu au rendu doit être celui en base ;
//  3. écriture conditionnelle (.eq updated_at) → une course résiduelle échoue
//     proprement au lieu d'écraser.
// Base vide (jamais générée / ERROR) → seed de TOUTES les semaines du livre
// (parité avec l'ancien SectionReference : une référence READY couvre toujours
// toutes les semaines — l'amont du retour VF (assemblerAmontVf) en dépend).
// Marque amende_par_prof (anti-écrasement IA) + amende_le sur la SEULE semaine
// réellement modifiée (empreinte normalisée : espaces/entrées vides ignorés).
export async function enregistrerFicheSemaine(livreId: string, chapitre: ReferenceChapitre, updatedAtVu: string | null): Promise<{ success?: boolean; error?: string }> {
  await verifierProf()
  if (!chapitre || !Number.isInteger(chapitre.semaine)) return { error: 'Fiche invalide.' }

  const admin = createAdminClient()
  const { data: existant } = await admin.from('aletheia_livre_reference')
    .select('contenu, statut, updated_at').eq('scriptorium_livre_id', livreId).maybeSingle()
  if (existant?.statut === 'PENDING') {
    return { error: 'Une génération des fiches est en cours — attends qu’elle se termine (la page se met à jour seule).' }
  }
  if ((existant?.updated_at ?? null) !== updatedAtVu) {
    return { error: 'Les fiches ont changé depuis l’affichage de la page (autre onglet ou génération). Recharge la page puis réessaie.' }
  }

  // Titre AUTORITÉ de chaque semaine : la source unique est la découpe
  // (scriptorium_documents), jamais le champ titre de la fiche — que ni l'IA ni le
  // prof n'éditent. Première occurrence par semaine (aligné sur VueLivre).
  const { data: docs } = await admin.from('scriptorium_documents')
    .select('semaine, titre').eq('unite_id', livreId).not('semaine', 'is', null)
    .order('semaine', { ascending: true }).order('created_at', { ascending: true })
  const titreParSemaine = new Map<number, string>()
  for (const d of docs ?? []) {
    const s = d.semaine as number
    if (!titreParSemaine.has(s)) titreParSemaine.set(s, (d.titre as string | null) ?? '')
  }

  const propre: ReferenceChapitre = {
    semaine: chapitre.semaine,
    titre: titreParSemaine.get(chapitre.semaine)?.trim() || (chapitre.titre ?? '').trim(),
    these_canonique: (chapitre.these_canonique ?? '').trim(),
    arguments_cles: Array.isArray(chapitre.arguments_cles) ? chapitre.arguments_cles.map(a => (a ?? '').trim()).filter(Boolean) : [],
    concepts_cles: Array.isArray(chapitre.concepts_cles) ? chapitre.concepts_cles.map(a => (a ?? '').trim()).filter(Boolean) : [],
    synthese_modele: (chapitre.synthese_modele ?? '').trim(),
  }

  const { parseReference } = await import('@/utils/aletheia-retours')
  let base = parseReference(existant?.contenu)
  if (base.length === 0) {
    base = [...titreParSemaine.entries()].map(([semaine, titre]) => ({ semaine, titre, these_canonique: '', arguments_cles: [], concepts_cles: [], synthese_modele: '' }))
  }

  // Empreinte des champs ÉDITABLES (titre EXCLU : il vient de la découpe, pas du
  // prof ; sinon une simple re-découpe ferait passer la fiche « amendée »),
  // normalisée DES DEUX CÔTÉS (le jsonb legacy peut porter espaces / entrées vides).
  const norm = (c: ReferenceChapitre) => JSON.stringify([
    (c.these_canonique ?? '').trim(),
    (c.arguments_cles ?? []).map(a => (a ?? '').trim()).filter(Boolean),
    (c.concepts_cles ?? []).map(a => (a ?? '').trim()).filter(Boolean),
    (c.synthese_modele ?? '').trim(),
  ])

  const idx = base.findIndex(c => c.semaine === propre.semaine)
  const ancien = idx >= 0 ? base[idx] : undefined
  if (ancien && norm(ancien) === norm(propre)) return { success: true }

  const maintenant = new Date().toISOString()
  // Entrée éditée : genere_le hérité (ou approximé par l'updated_at du livre pour
  // une fiche legacy non vide), amende_le = maintenant.
  const genereLe = ancien?.genere_le ?? (ancien && (ancien.these_canonique ?? '').trim() ? existant?.updated_at ?? undefined : undefined)
  const editee: ReferenceChapitre = { ...propre, ...(genereLe ? { genere_le: genereLe } : {}), amende_le: maintenant }
  const fusion = [...base.filter(c => c.semaine !== propre.semaine), editee]
    // Fiches legacy non touchées sans stamp : approximer genere_le par l'updated_at
    // du livre, sinon le flag global amende_par_prof posé ci-dessous les ferait
    // passer « amendées » à tort.
    .map(c => (c.semaine !== propre.semaine && !c.genere_le && !c.amende_le && (c.these_canonique ?? '').trim() && existant?.updated_at)
      ? { ...c, genere_le: existant.updated_at }
      : c)
    .sort((a, b) => a.semaine - b.semaine)

  const commun = { contenu: fusion, statut: 'READY', erreur_at: null, amende_par_prof: true, updated_at: maintenant }
  if (existant) {
    // Compare-and-set : n'écrase que si la ligne n'a pas bougé depuis la lecture.
    const { data: maj, error } = await admin.from('aletheia_livre_reference')
      .update(commun).eq('scriptorium_livre_id', livreId).eq('updated_at', existant.updated_at).select('id')
    if (error) return { error: error.message }
    if (!maj || maj.length === 0) return { error: 'Les fiches ont changé pendant l’enregistrement. Recharge la page puis réessaie.' }
  } else {
    const { error } = await admin.from('aletheia_livre_reference').insert({ scriptorium_livre_id: livreId, ...commun })
    if (error) return { error: error.message }
  }
  revalidatePath('/prof/scriptorium')
  return { success: true }
}

// ── Prompts de génération des artefacts (carte + référence) — onglet Paramètres ──
// Édités depuis Scriptorium (les autres prompts Aletheia restent dans /prof/aletheia).
// Si un prompt est laissé identique au défaut, on stocke null → le code retombe sur
// le défaut (et ses évolutions futures).
const nullSiDefaut = (valeur: string, defaut: string): string | null =>
  valeur.trim() && valeur.trim() !== defaut.trim() ? valeur : null

export async function sauvegarderPromptsScriptorium(
  p: { promptCapstone: string; promptReference: string },
): Promise<{ success?: boolean; error?: string }> {
  await verifierProf()
  // {livre_entier} = l'ancrage (le texte du livre) : sans lui, l'artefact n'a plus sa source.
  const pCap = nullSiDefaut(p.promptCapstone, PROMPT_CAPSTONE_DEFAUT)
  if (pCap !== null && !pCap.includes('{livre_entier}')) {
    return { error: 'Le prompt de la carte doit garder la variable {livre_entier} (le texte du livre).' }
  }
  const pRef = nullSiDefaut(p.promptReference, PROMPT_REFERENCE_DEFAUT)
  if (pRef !== null && !pRef.includes('{livre_entier}')) {
    return { error: 'Le prompt de la référence doit garder la variable {livre_entier} (le texte du livre).' }
  }

  // Upsert CIBLÉ de ces 2 colonnes seulement (aletheia_params id=1) : sur conflit, seules
  // ces colonnes sont mises à jour → n'écrase pas les prompts gérés par /prof/aletheia.
  const admin = createAdminClient()
  const { error } = await admin.from('aletheia_params').upsert(
    { id: 1, prompt_capstone: pCap, prompt_reference: pRef, updated_at: new Date().toISOString() },
    { onConflict: 'id' })
  if (error) return { error: error.message }
  revalidatePath('/prof/scriptorium')
  revalidatePath('/prof/aletheia')
  return { success: true }
}

// ── Parcours : conteneur d'orchestration hebdomadaire — Parcours L4 ──────────
// Un parcours (scriptorium_parcours) numérote ses semaines 1..nb_semaines et pose
// des CRÉNEAUX (scriptorium_parcours_creneaux) : chaque créneau référence un contenu
// de bibliothèque (texte/cours) OU un livre (entier/tranche), à une position `ordre`
// dans une semaine. La traduction semaine→date réelle (par classe) viendra en L5.

export async function creerParcours(formData: FormData): Promise<{ id?: string; error?: string }> {
  const { supabase, userId } = await verifierProf()
  const titre = (formData.get('titre') as string)?.trim()
  const nbSemaines = Number(formData.get('nbSemaines') as string)
  if (!titre) return { error: 'Donne un titre au parcours.' }
  if (!Number.isInteger(nbSemaines) || nbSemaines < 1 || nbSemaines > 52)
    return { error: 'Indique un nombre de semaines valide (1–52).' }

  const { data, error } = await supabase
    .from('scriptorium_parcours')
    .insert({ titre, nb_semaines: nbSemaines, created_by: userId })
    .select('id')
    .single()
  if (error || !data) return { error: error?.message ?? 'Création impossible.' }
  revalidatePath('/prof/scriptorium')
  return { id: data.id as string }
}

// Réduction de nb_semaines : les créneaux au-delà de la nouvelle borne seraient
// orphelins → confirmation (needsConfirm) puis purge ciblée si force=true.
export async function modifierParcours(
  id: string,
  patch: { titre: string; nbSemaines: number; description?: string },
  force = false,
): Promise<{ success?: boolean; needsConfirm?: boolean; nbCreneauxAuDela?: number; error?: string }> {
  const { supabase } = await verifierProf()
  if (!RE_UUID.test(id)) return { error: 'Identifiant invalide.' }
  const titre = patch.titre?.trim()
  const nbSemaines = patch.nbSemaines
  if (!titre) return { error: 'Le titre est requis.' }
  if (!Number.isInteger(nbSemaines) || nbSemaines < 1 || nbSemaines > 52)
    return { error: 'Nombre de semaines invalide (1–52).' }

  const { data: auDela } = await supabase
    .from('scriptorium_parcours_creneaux')
    .select('id')
    .eq('parcours_id', id)
    .gt('semaine', nbSemaines)
  const n = (auDela ?? []).length
  if (n > 0 && !force) return { needsConfirm: true, nbCreneauxAuDela: n }

  // Update d'abord (nb_semaines) : si la purge des créneaux au-delà échoue APRÈS,
  // ils sont seulement MASQUÉS (la grille ne rend que 1..nb_semaines), jamais
  // supprimés avant un raccourcissement effectif.
  const { error } = await supabase
    .from('scriptorium_parcours')
    .update({ titre, nb_semaines: nbSemaines, description: patch.description?.trim() || null, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: error.message }

  if (n > 0 && force) {
    // Le modèle suit ses classes : les copies intactes des créneaux purgés partent aussi.
    const res = await retirerCreneauxModele(supabase, id, (auDela ?? []).map(c => c.id as string))
    if (res.error) console.error('[scriptorium] modifierParcours : purge des créneaux au-delà échouée', res.error)
  }
  revalidatePath('/prof/scriptorium')
  return { success: true }
}

// Soft-delete la coquille (masquée des listes) + DÉTACHE son contenu : créneaux et
// assignations classe sont purgés (pure config, aucune donnée élève). Sans cette
// purge, les créneaux survivraient et gonfleraient le compteur « utilisé dans N
// parcours » d'un contenu avec des parcours pourtant supprimés.
export async function supprimerParcours(id: string): Promise<{ success?: boolean; error?: string }> {
  const { supabase } = await verifierProf()
  if (!RE_UUID.test(id)) return { error: 'Identifiant invalide.' }
  const { error } = await supabase
    .from('scriptorium_parcours')
    .update({ supprime_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: error.message }
  // S5 — annule les synthèses non réalisées de ce parcours (toutes classes) AVANT le
  // DELETE en masse qui court-circuite retirerCreneau/retirerParcoursClasse. Gate OFF → no-op.
  await hookSyntheseSuppressionParcours(createAdminClient(), id)
  await supabase.from('scriptorium_parcours_creneaux').delete().eq('parcours_id', id)
  await supabase.from('scriptorium_parcours_classes').delete().eq('parcours_id', id)
  revalidatePath('/prof/scriptorium')
  return { success: true }
}

// Cible d'un créneau : un contenu de bibliothèque OU un livre (entier/tranche).
export type RefCreneau =
  | { contenuId: string }
  | { livreId: string; semaineDebut?: number | null; semaineFin?: number | null }

// Valide la CIBLE d'un créneau (contenu vivant, ou livre vivant + tranche dans
// l'étendue réelle) et renvoie ses champs à insérer (sans parcours/semaine).
// Partagé entre le modèle (ajouterCreneau) et l'instance (ajouterCreneauInstance, L3).
async function validerRefCreneau(
  supabase: SupabaseClient,
  ref: RefCreneau,
): Promise<{ payload?: Record<string, unknown>; error?: string }> {
  if ('contenuId' in ref) {
    if (!RE_UUID.test(ref.contenuId)) return { error: 'Contenu invalide.' }
    const { data: c } = await supabase
      .from('scriptorium_contenus').select('id, titre, supprime_at').eq('id', ref.contenuId).maybeSingle()
    if (!c || c.supprime_at) return { error: 'Contenu introuvable ou retiré.' }
    // Snapshot du titre (titre_affiche) : garde un libellé si le contenu est retiré plus tard.
    return { payload: { ref_type: 'contenu', contenu_id: ref.contenuId, titre_affiche: c.titre } }
  }
  if (!RE_UUID.test(ref.livreId)) return { error: 'Livre invalide.' }
  const { data: l } = await supabase
    .from('scriptorium_unites').select('id, type, label, supprime_at').eq('id', ref.livreId).maybeSingle()
  if (!l || l.type !== 'livre' || l.supprime_at) return { error: 'Livre introuvable ou retiré.' }
  const debut = ref.semaineDebut ?? null
  const fin = ref.semaineFin ?? null
  if ((debut == null) !== (fin == null)) {
    return { error: 'Tranche incomplète : indique un début ET une fin, ou aucun (livre entier).' }
  }
  if (debut != null && fin != null) {
    if (!Number.isInteger(debut) || !Number.isInteger(fin) || debut < 1 || debut > fin) {
      return { error: 'Tranche invalide.' }
    }
    const { data: docs } = await supabase
      .from('scriptorium_documents').select('semaine').eq('unite_id', ref.livreId).not('semaine', 'is', null)
    const maxSem = Math.max(0, ...((docs ?? []).map(d => d.semaine as number)))
    if (fin > maxSem) return { error: `Le livre a ${maxSem} semaine(s) ; la tranche ${debut}→${fin} sort de l'étendue.` }
  }
  return { payload: { ref_type: 'livre', livre_id: ref.livreId, livre_semaine_debut: debut, livre_semaine_fin: fin, titre_affiche: l.label } }
}

// Ajoute un créneau. `ordre` calculé max+1 avec RETRY sur violation d'unicité
// (parcours_id, semaine, ordre) — schema-S9. Valide la cible (vivante, type='livre',
// tranche dans l'étendue réelle du livre) avant insertion.
export async function ajouterCreneau(
  parcoursId: string,
  semaine: number,
  ref: RefCreneau,
): Promise<{ id?: string; nbClasses?: number; detachees?: number; avis?: string; error?: string }> {
  const { supabase } = await verifierProf()
  if (!RE_UUID.test(parcoursId)) return { error: 'Parcours invalide.' }
  if (!Number.isInteger(semaine) || semaine < 1) return { error: 'Semaine invalide.' }

  const { data: parc } = await supabase
    .from('scriptorium_parcours').select('nb_semaines, supprime_at').eq('id', parcoursId).maybeSingle()
  if (!parc || parc.supprime_at) return { error: 'Parcours introuvable.' }
  if (semaine > (parc.nb_semaines as number)) return { error: `Le parcours n'a que ${parc.nb_semaines} semaines.` }

  const cible = await validerRefCreneau(supabase, ref)
  if (cible.error || !cible.payload) return { error: cible.error ?? 'Cible invalide.' }
  const payload: Record<string, unknown> = { ...cible.payload, parcours_id: parcoursId, semaine }

  for (let essai = 0; essai < 5; essai++) {
    const { data: dernier } = await supabase
      .from('scriptorium_parcours_creneaux').select('ordre')
      .eq('parcours_id', parcoursId).eq('semaine', semaine)
      .order('ordre', { ascending: false }).limit(1).maybeSingle()
    const ordre = (dernier?.ordre ?? 0) + 1
    const { data, error } = await supabase
      .from('scriptorium_parcours_creneaux').insert({ ...payload, ordre }).select(COLS_CRENEAU_MODELE).single()
    if (!error && data) {
      // Le modèle suit ses classes : chaque instance active reçoit sa copie AVANT le hook
      // de synthèse, qui ne crée que là où l'instance contient le cours (et l'a ouvert).
      const prop = await propagerAjout(supabase, data as CreneauModeleRow, parc.nb_semaines as number)
      // S3 — un créneau-cours crée la synthèse pour chaque classe assignée à plan vivant.
      // Gate OFF → no-op. Les créneaux-livre ne portent pas de synthèse.
      if ('contenuId' in ref) await hookSyntheseAjoutCreneau(createAdminClient(), parcoursId, ref.contenuId)
      revalidatePath('/prof/scriptorium')
      return {
        id: (data as CreneauModeleRow).id,
        nbClasses: prop.nbClasses,
        detachees: prop.detachees,
        avis: prop.echecs.length ? `Ajouté au modèle, mais pas partout : ${prop.echecs.join(' · ')}` : undefined,
      }
    }
    if (error && error.code !== '23505') return { error: error.message } // 23505 = doublon d'ordre → retry
  }
  return { error: 'Conflit d’ordre, réessaie.' }
}

export async function retirerCreneau(
  creneauId: string,
): Promise<{ success?: boolean; retireDe?: number; conserveDans?: number; detachees?: number; error?: string }> {
  const { supabase } = await verifierProf()
  if (!RE_UUID.test(creneauId)) return { error: 'Identifiant invalide.' }
  const { data: cr } = await supabase
    .from('scriptorium_parcours_creneaux').select('parcours_id').eq('id', creneauId).maybeSingle()
  if (!cr) return { error: 'Créneau introuvable.' }
  // Le modèle suit ses classes : les copies intactes partent avec lui, les vues restent ;
  // la synthèse d'un cours retiré est re-jugée classe par classe (retirerCreneauxModele).
  const res = await retirerCreneauxModele(supabase, cr.parcours_id as string, [creneauId])
  if (res.error) return { error: res.error }
  revalidatePath('/prof/scriptorium')
  return { success: true, retireDe: res.retireDe, conserveDans: res.conserveDans, detachees: res.detachees }
}

// Réordonne les créneaux d'une semaine (ordreIds = tous les créneaux de cette
// semaine, dans le nouvel ordre). Deux passes pour éviter une collision transitoire
// avec l'unicité (parcours, semaine, ordre) : d'abord des valeurs NÉGATIVES
// temporaires (jamais en collision avec des ordres positifs), puis 1..n.
export async function reordonnerCreneaux(
  parcoursId: string,
  semaine: number,
  ordreIds: string[],
): Promise<{ success?: boolean; suivi?: number; conserve?: number; detachees?: number; error?: string }> {
  const { supabase } = await verifierProf()
  if (!RE_UUID.test(parcoursId)) return { error: 'Parcours invalide.' }
  if (!Number.isInteger(semaine) || semaine < 1) return { error: 'Semaine invalide.' }
  if (!Array.isArray(ordreIds) || ordreIds.some(id => !RE_UUID.test(id))) return { error: 'Ordre invalide.' }

  // Garde d'intégrité : ordreIds DOIT être exactement l'ensemble des créneaux de
  // cette semaine — sinon la passe 2 (rangs positifs) pourrait entrer en collision
  // avec un créneau non listé. On refuse une liste périmée/partielle plutôt que de
  // corrompre l'ordre. (Avec l'ensemble complet, négatif→final ne collisionne jamais.)
  const { data: actuels } = await supabase
    .from('scriptorium_parcours_creneaux').select('id, ordre')
    .eq('parcours_id', parcoursId).eq('semaine', semaine)
  const idsBase = new Set((actuels ?? []).map(r => r.id as string))
  const idsFournis = new Set(ordreIds)
  if (idsBase.size !== idsFournis.size || [...idsBase].some(id => !idsFournis.has(id))) {
    return { error: 'La liste des créneaux a changé — recharge la page puis réessaie.' }
  }
  // L'ordre d'AVANT : c'est contre lui qu'on reconnaît une classe qui suivait encore.
  const ancienOrdre = [...(actuels ?? [])]
    .sort((a, b) => (a.ordre as number) - (b.ordre as number)).map(r => r.id as string)

  for (let i = 0; i < ordreIds.length; i++) {
    const { error } = await supabase.from('scriptorium_parcours_creneaux')
      .update({ ordre: -(i + 1) }).eq('id', ordreIds[i]).eq('parcours_id', parcoursId).eq('semaine', semaine)
    if (error) return { error: error.message }
  }
  for (let i = 0; i < ordreIds.length; i++) {
    const { error } = await supabase.from('scriptorium_parcours_creneaux')
      .update({ ordre: i + 1 }).eq('id', ordreIds[i]).eq('parcours_id', parcoursId).eq('semaine', semaine)
    if (error) return { error: error.message }
  }
  // Le modèle suit ses classes : leurs copies permutent parmi les positions qu'elles
  // occupent (les créneaux propres ne bougent pas) — sauf dans une classe qui avait
  // réordonné elle-même, qui garde son ordre.
  const prop = await propagerOrdre(supabase, ancienOrdre, ordreIds)
  revalidatePath('/prof/scriptorium')
  return { success: true, suivi: prop.suivi, conserve: prop.conserve, detachees: prop.detachees }
}

// Déplace un créneau vers une autre semaine (ajouté en fin de la semaine cible :
// ordre = max+1, même retry anti-collision).
export async function deplacerCreneau(
  creneauId: string,
  nouvelleSemaine: number,
): Promise<{ success?: boolean; suivi?: number; conserve?: number; detachees?: number; avis?: string; error?: string }> {
  const { supabase } = await verifierProf()
  if (!RE_UUID.test(creneauId)) return { error: 'Identifiant invalide.' }
  if (!Number.isInteger(nouvelleSemaine) || nouvelleSemaine < 1) return { error: 'Semaine invalide.' }

  const { data: cr } = await supabase
    .from('scriptorium_parcours_creneaux').select('parcours_id, semaine').eq('id', creneauId).maybeSingle()
  if (!cr) return { error: 'Créneau introuvable.' }
  if (cr.semaine === nouvelleSemaine) return { success: true }

  const { data: parc } = await supabase
    .from('scriptorium_parcours').select('nb_semaines').eq('id', cr.parcours_id as string).maybeSingle()
  if (!parc) return { error: 'Parcours introuvable.' }
  if (nouvelleSemaine > (parc.nb_semaines as number)) {
    return { error: `Le parcours n'a que ${parc.nb_semaines} semaines.` }
  }

  for (let essai = 0; essai < 5; essai++) {
    const { data: dernier } = await supabase
      .from('scriptorium_parcours_creneaux').select('ordre')
      .eq('parcours_id', cr.parcours_id as string).eq('semaine', nouvelleSemaine)
      .order('ordre', { ascending: false }).limit(1).maybeSingle()
    const ordre = (dernier?.ordre ?? 0) + 1
    const { error } = await supabase.from('scriptorium_parcours_creneaux')
      .update({ semaine: nouvelleSemaine, ordre }).eq('id', creneauId)
    if (!error) {
      // Le modèle suit ses classes : les copies intactes changent de semaine avec lui,
      // celles qu'une classe a déjà vues gardent la leur.
      const { data: m } = await supabase
        .from('scriptorium_parcours_creneaux').select(COLS_CRENEAU_MODELE).eq('id', creneauId).maybeSingle()
      const prop = m
        ? await propagerDeplacement(supabase, m as CreneauModeleRow, parc.nb_semaines as number)
        : { suivi: 0, conserve: 0, detachees: 0, echecs: 0 }
      revalidatePath('/prof/scriptorium')
      return {
        success: true, suivi: prop.suivi, conserve: prop.conserve, detachees: prop.detachees,
        avis: prop.echecs ? `${prop.echecs} classe(s) n'ont pas pu suivre le déplacement.` : undefined,
      }
    }
    if (error.code !== '23505') return { error: error.message }
  }
  return { error: 'Conflit d’ordre, réessaie.' }
}

// ── Instance de parcours par classe — RAG L1 (SPEC_scriptorium_rag.md §4) ───
// L'assignation MATÉRIALISE une instance : copie 1:1 des créneaux du modèle +
// éclatement en ÉLÉMENTS à grain fin (section de cours / contenu entier / séance
// de livre) — le « vu » du prof vit sur l'élément. L'instance diverge ensuite
// librement pour ce qui lui est PROPRE ; mais depuis le 02/09 LE MODÈLE SUIT SES
// CLASSES (bloc plus bas) : un ajout, un retrait ou un déplacement au modèle
// redescend dans chaque instance, sauf sur ce qu'elle a déjà vu.
// `reinitialiserInstance` reste la remise à zéro destructive.

// Matérialise l'instance d'une assignation depuis le modèle (§4.3). Abstention
// si l'instance existe déjà (une classe déjà servie n'est jamais re-matérialisée
// ici). Les créneaux pointant un contenu/livre soft-deleté sont copiés TELS
// QUELS (badge « retiré » à l'affichage, comportement existant du modèle).
async function materialiserInstance(
  supabase: SupabaseClient,
  parcoursClasseId: string,
  parcoursId: string,
  nbSemaines: number,
): Promise<{ error?: string }> {
  const { data: deja } = await supabase
    .from('scriptorium_parcours_classe_creneaux')
    .select('id').eq('parcours_classe_id', parcoursClasseId).limit(1).maybeSingle()
  if (deja) return {}

  const { data: modeles, error: eLect } = await supabase
    .from('scriptorium_parcours_creneaux')
    .select('id, semaine, ordre, ref_type, contenu_id, livre_id, livre_semaine_debut, livre_semaine_fin, titre_affiche, note')
    .eq('parcours_id', parcoursId)
    .order('semaine', { ascending: true }).order('ordre', { ascending: true })
  if (eLect) return { error: eLect.message }
  if (!modeles || modeles.length === 0) return {} // modèle vide → instance vide (légitime)

  // 1. Copie 1:1 des créneaux (provenance modele_creneau_id renseignée).
  const { data: copies, error: eIns } = await supabase
    .from('scriptorium_parcours_classe_creneaux')
    .insert(modeles.map(m => ({
      parcours_classe_id: parcoursClasseId,
      semaine: m.semaine, ordre: m.ordre, ref_type: m.ref_type,
      contenu_id: m.contenu_id, livre_id: m.livre_id,
      livre_semaine_debut: m.livre_semaine_debut, livre_semaine_fin: m.livre_semaine_fin,
      titre_affiche: m.titre_affiche, note: m.note,
      modele_creneau_id: m.id,
    })))
    .select('id, semaine, ref_type, contenu_id, livre_id, livre_semaine_debut, livre_semaine_fin')
  if (eIns || !copies) {
    // 23505 (pcc_ordre_uk) = matérialisation concurrente déjà passée → l'autre a gagné.
    if (eIns?.code === '23505') return {}
    return { error: eIns?.message ?? 'Copie des créneaux impossible.' }
  }

  // 2. Éclatement en éléments (§4.3) : selon la cible de chaque créneau copié.
  return materialiserElementsPourCreneaux(supabase, copies as CreneauAMaterialiser[], nbSemaines)
}

// Créneau d'instance dont les ÉLÉMENTS restent à matérialiser (§4.3).
interface CreneauAMaterialiser {
  id: string
  semaine: number
  ref_type: string
  contenu_id: string | null
  livre_id: string | null
  livre_semaine_debut: number | null
  livre_semaine_fin: number | null
}

// Matérialise les éléments de créneaux d'instance (§4.3) : cours découpé → 1
// élément par section ; texte / cours non découpé → 1 élément 'contenu' ; livre →
// 1 élément par séance k ∈ [a,b] (entier = [min,max] des séances-docs), étalés
// semaine = S + (k − a), CLAMPÉS à nb_semaines (excédents empilés). Partagé entre
// la matérialisation d'une instance entière et l'ajout d'un créneau isolé (L3).
async function materialiserElementsPourCreneaux(
  supabase: SupabaseClient,
  creneaux: CreneauAMaterialiser[],
  nbSemaines: number,
): Promise<{ error?: string }> {
  const contenuIds = [...new Set(creneaux.map(c => c.contenu_id).filter((x): x is string => !!x))]
  const livreIds = [...new Set(creneaux.map(c => c.livre_id).filter((x): x is string => !!x))]
  const [{ data: conts }, { data: secs }, { data: docs }] = await Promise.all([
    contenuIds.length
      ? supabase.from('scriptorium_contenus').select('id, type').in('id', contenuIds)
      : Promise.resolve({ data: [] as { id: string; type: string }[] }),
    contenuIds.length
      ? supabase.from('scriptorium_contenu_sections').select('id, contenu_id, ordre')
          .in('contenu_id', contenuIds).order('ordre', { ascending: true })
      : Promise.resolve({ data: [] as { id: string; contenu_id: string; ordre: number }[] }),
    livreIds.length
      ? supabase.from('scriptorium_documents').select('unite_id, semaine')
          .in('unite_id', livreIds).not('semaine', 'is', null)
      : Promise.resolve({ data: [] as { unite_id: string; semaine: number }[] }),
  ])
  const typeContenu = new Map((conts ?? []).map(c => [c.id as string, c.type as string]))
  const sectionsParContenu = new Map<string, { id: string; ordre: number }[]>()
  for (const s of secs ?? []) {
    const arr = sectionsParContenu.get(s.contenu_id as string) ?? []
    arr.push({ id: s.id as string, ordre: s.ordre as number })
    sectionsParContenu.set(s.contenu_id as string, arr)
  }
  const bornesLivre = new Map<string, { mn: number; mx: number }>()
  for (const d of docs ?? []) {
    const lid = d.unite_id as string
    const sem = d.semaine as number
    const b = bornesLivre.get(lid)
    if (!b) bornesLivre.set(lid, { mn: sem, mx: sem })
    else { b.mn = Math.min(b.mn, sem); b.mx = Math.max(b.mx, sem) }
  }

  const elements: Record<string, unknown>[] = []
  for (const c of creneaux) {
    if (c.ref_type === 'contenu') {
      const cid = c.contenu_id as string
      const sections = typeContenu.get(cid) === 'cours' ? (sectionsParContenu.get(cid) ?? []) : []
      if (sections.length > 0) {
        for (const s of sections) {
          elements.push({ creneau_id: c.id, ref_type: 'section', section_id: s.id, semaine: c.semaine, ordre: s.ordre })
        }
      } else {
        elements.push({ creneau_id: c.id, ref_type: 'contenu', semaine: c.semaine, ordre: 1 })
      }
    } else {
      const lid = c.livre_id as string
      const b = bornesLivre.get(lid)
      const deb = c.livre_semaine_debut ?? b?.mn ?? null
      const fin = c.livre_semaine_fin ?? b?.mx ?? null
      if (deb == null || fin == null || deb > fin) continue // livre sans découpe et sans bornes → rien à étaler
      const ordreParSemaine = new Map<number, number>()
      for (let k = deb; k <= fin; k++) {
        const sem = Math.min(c.semaine + (k - deb), nbSemaines)
        const ord = (ordreParSemaine.get(sem) ?? 0) + 1
        ordreParSemaine.set(sem, ord)
        elements.push({ creneau_id: c.id, ref_type: 'livre_semaine', livre_semaine: k, semaine: sem, ordre: ord })
      }
    }
  }
  if (elements.length > 0) {
    const { error: eEl } = await supabase.from('scriptorium_parcours_classe_elements').insert(elements)
    if (eEl && eEl.code !== '23505') return { error: eEl.message }
  }
  return {}
}

// ── LE MODÈLE SUIT SES CLASSES (02/09/2026) ──────────────────────────────────
// ⭐ POURQUOI. « Je sais combien de temps vont durer mes cours, mais le contenu
//    exact, je ne sais pas » (Louis, 01/09) : un parcours se remplit au fil de
//    l'année, APRÈS avoir été assigné. Or l'instance était une photo du modèle
//    prise à l'assignation — mesuré en prod le 02/09 : « D'où viennent nos
//    croyances ? », ajouté au modèle la veille, absent du parcours de T5.
// ⭐ LA RÈGLE (utils/parcours-propagation.ts) : ce que le modèle AJOUTE, RETIRE ou
//    DÉPLACE, les classes le suivent — SAUF CE QU'UNE CLASSE A DÉJÀ VU. Une copie
//    sans aucun élément coché « vu » est encore une intention du modèle ; dès
//    qu'un élément est vu, elle appartient à l'histoire de la classe.
//      · ajout   → copie en fin de la même semaine de chaque instance active ;
//      · retrait → les copies intactes partent, les vues restent (le geste le dit) ;
//      · déplacement → les copies intactes suivent (éléments re-matérialisés) ;
//      · réordonnancement → les copies permutent parmi leurs positions (l'instance
//        ne sait pas réordonner ses créneaux : aucun choix de classe à écraser).
//    Ce que la classe a ajouté elle-même, retiré, déplacé élément par élément, ou
//    RÉORDONNÉ elle-même (reordonnerCreneauxInstance — l'ordre du modèle ne
//    redescend que là où la classe suivait encore son ordre d'avant, cf.
//    suitLOrdreDuModele) n'est jamais touché ; `reinitialiserInstance` reste la
//    remise à zéro.
// ⭐ DEUX COLONNES, une migration (parcours_suivi_du_modele.sql, 02/09 soir) :
//    `suit_modele` — l'interrupteur « cette classe ne suit plus le modèle »
//    (rien n'y arrive ni n'en part de lui-même) ; `modele_retire_at` — la
//    provenance d'une copie conservée (la FK `set null` la rendait indiscernable
//    d'un ajout à la main), pour que l'instance dise « plus au modèle ».
//    Lues À PART et TOLÉRÉES absentes : sans la migration, toutes suivent.
// ⚠️ Un cours que la classe avait AJOUTÉ À LA MAIN avant qu'il entre au modèle est
//    RECONNU (même cible) et rattaché, jamais dupliqué — c'est l'état réel de T5.
// ⚠️ Pas de transaction (supabase-js) : chaque instance est traitée à part, les
//    échecs remontent en `avis`, et le panneau « le modèle a N contenus que cette
//    classe n'a pas » de l'instance offre la reprise (recupererCreneauxModele).

const COLS_CRENEAU_MODELE =
  'id, parcours_id, semaine, ordre, ref_type, contenu_id, livre_id, livre_semaine_debut, livre_semaine_fin, titre_affiche, note'

interface CreneauModeleRow {
  id: string
  parcours_id: string
  semaine: number
  ordre: number
  ref_type: string
  contenu_id: string | null
  livre_id: string | null
  livre_semaine_debut: number | null
  livre_semaine_fin: number | null
  titre_affiche: string | null
  note: string | null
}

interface CibleRow {
  ref_type: string
  contenu_id: string | null
  livre_id: string | null
  livre_semaine_debut: number | null
  livre_semaine_fin: number | null
}
const cibleDe = (c: CibleRow) => ({
  refType: c.ref_type, contenuId: c.contenu_id, livreId: c.livre_id,
  livreSemaineDebut: c.livre_semaine_debut, livreSemaineFin: c.livre_semaine_fin,
})

// Les assignations qui NE SUIVENT PLUS le modèle, parmi des ids donnés. Lecture
// tolérante : `parcours_suivi_du_modele.sql` non jouée ⇒ aucune (toutes suivent).
async function instancesDetachees(supabase: SupabaseClient, pcIds: string[]): Promise<Set<string>> {
  if (pcIds.length === 0) return new Set()
  const { data, error } = await supabase
    .from('scriptorium_parcours_classes').select('id, suit_modele').in('id', pcIds)
  if (error) return new Set()
  return new Set((data ?? []).filter(r => r.suit_modele === false).map(r => r.id as string))
}

// Instances d'un parcours qui SUIVENT le modèle (actives et non détachées), et le
// nombre de celles qui ne le suivent plus — pour que le geste du modèle le dise.
async function instancesActives(
  supabase: SupabaseClient, parcoursId: string,
): Promise<{ suivent: { pcId: string; classeId: string }[]; detachees: number }> {
  const { data } = await supabase
    .from('scriptorium_parcours_classes').select('id, classe_id')
    .eq('parcours_id', parcoursId).eq('statut', 'active')
  const toutes = (data ?? []).map(r => ({ pcId: r.id as string, classeId: r.classe_id as string }))
  const detachees = await instancesDetachees(supabase, toutes.map(t => t.pcId))
  return { suivent: toutes.filter(t => !detachees.has(t.pcId)), detachees: detachees.size }
}

// Copie UN créneau du modèle dans UNE instance : en fin de sa semaine (ordre max+1,
// retry 23505 — patron ajouterCreneauInstance), puis ses éléments (§4.3).
// Idempotent : une copie déjà présente n'est pas refaite ; un créneau PROPRE de même
// cible est RATTACHÉ (modele_creneau_id) au lieu d'être doublé.
async function copierCreneauModele(
  supabase: SupabaseClient, pcId: string, m: CreneauModeleRow, nbSemaines: number,
): Promise<{ id?: string; deja?: boolean; error?: string }> {
  const { data: existants } = await supabase
    .from('scriptorium_parcours_classe_creneaux')
    .select('id, ref_type, contenu_id, livre_id, livre_semaine_debut, livre_semaine_fin, modele_creneau_id')
    .eq('parcours_classe_id', pcId)
  const rows = (existants ?? []) as (CibleRow & { id: string; modele_creneau_id: string | null })[]
  if (rows.some(r => r.modele_creneau_id === m.id)) return { deja: true }
  const jumeau = rows.find(r => !r.modele_creneau_id && memeCible(cibleDe(r), cibleDe(m)))
  if (jumeau) {
    const { error } = await supabase.from('scriptorium_parcours_classe_creneaux')
      .update({ modele_creneau_id: m.id }).eq('id', jumeau.id)
    if (error) return { error: error.message }
    // Le modèle reprend ce contenu : la copie n'est plus « plus au modèle » (tolérant).
    await supabase.from('scriptorium_parcours_classe_creneaux')
      .update({ modele_retire_at: null }).eq('id', jumeau.id)
    return { id: jumeau.id, deja: true }
  }
  const semaine = Math.min(Math.max(1, m.semaine), Math.max(1, nbSemaines))
  const payload = {
    parcours_classe_id: pcId, semaine, ref_type: m.ref_type,
    contenu_id: m.contenu_id, livre_id: m.livre_id,
    livre_semaine_debut: m.livre_semaine_debut, livre_semaine_fin: m.livre_semaine_fin,
    titre_affiche: m.titre_affiche, note: m.note, modele_creneau_id: m.id,
  }
  for (let essai = 0; essai < 5; essai++) {
    const { data: dernier } = await supabase
      .from('scriptorium_parcours_classe_creneaux').select('ordre')
      .eq('parcours_classe_id', pcId).eq('semaine', semaine)
      .order('ordre', { ascending: false }).limit(1).maybeSingle()
    const ordre = (dernier?.ordre ?? 0) + 1
    const { data, error } = await supabase
      .from('scriptorium_parcours_classe_creneaux').insert({ ...payload, ordre })
      .select('id, semaine, ref_type, contenu_id, livre_id, livre_semaine_debut, livre_semaine_fin').single()
    if (!error && data) {
      const mat = await materialiserElementsPourCreneaux(supabase, [data as CreneauAMaterialiser], nbSemaines)
      if (mat.error) return { error: `copié, mais éléments non matérialisés : ${mat.error}` }
      return { id: data.id as string }
    }
    if (error && error.code !== '23505') return { error: error.message }
  }
  return { error: 'conflit d’ordre' }
}

// AJOUT au modèle → chaque instance active reçoit sa copie. Renvoie le nombre de
// classes servies et les échecs nommés (l'ajout au modèle, lui, est acquis).
async function propagerAjout(
  supabase: SupabaseClient, m: CreneauModeleRow, nbSemaines: number,
): Promise<{ nbClasses: number; detachees: number; echecs: string[] }> {
  let nbClasses = 0
  const rates: { classeId: string; error: string }[] = []
  const { suivent, detachees } = await instancesActives(supabase, m.parcours_id)
  for (const inst of suivent) {
    const r = await copierCreneauModele(supabase, inst.pcId, m, nbSemaines)
    if (r.error) rates.push({ classeId: inst.classeId, error: r.error })
    else nbClasses++
  }
  if (rates.length === 0) return { nbClasses, detachees, echecs: [] }
  const { data: noms } = await supabase.from('classes').select('id, nom').in('id', rates.map(r => r.classeId))
  const nom = new Map((noms ?? []).map(c => [c.id as string, c.nom as string]))
  return { nbClasses, detachees, echecs: rates.map(r => `${nom.get(r.classeId) ?? 'classe'} — ${r.error}`) }
}

// Copies d'instance des créneaux modèle donnés, avec « au moins un élément vu ». Les
// copies d'une classe qui NE SUIT PLUS le modèle sont écartées (et comptées) : le
// modèle ne les touche plus.
async function copiesDuModele(
  supabase: SupabaseClient, modeleIds: string[],
): Promise<{ copies: CopieDeModele[]; detachees: number }> {
  if (modeleIds.length === 0) return { copies: [], detachees: 0 }
  const { data } = await supabase
    .from('scriptorium_parcours_classe_creneaux')
    .select('id, parcours_classe_id, modele_creneau_id, semaine, ordre')
    .in('modele_creneau_id', modeleIds)
  const toutes = (data ?? []) as { id: string; parcours_classe_id: string; modele_creneau_id: string; semaine: number; ordre: number }[]
  if (toutes.length === 0) return { copies: [], detachees: 0 }
  const hors = await instancesDetachees(supabase, [...new Set(toutes.map(r => r.parcours_classe_id))])
  const rows = toutes.filter(r => !hors.has(r.parcours_classe_id))
  const { data: vus } = rows.length
    ? await supabase.from('scriptorium_parcours_classe_elements').select('creneau_id')
        .in('creneau_id', rows.map(r => r.id)).not('vu_at', 'is', null)
    : { data: [] as { creneau_id: string }[] }
  const vues = new Set((vus ?? []).map(v => v.creneau_id as string))
  return {
    copies: rows.map(r => ({
      id: r.id, pcId: r.parcours_classe_id, modeleId: r.modele_creneau_id,
      semaine: r.semaine, ordre: r.ordre, vue: vues.has(r.id),
    })),
    detachees: hors.size,
  }
}

// RETRAIT de créneaux du modèle. Les copies sont relevées AVANT le DELETE du modèle
// (la FK met leur modele_creneau_id à null) ; le modèle part d'abord (s'il refuse,
// rien d'autre ne bouge), puis les copies intactes ; enfin la synthèse de chaque
// cours retiré est re-jugée classe par classe (elle ne reste que là où il vit encore).
async function retirerCreneauxModele(
  supabase: SupabaseClient, parcoursId: string, modeleIds: string[],
): Promise<{ retireDe: number; conserveDans: number; detachees: number; error?: string }> {
  if (modeleIds.length === 0) return { retireDe: 0, conserveDans: 0, detachees: 0 }
  const { data: rows } = await supabase
    .from('scriptorium_parcours_creneaux').select('id, ref_type, contenu_id')
    .in('id', modeleIds).eq('parcours_id', parcoursId)
  const modeles = (rows ?? []) as { id: string; ref_type: string; contenu_id: string | null }[]
  if (modeles.length === 0) return { retireDe: 0, conserveDans: 0, detachees: 0, error: 'Créneau introuvable.' }
  const { copies, detachees } = await copiesDuModele(supabase, modeles.map(m => m.id))
  const { intactes, vues, nbClassesIntactes, nbClassesVues } = partagerCopies(copies)

  // La PROVENANCE des copies conservées, AVANT que la FK efface le lien : l'instance
  // dira « plus au modèle ». Tolérant (migration parcours_suivi_du_modele.sql).
  if (vues.length > 0) {
    await supabase.from('scriptorium_parcours_classe_creneaux')
      .update({ modele_retire_at: new Date().toISOString() }).in('id', vues.map(c => c.id))
  }
  const { error } = await supabase
    .from('scriptorium_parcours_creneaux').delete().in('id', modeles.map(m => m.id))
  if (error) return { retireDe: 0, conserveDans: nbClassesVues, detachees, error: error.message }
  if (intactes.length > 0) {
    const { error: eCop } = await supabase
      .from('scriptorium_parcours_classe_creneaux').delete().in('id', intactes.map(c => c.id)) // cascade éléments
    if (eCop) return { retireDe: 0, conserveDans: nbClassesVues, detachees, error: `retiré du modèle, mais pas des classes : ${eCop.message}` }
  }
  const admin = createAdminClient()
  const cours = new Set(modeles.filter(m => m.ref_type === 'contenu' && m.contenu_id).map(m => m.contenu_id as string))
  for (const contenuId of cours) await hookSyntheseRetraitCreneau(admin, parcoursId, contenuId)
  return { retireDe: nbClassesIntactes, conserveDans: nbClassesVues, detachees }
}

// DÉPLACEMENT d'un créneau du modèle : les copies intactes suivent — nouvelle
// semaine, en fin de semaine (ordre max+1), éléments refaits pour cette semaine
// (aucun n'est vu, rien n'est perdu) ; les copies vues gardent leur semaine.
async function propagerDeplacement(
  supabase: SupabaseClient, m: CreneauModeleRow, nbSemaines: number,
): Promise<{ suivi: number; conserve: number; detachees: number; echecs: number }> {
  const { copies, detachees } = await copiesDuModele(supabase, [m.id])
  const { intactes, nbClassesVues } = partagerCopies(copies)
  const semaine = Math.min(Math.max(1, m.semaine), Math.max(1, nbSemaines))
  let suivi = 0
  let echecs = 0
  for (const c of intactes) {
    if (c.semaine === semaine) { suivi++; continue }
    let ok = false
    for (let essai = 0; essai < 5 && !ok; essai++) {
      const { data: dernier } = await supabase
        .from('scriptorium_parcours_classe_creneaux').select('ordre')
        .eq('parcours_classe_id', c.pcId).eq('semaine', semaine)
        .order('ordre', { ascending: false }).limit(1).maybeSingle()
      const { error } = await supabase.from('scriptorium_parcours_classe_creneaux')
        .update({ semaine, ordre: (dernier?.ordre ?? 0) + 1 }).eq('id', c.id)
      if (!error) ok = true
      else if (error.code !== '23505') break
    }
    if (!ok) { echecs++; continue }
    const { error: eDel } = await supabase
      .from('scriptorium_parcours_classe_elements').delete().eq('creneau_id', c.id)
    if (eDel) { echecs++; continue }
    const mat = await materialiserElementsPourCreneaux(supabase, [{
      id: c.id, semaine, ref_type: m.ref_type, contenu_id: m.contenu_id, livre_id: m.livre_id,
      livre_semaine_debut: m.livre_semaine_debut, livre_semaine_fin: m.livre_semaine_fin,
    }], nbSemaines)
    if (mat.error) echecs++
    else suivi++
  }
  return { suivi, conserve: nbClassesVues, detachees, echecs }
}

// RÉORDONNANCEMENT d'une semaine du modèle : dans chaque instance qui SUIVAIT ENCORE
// l'ordre d'avant (suitLOrdreDuModele contre `ancienOrdre`), les copies permutent parmi
// les positions qu'elles occupent (reassignerPositions) ; une classe qui avait
// réordonné elle-même garde son ordre. Deux passes négatives/positives — patron
// reordonnerCreneaux. Meilleur effort : un échec est journalisé, l'ordre du modèle
// est acquis. Renvoie les comptes en CLASSES (une semaine d'instance par classe).
async function propagerOrdre(
  supabase: SupabaseClient, ancienOrdre: string[], nouvelOrdre: string[],
): Promise<{ suivi: number; conserve: number; detachees: number }> {
  const { copies, detachees } = await copiesDuModele(supabase, nouvelOrdre)
  const parSemaine = new Map<string, CopieDeModele[]>()
  for (const c of copies) {
    const cle = `${c.pcId}|${c.semaine}`
    parSemaine.set(cle, [...(parSemaine.get(cle) ?? []), c])
  }
  let suivi = 0
  let conserve = 0
  for (const groupe of parSemaine.values()) {
    if (!suitLOrdreDuModele(groupe, ancienOrdre)) { conserve++; continue }
    suivi++
    const changements = reassignerPositions(groupe, nouvelOrdre)
    if (changements.length === 0) continue
    for (let i = 0; i < changements.length; i++) {
      const { error } = await supabase.from('scriptorium_parcours_classe_creneaux')
        .update({ ordre: -(i + 1) }).eq('id', changements[i].id)
      if (error) { console.error('[scriptorium] propagation de l’ordre (passe 1)', error.message); return { suivi, conserve, detachees } }
    }
    for (const ch of changements) {
      const { error } = await supabase.from('scriptorium_parcours_classe_creneaux')
        .update({ ordre: ch.ordre }).eq('id', ch.id)
      if (error) { console.error('[scriptorium] propagation de l’ordre (passe 2)', error.message); return { suivi, conserve, detachees } }
    }
  }
  return { suivi, conserve, detachees }
}

// ── Décalages : ce qui permet à DEUX PARCOURS d'une classe de S'ALTERNER ──────
// Par défaut les semaines d'un parcours sont consécutives ; un décalage insère des
// semaines d'enseignement vides pour CE parcours-là, laissant la place à l'autre.
// Lecture TOLÉRANTE : tant que `parcours_decalages.sql` n'est pas joué, on rend {}
// et tout se comporte comme avant (mapping consécutif).
async function lireDecalages(
  supabase: SupabaseClient, parcoursId: string, classeId: string,
): Promise<Decalages> {
  const { data, error } = await supabase
    .from('scriptorium_parcours_classes').select('decalages')
    .eq('parcours_id', parcoursId).eq('classe_id', classeId).maybeSingle()
  if (error) return {}
  return (data?.decalages as Decalages | null) ?? {}
}

// Assignation + parcours d'un pcId, avec ses décalages (tolérants). Socle commun des
// gestes du PARCOURS DE LA CLASSE (planifier, décaler, publier).
async function lireInstance(supabase: SupabaseClient, pcId: string): Promise<{
  pc: { id: string; parcoursId: string; classeId: string; dateDebut: string | null }
  nbSemaines: number
  decalages: Decalages
} | { error: string }> {
  const { data: pc } = await supabase
    .from('scriptorium_parcours_classes')
    .select('id, parcours_id, classe_id, date_debut').eq('id', pcId).maybeSingle()
  if (!pc) return { error: 'Assignation introuvable.' }
  const { data: parc } = await supabase
    .from('scriptorium_parcours').select('nb_semaines, supprime_at')
    .eq('id', pc.parcours_id as string).maybeSingle()
  if (!parc || parc.supprime_at) return { error: 'Parcours introuvable.' }
  const { data: dec, error: eDec } = await supabase
    .from('scriptorium_parcours_classes').select('decalages').eq('id', pcId).maybeSingle()
  return {
    pc: {
      id: pc.id as string,
      parcoursId: pc.parcours_id as string,
      classeId: pc.classe_id as string,
      dateDebut: (pc.date_debut as string | null) ?? null,
    },
    nbSemaines: (parc.nb_semaines as number) ?? 0,
    decalages: eDec ? {} : ((dec?.decalages as Decalages | null) ?? {}),
  }
}

// Gardes communes à toute pose de date : une frise incohérente, une date hors
// semestres ou un débordement hors année scolaire REFUSENT ; un débordement sur un
// semestre à créer (même AY) passe avec avis. Règle unique — cf. décision 8 du SPEC.
async function validerFenetre(
  date: string, nbSemaines: number, decalages: Decalages,
): Promise<{ avis?: string } | { error: string }> {
  const ap = await resoudreFrisePourDate(date, nbSemaines, decalages)
  if (ap.avisBloquant) {
    return { error: ap.avis ?? 'Configuration des semestres incohérente — corrige-la dans le Calendrier.' }
  }
  if (ap.semaines.every(s => s.statut !== 'definie')) {
    return { error: ap.avis ?? 'Cette date ne tombe dans aucun semestre défini de l’année scolaire.' }
  }
  if (ap.nbNonPlanifiable > 0) {
    return {
      error: `Ce parcours prolonge au-delà des semestres définis de l’année scolaire (${ap.nbNonPlanifiable} semaine(s) non planifiable(s)). Définis le semestre suivant, raccourcis le parcours, ou retire un décalage.`,
    }
  }
  if (ap.nbADefinir > 0) {
    return { avis: `${ap.nbADefinir} semaine(s) « à définir » : le parcours déborde sur un semestre non encore créé de l’année scolaire.` }
  }
  return {}
}

/**
 * Pose (ou retire) la date de début DEPUIS LE PARCOURS DE LA CLASSE. C'est le geste
 * qui a quitté le panneau d'assignation du modèle : assigner ne demande plus de date,
 * on la pose ici, là où la grille datée est sous les yeux. `null` dé-planifie.
 */
export async function planifierInstance(
  pcId: string, dateDebut: string | null,
): Promise<{ success?: boolean; error?: string; avis?: string }> {
  const { supabase } = await verifierProf()
  if (!RE_UUID.test(pcId)) return { error: 'Identifiant invalide.' }
  const inst = await lireInstance(supabase, pcId)
  if ('error' in inst) return { error: inst.error }

  const date = dateDebut && /^\d{4}-\d{2}-\d{2}$/.test(dateDebut) ? dateDebut : null
  let avis: string | undefined
  if (date) {
    const v = await validerFenetre(date, inst.nbSemaines, inst.decalages)
    if ('error' in v) return { error: v.error }
    avis = v.avis
  }

  const { error } = await supabase.from('scriptorium_parcours_classes')
    .update({ date_debut: date, updated_at: new Date().toISOString() }).eq('id', pcId)
  if (error) return { error: error.message }
  revalidatePath('/prof/scriptorium')
  return { success: true, avis }
}

/**
 * Décale la semaine `semaine` du parcours de la classe ET TOUTES LES SUIVANTES de
 * `delta` semaines d'enseignement (+1 = insérer une semaine vide avant elle, −1 = la
 * retirer). C'est LE geste d'alternance : la semaine libérée devient disponible pour
 * un autre parcours de la même classe. Ne touche ni le modèle ni les autres classes.
 */
export async function decalerSemaineInstance(
  pcId: string, semaine: number, delta: number,
): Promise<{ success?: boolean; error?: string; avis?: string }> {
  const { supabase } = await verifierProf()
  if (!RE_UUID.test(pcId)) return { error: 'Identifiant invalide.' }
  if (!Number.isInteger(semaine) || semaine < 1) return { error: 'Semaine invalide.' }
  if (delta !== 1 && delta !== -1) return { error: 'Décalage invalide.' }
  const inst = await lireInstance(supabase, pcId)
  if ('error' in inst) return { error: inst.error }
  if (semaine > inst.nbSemaines) return { error: `Le parcours n'a que ${inst.nbSemaines} semaines.` }

  const { decalages, refuse } = decalerDepuis(inst.decalages, semaine, delta, inst.nbSemaines)
  if (refuse) return { error: refuse }

  // Un décalage allonge la fenêtre réelle : il peut pousser la fin hors des semestres
  // définis. Même garde que la pose de date — sinon on planifie dans le vide.
  let avis: string | undefined
  if (inst.pc.dateDebut) {
    const v = await validerFenetre(inst.pc.dateDebut, inst.nbSemaines, decalages)
    if ('error' in v) return { error: v.error }
    avis = v.avis
  }

  const { error } = await supabase.from('scriptorium_parcours_classes')
    .update({ decalages, updated_at: new Date().toISOString() }).eq('id', pcId)
  if (error) {
    return { error: error.message.includes('decalages')
      ? 'Le décalage des semaines demande la migration `parcours_decalages.sql` (pas encore jouée sur cette base).'
      : error.message }
  }
  revalidatePath('/prof/scriptorium')
  return { success: true, avis }
}

/**
 * OUVRIR / COUPER la synthèse de fin d'un cours, DANS CETTE CLASSE (01/09).
 *
 * ⭐ UN SEUL CONTRÔLE POUR DEUX GESTES, et c'est ce qui le rend juste. Avant, une
 *    synthèse naissait toute seule dès qu'un cours entrait dans le parcours d'une
 *    classe à plan vivant : le professeur ne pouvait ni s'y opposer, ni choisir son
 *    moment. « Il me faudrait un bouton pour que je puisse déclencher la création des
 *    synthèses uniquement quand je veux, et pas de manière automatique à la fin d'un
 *    cours » (Louis, 01/09). Ouvrir POSE l'intention et fabrique la ligne dans la
 *    foulée ; couper retire l'intention et met la ligne en SOURDINE.
 *
 * ⛔ COUPER NE DÉTRUIT RIEN. La ligne planifiée reste en base avec son statut et sa
 *    séance Codex : rouvrir la ramène telle quelle. C'est ce qui distingue ce geste de
 *    « Retirer du plan » (qui, lui, annule).
 *
 * ⚠️ Gate du plan d'évaluation OFF → refus explicite plutôt qu'un bouton mort : sans
 *    plan d'évaluation, une synthèse n'a nulle part où vivre.
 */
export async function basculerSyntheseCours(
  pcId: string, contenuId: string, ouvrir: boolean,
): Promise<{ success?: boolean; error?: string }> {
  await verifierProf()
  if (!RE_UUID.test(pcId) || !RE_UUID.test(contenuId)) return { error: 'Identifiant invalide.' }
  const admin = createAdminClient()
  if (!(await lireGatePlanActif(admin))) return { error: 'Le plan d’évaluation est désactivé.' }

  const res = ouvrir
    ? await ouvrirSyntheseCours(admin, pcId, contenuId)
    : await couperSyntheseCours(admin, pcId, contenuId)
  if (res.error) return { error: res.error }

  // Les quatre surfaces qui montrent (ou taisent) une synthèse : l'écran d'instance et
  // la panoptique du plan vivent sous /prof/scriptorium, le « à préparer » sous
  // /prof/codex, le à-faire et le calendrier prof sous /prof.
  revalidatePath('/prof/scriptorium')
  revalidatePath('/prof/codex')
  revalidatePath('/prof')
  return { success: true }
}

/**
 * Ajoute (delta = +1) ou retire (−1) une semaine au parcours. ⚠️ `nb_semaines` vit sur
 * le MODÈLE : le geste vaut pour TOUTES les classes qui suivent ce parcours — l'écran
 * l'annonce (nbClassesDuParcours). Le retrait supprime les créneaux au-delà, comme
 * `modifierParcours` : il exige donc une confirmation quand il y en a.
 */
export async function ajusterNbSemainesParcours(
  parcoursId: string, delta: number, confirme = false,
): Promise<{ success?: boolean; nbSemaines?: number; needsConfirm?: boolean; nbCreneauxAuDela?: number; error?: string }> {
  const { supabase } = await verifierProf()
  if (!RE_UUID.test(parcoursId)) return { error: 'Identifiant invalide.' }
  if (delta !== 1 && delta !== -1) return { error: 'Ajustement invalide.' }

  const { data: parc } = await supabase
    .from('scriptorium_parcours').select('nb_semaines, supprime_at').eq('id', parcoursId).maybeSingle()
  if (!parc || parc.supprime_at) return { error: 'Parcours introuvable.' }
  const actuel = (parc.nb_semaines as number) ?? 1
  const cible = actuel + delta
  if (cible < 1) return { error: 'Un parcours dure au moins une semaine.' }
  if (cible > 52) return { error: 'Un parcours ne peut pas dépasser 52 semaines.' }

  if (delta < 0 && !confirme) {
    const { count } = await supabase
      .from('scriptorium_parcours_creneaux')
      .select('id', { count: 'exact', head: true })
      .eq('parcours_id', parcoursId).gt('semaine', cible)
    if ((count ?? 0) > 0) return { needsConfirm: true, nbCreneauxAuDela: count ?? 0 }
  }

  const { error } = await supabase.from('scriptorium_parcours')
    .update({ nb_semaines: cible, updated_at: new Date().toISOString() }).eq('id', parcoursId)
  if (error) return { error: error.message }
  if (delta < 0) {
    const { data: auDela } = await supabase
      .from('scriptorium_parcours_creneaux').select('id').eq('parcours_id', parcoursId).gt('semaine', cible)
    // Le modèle suit ses classes : les copies intactes des créneaux purgés partent aussi.
    const res = await retirerCreneauxModele(supabase, parcoursId, (auDela ?? []).map(c => c.id as string))
    if (res.error) console.error('[scriptorium] ajusterNbSemainesParcours : purge des créneaux au-delà échouée', res.error)
  }
  revalidatePath('/prof/scriptorium')
  return { success: true, nbSemaines: cible }
}

// ── Assignation d'un parcours à une classe (+ date de début) — Parcours L5 ────
// La date de début vit sur scriptorium_parcours_classes (PAR CLASSE). À la pose
// d'une date, on résout la frise (AY dérivée de la date) : un débordement HORS
// année scolaire (non_planifiable), une frise vide/ancre hors frise, ou une config
// semestres incohérente (chevauchement) BLOQUENT l'enregistrement (décision 8).
export async function assignerParcoursClasse(
  parcoursId: string,
  classeId: string,
  dateDebut: string | null,
): Promise<{ success?: boolean; error?: string; avis?: string; bloque?: boolean }> {
  const { supabase } = await verifierProf()
  if (!RE_UUID.test(parcoursId) || !RE_UUID.test(classeId)) return { error: 'Identifiant invalide.' }

  const date = dateDebut && /^\d{4}-\d{2}-\d{2}$/.test(dateDebut) ? dateDebut : null

  // Garde d'existence/soft-delete AVANT tout (y compris pour une assignation sans date).
  const { data: parc } = await supabase
    .from('scriptorium_parcours').select('nb_semaines, supprime_at').eq('id', parcoursId).maybeSingle()
  if (!parc || parc.supprime_at) return { error: 'Parcours introuvable.' }

  let avis: string | undefined
  if (date) {
    // Les décalages déjà posés font partie de la fenêtre à valider : sans eux, une
    // date acceptée ici pourrait pousser les dernières semaines hors année scolaire.
    const ap = await resoudreFrisePourDate(
      date, parc.nb_semaines as number, await lireDecalages(supabase, parcoursId, classeId))
    if (ap.avisBloquant) {
      return { bloque: true, error: ap.avis ?? 'Configuration des semestres incohérente — corrige-la dans le Calendrier avant de planifier.' }
    }
    if (ap.semaines.every(s => s.statut !== 'definie')) {
      return { bloque: true, error: ap.avis ?? 'Cette date ne tombe dans aucun semestre défini de l’année scolaire.' }
    }
    if (ap.nbNonPlanifiable > 0) {
      return {
        bloque: true,
        error: `Ce parcours prolonge au-delà des semestres définis de l’année scolaire (${ap.nbNonPlanifiable} semaine(s) non planifiable(s)). Définis le semestre suivant ou raccourcis le parcours.`,
      }
    }
    if (ap.nbADefinir > 0) {
      avis = `${ap.nbADefinir} semaine(s) « à définir » : le parcours déborde sur un semestre non encore créé de l’année scolaire.`
    }
  }

  // L'upsert sert AUSSI à (re)dater une assignation existante : on détecte ici si
  // elle est NOUVELLE — seul cas où l'instance est matérialisée (RAG L1 §4.3).
  // Une classe déjà servie garde son instance telle quelle (divergence libre) ;
  // la propagation consciente passe par reinitialiserInstance.
  const { data: existante } = await supabase
    .from('scriptorium_parcours_classes')
    .select('id').eq('parcours_id', parcoursId).eq('classe_id', classeId).maybeSingle()

  const { data: ligne, error } = await supabase
    .from('scriptorium_parcours_classes')
    .upsert(
      { parcours_id: parcoursId, classe_id: classeId, date_debut: date, updated_at: new Date().toISOString() },
      { onConflict: 'parcours_id,classe_id' },
    )
    .select('id')
    .single()
  if (error || !ligne) return { error: error?.message ?? 'Assignation impossible.' }

  if (!existante) {
    const mat = await materialiserInstance(supabase, ligne.id as string, parcoursId, parc.nb_semaines as number)
    if (mat.error) {
      return { error: `Classe assignée, mais matérialisation de l'instance échouée : ${mat.error}` }
    }
  }
  // S3 — la classe fraîchement assignée reçoit la synthèse de chaque cours du parcours
  // (si elle a un plan vivant). APRÈS la matérialisation : le hook lit l'instance.
  // Gate OFF → no-op.
  await hookSyntheseAssignClasse(createAdminClient(), parcoursId, classeId)
  revalidatePath('/prof/scriptorium')
  return { success: true, avis }
}

export async function retirerParcoursClasse(parcoursId: string, classeId: string): Promise<{ success?: boolean; error?: string }> {
  const { supabase } = await verifierProf()
  if (!RE_UUID.test(parcoursId) || !RE_UUID.test(classeId)) return { error: 'Identifiant invalide.' }
  // Le DELETE de l'assignation CASCADE l'instance (créneaux → éléments, RAG L1) :
  // une ré-assignation ultérieure repart d'une matérialisation fraîche du modèle.
  const { error } = await supabase
    .from('scriptorium_parcours_classes').delete().eq('parcours_id', parcoursId).eq('classe_id', classeId)
  if (error) return { error: error.message }
  // S5 — annule les synthèses non réalisées de (parcours, classe). Gate OFF → no-op.
  await hookSyntheseRetraitClasse(createAdminClient(), parcoursId, classeId)
  revalidatePath('/prof/scriptorium')
  return { success: true }
}

// Re-matérialise l'instance d'une classe DEPUIS LE MODÈLE (RAG L1 §4.1) —
// DESTRUCTIF : divergences et « vu » perdus. Réservé au cas « je veux propager
// ma refonte du modèle ». La double confirmation vit côté UI (grille d'instance,
// lot L3) ; l'action est le geste unique de propagation consciente.
export async function reinitialiserInstance(parcoursClasseId: string): Promise<{ success?: boolean; error?: string }> {
  const { supabase } = await verifierProf()
  if (!RE_UUID.test(parcoursClasseId)) return { error: 'Identifiant invalide.' }

  const { data: pc } = await supabase
    .from('scriptorium_parcours_classes').select('id, parcours_id').eq('id', parcoursClasseId).maybeSingle()
  if (!pc) return { error: 'Assignation introuvable.' }
  const { data: parc } = await supabase
    .from('scriptorium_parcours').select('nb_semaines, supprime_at').eq('id', pc.parcours_id as string).maybeSingle()
  if (!parc || parc.supprime_at) return { error: 'Parcours introuvable.' }

  const { error: eDel } = await supabase
    .from('scriptorium_parcours_classe_creneaux').delete().eq('parcours_classe_id', parcoursClasseId) // cascade éléments
  if (eDel) return { error: eDel.message }
  const mat = await materialiserInstance(supabase, parcoursClasseId, pc.parcours_id as string, parc.nb_semaines as number)
  if (mat.error) return { error: mat.error }
  revalidatePath('/prof/scriptorium')
  return { success: true }
}

/**
 * REPRISE — copie dans l'instance `pcId` les créneaux du modèle qu'elle n'a pas : ceux
 * ajoutés au modèle AVANT qu'il suive ses classes (02/09), ou retirés de la classe et
 * voulus de nouveau. Le panneau de l'instance les liste ; on ne copie que ce qui
 * appartient bien au modèle de CE parcours. Un créneau propre de même cible est
 * rattaché plutôt que doublé (copierCreneauModele).
 */
export async function recupererCreneauxModele(
  pcId: string, modeleIds: string[],
): Promise<{ nb?: number; error?: string }> {
  const { supabase } = await verifierProf()
  if (!RE_UUID.test(pcId)) return { error: 'Identifiant invalide.' }
  if (!Array.isArray(modeleIds) || modeleIds.length === 0 || modeleIds.some(id => !RE_UUID.test(id))) {
    return { error: 'Sélection invalide.' }
  }
  const inst = await lireInstance(supabase, pcId)
  if ('error' in inst) return { error: inst.error }
  const { data: rows } = await supabase
    .from('scriptorium_parcours_creneaux').select(COLS_CRENEAU_MODELE)
    .in('id', modeleIds).eq('parcours_id', inst.pc.parcoursId)
    .order('semaine', { ascending: true }).order('ordre', { ascending: true })
  const modeles = (rows ?? []) as CreneauModeleRow[]
  if (modeles.length === 0) return { error: 'Ces créneaux n’appartiennent pas au modèle de ce parcours.' }
  let nb = 0
  const echecs: string[] = []
  for (const m of modeles) {
    const r = await copierCreneauModele(supabase, pcId, m, inst.nbSemaines)
    if (r.error) echecs.push(`« ${m.titre_affiche ?? '?'} » : ${r.error}`)
    else nb++
  }
  // S3 — la synthèse suit l'instance (le hook lit l'intention ouverte/coupée). Gate OFF → no-op.
  const admin = createAdminClient()
  const cours = new Set(modeles.filter(m => m.ref_type === 'contenu' && m.contenu_id).map(m => m.contenu_id as string))
  for (const contenuId of cours) await hookSyntheseAjoutCreneau(admin, inst.pc.parcoursId, contenuId)
  revalidatePath('/prof/scriptorium')
  return echecs.length ? { nb, error: echecs.join(' · ') } : { nb }
}

/**
 * RÉORDONNE les créneaux d'une semaine DE L'INSTANCE (02/09 soir) — l'ordre PROPRE d'une
 * classe. `ordreIds` = tous les créneaux qui VIVENT dans cette semaine (semaine réelle), dans
 * le nouvel ordre. Deux passes négatives/positives contre l'unicité (assignation, semaine,
 * ordre) — patron reordonnerCreneaux. Un ordre choisi ici est respecté par le modèle : sa
 * propagation d'ordre ne redescend que là où la classe suivait encore (suitLOrdreDuModele).
 */
export async function reordonnerCreneauxInstance(
  pcId: string, semaine: number, ordreIds: string[],
): Promise<{ error?: string }> {
  const { supabase } = await verifierProf()
  if (!RE_UUID.test(pcId)) return { error: 'Assignation invalide.' }
  if (!Number.isInteger(semaine) || semaine < 1) return { error: 'Semaine invalide.' }
  if (!Array.isArray(ordreIds) || ordreIds.some(id => !RE_UUID.test(id))) return { error: 'Ordre invalide.' }

  const { data: actuels } = await supabase
    .from('scriptorium_parcours_classe_creneaux').select('id')
    .eq('parcours_classe_id', pcId).eq('semaine', semaine)
  const idsBase = new Set((actuels ?? []).map(r => r.id as string))
  const idsFournis = new Set(ordreIds)
  if (idsBase.size !== idsFournis.size || [...idsBase].some(id => !idsFournis.has(id))) {
    return { error: 'La liste des créneaux a changé — recharge la page puis réessaie.' }
  }
  for (let i = 0; i < ordreIds.length; i++) {
    const { error } = await supabase.from('scriptorium_parcours_classe_creneaux')
      .update({ ordre: -(i + 1) }).eq('id', ordreIds[i]).eq('parcours_classe_id', pcId).eq('semaine', semaine)
    if (error) return { error: error.message }
  }
  for (let i = 0; i < ordreIds.length; i++) {
    const { error } = await supabase.from('scriptorium_parcours_classe_creneaux')
      .update({ ordre: i + 1 }).eq('id', ordreIds[i]).eq('parcours_classe_id', pcId).eq('semaine', semaine)
    if (error) return { error: error.message }
  }
  revalidatePath('/prof/scriptorium')
  return {}
}

/**
 * L'INTERRUPTEUR « cette classe suit / ne suit plus le modèle » (02/09 soir). Détacher ne
 * détruit rien et se défait d'un clic : le modèle cesse d'ajouter, retirer, déplacer et
 * réordonner dans cette instance ; le panneau de reprise reste le chemin manuel. Rattacher
 * ne rejoue rien de lui-même — la reprise le fait, à la demande.
 */
export async function reglerSuiviModele(pcId: string, suit: boolean): Promise<{ success?: boolean; error?: string }> {
  const { supabase } = await verifierProf()
  if (!RE_UUID.test(pcId)) return { error: 'Identifiant invalide.' }
  const { error } = await supabase.from('scriptorium_parcours_classes')
    .update({ suit_modele: suit, updated_at: new Date().toISOString() }).eq('id', pcId)
  if (error) {
    return { error: error.message.includes('suit_modele')
      ? 'Ce réglage demande la migration `parcours_suivi_du_modele.sql` (pas encore jouée sur cette base).'
      : error.message }
  }
  revalidatePath('/prof/scriptorium')
  return { success: true }
}

// ── Pilotage de l'instance — RAG L3 (grille « vu », SPEC §5.3) ────────────────
// Les gestes d'instance ne touchent NI le modèle NI les autres classes. Le « vu »
// est un acte de pilotage (par élément, par classe) ; le placement (déplacer /
// réordonner / ajouter / retirer) un acte de conception de l'instance.

/** Coche / décoche le « vu » d'un élément (le clic prof, §2 décision 4). */
export async function marquerVu(elementId: string, vu: boolean): Promise<{ error?: string }> {
  const { supabase, userId } = await verifierProf()
  if (!RE_UUID.test(elementId)) return { error: 'Identifiant invalide.' }
  const { error } = await supabase
    .from('scriptorium_parcours_classe_elements')
    .update(vu ? { vu_at: new Date().toISOString(), vu_par: userId } : { vu_at: null, vu_par: null })
    .eq('id', elementId)
  if (error) return { error: error.message }
  revalidatePath('/prof/scriptorium')
  return {}
}

/**
 * Marquage groupé « vu jusqu'ici » : tous les éléments non vus de l'instance dont
 * la semaine ≤ celle choisie — indispensable en adoption de mi-année (§5.3).
 */
export async function marquerVuJusquA(parcoursClasseId: string, semaine: number): Promise<{ nb?: number; error?: string }> {
  const { supabase, userId } = await verifierProf()
  if (!RE_UUID.test(parcoursClasseId)) return { error: 'Identifiant invalide.' }
  if (!Number.isInteger(semaine) || semaine < 1) return { error: 'Semaine invalide.' }
  const { data: crens } = await supabase
    .from('scriptorium_parcours_classe_creneaux').select('id').eq('parcours_classe_id', parcoursClasseId)
  const ids = (crens ?? []).map(c => c.id as string)
  if (ids.length === 0) return { nb: 0 }
  const { data: maj, error } = await supabase
    .from('scriptorium_parcours_classe_elements')
    .update({ vu_at: new Date().toISOString(), vu_par: userId })
    .in('creneau_id', ids).lte('semaine', semaine).is('vu_at', null)
    .select('id')
  if (error) return { error: error.message }
  revalidatePath('/prof/scriptorium')
  return { nb: (maj ?? []).length }
}

/**
 * Déplace un élément vers une autre semaine de l'instance (report volontaire :
 * il redevient « à venir » si la semaine est future — §5.1). Ordre max+1 atomique
 * avec retry (schema-S9) ; garde applicative semaine ≤ nb_semaines (§4.2).
 */
export async function deplacerElement(elementId: string, nouvelleSemaine: number): Promise<{ error?: string }> {
  const { supabase } = await verifierProf()
  if (!RE_UUID.test(elementId)) return { error: 'Identifiant invalide.' }
  if (!Number.isInteger(nouvelleSemaine) || nouvelleSemaine < 1) return { error: 'Semaine invalide.' }

  const { data: el } = await supabase
    .from('scriptorium_parcours_classe_elements')
    .select('id, creneau_id, semaine').eq('id', elementId).maybeSingle()
  if (!el) return { error: 'Élément introuvable.' }
  if ((el.semaine as number) === nouvelleSemaine) return {}

  const { data: cr } = await supabase
    .from('scriptorium_parcours_classe_creneaux')
    .select('parcours_classe_id').eq('id', el.creneau_id as string).maybeSingle()
  const { data: pc } = cr
    ? await supabase.from('scriptorium_parcours_classes').select('parcours_id').eq('id', cr.parcours_classe_id as string).maybeSingle()
    : { data: null }
  const { data: parc } = pc
    ? await supabase.from('scriptorium_parcours').select('nb_semaines').eq('id', pc.parcours_id as string).maybeSingle()
    : { data: null }
  if (!parc) return { error: 'Parcours introuvable.' }
  if (nouvelleSemaine > (parc.nb_semaines as number)) {
    return { error: `Le parcours n'a que ${parc.nb_semaines} semaines.` }
  }

  for (let essai = 0; essai < 5; essai++) {
    const { data: dernier } = await supabase
      .from('scriptorium_parcours_classe_elements').select('ordre')
      .eq('creneau_id', el.creneau_id as string).eq('semaine', nouvelleSemaine)
      .order('ordre', { ascending: false }).limit(1).maybeSingle()
    const ordre = (dernier?.ordre ?? 0) + 1
    const { error } = await supabase.from('scriptorium_parcours_classe_elements')
      .update({ semaine: nouvelleSemaine, ordre }).eq('id', elementId)
    if (!error) { revalidatePath('/prof/scriptorium'); return {} }
    if (error.code !== '23505') return { error: error.message }
  }
  return { error: 'Conflit d’ordre, réessaie.' }
}

/**
 * Réordonne les éléments d'un créneau dans une semaine (ordreIds = TOUS les
 * éléments de ce couple, dans le nouvel ordre). Deux passes négatives/positives
 * contre l'unicité (creneau, semaine, ordre) — patron reordonnerCreneaux.
 */
export async function reordonnerElements(
  creneauId: string,
  semaine: number,
  ordreIds: string[],
): Promise<{ error?: string }> {
  const { supabase } = await verifierProf()
  if (!RE_UUID.test(creneauId)) return { error: 'Créneau invalide.' }
  if (!Number.isInteger(semaine) || semaine < 1) return { error: 'Semaine invalide.' }
  if (!Array.isArray(ordreIds) || ordreIds.some(id => !RE_UUID.test(id))) return { error: 'Ordre invalide.' }

  const { data: actuels } = await supabase
    .from('scriptorium_parcours_classe_elements').select('id')
    .eq('creneau_id', creneauId).eq('semaine', semaine)
  const idsBase = new Set((actuels ?? []).map(r => r.id as string))
  const idsFournis = new Set(ordreIds)
  if (idsBase.size !== idsFournis.size || [...idsBase].some(id => !idsFournis.has(id))) {
    return { error: 'La liste des éléments a changé — recharge la page puis réessaie.' }
  }

  for (let i = 0; i < ordreIds.length; i++) {
    const { error } = await supabase.from('scriptorium_parcours_classe_elements')
      .update({ ordre: -(i + 1) }).eq('id', ordreIds[i]).eq('creneau_id', creneauId).eq('semaine', semaine)
    if (error) return { error: error.message }
  }
  for (let i = 0; i < ordreIds.length; i++) {
    const { error } = await supabase.from('scriptorium_parcours_classe_elements')
      .update({ ordre: i + 1 }).eq('id', ordreIds[i]).eq('creneau_id', creneauId).eq('semaine', semaine)
    if (error) return { error: error.message }
  }
  revalidatePath('/prof/scriptorium')
  return {}
}

/**
 * Ajoute un créneau à l'INSTANCE d'une classe (picker réutilisé) + matérialise
 * ses éléments (§4.3). Ne touche ni le modèle ni les autres classes.
 */
export async function ajouterCreneauInstance(
  parcoursClasseId: string,
  semaine: number,
  ref: RefCreneau,
): Promise<{ id?: string; error?: string }> {
  const { supabase } = await verifierProf()
  if (!RE_UUID.test(parcoursClasseId)) return { error: 'Assignation invalide.' }
  if (!Number.isInteger(semaine) || semaine < 1) return { error: 'Semaine invalide.' }

  const { data: pc } = await supabase
    .from('scriptorium_parcours_classes').select('id, parcours_id').eq('id', parcoursClasseId).maybeSingle()
  if (!pc) return { error: 'Assignation introuvable.' }
  const { data: parc } = await supabase
    .from('scriptorium_parcours').select('nb_semaines, supprime_at').eq('id', pc.parcours_id as string).maybeSingle()
  if (!parc || parc.supprime_at) return { error: 'Parcours introuvable.' }
  if (semaine > (parc.nb_semaines as number)) return { error: `Le parcours n'a que ${parc.nb_semaines} semaines.` }

  const cible = await validerRefCreneau(supabase, ref)
  if (cible.error || !cible.payload) return { error: cible.error ?? 'Cible invalide.' }
  const payload: Record<string, unknown> = { ...cible.payload, parcours_classe_id: parcoursClasseId, semaine }

  for (let essai = 0; essai < 5; essai++) {
    const { data: dernier } = await supabase
      .from('scriptorium_parcours_classe_creneaux').select('ordre')
      .eq('parcours_classe_id', parcoursClasseId).eq('semaine', semaine)
      .order('ordre', { ascending: false }).limit(1).maybeSingle()
    const ordre = (dernier?.ordre ?? 0) + 1
    const { data, error } = await supabase
      .from('scriptorium_parcours_classe_creneaux').insert({ ...payload, ordre })
      .select('id, semaine, ref_type, contenu_id, livre_id, livre_semaine_debut, livre_semaine_fin')
      .single()
    if (!error && data) {
      const mat = await materialiserElementsPourCreneaux(supabase, [data as CreneauAMaterialiser], parc.nb_semaines as number)
      if (mat.error) return { error: `Créneau ajouté, mais éléments non matérialisés : ${mat.error}` }
      // S3 — la synthèse suit l'instance : le hook trouve ce cours dans l'instance
      // de CETTE classe (les autres classes ne sont pas concernées). Gate OFF → no-op.
      if ('contenuId' in ref) await hookSyntheseAjoutCreneau(createAdminClient(), pc.parcours_id as string, ref.contenuId)
      revalidatePath('/prof/scriptorium')
      return { id: data.id as string }
    }
    if (error && error.code !== '23505') return { error: error.message }
  }
  return { error: 'Conflit d’ordre, réessaie.' }
}

// ── Synthèse hebdo du Scriptorium élève (L7) — secours « (Re)générer » ───────
// Régénère la synthèse de la SEMAINE ÉCOULÉE pour une classe (le cron du lundi
// est la voie normale ; ce bouton couvre les ratés et la recette — §15.8).
export async function regenererSyntheseRag(classeId: string): Promise<{ statut?: string; error?: string }> {
  await verifierProf()
  if (!RE_UUID.test(classeId)) return { error: 'Identifiant invalide.' }
  const admin = createAdminClient()
  const reglages = await lireReglagesRag(admin)
  if (!reglages.actif) return { error: 'Active d’abord l’espace élève (onglet Paramètres).' }
  const fuseau = await lireFuseau()
  const aujourdHui = jourDansFuseau(new Date().toISOString(), fuseau)
  const res = await genererSyntheseClasse(admin, classeId, lundiSemaineEcoulee(aujourdHui), fuseau, reglages)
  if (res.statut === 'ERROR') return { error: res.error ?? 'Échec de génération.' }
  revalidatePath('/prof/scriptorium')
  return { statut: res.statut }
}

// ── Réglages du RAG élève (L5, SPEC §8.3) — gate, modèles, quota, prompts ────
// Le prompt du TUTEUR n'est plus ici : il s'édite par sections (L9, action
// sauvegarderSectionsPromptTuteur ci-dessous) et cette action ne touche donc
// jamais `rag_prompt` — l'ancienne colonne du prompt intégral reste telle quelle
// en base (dormante), on ne l'écrase pas au passage.
export async function sauvegarderReglagesRag(reglages: {
  actif: boolean
  modele: string
  modeleSynthese: string
  quotaJour: number
  promptSynthese: string | null
}): Promise<{ error?: string }> {
  await verifierProf()
  const modele = reglages.modele?.trim()
  const modeleSynthese = reglages.modeleSynthese?.trim()
  if (!modele || !modeleSynthese) return { error: 'Indique les identifiants de modèle.' }
  if (!modele.startsWith('claude') && !modele.startsWith('gemini')) {
    return { error: 'Modèle de chat inconnu (préfixes gérés : claude-, gemini-).' }
  }
  if (!Number.isInteger(reglages.quotaJour) || reglages.quotaJour < 1 || reglages.quotaJour > 500) {
    return { error: 'Quota journalier invalide (1–500).' }
  }
  const admin = createAdminClient()
  const { error } = await admin.from('scriptorium_params').upsert({
    id: 1,
    rag_actif: !!reglages.actif,
    rag_modele: modele,
    rag_modele_synthese: modeleSynthese,
    rag_quota_jour: reglages.quotaJour,
    rag_prompt_synthese: reglages.promptSynthese?.trim() || null,
  }, { onConflict: 'id' })
  if (error) return { error: error.message }
  revalidatePath('/prof/scriptorium')
  revalidatePath('/eleve/modules/scriptorium')
  return {}
}

// ── Prompt du tuteur, édition PAR SECTIONS (C2 · L9) ─────────────────────────
// N'écrit QUE les trois sections éditables : les sections verrouillées
// (anti-spoiler, périmètre, sources, refus) n'ont pas de colonne et ne peuvent
// donc pas être écrites, même par un appel forgé — les clés inconnues sont
// ignorées à la lecture ci-dessous, l'upsert ne porte que 4 colonnes.
// `rag_prompt_sections_maj` horodate la divergence avec le prompt calibré au
// banc L8 : c'est lui qui fait vivre le bandeau « recommandé : rejouer le banc ».
// Retour au défaut sur les TROIS sections → horodatage effacé, bandeau éteint
// (le prompt effectif est de nouveau celui de la calibration).
export async function sauvegarderSectionsPromptTuteur(
  sections: OverridesPromptTuteur,
): Promise<{ error?: string; modifieLe?: string | null }> {
  await verifierProf()
  const stockees: Record<CleSectionEditable, string | null> = { ton: null, relances: null, longueur: null }
  for (const cle of CLES_EDITABLES) {
    const brut = sections[cle]
    if (typeof brut === 'string' && brut.length > MAX_CARACTERES_SECTION) {
      return { error: `Section « ${cle} » trop longue (${MAX_CARACTERES_SECTION} caractères maximum).` }
    }
    stockees[cle] = normaliserSection(cle, brut)
  }
  const modifieLe = CLES_EDITABLES.some(c => stockees[c] !== null) ? new Date().toISOString() : null
  const admin = createAdminClient()
  const { error } = await admin.from('scriptorium_params').upsert({
    id: 1,
    rag_prompt_ton: stockees.ton,
    rag_prompt_relances: stockees.relances,
    rag_prompt_longueur: stockees.longueur,
    rag_prompt_sections_maj: modifieLe,
  }, { onConflict: 'id' })
  if (error) return { error: error.message }
  revalidatePath('/prof/scriptorium')
  revalidatePath('/eleve/modules/scriptorium')
  return { modifieLe }
}

/** Retire un créneau de l'instance (cascade sur ses éléments — « vu » compris). */
export async function retirerCreneauInstance(creneauId: string): Promise<{ error?: string }> {
  const { supabase } = await verifierProf()
  if (!RE_UUID.test(creneauId)) return { error: 'Identifiant invalide.' }
  // S5 — pré-lecture : capturer le cours et le parcours AVANT le DELETE, pour
  // décider du retrait de sa synthèse une fois le créneau parti (patron retirerCreneau).
  const admin = createAdminClient()
  const gateOn = await lireGatePlanActif(admin)
  const { data: cr } = await supabase
    .from('scriptorium_parcours_classe_creneaux')
    .select('parcours_classe_id, ref_type, contenu_id').eq('id', creneauId).maybeSingle()
  if (!cr) return { error: 'Créneau introuvable.' }
  let coursDuCreneau: { parcoursId: string; contenuId: string } | null = null
  if (gateOn && cr.ref_type === 'contenu' && cr.contenu_id) {
    const { data: pc } = await admin
      .from('scriptorium_parcours_classes').select('parcours_id').eq('id', cr.parcours_classe_id as string).maybeSingle()
    if (pc) coursDuCreneau = { parcoursId: pc.parcours_id as string, contenuId: cr.contenu_id as string }
  }
  const { error } = await supabase.from('scriptorium_parcours_classe_creneaux').delete().eq('id', creneauId)
  if (error) return { error: error.message }
  if (coursDuCreneau) await hookSyntheseRetraitCreneau(admin, coursDuCreneau.parcoursId, coursDuCreneau.contenuId)
  revalidatePath('/prof/scriptorium')
  return {}
}

// Publie (fige) l'horaire résolu d'un parcours pour une classe — décision PO 3.
// L'aperçu continue de recalculer depuis la frise ; ce snapshot sert de référence
// pour signaler les décalages ultérieurs (édition du calendrier). Refuse un horaire
// incomplet (non planifiable) ou une config semestres incohérente.
// Nécessite la migration parcours_snapshot_horaire.sql (colonnes horaire_snapshot…).
// Publie l'horaire d'une instance — DEPUIS LE PARCOURS DE LA CLASSE (l'argument est
// l'id d'ASSIGNATION, plus le couple parcours×classe : la publication a suivi la date
// dans son déménagement). Fige l'aperçu recalculé (frise × décalages) en snapshot.
export async function publierHoraire(
  parcoursClasseId: string,
): Promise<{ success?: boolean; error?: string }> {
  const { supabase } = await verifierProf()
  if (!RE_UUID.test(parcoursClasseId)) return { error: 'Identifiant invalide.' }

  const inst = await lireInstance(supabase, parcoursClasseId)
  if ('error' in inst) return { error: inst.error }
  if (!inst.pc.dateDebut) return { error: 'Pose d’abord une date de début.' }

  const ap = await resoudreFrisePourDate(inst.pc.dateDebut, inst.nbSemaines, inst.decalages)
  if (ap.avisBloquant) return { error: 'Configuration des semestres incohérente — corrige-la avant de publier.' }
  if (ap.semaines.every(s => s.statut !== 'definie')) {
    return { error: 'Cette date ne tombe dans aucun semestre défini — impossible de publier un horaire vide.' }
  }
  if (ap.nbNonPlanifiable > 0) {
    return { error: `Horaire incomplet : ${ap.nbNonPlanifiable} semaine(s) non planifiable(s). Corrige avant de publier.` }
  }

  // snapshot_version lu À PART (tolérant) : si la migration n'est pas jouée, cette lecture
  // échoue → version=1, et c'est l'UPDATE ci-dessous qui signalera l'absence de colonnes.
  const { data: snapRow } = await supabase
    .from('scriptorium_parcours_classes').select('snapshot_version').eq('id', parcoursClasseId).maybeSingle()
  const version = ((snapRow?.snapshot_version as number | null) ?? 0) + 1
  const { error } = await supabase
    .from('scriptorium_parcours_classes')
    .update({
      horaire_snapshot: ap.semaines,
      snapshot_version: version,
      snapshot_genere_le: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', parcoursClasseId)
  if (error) return { error: error.message }
  revalidatePath('/prof/scriptorium')
  return { success: true }
}
