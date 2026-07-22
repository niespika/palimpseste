import { lirePromptsAletheia } from '@/app/prof/aletheia/actions'
import { PROMPT_CAPSTONE_DEFAUT, PROMPT_REFERENCE_DEFAUT } from '@/utils/aletheia-retours'
import { PROMPT_RAG_DEFAUT, PROMPT_SYNTHESE_RAG_DEFAUT } from '@/utils/scriptorium-rag'
import { createAdminClient } from '@/utils/supabase/admin'
import FormulaireParametresScriptorium from './FormulaireParametresScriptorium'
import FormulaireReglagesRag from './FormulaireReglagesRag'

// Onglet « Paramètres » de Scriptorium : réglages du Scriptorium ÉLÈVE (RAG L5 —
// gate, modèles, quota, prompts) + prompts des artefacts générés à la prép du
// livre (carte d'architecture + référence par chapitre). Leur maison logique est ici,
// pas dans /prof/aletheia (qui garde retour V1/VF + diagnostic). Mêmes colonnes en base.
export default async function SectionParametresScriptorium() {
  const prompts = await lirePromptsAletheia()
  // Valeurs BRUTES des réglages RAG (les overrides restent null si défaut).
  const { data: params } = await createAdminClient()
    .from('scriptorium_params')
    .select('rag_actif, rag_modele, rag_modele_synthese, rag_quota_jour, rag_prompt, rag_prompt_synthese')
    .eq('id', 1).maybeSingle()
  return (
    <div className="space-y-10">
      <FormulaireReglagesRag
        initial={{
          actif: !!params?.rag_actif,
          modele: (params?.rag_modele as string | null) || 'gemini-3.5-flash-lite',
          modeleSynthese: (params?.rag_modele_synthese as string | null) || 'claude-sonnet-4-6',
          quotaJour: (params?.rag_quota_jour as number | null) ?? 40,
          prompt: (params?.rag_prompt as string | null) ?? null,
          promptSynthese: (params?.rag_prompt_synthese as string | null) ?? null,
        }}
        defauts={{ prompt: PROMPT_RAG_DEFAUT, promptSynthese: PROMPT_SYNTHESE_RAG_DEFAUT }}
      />
      <FormulaireParametresScriptorium
        initial={{ prompt_capstone: prompts.prompt_capstone, prompt_reference: prompts.prompt_reference }}
        defauts={{ capstone: PROMPT_CAPSTONE_DEFAUT, reference: PROMPT_REFERENCE_DEFAUT }}
      />
    </div>
  )
}
