import { lireParametres, sauvegarderParametres, sauvegarderPlafond } from './actions'
import { PARAMS_DEFAUT } from '@/utils/quazian-params'
import { MOTS_PAR_CARTE, PLAFOND_MAX, PLAFOND_MIN } from '@/utils/quazian-quotas'
import { PROMPT_SYSTEME as PROMPT_FLASHCARDS, PROMPT_SYSTEME_TEXTE as PROMPT_TEXTE } from '@/utils/extraire-flashcards'
import { PROMPT_SYSTEME as PROMPT_QUIZZ } from '@/utils/generer-questions'
import Tuile from '@/components/Tuile'

async function actionSauvegarder(formData: FormData): Promise<void> {
  'use server'
  await sauvegarderParametres(formData)
}

async function actionPlafond(formData: FormData): Promise<void> {
  'use server'
  await sauvegarderPlafond(formData)
}

function Entrees({ vue }: { vue: string }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 max-w-lg">
      <Tuile nom="Notation" sousTitre="Notes formative & de semestre, FSRS" href="/prof/quazian/parametres?vue=notation" selectionnee={vue === 'notation'} />
      <Tuile nom="Génération" sousTitre="Plafond de cartes & prompts IA" href="/prof/quazian/parametres?vue=generation" selectionnee={vue === 'generation'} />
    </div>
  )
}

export default async function ParametresPage({ searchParams }: { searchParams: Promise<{ vue?: string }> }) {
  const { vue = 'notation' } = await searchParams

  // `vue=prompts` reste servi : c'est l'ancienne adresse de cet onglet, et des
  // liens (ou un signet du prof) la portent encore.
  if (vue === 'generation' || vue === 'prompts') {
    const params = await lireParametres()
    return (
      <div className="max-w-lg">
        <Entrees vue="generation" />

        <section className="bg-surface border border-bordure rounded-xl p-5 mb-6">
          <h4 className="text-sm font-medium text-encre-douce mb-1">Plafond de cartes par contenu</h4>
          <p className="text-xs text-muet mb-4">
            Nombre maximal de cartes qu&apos;une génération dépose sur UN cours — pas par sous-section.
            Un cours découpé partage ce plafond entre ses sous-sections, au prorata de leur longueur.
          </p>
          <form action={actionPlafond} className="space-y-3">
            <label className="text-xs text-muet mb-1 block" htmlFor="plafond_cartes">
              Cartes au maximum ({PLAFOND_MIN}–{PLAFOND_MAX})
            </label>
            <input
              id="plafond_cartes"
              type="number"
              name="plafond_cartes"
              min={PLAFOND_MIN}
              max={PLAFOND_MAX}
              step="1"
              defaultValue={params.plafond_cartes}
              className="w-full px-3 py-2 text-sm border border-bordure rounded-lg"
            />
            <p className="text-xs text-muet">défaut : {PARAMS_DEFAUT.plafond_cartes}</p>
            <p className="text-xs text-muet bg-parchemin-fonce rounded-lg px-3 py-2">
              La densité visée est d&apos;environ 1 carte tous les {MOTS_PAR_CARTE}&nbsp;mots : un cours de
              sept pages (~2 800 mots) atteint le plafond, un cours de deux pages en reçoit ~7.
              Le plafond est un maximum, pas un objectif — l&apos;IA en rend moins si le cours ne
              porte pas davantage d&apos;essentiel.
            </p>
            <button type="submit"
              className="w-full py-2.5 bg-bouton text-surface text-sm rounded-xl hover:opacity-90 transition-colors">
              Enregistrer le plafond
            </button>
          </form>
        </section>

        <h3 className="text-base font-medium text-encre-douce mb-1">Prompts de génération</h3>
        <p className="text-xs text-muet mb-4">
          Prompts système qui guident l&apos;IA pour produire le contenu. Visibles ici à titre de référence.
        </p>
        <div className="space-y-3">
          <details className="bg-surface border border-bordure rounded-xl p-4">
            <summary className="text-sm font-medium text-encre-douce cursor-pointer">Flashcards depuis un cours (plafonnées)</summary>
            <pre className="mt-3 text-xs text-encre-douce bg-parchemin-fonce p-3 rounded-lg whitespace-pre-wrap font-sans overflow-auto max-h-96">{PROMPT_FLASHCARDS}</pre>
          </details>
          <details className="bg-surface border border-bordure rounded-xl p-4">
            <summary className="text-sm font-medium text-encre-douce cursor-pointer">Flashcards depuis un texte source (1-2 cartes)</summary>
            <pre className="mt-3 text-xs text-encre-douce bg-parchemin-fonce p-3 rounded-lg whitespace-pre-wrap font-sans overflow-auto max-h-96">{PROMPT_TEXTE}</pre>
          </details>
          <details className="bg-surface border border-bordure rounded-xl p-4">
            <summary className="text-sm font-medium text-encre-douce cursor-pointer">Quizz (QCM)</summary>
            <pre className="mt-3 text-xs text-encre-douce bg-parchemin-fonce p-3 rounded-lg whitespace-pre-wrap font-sans overflow-auto max-h-96">{PROMPT_QUIZZ}</pre>
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
      <h3 className="text-base font-medium text-encre-douce mb-6">Paramètres de notation</h3>

      <form action={actionSauvegarder} className="space-y-6">

        <section className="bg-surface border border-bordure rounded-xl p-5">
          <h4 className="text-sm font-medium text-encre-douce mb-1">Note formative par quizz</h4>
          <p className="text-xs text-muet mb-4">
            note = clamp(a + b × score_moyen, 0, 20) — score_moyen ∈ [−10, +10]
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muet mb-1 block">a (intercept)</label>
              <input type="number" name="a" step="0.1" defaultValue={params.a}
                className="w-full px-3 py-2 text-sm border border-bordure rounded-lg" />
              <p className="text-xs text-muet mt-1">défaut : {PARAMS_DEFAUT.a}</p>
            </div>
            <div>
              <label className="text-xs text-muet mb-1 block">b (pente)</label>
              <input type="number" name="b" step="0.1" defaultValue={params.b}
                className="w-full px-3 py-2 text-sm border border-bordure rounded-lg" />
              <p className="text-xs text-muet mt-1">défaut : {PARAMS_DEFAUT.b}</p>
            </div>
          </div>
          <p className="text-xs text-muet mt-3 bg-parchemin-fonce rounded-lg px-3 py-2">
            Avec a={params.a}, b={params.b} : 25 % partout → {(params.a + params.b * 2.5).toFixed(1)}/20 · bonne réponse sûre → {Math.min(params.a + params.b * 10, 20).toFixed(1)}/20
          </p>
        </section>

        <section className="bg-surface border border-bordure rounded-xl p-5">
          <h4 className="text-sm font-medium text-encre-douce mb-1">Note sommative de semestre</h4>
          <p className="text-xs text-muet mb-4">
            note_relative = clamp(centre + pente × z_moyen, 0, 20)
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muet mb-1 block">centre</label>
              <input type="number" name="centre" step="0.5" defaultValue={params.centre}
                className="w-full px-3 py-2 text-sm border border-bordure rounded-lg" />
              <p className="text-xs text-muet mt-1">défaut : {PARAMS_DEFAUT.centre}</p>
            </div>
            <div>
              <label className="text-xs text-muet mb-1 block">pente</label>
              <input type="number" name="pente" step="0.5" defaultValue={params.pente}
                className="w-full px-3 py-2 text-sm border border-bordure rounded-lg" />
              <p className="text-xs text-muet mt-1">défaut : {PARAMS_DEFAUT.pente}</p>
            </div>
          </div>
        </section>

        <section className="bg-surface border border-bordure rounded-xl p-5">
          <h4 className="text-sm font-medium text-encre-douce mb-1">Blend relatif / absolu</h4>
          <p className="text-xs text-muet mb-4">
            note_finale = w × note_relative + (1−w) × note_absolue
          </p>
          <div>
            <label className="text-xs text-muet mb-1 block">w (poids du relatif, 0–1)</label>
            <input type="number" name="w" step="0.05" min="0" max="1" defaultValue={params.w}
              className="w-full px-3 py-2 text-sm border border-bordure rounded-lg" />
            <p className="text-xs text-muet mt-1">défaut : {PARAMS_DEFAUT.w} (50 % relatif, 50 % absolu)</p>
          </div>
        </section>

        <section className="bg-surface border border-bordure rounded-xl p-5">
          <h4 className="text-sm font-medium text-encre-douce mb-1">Répétition espacée (FSRS)</h4>
          <div>
            <label className="text-xs text-muet mb-1 block">Cible de rétention</label>
            <input type="number" name="retention_cible" step="0.01" min="0.7" max="0.99" defaultValue={params.retention_cible}
              className="w-full px-3 py-2 text-sm border border-bordure rounded-lg" />
            <p className="text-xs text-muet mt-1">défaut : {PARAMS_DEFAUT.retention_cible} (90 %)</p>
          </div>
        </section>

        <button type="submit"
          className="w-full py-2.5 bg-bouton text-surface text-sm rounded-xl hover:opacity-90 transition-colors">
          Enregistrer les paramètres
        </button>
      </form>
    </div>
  )
}
