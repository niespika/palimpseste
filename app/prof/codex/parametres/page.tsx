import { lirePromptsCodex } from './actions'
import { PROMPT_V1_DEFAUT, PROMPT_VF_DEFAUT } from '@/utils/codex-analyse'
import { CONSIGNE_V1_DEFAUT, CONSIGNE_VF_DEFAUT } from '@/app/eleve/modules/codex/consignes'
import FormulaireParametresCodex from './FormulaireParametresCodex'

export default async function ParametresCodexPage() {
  const prompts = await lirePromptsCodex()

  return (
    <div className="max-w-3xl">
      <h3 className="text-base font-medium text-stone-700 mb-6">Paramètres</h3>
      <FormulaireParametresCodex
        promptV1Initial={prompts.prompt_suggestions_v1 ?? ''}
        promptVfInitial={prompts.prompt_retour_vf ?? ''}
        promptV1Defaut={PROMPT_V1_DEFAUT}
        promptVfDefaut={PROMPT_VF_DEFAUT}
        consigneV1Initial={prompts.consigne_v1 ?? ''}
        consigneVfInitial={prompts.consigne_vf ?? ''}
        consigneV1Defaut={CONSIGNE_V1_DEFAUT}
        consigneVfDefaut={CONSIGNE_VF_DEFAUT}
      />
    </div>
  )
}
