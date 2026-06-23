import { lireParametres, sauvegarderParametres } from './actions'
import { PARAMS_DEFAUT } from '@/utils/quazian-params'
import { PROMPT_SYSTEME as PROMPT_FLASHCARDS, PROMPT_SYSTEME_TEXTE as PROMPT_TEXTE } from '@/utils/extraire-flashcards'
import { PROMPT_SYSTEME as PROMPT_QUIZZ } from '@/utils/generer-questions'
import Tuile from '@/components/Tuile'

async function actionSauvegarder(formData: FormData): Promise<void> {
  'use server'
  await sauvegarderParametres(formData)
}

function Entrees({ vue }: { vue: string }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 max-w-lg">
      <Tuile nom="Notation" sousTitre="Notes formative & de semestre, FSRS" href="/prof/quazian/parametres?vue=notation" selectionnee={vue === 'notation'} />
      <Tuile nom="Prompts" sousTitre="Prompts de génération IA" href="/prof/quazian/parametres?vue=prompts" selectionnee={vue === 'prompts'} />
    </div>
  )
}

export default async function ParametresPage({ searchParams }: { searchParams: Promise<{ vue?: string }> }) {
  const { vue = 'notation' } = await searchParams

  if (vue === 'prompts') {
    return (
      <div className="max-w-lg">
        <Entrees vue={vue} />
        <h3 className="text-base font-medium text-stone-700 mb-1">Prompts de génération</h3>
        <p className="text-xs text-stone-400 mb-4">
          Prompts système qui guident l&apos;IA pour produire le contenu. Visibles ici à titre de référence.
        </p>
        <div className="space-y-3">
          <details className="bg-white border border-stone-200 rounded-xl p-4">
            <summary className="text-sm font-medium text-stone-600 cursor-pointer">Flashcards depuis un cours</summary>
            <pre className="mt-3 text-xs text-stone-600 bg-stone-50 p-3 rounded-lg whitespace-pre-wrap font-sans overflow-auto max-h-96">{PROMPT_FLASHCARDS}</pre>
          </details>
          <details className="bg-white border border-stone-200 rounded-xl p-4">
            <summary className="text-sm font-medium text-stone-600 cursor-pointer">Flashcards depuis un texte source (1-2 cartes)</summary>
            <pre className="mt-3 text-xs text-stone-600 bg-stone-50 p-3 rounded-lg whitespace-pre-wrap font-sans overflow-auto max-h-96">{PROMPT_TEXTE}</pre>
          </details>
          <details className="bg-white border border-stone-200 rounded-xl p-4">
            <summary className="text-sm font-medium text-stone-600 cursor-pointer">Quizz (QCM)</summary>
            <pre className="mt-3 text-xs text-stone-600 bg-stone-50 p-3 rounded-lg whitespace-pre-wrap font-sans overflow-auto max-h-96">{PROMPT_QUIZZ}</pre>
          </details>
        </div>
      </div>
    )
  }

  // vue === 'notation'
  const params = await lireParametres()

  return (
    <div className="max-w-lg">
      <Entrees vue={vue} />
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
