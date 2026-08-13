import { createClient } from '@/utils/supabase/server'
import FormulaireParametres from './FormulaireParametres'
import { PROMPT_ORAL_DEFAUT } from '@/utils/analyse-orale'
import { ECHELLE_LETTRES_DEFAUT, PROMPT_ESSAI_DEFAUT } from '@/utils/analyse-essai'
import { PROMPT_SYNTHESE_DEFAUT } from '@/utils/synthese-semestre'
import { PROMPT_FRAGMENT_DEFAUT } from '@/utils/prompt-fragment'
import { RUBRIQUE_DEFAUT, BAREME_DEFAUT } from '@/utils/rubrique'


export default async function PageParametres() {
  const supabase = await createClient()

  // Coût total du mois (si renseigné)
  const debut = new Date()
  debut.setDate(1)
  debut.setHours(0, 0, 0, 0)

  const { data: analyses } = await supabase
    .from('fragments_analyses')
    .select('cout_api')
    .gte('created_at', debut.toISOString())

  const coutMois = (analyses ?? [])
    .reduce((sum, a) => sum + (a.cout_api ?? 0), 0)

  // Config actuelle
  const { data: config } = await supabase
    .from('fragments_config')
    .select('prompt_evaluation, bareme, rubrique, prompt_evaluation_orale, supprimer_audio_publication, echelle_lettres, fourchette_points, prompt_evaluation_essai, prompt_synthese_semestre, seuil_photo_heures')
    .eq('id', 1)
    .single()

  return (
    <div className="space-y-6">
      {coutMois > 0 && (
        <div className="bg-parchemin-fonce border border-bordure rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-sm text-encre-douce">Coût API estimé ce mois-ci :</span>
          <span className="font-medium text-encre">${coutMois.toFixed(4)}</span>
        </div>
      )}

      <FormulaireParametres
        promptInitial={config?.prompt_evaluation ?? ''}
        baremeInitial={config?.bareme ?? ''}
        promptDefaut={PROMPT_FRAGMENT_DEFAUT}
        baremeDefaut={BAREME_DEFAUT}
        rubriqueInitial={config?.rubrique ?? RUBRIQUE_DEFAUT}
        rubriqueDefaut={RUBRIQUE_DEFAUT}
        promptOralInitial={config?.prompt_evaluation_orale ?? ''}
        promptOralDefaut={PROMPT_ORAL_DEFAUT}
        supprimerAudioInitial={config?.supprimer_audio_publication ?? true}
        echelleInitiale={config?.echelle_lettres ?? ''}
        echelleDefaut={ECHELLE_LETTRES_DEFAUT}
        fourchetteInitiale={config?.fourchette_points ?? 2}
        promptEssaiInitial={config?.prompt_evaluation_essai ?? ''}
        promptEssaiDefaut={PROMPT_ESSAI_DEFAUT}
        promptSyntheseInitial={config?.prompt_synthese_semestre ?? ''}
        promptSyntheseDefaut={PROMPT_SYNTHESE_DEFAUT}
        seuilPhotoInitial={config?.seuil_photo_heures ?? 48}
      />
    </div>
  )
}
