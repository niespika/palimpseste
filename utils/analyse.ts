import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/utils/supabase/admin'

// Structure de la réponse JSON attendue de Claude
interface AnalyseJSON {
  transcription: string
  notes: { decouvertes: number; sources: number; reflexions: number }
  retour_progres: string
  retour_langue: string
  retour_style: string
  retour_contenu: string
  commentaire_general: string
  pistes_nouvelles: string[]
  rappels_pistes: { piste_id: string; reformulation: string }[]
  bilan_pistes: { piste_id: string; statut: 'suivie' | 'partiellement_suivie' | 'proposee'; justification: string }[]
}

function construireHistorique(
  analyses: Array<{
    semaine_numero: number
    note_decouvertes: number | null
    note_sources: number | null
    note_reflexions: number | null
    transcription: string | null
    commentaire_general: string | null
  }>,
  pistes: Array<{ id: string; contenu: string; statut: string }>
): string {
  if (analyses.length === 0) return 'Aucun historique (première semaine).'

  let texte = 'NOTES PASSÉES :\n'
  for (const a of analyses) {
    texte += `- Semaine ${a.semaine_numero} : Découvertes ${a.note_decouvertes ?? '?'}/4, Sources ${a.note_sources ?? '?'}/4, Réflexions ${a.note_reflexions ?? '?'}/4\n`
  }
  texte += '\n'

  const derniers = analyses.slice(-3)
  texte += 'DERNIERS COMPTES-RENDUS :\n'
  for (const a of derniers) {
    texte += `Semaine ${a.semaine_numero} :\n`
    if (a.transcription) {
      const tronquee = a.transcription.length > 1500
        ? a.transcription.slice(0, 1500) + '…'
        : a.transcription
      texte += `Transcription : ${tronquee}\n`
    }
    if (a.commentaire_general) {
      texte += `Commentaire général : ${a.commentaire_general}\n`
    }
    texte += '\n'
  }

  if (pistes.length > 0) {
    texte += 'PISTES PROPOSÉES ET STATUTS :\n'
    for (const p of pistes) {
      texte += `- [ID: ${p.id}] [statut: ${p.statut}] ${p.contenu}\n`
    }
  } else {
    texte += 'Aucune piste proposée lors des semaines précédentes.\n'
  }

  return texte
}

export async function lancerAnalyse(
  depotId: string,
  eleveId: string,
  options: { force?: boolean } = {}
): Promise<void> {
  const admin = createAdminClient()

  // Vérifier si une analyse est déjà en cours
  const { data: existante } = await admin
    .from('fragments_analyses')
    .select('id, statut')
    .eq('depot_id', depotId)
    .maybeSingle()

  if (existante?.statut === 'en_cours') return

  // Ne pas écraser une analyse publiée sauf si force=true
  if (existante?.statut === 'publiee' && !options.force) return

  // Créer ou remettre à zéro l'analyse
  let analyseId: string
  if (existante) {
    await admin.from('fragments_analyses').update({
      statut: 'en_cours',
      transcription: null,
      note_decouvertes: null,
      note_sources: null,
      note_reflexions: null,
      retour_progres: null,
      retour_langue: null,
      retour_style: null,
      retour_contenu: null,
      commentaire_general: null,
      notes_prof: null,
      modifie_par_prof: false,
      cout_api: null,
      publiee_at: null,
    }).eq('id', existante.id)
    analyseId = existante.id
  } else {
    const { data } = await admin
      .from('fragments_analyses')
      .insert({ depot_id: depotId, statut: 'en_cours' })
      .select('id')
      .single()
    if (!data) return
    analyseId = data.id
  }

  try {
    // Photos du dépôt
    const { data: photos } = await admin
      .from('fragments_photos')
      .select('storage_path, ordre')
      .eq('depot_id', depotId)
      .order('ordre')

    if (!photos || photos.length === 0) {
      await admin.from('fragments_analyses').update({ statut: 'erreur' }).eq('id', analyseId)
      return
    }

    // Télécharger les photos en base64
    const imagesBase64: string[] = []
    for (const photo of photos) {
      const { data: blob } = await admin.storage.from('fragments').download(photo.storage_path)
      if (!blob) continue
      const buffer = Buffer.from(await blob.arrayBuffer())
      imagesBase64.push(buffer.toString('base64'))
    }

    if (imagesBase64.length === 0) {
      await admin.from('fragments_analyses').update({ statut: 'erreur' }).eq('id', analyseId)
      return
    }

    // Thème de l'élève
    const { data: theme } = await admin
      .from('fragments_themes')
      .select('theme, description')
      .eq('eleve_id', eleveId)
      .maybeSingle()

    // Numéro de semaine
    const { data: depot } = await admin
      .from('fragments_depots')
      .select('semaine_id, fragments_semaines(numero)')
      .eq('id', depotId)
      .single()
    const numeroSemaine = (depot?.fragments_semaines as unknown as { numero: number } | null)?.numero ?? 1

    // Historique : récupérer tous les dépôts de l'élève
    const { data: tousDepots } = await admin
      .from('fragments_depots')
      .select('id, fragments_semaines(numero)')
      .eq('eleve_id', eleveId)

    const depotIds = (tousDepots ?? []).map(d => d.id)
    const semaineNumeroParDepot: Record<string, number> = {}
    for (const d of tousDepots ?? []) {
      semaineNumeroParDepot[d.id] = (d.fragments_semaines as unknown as { numero: number } | null)?.numero ?? 0
    }

    // Analyses publiées
    const { data: analysesPubliees } = depotIds.length > 0
      ? await admin
          .from('fragments_analyses')
          .select('id, depot_id, note_decouvertes, note_sources, note_reflexions, transcription, commentaire_general')
          .eq('statut', 'publiee')
          .in('depot_id', depotIds)
      : { data: [] }

    const analysesTriees = (analysesPubliees ?? [])
      .map(a => ({ ...a, semaine_numero: semaineNumeroParDepot[a.depot_id] ?? 0 }))
      .sort((a, b) => a.semaine_numero - b.semaine_numero)

    // Pistes des analyses publiées
    const analyseIds = analysesTriees.map(a => a.id)
    const { data: pistes } = analyseIds.length > 0
      ? await admin
          .from('fragments_pistes')
          .select('id, contenu, statut')
          .eq('eleve_id', eleveId)
          .in('analyse_id', analyseIds)
          .order('created_at')
      : { data: [] }

    // Configuration (prompt + barème)
    const { data: config } = await admin
      .from('fragments_config')
      .select('prompt_evaluation, bareme')
      .eq('id', 1)
      .single()

    if (!config) {
      await admin.from('fragments_analyses').update({ statut: 'erreur' }).eq('id', analyseId)
      return
    }

    // Construction du prompt
    const historiqueTexte = construireHistorique(analysesTriees, pistes ?? [])
    const prompt = config.prompt_evaluation
      .replace('{{theme}}', theme?.theme ?? 'Non défini')
      .replace('{{description_theme}}', theme?.description ?? '')
      .replace('{{numero_semaine}}', String(numeroSemaine))
      .replace('{{historique}}', historiqueTexte)
      .replace('{{bareme}}', config.bareme)

    // Appel Claude
    const client = new Anthropic()
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            ...imagesBase64.map(b64 => ({
              type: 'image' as const,
              source: { type: 'base64' as const, media_type: 'image/jpeg' as const, data: b64 },
            })),
            { type: 'text' as const, text: prompt },
          ],
        },
      ],
    })

    const texte = response.content[0].type === 'text' ? response.content[0].text : ''

    // Parser le JSON (Claude peut ajouter des balises ```)
    let parsed: AnalyseJSON
    try {
      const nettoye = texte.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '').trim()
      parsed = JSON.parse(nettoye)
    } catch {
      await admin.from('fragments_analyses').update({ statut: 'erreur' }).eq('id', analyseId)
      return
    }

    // Coût estimé (tarifs approximatifs claude-sonnet-4-6)
    const cout = response.usage.input_tokens * 3 / 1_000_000
      + response.usage.output_tokens * 15 / 1_000_000

    // Sauvegarder l'analyse
    await admin.from('fragments_analyses').update({
      statut: 'generee',
      transcription: parsed.transcription ?? null,
      note_decouvertes: parsed.notes?.decouvertes ?? null,
      note_sources: parsed.notes?.sources ?? null,
      note_reflexions: parsed.notes?.reflexions ?? null,
      retour_progres: parsed.retour_progres || null,
      retour_langue: parsed.retour_langue ?? null,
      retour_style: parsed.retour_style ?? null,
      retour_contenu: parsed.retour_contenu ?? null,
      commentaire_general: parsed.commentaire_general ?? null,
      cout_api: cout,
    }).eq('id', analyseId)

    // Supprimer les anciennes pistes de cette analyse et recréer
    await admin.from('fragments_pistes').delete().eq('analyse_id', analyseId)

    const nouvellesPistes = [
      ...(parsed.pistes_nouvelles ?? []).map(contenu => ({
        analyse_id: analyseId,
        eleve_id: eleveId,
        contenu,
        est_rappel: false,
        statut: 'proposee' as const,
      })),
      ...(parsed.rappels_pistes ?? []).map(rappel => ({
        analyse_id: analyseId,
        eleve_id: eleveId,
        contenu: rappel.reformulation,
        est_rappel: true,
        statut: 'proposee' as const,
      })),
    ]

    if (nouvellesPistes.length > 0) {
      await admin.from('fragments_pistes').insert(nouvellesPistes)
    }

    // Mettre à jour les statuts des pistes passées selon le bilan
    for (const bilan of parsed.bilan_pistes ?? []) {
      await admin.from('fragments_pistes')
        .update({ statut: bilan.statut })
        .eq('id', bilan.piste_id)
    }
  } catch {
    await admin.from('fragments_analyses').update({ statut: 'erreur' }).eq('id', analyseId)
  }
}
