import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/utils/supabase/admin'
import { RUBRIQUE_DEFAUT } from '@/utils/rubrique'

export const PROMPT_SYNTHESE_DEFAUT = `Tu es l'assistant pédagogique d'un professeur de philosophie et d'humanités dans un lycée français. Tu rédiges le bilan de fin de semestre du travail de « fragments d'érudition » d'un élève : son travail écrit hebdomadaire ET, le cas échéant, sa présentation orale. Tu disposes de toutes les analyses du semestre.

## L'élève
- Thème / question : {{theme}}
- Semestre : {{label_semestre}} ({{date_debut}} – {{date_fin}})
- Taux de dépôt : {{taux_depot}} ; retards : {{nb_retards}}

## Échelle des sections (pour lire le dossier)
{{rubrique}}

## Dossier du semestre
{{dossier}}
(Notes 0-4 par fragment, commentaires et retours, analyse orale si présente, pistes et statuts.)

## Tes tâches — tu t'adresses à l'élève en le tutoyant, ton bienveillant et exigeant

### 1. SYNTHÈSE (synthese)
Deux à trois paragraphes qui racontent le chemin du semestre : d'où l'élève est parti, comment son travail a évolué (régularité, qualité des découvertes, des sources, des réflexions), ce que l'oral a montré. Appuie-toi sur des éléments précis et datés. Pas de langue de bois : si le travail a été irrégulier ou en baisse, dis-le avec mesure.

### 2. POINTS FORTS (points_forts) et AXES DE PROGRÈS (axes_progres)
Quelques lignes chacun, concrets et actionnables.

### 3. NOTE SUGGÉRÉE (note20_suggeree, note20_justification)
Propose une note sur 20 (entiers ou demi-points) qui reflète la VALEUR D'ENSEMBLE du travail de fragments sur le semestre — pas une moyenne mécanique des notes 0-4. Pondère selon : la régularité (un travail rendu chaque semaine vaut mieux qu'un sursaut tardif), la trajectoire (un élève qui progresse nettement mérite d'en être crédité), la qualité de fond, et l'oral. Justifie en 2-4 phrases. Cette note est une SUGGESTION que le professeur validera ; ne la présente jamais comme définitive, et n'écris pas la note dans la synthèse adressée à l'élève (elle va uniquement dans le champ prévu).

## Format de réponse — JSON valide uniquement, rien avant ni après :
{
  "synthese": "...",
  "points_forts": "...",
  "axes_progres": "...",
  "note20_suggeree": 0-20,
  "note20_justification": "..."
}`

interface SyntheseJSON {
  synthese: string
  points_forts: string
  axes_progres: string
  note20_suggeree: number
  note20_justification: string
}

export async function genererSynthesePourEleve(inscriptionId: string, semestreId: string): Promise<void> {
  const admin = createAdminClient()

  // eleve_id dérivé de l'inscription (le travail est scopé par inscription).
  const { data: insc } = await admin
    .from('inscriptions')
    .select('eleve_id')
    .eq('id', inscriptionId)
    .single()
  if (!insc) return
  const eleveId = insc.eleve_id as string

  const { data: semestre } = await admin
    .from('fragments_semestres')
    .select('id, label, date_debut, date_fin')
    .eq('id', semestreId)
    .single()

  if (!semestre) return

  // Créer ou réinitialiser la synthèse
  const { data: existante } = await admin
    .from('fragments_syntheses')
    .select('id, statut')
    .eq('inscription_id', inscriptionId)
    .eq('semestre_id', semestreId)
    .maybeSingle()

  if (existante?.statut === 'publiee') return

  let syntheseId: string
  if (existante) {
    await admin.from('fragments_syntheses').update({
      statut: 'en_cours',
      synthese: null,
      points_forts: null,
      axes_progres: null,
      note20_suggeree: null,
      note20_min: null,
      note20_max: null,
      note20_justification: null,
      publiee_at: null,
    }).eq('id', existante.id)
    syntheseId = existante.id
  } else {
    const { data, error } = await admin.from('fragments_syntheses').insert({
      inscription_id: inscriptionId,
      eleve_id: eleveId,
      semestre_id: semestreId,
      statut: 'en_cours',
    }).select('id').single()
    if (error || !data) return
    syntheseId = data.id
  }

  try {
    const dateDebut = new Date(semestre.date_debut)
    const dateFin = new Date(semestre.date_fin)

    // Thème
    const { data: theme } = await admin
      .from('fragments_themes')
      .select('theme, description, question')
      .eq('inscription_id', inscriptionId)
      .maybeSingle()

    // Dépôts dans l'intervalle (de cette inscription)
    const { data: depots } = await admin
      .from('fragments_depots')
      .select('id, statut, created_at, fragments_semaines(numero, date_debut, date_limite)')
      .eq('inscription_id', inscriptionId)

    const depotsInterval = (depots ?? []).filter(d => {
      const sem = d.fragments_semaines as unknown as { date_debut: string; date_limite: string } | null
      if (!sem) return false
      const dl = new Date(sem.date_limite)
      return dl >= dateDebut && dl <= dateFin
    })

    // Compter semaines attendues (semaines dont la date_limite est dans l'intervalle)
    const { data: toutesLessemaines } = await admin
      .from('fragments_semaines')
      .select('id, numero, date_limite')

    const semainesInterval = (toutesLessemaines ?? []).filter(s => {
      const dl = new Date(s.date_limite)
      return dl >= dateDebut && dl <= dateFin
    })

    const nbSemainesAttendues = semainesInterval.length
    const nbDeposes = depotsInterval.length
    const nbRetards = depotsInterval.filter(d => d.statut === 'en_retard').length
    const tauxDepot = nbSemainesAttendues > 0
      ? `${nbDeposes}/${nbSemainesAttendues} (${Math.round((nbDeposes / nbSemainesAttendues) * 100)}%)`
      : '0/0'

    const depotIdsInterval = depotsInterval.map(d => d.id)
    const semaineNumParDepot: Record<string, number> = {}
    for (const d of depotsInterval) {
      semaineNumParDepot[d.id] = (d.fragments_semaines as unknown as { numero: number } | null)?.numero ?? 0
    }

    // Analyses publiées
    const { data: analysesPubliees } = depotIdsInterval.length > 0
      ? await admin
          .from('fragments_analyses')
          .select('id, depot_id, note_decouvertes, note_sources, note_reflexions, transcription, commentaire_general, retour_langue, retour_style, retour_contenu')
          .eq('statut', 'publiee')
          .in('depot_id', depotIdsInterval)
      : { data: [] }

    const analysesTriees = (analysesPubliees ?? [])
      .map(a => ({ ...a, semaine_numero: semaineNumParDepot[a.depot_id] ?? 0 }))
      .sort((a, b) => a.semaine_numero - b.semaine_numero)

    // Pistes
    const analyseIds = analysesTriees.map(a => a.id)
    const { data: pistes } = analyseIds.length > 0
      ? await admin
          .from('fragments_pistes')
          .select('contenu, statut')
          .eq('eleve_id', eleveId)
          .in('analyse_id', analyseIds)
          .order('created_at')
      : { data: [] }

    // Analyse orale du semestre (même inscription)
    const { data: presentations } = await admin
      .from('fragments_presentations')
      .select('id, semaine_id, fragments_semaines(date_limite)')
      .eq('inscription_id', inscriptionId)

    const presInterval = (presentations ?? []).filter(p => {
      const sem = p.fragments_semaines as unknown as { date_limite: string } | null
      if (!sem) return false
      const dl = new Date(sem.date_limite)
      return dl >= dateDebut && dl <= dateFin
    })

    let analyseOrale = null
    if (presInterval.length > 0) {
      const presIds = presInterval.map(p => p.id)
      const { data: oraux } = await admin
        .from('fragments_oraux')
        .select('id')
        .in('presentation_id', presIds)

      const oralIds = (oraux ?? []).map(o => o.id)
      if (oralIds.length > 0) {
        const { data: ao } = await admin
          .from('fragments_analyses_orales')
          .select('note_contenu, note_structure, note_expression, commentaire_general, retour_integration, retour_oral')
          .not('publiee_at', 'is', null)
          .in('oral_id', oralIds)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        analyseOrale = ao
      }
    }

    // Config
    const { data: config } = await admin
      .from('fragments_config')
      .select('prompt_synthese_semestre, fourchette_points, rubrique')
      .eq('id', 1)
      .single()

    const promptBase = config?.prompt_synthese_semestre?.trim() || PROMPT_SYNTHESE_DEFAUT
    const fourchette = config?.fourchette_points ?? 2

    // Construire le dossier semestre
    let dossier = 'FRAGMENTS DU SEMESTRE :\n'
    if (analysesTriees.length === 0) {
      dossier += 'Aucune analyse publiée pour ce semestre.\n'
    } else {
      for (const a of analysesTriees) {
        dossier += `\nSemaine ${a.semaine_numero} — Découvertes ${a.note_decouvertes ?? '?'}/4, Sources ${a.note_sources ?? '?'}/4, Réflexions ${a.note_reflexions ?? '?'}/4\n`
        if (a.commentaire_general) dossier += `Commentaire général : ${a.commentaire_general}\n`
        if (a.retour_langue) dossier += `Retour langue : ${a.retour_langue}\n`
        if (a.retour_style) dossier += `Retour style : ${a.retour_style}\n`
        if (a.retour_contenu) dossier += `Retour contenu : ${a.retour_contenu}\n`
      }
    }

    if (pistes && pistes.length > 0) {
      dossier += '\nPISTES ET STATUTS :\n'
      for (const p of pistes) {
        dossier += `- [${p.statut}] ${p.contenu}\n`
      }
    }

    if (analyseOrale) {
      dossier += '\nPRÉSENTATION ORALE :\n'
      dossier += `Notes : Contenu ${analyseOrale.note_contenu ?? '?'}/4, Structure ${analyseOrale.note_structure ?? '?'}/4, Expression ${analyseOrale.note_expression ?? '?'}/4\n`
      if (analyseOrale.commentaire_general) dossier += `Commentaire : ${analyseOrale.commentaire_general}\n`
    }

    // Périmètre (pour traçabilité)
    const perimetre = {
      semestre: semestre.label,
      analyse_ids: analyseIds,
      oral: analyseOrale ? 'inclus' : 'absent',
      nb_fragments: analysesTriees.length,
    }

    const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

    const prompt = promptBase
      .replace('{{theme}}', theme?.question ?? theme?.theme ?? 'Non défini')
      .replace('{{label_semestre}}', semestre.label)
      .replace('{{date_debut}}', formatDate(semestre.date_debut))
      .replace('{{date_fin}}', formatDate(semestre.date_fin))
      .replace('{{taux_depot}}', tauxDepot)
      .replace('{{nb_retards}}', String(nbRetards))
      .replace('{{rubrique}}', config?.rubrique ?? RUBRIQUE_DEFAUT)
      .replace('{{dossier}}', dossier)

    const client = new Anthropic()
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: [{ type: 'text', text: prompt }] }],
    })

    const texte = response.content[0].type === 'text' ? response.content[0].text : ''
    const nettoye = texte.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '').trim()

    let parsed: SyntheseJSON
    try {
      parsed = JSON.parse(nettoye)
    } catch {
      await admin.from('fragments_syntheses').update({ statut: 'erreur' }).eq('id', syntheseId)
      return
    }

    const cout = response.usage.input_tokens * 3 / 1_000_000
      + response.usage.output_tokens * 15 / 1_000_000

    const noteSuggeree = parsed.note20_suggeree ?? null
    const noteMin = noteSuggeree !== null ? Math.max(0, noteSuggeree - fourchette) : null
    const noteMax = noteSuggeree !== null ? Math.min(20, noteSuggeree + fourchette) : null

    const { error } = await admin.from('fragments_syntheses').update({
      statut: 'generee',
      synthese: parsed.synthese ?? null,
      points_forts: parsed.points_forts ?? null,
      axes_progres: parsed.axes_progres ?? null,
      note20_suggeree: noteSuggeree,
      note20_min: noteMin,
      note20_max: noteMax,
      note20_justification: parsed.note20_justification ?? null,
      note20_validee: noteSuggeree,
      perimetre,
      cout_api: cout,
    }).eq('id', syntheseId)

    if (error) {
      await admin.from('fragments_syntheses').update({ statut: 'erreur' }).eq('id', syntheseId)
    }

  } catch {
    await admin.from('fragments_syntheses').update({ statut: 'erreur' }).eq('id', syntheseId)
  }
}
