import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/utils/supabase/admin'
import type { Retour1 } from '@/app/eleve/modules/aletheia/types'

const MODELE = 'claude-sonnet-4-6'

// ── Prompt par défaut — Retour 1 socratique (aletheia-spec §5.1) ─────────────
// Override éditable par le prof dans aletheia_params.prompt_feedback_1.
export const PROMPT_FEEDBACK_1_DEFAUT = `Tu es un tuteur de lecture, généreux mais exigeant. Un élève lit en autonomie un livre exigeant, semaine après semaine. Il vient d'écrire un résumé des chapitres de CETTE semaine et de poser quelques questions. Ton rôle : l'aider à approfondir sa lecture — sans jamais faire le travail à sa place.

## Texte de la semaine (ta SEULE source)
{texte_unite}

## Résumé de l'élève
{resume_eleve}

## Questions de l'élève
{questions_eleve}

## Ce que l'élève a déjà écrit les semaines précédentes (continuité)
{syntheses_precedentes}

## Principes ABSOLUS
1. **Tu ne corriges JAMAIS directement** une erreur ou une approximation du résumé. À la place, tu **poses une question** qui amène l'élève à la repérer lui-même, en le renvoyant à un **passage précis** (chapitre/section).
2. **En revanche, tu RÉPONDS clairement** aux questions que l'élève a posées, en les ancrant dans le texte. (Règle : on *questionne* ses erreurs, on *répond* à ses questions.) Si une question est purement factuelle, réponds-y puis propose une reformulation qui creuserait davantage.
3. **Ancrage strict** au seul « Texte de la semaine » ci-dessus. **Aucune** référence à la suite du livre, à d'autres œuvres, à l'auteur, à des influences ou à la littérature critique. Si l'élève s'égare hors du texte, ramène-le au texte.
4. **Citations systématiques** : chaque remarque renvoie à un endroit précis (chapitre/section/passage). **Ne recopie pas de longs extraits** du texte — renvoie aux passages ; l'élève lit son propre exemplaire.
5. **Tu ne réécris pas** le résumé de l'élève (ce sera le rôle d'un retour ultérieur).
6. **Adaptativité légère, sans plafond** : si le résumé est fragile, porte l'effort sur la compréhension de base ; s'il est solide, pousse plus loin. Vise toujours **la marche suivante**, jamais un jugement de niveau (« ton niveau, c'est X »).
7. **Ton** bienveillant, encourageant et exigeant. Tutoie l'élève. **3 à 5 relances maximum.**

## Format de réponse — UNIQUEMENT un objet JSON valide, sans texte autour :
{
  "questions_pour_avancer": ["question renvoyant à un passage précis", "..."],
  "reponses_a_tes_questions": ["réponse ancrée dans le texte à la 1re question", "..."],
  "remarque_questions": "remarque optionnelle et brève sur la qualité des questions, ou null"
}`

// Remplace {var} dans un template, en évitant l'interprétation des « $ » du contenu.
function injecter(template: string, vars: Record<string, string>): string {
  let out = template
  for (const [cle, val] of Object.entries(vars)) {
    out = out.replace(new RegExp('\\{' + cle + '\\}', 'g'), () => val)
  }
  return out
}

function extraireJSON(texte: string): string {
  return texte.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '').trim()
}

type Admin = ReturnType<typeof createAdminClient>

// ── Couture d'ancrage réutilisable ──────────────────────────────────────────
// Périmètre SEMAINE (retour 1). Le Lot 4 ajoutera l'équivalent « livre entier ».
// Le texte vient de Scriptorium (texte_extrait, extrait à l'upload du PDF). Jamais
// servi à l'élève — uniquement comme contexte IM.
export async function assemblerAncrageSemaine(admin: Admin, livreId: string, semaine: number): Promise<string> {
  const { data: docs } = await admin
    .from('scriptorium_documents')
    .select('titre, chapitres, texte_extrait')
    .eq('unite_id', livreId)
    .eq('semaine', semaine)
    .not('texte_extrait', 'is', null)
    .order('created_at', { ascending: true })

  if (!docs || docs.length === 0) return ''   // vide → l'appelant traite l'absence d'ancrage
  return docs
    .map(d => `## ${d.titre}${d.chapitres ? ` (${d.chapitres})` : ''}\n\n${d.texte_extrait}`)
    .join('\n\n---\n\n')
}

// Synthèses (vf) des semaines antérieures du même élève sur le même livre.
async function assemblerSynthesesPrecedentes(admin: Admin, eleveId: string, livreId: string, semaine: number): Promise<string> {
  const { data: prec } = await admin
    .from('aletheia_travaux')
    .select('semaine_index, resume_vf')
    .eq('eleve_id', eleveId)
    .eq('scriptorium_livre_id', livreId)
    .lt('semaine_index', semaine)
    .not('resume_vf', 'is', null)
    .order('semaine_index', { ascending: true })

  if (!prec || prec.length === 0) return '(Première semaine traitée — aucune synthèse précédente.)'
  return prec.map(p => `Semaine ${p.semaine_index} : ${p.resume_vf}`).join('\n\n')
}

// ── Génération du retour 1 (appelée en arrière-plan via after()) ─────────────
export async function genererRetour1(travailId: string): Promise<void> {
  const admin = createAdminClient()

  // Échec → retour à DRAFT + horodatage d'erreur (résumé/questions conservés). Le
  // compare-and-set (.eq statut) évite d'écraser un état plus récent (resoumission).
  const echec = async () => {
    await admin.from('aletheia_travaux')
      .update({ statut: 'DRAFT', retour_1_erreur_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', travailId).eq('statut', 'V1_SUBMITTED')
  }

  const { data: t } = await admin
    .from('aletheia_travaux')
    .select('id, scriptorium_livre_id, semaine_index, eleve_id, resume_initial, questions, statut')
    .eq('id', travailId)
    .single()
  if (!t || t.statut !== 'V1_SUBMITTED') return

  try {
    const texteUnite = await assemblerAncrageSemaine(admin, t.scriptorium_livre_id as string, t.semaine_index as number)
    // Sans texte de la semaine, l'ancrage strict est impossible → on n'appelle pas le modèle.
    if (!texteUnite.trim()) { await echec(); return }

    const synthesesPrec = await assemblerSynthesesPrecedentes(admin, t.eleve_id as string, t.scriptorium_livre_id as string, t.semaine_index as number)
    const { data: params } = await admin.from('aletheia_params').select('prompt_feedback_1').eq('id', 1).maybeSingle()
    const questions = (t.questions as string[] | null) ?? []

    const prompt = injecter(params?.prompt_feedback_1?.trim() || PROMPT_FEEDBACK_1_DEFAUT, {
      texte_unite: texteUnite,
      resume_eleve: (t.resume_initial as string | null) ?? '',
      questions_eleve: questions.map((q, i) => `${i + 1}. ${q}`).join('\n') || '(aucune)',
      syntheses_precedentes: synthesesPrec,
    })

    const client = new Anthropic()
    const response = await client.messages.create({
      model: MODELE,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })
    if (response.stop_reason === 'max_tokens') throw new Error('Réponse tronquée (max_tokens).')

    const texte = response.content[0]?.type === 'text' ? response.content[0].text : ''
    const parsed = JSON.parse(extraireJSON(texte)) as Partial<Retour1>

    const retour1: Retour1 = {
      questions_pour_avancer: Array.isArray(parsed.questions_pour_avancer) ? parsed.questions_pour_avancer : [],
      reponses_a_tes_questions: Array.isArray(parsed.reponses_a_tes_questions) ? parsed.reponses_a_tes_questions : [],
      remarque_questions: typeof parsed.remarque_questions === 'string' ? parsed.remarque_questions : null,
    }
    // Un retour sans aucune relance ni réponse n'est pas exploitable → échec.
    if (retour1.questions_pour_avancer.length === 0 && retour1.reponses_a_tes_questions.length === 0) {
      throw new Error('Retour 1 vide.')
    }

    await admin.from('aletheia_travaux')
      .update({ retour_1: retour1, retour_1_erreur_at: null, statut: 'FEEDBACK1_READY', updated_at: new Date().toISOString() })
      .eq('id', travailId).eq('statut', 'V1_SUBMITTED')
  } catch (err) {
    console.error('[aletheia] génération retour 1 :', err)
    await echec()
  }
}
