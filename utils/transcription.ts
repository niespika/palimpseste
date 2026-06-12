import Groq, { toFile } from 'groq-sdk'
import { createAdminClient } from '@/utils/supabase/admin'

export async function transcrireEtAnalyserOral(oralId: string): Promise<void> {
  const admin = createAdminClient()

  const { data: oral } = await admin
    .from('fragments_oraux')
    .select('id, storage_path, eleve_id, statut')
    .eq('id', oralId)
    .single()

  if (!oral?.storage_path) {
    await admin.from('fragments_oraux').update({ statut: 'erreur' }).eq('id', oralId)
    return
  }

  // ── Transcription ──────────────────────────────────────────────────────────
  try {
    const { data: audioBlob, error: dlErr } = await admin.storage
      .from('oraux')
      .download(oral.storage_path)

    if (dlErr || !audioBlob) throw new Error('Téléchargement audio impossible')

    const buffer = Buffer.from(await audioBlob.arrayBuffer())
    const ext = oral.storage_path.split('.').pop() ?? 'webm'
    const mimeType = ext === 'm4a' ? 'audio/mp4' : `audio/${ext}`

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

    const result = await groq.audio.transcriptions.create({
      file: await toFile(buffer, `audio.${ext}`, { type: mimeType }),
      model: 'whisper-large-v3-turbo',
      language: 'fr',
      response_format: 'verbose_json',
    }) as { text: string; duration?: number }

    const texte = result.text ?? ''
    const dureeSecondes = Math.round(result.duration ?? 0)
    const nbMots = texte.trim() ? texte.trim().split(/\s+/).length : 0
    const debit = dureeSecondes > 0 ? Math.round((nbMots / dureeSecondes) * 60) : 0

    await admin.from('fragments_oraux').update({
      transcription: texte,
      duree_secondes: dureeSecondes,
      nb_mots: nbMots,
      debit_mots_minute: debit,
      statut: 'transcrit',
    }).eq('id', oralId)

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await admin.from('fragments_oraux').update({
      statut: 'erreur',
      transcription: `ERREUR transcription: ${msg}`,
    }).eq('id', oralId)
    return
  }

  // ── Analyse IA ─────────────────────────────────────────────────────────────
  // Importé ici pour éviter la dépendance circulaire
  const { analyserOral } = await import('@/utils/analyse-orale')
  await analyserOral(oralId)
}
