import { lirePromptsAletheia } from '@/app/prof/aletheia/actions'
import { PROMPT_CAPSTONE_DEFAUT, PROMPT_REFERENCE_DEFAUT } from '@/utils/aletheia-retours'
import FormulaireParametresScriptorium from './FormulaireParametresScriptorium'

// Onglet « Paramètres » de Scriptorium : prompts des artefacts générés à la prép du
// livre (carte d'architecture + référence par chapitre). Leur maison logique est ici,
// pas dans /prof/aletheia (qui garde retour V1/VF + diagnostic). Mêmes colonnes en base.
export default async function SectionParametresScriptorium() {
  const prompts = await lirePromptsAletheia()
  return (
    <FormulaireParametresScriptorium
      initial={{ prompt_capstone: prompts.prompt_capstone, prompt_reference: prompts.prompt_reference }}
      defauts={{ capstone: PROMPT_CAPSTONE_DEFAUT, reference: PROMPT_REFERENCE_DEFAUT }}
    />
  )
}
