import { lirePromptsAletheia } from './actions'
import { PROMPT_FEEDBACK_1_DEFAUT } from '@/utils/aletheia-retours'
import FormulaireParametresAletheia from './FormulaireParametresAletheia'

export default async function ParametresAletheiaPage() {
  const prompts = await lirePromptsAletheia()

  return (
    <div className="max-w-3xl">
      <h3 className="text-base font-medium text-stone-700 mb-6">Paramètres — prompts des retours IA</h3>
      <FormulaireParametresAletheia
        promptFeedback1Initial={prompts.prompt_feedback_1 ?? ''}
        promptFeedback1Defaut={PROMPT_FEEDBACK_1_DEFAUT}
      />
    </div>
  )
}
