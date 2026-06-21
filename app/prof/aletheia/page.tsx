import { lirePromptsAletheia } from './actions'
import { PROMPT_FEEDBACK_1_DEFAUT, PROMPT_FEEDBACK_2_DEFAUT, PROMPT_CAPSTONE_DEFAUT } from '@/utils/aletheia-retours'
import FormulaireParametresAletheia from './FormulaireParametresAletheia'

export default async function ParametresAletheiaPage() {
  const prompts = await lirePromptsAletheia()

  return (
    <div className="max-w-3xl">
      <h3 className="text-base font-medium text-stone-700 mb-6">Paramètres — prompts des retours IA</h3>
      <FormulaireParametresAletheia
        promptFeedback1Initial={prompts.prompt_feedback_1 ?? ''}
        promptFeedback1Defaut={PROMPT_FEEDBACK_1_DEFAUT}
        promptFeedback2Initial={prompts.prompt_feedback_2 ?? ''}
        promptFeedback2Defaut={PROMPT_FEEDBACK_2_DEFAUT}
        promptCapstoneInitial={prompts.prompt_capstone ?? ''}
        promptCapstoneDefaut={PROMPT_CAPSTONE_DEFAUT}
      />
    </div>
  )
}
