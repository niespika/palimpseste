import { lirePromptsCodex } from './actions'
import { PROMPT_V1_DEFAUT, PROMPT_VF_DEFAUT } from '@/utils/codex-analyse'
import FormulaireParametresCodex from './FormulaireParametresCodex'

export default async function ParametresCodexPage() {
  const prompts = await lirePromptsCodex()

  return (
    <div className="max-w-3xl">
      <h3 className="text-base font-medium text-stone-700 mb-6">Paramètres — prompts des retours IA</h3>
      <FormulaireParametresCodex
        promptV1Initial={prompts.prompt_suggestions_v1 ?? ''}
        promptVfInitial={prompts.prompt_retour_vf ?? ''}
        promptV1Defaut={PROMPT_V1_DEFAUT}
        promptVfDefaut={PROMPT_VF_DEFAUT}
      />
    </div>
  )
}
