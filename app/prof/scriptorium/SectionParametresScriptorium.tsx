import { lirePromptsAletheia } from '@/app/prof/aletheia/actions'
import { PROMPT_CAPSTONE_DEFAUT, PROMPT_REFERENCE_DEFAUT } from '@/utils/aletheia-retours'
import { PROMPT_SYNTHESE_RAG_DEFAUT } from '@/utils/scriptorium-rag'
import { createAdminClient } from '@/utils/supabase/admin'
import FormulaireParametresScriptorium from './FormulaireParametresScriptorium'
import FormulaireReglagesRag from './FormulaireReglagesRag'
import PromptTuteurSections from './PromptTuteurSections'
import PorteCopieAnnotee from './PorteCopieAnnotee'
import PorteJugeDocuments from './PorteJugeDocuments'

// Onglet « Paramètres » de Scriptorium : réglages du Scriptorium ÉLÈVE (RAG L5 —
// gate, modèles, quota, prompt de synthèse), prompt du TUTEUR par sections (L9)
// + prompts des artefacts générés à la prép du livre (carte d'architecture +
// référence par chapitre). Leur maison logique est ici, pas dans /prof/aletheia
// (qui garde retour V1/VF + diagnostic). Mêmes colonnes en base.
export default async function SectionParametresScriptorium() {
  const prompts = await lirePromptsAletheia()
  // Valeurs BRUTES des réglages RAG (les overrides restent null si défaut).
  // `select('*')` : les colonnes de sections (L9) peuvent ne pas encore exister
  // en base (migration jouée après le code) — une liste explicite ferait échouer
  // tout le select et l'écran perdrait aussi le gate et les modèles.
  const { data: params } = await createAdminClient()
    .from('scriptorium_params').select('*').eq('id', 1).maybeSingle()
  const p = (params ?? {}) as Record<string, unknown>
  const texte = (col: string): string | null => {
    const v = p[col]
    return typeof v === 'string' ? v.trim() || null : null
  }
  return (
    <div className="space-y-10">
      {/* La copie annotée (03/09) — l'interrupteur vit ici, sur `scriptorium_params`,
          comme `rag_actif`. Colonne absente (`select('*')` tolérant) ⇒ fermé. */}
      <PorteCopieAnnotee actif={!!p.copie_annotee_actif} />
      {/* C7-L1 (03/09) — le juge reçoit les documents. Même domicile, même tolérance. */}
      <PorteJugeDocuments actif={!!p.juge_documents_actif} />
      <FormulaireReglagesRag
        initial={{
          actif: !!p.rag_actif,
          modele: (p.rag_modele as string | null) || 'gemini-3.5-flash-lite',
          modeleSynthese: (p.rag_modele_synthese as string | null) || 'claude-sonnet-4-6',
          quotaJour: (p.rag_quota_jour as number | null) ?? 40,
          promptSynthese: texte('rag_prompt_synthese'),
        }}
        defauts={{ promptSynthese: PROMPT_SYNTHESE_RAG_DEFAUT }}
      />
      <PromptTuteurSections
        initial={{
          ton: texte('rag_prompt_ton'),
          relances: texte('rag_prompt_relances'),
          longueur: texte('rag_prompt_longueur'),
        }}
        modifieLeInitial={(p.rag_prompt_sections_maj as string | null) ?? null}
        ancienPromptIntegral={texte('rag_prompt') !== null}
      />
      <FormulaireParametresScriptorium
        initial={{ prompt_capstone: prompts.prompt_capstone, prompt_reference: prompts.prompt_reference }}
        defauts={{ capstone: PROMPT_CAPSTONE_DEFAUT, reference: PROMPT_REFERENCE_DEFAUT }}
      />
    </div>
  )
}
