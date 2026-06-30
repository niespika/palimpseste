'use server'

import { after } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { PROMPT_CAPSTONE_DEFAUT, PROMPT_REFERENCE_DEFAUT } from '@/utils/aletheia-retours'
import type { Capstone, ReferenceChapitre } from '@/app/eleve/modules/aletheia/types'
import { reassemblerLivre } from './decoupe-utils'

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
export async function chargerPagesImport(importId: string): Promise<{ pages?: string[]; error?: string }> {
  const { userId } = await verifierProf()
  if (!RE_UUID.test(importId)) return { error: 'Import invalide.' }
  const admin = createAdminClient()
  const { data: row } = await admin
    .from('scriptorium_imports')
    .select('pages').eq('import_id', importId).eq('user_id', userId).maybeSingle()
  const pages = (row?.pages as string[] | undefined) ?? null
  if (!pages || pages.length === 0) return { error: 'Import expiré — re-dépose le PDF.' }
  return { pages }
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
      titreSem = (formData.get(`decoupe_${n}_titre`) as string)?.trim() || `Semaine ${n}`
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
      titreSem = (formData.get(`semaine_${n}_titre`) as string)?.trim() || `Semaine ${n}`
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

// Édition manuelle de la RÉFÉRENCE par chapitre (socle du diagnostic). Marque
// amende_par_prof (anti-écrasement IA). Le prof corrige thèse canonique / arguments.
export async function enregistrerReferenceLivre(livreId: string, contenu: ReferenceChapitre[]): Promise<{ success?: boolean; error?: string }> {
  await verifierProf()
  const chapitres = Array.isArray(contenu)
    ? contenu
        .filter(c => c && Number.isInteger(c.semaine))
        .map(c => ({
          semaine: c.semaine,
          titre: (c.titre ?? '').trim(),
          these_canonique: (c.these_canonique ?? '').trim(),
          arguments_cles: Array.isArray(c.arguments_cles) ? c.arguments_cles.map(a => (a ?? '').trim()).filter(Boolean) : [],
        }))
    : []
  if (chapitres.length === 0) return { error: 'La référence ne peut pas être vide.' }

  const admin = createAdminClient()
  const { error } = await admin.from('aletheia_livre_reference').upsert(
    { scriptorium_livre_id: livreId, contenu: chapitres, statut: 'READY', erreur_at: null, amende_par_prof: true, updated_at: new Date().toISOString() },
    { onConflict: 'scriptorium_livre_id' })
  if (error) return { error: error.message }
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
