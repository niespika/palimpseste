import { lireParametres, sauvegarderParametres } from './actions'
import { PARAMS_DEFAUT } from '@/utils/quazian-params'

async function actionSauvegarder(formData: FormData): Promise<void> {
  'use server'
  await sauvegarderParametres(formData)
}

export default async function ParametresPage() {
  const params = await lireParametres()

  return (
    <div className="max-w-lg">
      <h3 className="text-base font-medium text-stone-700 mb-6">Paramètres de notation</h3>

      <form action={actionSauvegarder} className="space-y-6">

        <section className="bg-white border border-stone-200 rounded-xl p-5">
          <h4 className="text-sm font-medium text-stone-600 mb-1">Note formative par quizz</h4>
          <p className="text-xs text-stone-400 mb-4">
            note = clamp(a + b × score_moyen, 0, 20) — score_moyen ∈ [−10, +10]
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-stone-500 mb-1 block">a (intercept)</label>
              <input type="number" name="a" step="0.1" defaultValue={params.a}
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg" />
              <p className="text-xs text-stone-300 mt-1">défaut : {PARAMS_DEFAUT.a}</p>
            </div>
            <div>
              <label className="text-xs text-stone-500 mb-1 block">b (pente)</label>
              <input type="number" name="b" step="0.1" defaultValue={params.b}
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg" />
              <p className="text-xs text-stone-300 mt-1">défaut : {PARAMS_DEFAUT.b}</p>
            </div>
          </div>
          <p className="text-xs text-stone-400 mt-3 bg-stone-50 rounded-lg px-3 py-2">
            Avec a={params.a}, b={params.b} : 25 % partout → {(params.a + params.b * 2.5).toFixed(1)}/20 · bonne réponse sûre → {Math.min(params.a + params.b * 10, 20).toFixed(1)}/20
          </p>
        </section>

        <section className="bg-white border border-stone-200 rounded-xl p-5">
          <h4 className="text-sm font-medium text-stone-600 mb-1">Note sommative de semestre</h4>
          <p className="text-xs text-stone-400 mb-4">
            note_relative = clamp(centre + pente × z_moyen, 0, 20)
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-stone-500 mb-1 block">centre</label>
              <input type="number" name="centre" step="0.5" defaultValue={params.centre}
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg" />
              <p className="text-xs text-stone-300 mt-1">défaut : {PARAMS_DEFAUT.centre}</p>
            </div>
            <div>
              <label className="text-xs text-stone-500 mb-1 block">pente</label>
              <input type="number" name="pente" step="0.5" defaultValue={params.pente}
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg" />
              <p className="text-xs text-stone-300 mt-1">défaut : {PARAMS_DEFAUT.pente}</p>
            </div>
          </div>
        </section>

        <section className="bg-white border border-stone-200 rounded-xl p-5">
          <h4 className="text-sm font-medium text-stone-600 mb-1">Blend relatif / absolu</h4>
          <p className="text-xs text-stone-400 mb-4">
            note_finale = w × note_relative + (1−w) × note_absolue
          </p>
          <div>
            <label className="text-xs text-stone-500 mb-1 block">w (poids du relatif, 0–1)</label>
            <input type="number" name="w" step="0.05" min="0" max="1" defaultValue={params.w}
              className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg" />
            <p className="text-xs text-stone-300 mt-1">défaut : {PARAMS_DEFAUT.w} (50 % relatif, 50 % absolu)</p>
          </div>
        </section>

        <section className="bg-white border border-stone-200 rounded-xl p-5">
          <h4 className="text-sm font-medium text-stone-600 mb-1">Répétition espacée (FSRS)</h4>
          <div>
            <label className="text-xs text-stone-500 mb-1 block">Cible de rétention</label>
            <input type="number" name="retention_cible" step="0.01" min="0.7" max="0.99" defaultValue={params.retention_cible}
              className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg" />
            <p className="text-xs text-stone-300 mt-1">défaut : {PARAMS_DEFAUT.retention_cible} (90 %)</p>
          </div>
        </section>

        <button type="submit"
          className="w-full py-2.5 bg-stone-800 text-white text-sm rounded-xl hover:bg-stone-900 transition-colors">
          Enregistrer les paramètres
        </button>
      </form>
    </div>
  )
}
