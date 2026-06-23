import { lirePromptsAletheia } from '../actions'
import {
  PROMPT_FEEDBACK_V1_DEFAUT, PROMPT_FEEDBACK_VF_DEFAUT, PROMPT_CAPSTONE_DEFAUT,
  PROMPT_REFERENCE_DEFAUT, PROMPT_DIAG_INVENTAIRE_DEFAUT, PROMPT_DIAG_NIVEAU_DEFAUT,
} from '@/utils/aletheia-retours'
import FormulaireParametresAletheia from '../FormulaireParametresAletheia'

export default async function ParametresAletheiaPage() {
  const prompts = await lirePromptsAletheia()

  return (
    <div className="max-w-3xl">
      <h3 className="text-base font-medium text-stone-700 mb-6">Paramètres</h3>
      <FormulaireParametresAletheia
        initial={prompts}
        defauts={{
          feedback1: PROMPT_FEEDBACK_V1_DEFAUT,
          feedback2: PROMPT_FEEDBACK_VF_DEFAUT,
          capstone: PROMPT_CAPSTONE_DEFAUT,
          reference: PROMPT_REFERENCE_DEFAUT,
          diagInventaire: PROMPT_DIAG_INVENTAIRE_DEFAUT,
          diagNiveau: PROMPT_DIAG_NIVEAU_DEFAUT,
        }}
      />
    </div>
  )
}
