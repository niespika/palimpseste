import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/utils/supabase/admin'

export const PROMPT_ORAL_DEFAUT = `Tu es l'assistant pédagogique d'un professeur de philosophie et d'humanités dans un lycée français. Un élève vient de faire une présentation orale de 3-4 minutes devant sa classe, sur le thème annuel qu'il travaille chaque semaine dans ses « fragments d'érudition » écrits. Tu disposes de la transcription de sa présentation ET de son dossier écrit complet. Ta valeur ajoutée est précisément ce recoupement : tu as tout le dossier sous les yeux.

## L'élève
- Thème annuel : {{theme}} — {{description_theme}}
- Présentation de la semaine n° {{numero_semaine}}
- Durée : {{duree}} ; nombre de mots : {{nb_mots}} ; débit : {{debit}} mots/minute (repères : une présentation de 3-4 min fait environ 400-600 mots ; un débit confortable se situe entre 120 et 160 mots/minute)

## Transcription de la présentation
{{transcription_orale}}
(C'est de l'oral transcrit automatiquement : ne sanctionne pas la ponctuation ni les éventuelles erreurs de transcription ; en cas de passage incohérent, envisage d'abord une erreur de transcription.)

## Dossier écrit de l'élève
{{dossier}}
(Transcriptions de ses derniers fragments, retours sur le contenu qui lui ont été faits, pistes proposées avec leurs statuts, notes.)

## Tes tâches — tu t'adresses à l'élève en le tutoyant, ton bienveillant et exigeant

### 1. INTÉGRATION DES RETOURS (retour_integration)
Parcours les corrections et signalements d'erreurs faits sur ses fragments écrits (sections « retour_contenu » du dossier). À l'oral, l'élève a-t-il corrigé ces erreurs et levé ces approximations, ou les a-t-il répétées ? Sois précis : cite l'erreur d'origine et ce qu'il en a fait. S'il n'y avait rien à corriger, dis-le simplement.

### 2. PISTES MOBILISÉES (retour_pistes)
Parmi les pistes qui lui ont été proposées au fil des semaines, lesquelles nourrissent sa présentation ? Lesquelles, marquées « suivies » dans ses écrits, sont étrangement absentes de l'oral ? Valorise explicitement toute piste mobilisée.

### 3. COMPLÉTUDE (retour_completude)
Au vu de tout ce qu'il a écrit dans ses fragments : la présentation restitue-t-elle l'essentiel de son année de recherche ? Nomme 1) ce qu'il a bien choisi de mettre en avant, 2) ce qu'il a laissé de côté alors que c'était fort dans ses écrits (sois spécifique : « tu n'as pas parlé de X, que tu avais pourtant développé en semaine 4 »), 3) ce qu'il a apporté de neuf par rapport à ses écrits, le cas échéant — c'est un mérite à souligner.

### 4. QUALITÉS ORALES (retour_oral)
Uniquement ce qui se juge sur transcription : la structure (y a-t-il une annonce, un fil, une conclusion, ou est-ce une juxtaposition ?), la clarté des phrases, la durée et le débit par rapport aux repères, les tics de langage récurrents (compte-les : « du coup » × 9). Ne dis RIEN de la voix, de la gestuelle ou de l'aisance : tu ne les connais pas.

### 5. NOTES (0-4, barème : {{bareme}})
- note_contenu : richesse et justesse de ce qui est présenté, au regard du dossier ;
- note_structure : organisation du propos ;
- note_expression : clarté de la langue orale (phrases, vocabulaire, débit), en tenant compte de ce qu'est l'oral.

### 6. COMMENTAIRE GÉNÉRAL (commentaire_general)
3 à 5 phrases : le geste d'ensemble de la présentation, le principal mérite, le principal axe de progrès. C'est un moment important pour l'élève — il est passé devant la classe : commence par reconnaître ce qui a été réussi.

## Format de réponse
Réponds UNIQUEMENT avec un objet JSON valide, sans texte avant ou après :
{
  "retour_integration": "...",
  "retour_pistes": "...",
  "retour_completude": "...",
  "retour_oral": "...",
  "notes": { "contenu": 0-4, "structure": 0-4, "expression": 0-4 },
  "commentaire_general": "..."
}`

interface AnalyseOraleJSON {
  retour_integration: string
  retour_pistes: string
  retour_completude: string
  retour_oral: string
  notes: { contenu: number; structure: number; expression: number }
  commentaire_general: string
}

function construireDossier(
  analyses: Array<{
    semaine_numero: number
    note_decouvertes: number | null
    note_sources: number | null
    note_reflexions: number | null
    transcription: string | null
    commentaire_general: string | null
    retour_contenu: string | null
  }>,
  pistes: Array<{ contenu: string; statut: string }>
): string {
  let texte = 'TABLEAU DES NOTES ÉCRITES :\n'
  for (const a of analyses) {
    texte += `- Semaine ${a.semaine_numero} : Découvertes ${a.note_decouvertes ?? '?'}/4, Sources ${a.note_sources ?? '?'}/4, Réflexions ${a.note_reflexions ?? '?'}/4\n`
  }
  texte += '\n'

  const derniers5 = analyses.slice(-5)
  const anciens = analyses.slice(0, -5)

  if (derniers5.length > 0) {
    texte += 'FRAGMENTS ÉCRITS RÉCENTS (transcriptions) :\n'
    for (const a of derniers5) {
      texte += `\n=== Semaine ${a.semaine_numero} ===\n`
      if (a.transcription) {
        const t = a.transcription.length > 2500 ? a.transcription.slice(0, 2500) + '…' : a.transcription
        texte += `${t}\n`
      }
      if (a.commentaire_general) texte += `Commentaire prof : ${a.commentaire_general}\n`
    }
  }

  if (anciens.length > 0) {
    texte += '\nFRAGMENTS ANCIENS (commentaires seulement) :\n'
    for (const a of anciens) {
      texte += `- Semaine ${a.semaine_numero} : ${a.commentaire_general ?? '(pas de commentaire)'}\n`
    }
  }

  const retourContenu = analyses.filter(a => a.retour_contenu)
  if (retourContenu.length > 0) {
    texte += '\nERREURS ET APPROXIMATIONS SIGNALÉES (à vérifier à l\'oral) :\n'
    for (const a of retourContenu) {
      texte += `Semaine ${a.semaine_numero} : ${a.retour_contenu}\n`
    }
  }

  if (pistes.length > 0) {
    texte += '\nPISTES PROPOSÉES ET STATUTS :\n'
    for (const p of pistes) {
      texte += `- [${p.statut}] ${p.contenu}\n`
    }
  }

  return texte
}

export async function analyserOral(oralId: string): Promise<void> {
  const admin = createAdminClient()

  const { data: oral } = await admin
    .from('fragments_oraux')
    .select('id, eleve_id, presentation_id, transcription, duree_secondes, nb_mots, debit_mots_minute, statut')
    .eq('id', oralId)
    .single()

  if (!oral || oral.statut !== 'transcrit' || !oral.transcription) return

  try {
    // Thème
    const { data: theme } = await admin
      .from('fragments_themes')
      .select('theme, description')
      .eq('eleve_id', oral.eleve_id)
      .maybeSingle()

    // Numéro de semaine
    const { data: presentation } = await admin
      .from('fragments_presentations')
      .select('semaine_id, fragments_semaines(numero)')
      .eq('id', oral.presentation_id)
      .single()
    const numeroSemaine = (presentation?.fragments_semaines as unknown as { numero: number } | null)?.numero ?? 1

    // Dépôts de l'élève
    const { data: tousDepots } = await admin
      .from('fragments_depots')
      .select('id, fragments_semaines(numero)')
      .eq('eleve_id', oral.eleve_id)

    const depotIds = (tousDepots ?? []).map(d => d.id)
    const semainePourDepot: Record<string, number> = {}
    for (const d of tousDepots ?? []) {
      semainePourDepot[d.id] = (d.fragments_semaines as unknown as { numero: number } | null)?.numero ?? 0
    }

    // Analyses publiées
    const { data: analysesPubliees } = depotIds.length > 0
      ? await admin
          .from('fragments_analyses')
          .select('id, depot_id, note_decouvertes, note_sources, note_reflexions, transcription, commentaire_general, retour_contenu')
          .eq('statut', 'publiee')
          .in('depot_id', depotIds)
      : { data: [] }

    const analysesTriees = (analysesPubliees ?? [])
      .map(a => ({ ...a, semaine_numero: semainePourDepot[a.depot_id] ?? 0 }))
      .sort((a, b) => a.semaine_numero - b.semaine_numero)

    // Pistes
    const analyseIds = analysesTriees.map(a => a.id)
    const { data: pistes } = analyseIds.length > 0
      ? await admin
          .from('fragments_pistes')
          .select('contenu, statut')
          .eq('eleve_id', oral.eleve_id)
          .in('analyse_id', analyseIds)
          .order('created_at')
      : { data: [] }

    // Config
    const { data: config } = await admin
      .from('fragments_config')
      .select('prompt_evaluation_orale, bareme')
      .eq('id', 1)
      .single()

    const promptBase = (config?.prompt_evaluation_orale?.trim())
      ? config.prompt_evaluation_orale
      : PROMPT_ORAL_DEFAUT

    const dureeFormatee = oral.duree_secondes
      ? `${Math.floor(oral.duree_secondes / 60)}min${oral.duree_secondes % 60}s`
      : 'inconnue'

    const dossier = construireDossier(analysesTriees, pistes ?? [])

    const prompt = promptBase
      .replace('{{theme}}', theme?.theme ?? 'Non défini')
      .replace('{{description_theme}}', theme?.description ?? '')
      .replace('{{numero_semaine}}', String(numeroSemaine))
      .replace('{{duree}}', dureeFormatee)
      .replace('{{nb_mots}}', String(oral.nb_mots ?? '?'))
      .replace('{{debit}}', String(oral.debit_mots_minute ?? '?'))
      .replace('{{transcription_orale}}', oral.transcription)
      .replace('{{dossier}}', dossier)
      .replace('{{bareme}}', config?.bareme ?? '')

    const client = new Anthropic()
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: [{ type: 'text', text: prompt }] }],
    })

    const texte = response.content[0].type === 'text' ? response.content[0].text : ''
    const nettoye = texte.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '').trim()

    let parsed: AnalyseOraleJSON
    try {
      parsed = JSON.parse(nettoye)
    } catch {
      await admin.from('fragments_oraux').update({ statut: 'erreur' }).eq('id', oralId)
      return
    }

    // Supprimer l'ancienne analyse si elle existe (cas relancer)
    await admin.from('fragments_analyses_orales').delete().eq('oral_id', oralId)

    await admin.from('fragments_analyses_orales').insert({
      oral_id: oralId,
      retour_integration: parsed.retour_integration ?? null,
      retour_pistes: parsed.retour_pistes ?? null,
      retour_completude: parsed.retour_completude ?? null,
      retour_oral: parsed.retour_oral ?? null,
      commentaire_general: parsed.commentaire_general ?? null,
      note_contenu: parsed.notes?.contenu ?? null,
      note_structure: parsed.notes?.structure ?? null,
      note_expression: parsed.notes?.expression ?? null,
    })

    await admin.from('fragments_oraux').update({ statut: 'analyse' }).eq('id', oralId)

  } catch {
    await admin.from('fragments_oraux').update({ statut: 'erreur' }).eq('id', oralId)
  }
}
