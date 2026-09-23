'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { sauvegarderReponse, soumettreQuizz, type QuestionPassation } from './actions'
import { CurseurPoints } from './CurseurPoints'

const LETTRES = ['A', 'B', 'C', 'D']
const VIDE: [number, number, number, number] = [0, 0, 0, 0]
const somme = (j: readonly number[]) => j.reduce((a, b) => a + b, 0)

// Les cases de navigation, trois états + la question à l'écran (22/09) : l'élève
// voit d'un coup d'œil ce qu'il n'a pas encore fait.
const CLASSE_CASE = {
  courante: 'bg-bouton text-surface border-bouton',
  // Plein, pas teinté : la teinte `ok` sur parchemin ne se lisait pas d'un coup d'œil à 375 px.
  repondue: 'bg-ok text-surface border-ok',
  vue: 'bg-attention-teinte text-attention border-attention',
  'pas-vue': 'bg-surface text-muet border-bordure',
} as const
const LIBELLE_CASE = {
  courante: 'à l’écran', repondue: 'répondue', vue: 'vue, sans réponse', 'pas-vue': 'pas encore vue',
} as const

interface Props {
  sessionId: string
  quizId: string
  questions: QuestionPassation[]
  reponsesInitiales: Record<string, [number, number, number, number]>
  fermeAt: string | null
}

export function PassationJetons({ sessionId, quizId, questions, reponsesInitiales, fermeAt }: Props) {
  const [indexQuestion, setIndexQuestion] = useState(0)
  const [reponses, setReponses] = useState<Record<string, [number, number, number, number]>>(reponsesInitiales)
  const reponsesSauvees = useRef(reponsesInitiales)
  // Le MIROIR rendu de `reponsesSauvees` : quelles questions ont une réponse en
  // base. Une ref ne se lit pas au rendu ; « peut-on quitter cette question ? » en a besoin.
  const [enregistrees, setEnregistrees] = useState<Record<string, true>>(
    Object.fromEntries(Object.keys(reponsesInitiales).map((id) => [id, true as const])))
  // Les questions OUVERTES au moins une fois (22/09, demande de Louis) : la case
  // dit alors « vue, sans réponse » plutôt que « pas encore vue ». État local :
  // un rechargement l'oublie (la page est verrouillée), les réponses, elles, restent.
  const [vues, setVues] = useState<Record<string, true>>(Object.fromEntries(
    [...Object.keys(reponsesInitiales), questions[0]?.id].filter(Boolean).map((id) => [id, true as const])))
  // Le récapitulatif avant l'envoi (22/09) : il remplace la question à l'écran.
  const [recap, setRecap] = useState(false)
  // Une fois le récapitulatif ouvert, « Revoir mes réponses » est offert sur
  // TOUTE question : corriger la 4 ne force plus à repasser par la dernière.
  const [recapVu, setRecapVu] = useState(false)
  // Un double toucher sur « Suivant » ne saute pas une question intacte : le
  // second toucher arrive sur la question suivante, et l'ignorer suffit.
  const arriveeQuestion = useRef(0)
  const [pending, setPending] = useState(false)
  const envoiEnCours = useRef(false)
  const [avisSoumission, setAvisSoumission] = useState<string | null>(null)
  const [soumis, setSoumis] = useState(false)
  // ⚠️ Distinct de `soumis` : une soumission REFUSÉE n'est pas une soumission.
  const [erreur, setErreur] = useState<string | null>(null)
  const [secondesRestantes, setSecondesRestantes] = useState<number | null>(null)

  const question = questions[indexQuestion]
  // Retours de classe du 22/09 : une question part de ZÉRO, plus de 25 partout.
  // Un 25/25/25/25 déjà valide laissait passer sans rien décider — et comptait
  // comme « répondu ». « Je ne sais pas » reste un geste, en un toucher.
  const jetonsActuels = useMemo<[number, number, number, number]>(
    () => reponses[question?.id] ?? VIDE,
    [reponses, question?.id]
  )
  const restants = 100 - somme(jetonsActuels)
  const peutSoumettre = restants === 0
  // On peut quitter une question COMPLÈTE (elle s'enregistre) ou INTACTE (rien
  // à enregistrer : elle reste sans réponse). Pas une question à moitié placée,
  // ni une question déjà enregistrée qu'on aurait vidée — la base la garderait.
  const intacte = restants === 100 && !enregistrees[question?.id]
  const peutQuitter = peutSoumettre || intacte

  // La réponse la plus chargée se détache — effet de SA saisie, jamais un indice
  // (le composant ne connaît pas la bonne réponse). Une égalité ne désigne personne.
  const plusHaut = Math.max(...jetonsActuels)
  const retenu = plusHaut > 0 && jetonsActuels.filter((j) => j === plusHaut).length === 1
    ? jetonsActuels.indexOf(plusHaut) : -1

  // Ref vers la dernière version de handleSoumettre, pour l'auto-soumission au
  // temps écoulé (évite une closure périmée dans le timer).
  const handleSoumettreRef = useRef<() => void>(() => {})

  // Verrou de page (T2) : tant que le quiz n'est pas soumis, on empêche la sortie
  // (avertissement natif sur fermeture/rechargement) et on piège le bouton retour
  // (tout popstate ré-empile l'état courant). Soft-lock : dissuasif, non infaillible.
  useEffect(() => {
    if (soumis) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    window.history.pushState(null, '', window.location.href)
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href)
    }
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [soumis])

  // Timer
  useEffect(() => {
    if (!fermeAt) return
    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(fermeAt).getTime() - Date.now()) / 1000))
      setSecondesRestantes(diff)
      if (diff === 0 && !soumis) handleSoumettreRef.current()
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [fermeAt, soumis])

  // ⭐ LE BUDGET EST UN PLAFOND DUR, comme à la crédence des exercices (décision
  //    de Louis, 22/09) : le curseur bute sur ce qui reste, et rien ne bouge seul
  //    sur les autres réponses — donner à B, c'est d'abord retirer à A.
  function poser(index: number, valeur: number) {
    setErreur(null)
    setReponses((prev) => {
      const actuel = [...(prev[question.id] ?? VIDE)] as [number, number, number, number]
      const autres = somme(actuel) - actuel[index]
      actuel[index] = Math.max(0, Math.min(Math.round(valeur), 100 - autres))
      return { ...prev, [question.id]: actuel }
    })
  }

  const repondue = (id: string) => !!reponses[id] && somme(reponses[id]) === 100
  const etatCase = (i: number): 'courante' | 'repondue' | 'vue' | 'pas-vue' =>
    !recap && i === indexQuestion ? 'courante'
      : repondue(questions[i].id) ? 'repondue'
      : vues[questions[i].id] ? 'vue' : 'pas-vue'

  function resetNeutral() {
    setErreur(null)
    setReponses((prev) => ({ ...prev, [question.id]: [25, 25, 25, 25] }))
  }

  // Tous les chemins de navigation passent par la sauvegarde, y compris les
  // numéros et « Précédent ». En cas d'échec, la réponse reste à l'écran.
  async function allerA(cible: number | 'recap') {
    if (envoiEnCours.current) return
    const aller = () => {
      setErreur(null)
      if (cible === 'recap') { setRecap(true); setRecapVu(true); return }
      setRecap(false)
      setIndexQuestion(cible)
      setVues((prev) => ({ ...prev, [questions[cible].id]: true }))
      arriveeQuestion.current = Date.now()
    }
    // Depuis le récapitulatif, la question courante a déjà été quittée proprement.
    if (recap) { if (cible !== 'recap') aller(); return }
    if (cible === indexQuestion) return
    if (!peutQuitter) {
      setErreur(restants > 0
        ? `Il te reste ${restants} point${restants > 1 ? 's' : ''} à placer sur cette question avant d’en changer.`
        : 'Répartis les 100 points avant de changer de question.')
      return
    }
    if (intacte) { aller(); return }
    // Déjà en base, à l'identique : rien à renvoyer (revue du 22/09).
    if (reponsesSauvees.current[question.id]?.every((v, i) => v === jetonsActuels[i])) { aller(); return }
    envoiEnCours.current = true
    setPending(true)
    setErreur(null)
    try {
      const retour = await sauvegarderReponse(sessionId, question.id, jetonsActuels)
      // ⭐ L'échéance du SERVEUR fait foi (revue du 22/09) : une horloge de
      //    téléphone en retard laissait l'élève bloqué, sans accès à « Envoyer ».
      //    Il va au récapitulatif, d'où l'envoi soumet ce qui est enregistré.
      if (retour.ferme) { setErreur(retour.error ?? null); setRecap(true); setRecapVu(true); return }
      if (retour.error) { setErreur(retour.error); return }
      reponsesSauvees.current = { ...reponsesSauvees.current, [question.id]: jetonsActuels }
      setEnregistrees((prev) => ({ ...prev, [question.id]: true }))
      setReponses((prev) => ({ ...prev, [question.id]: jetonsActuels }))
      aller()
    } catch {
      // L'écriture a PEUT-ÊTRE eu lieu : la question ne peut plus être laissée
      // à zéro comme si de rien n'était (la base garderait l'ancienne réponse).
      setEnregistrees((prev) => ({ ...prev, [question.id]: true }))
      setErreur('La sauvegarde n’a pas pu être confirmée. Réessaie.')
    } finally {
      envoiEnCours.current = false
      setPending(false)
    }
  }

  function suivant() {
    // eslint-disable-next-line react-hooks/purity -- gestionnaire de clic, jamais pendant le rendu
    if (Date.now() - arriveeQuestion.current < 350) return
    void allerA(indexQuestion + 1)
  }

  const handleSoumettre = useCallback(async (automatique = false) => {
    if (soumis || envoiEnCours.current) return
    envoiEnCours.current = true
    setPending(true)
    setErreur(null)
    try {
      // Ce gestionnaire s'exécute au clic ou au timer, jamais pendant le rendu.
      // eslint-disable-next-line react-hooks/purity
      const expire = !!fermeAt && new Date(fermeAt).getTime() <= Date.now()
      let avis = expire ? 'Le temps est écoulé : les réponses enregistrées avant l’échéance ont été soumises.' : null
      if (!expire) {
        // Vérifier toutes les réponses présentes. Ne renvoyer que celles qui
        // ont changé, pour ne pas consommer le temps restant en doubles envois.
        const aSauver = { ...reponses, [question.id]: jetonsActuels }
        // Une question INTACTE (0 point) n'est pas incomplète : elle part sans
        // réponse, comptée 25/25/25/25 à la correction, comme avant.
        const incomplet = questions.findIndex((q) => aSauver[q.id] && somme(aSauver[q.id]) > 0 && somme(aSauver[q.id]) !== 100)
        if (incomplet >= 0 && !automatique) {
          setRecap(false)
          setIndexQuestion(incomplet)
          setErreur('Place tous les points de cette question (ou remets-la à zéro) avant de soumettre.')
          return
        }
        for (const q of questions) {
          const jetons = aSauver[q.id]
          if (!jetons || somme(jetons) !== 100) continue
          if (reponsesSauvees.current[q.id]?.every((v, i) => v === jetons[i])) continue
          const retour = await sauvegarderReponse(sessionId, q.id, jetons)
          if (retour.ferme) {
            avis = retour.error ?? null
            break // L'échéance serveur fait foi, même si l'horloge locale diffère.
          }
          if (retour.error) { setErreur(retour.error); return }
          reponsesSauvees.current = { ...reponsesSauvees.current, [q.id]: jetons }
          setEnregistrees((prev) => ({ ...prev, [q.id]: true }))
        }
      }
      const retour = await soumettreQuizz(sessionId, quizId)
      if (retour.error) { setErreur(retour.error); return }
      setAvisSoumission(avis)
      setSoumis(true)
    } catch {
      setErreur('L’envoi n’a pas pu être confirmé. Réessaie.')
    } finally {
      envoiEnCours.current = false
      setPending(false)
    }
  }, [soumis, fermeAt, reponses, questions, sessionId, question, jetonsActuels, quizId])

  useEffect(() => {
    handleSoumettreRef.current = () => { void handleSoumettre(true) }
  }, [handleSoumettre])

  function formatTemps(s: number) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${String(sec).padStart(2, '0')}`
  }

  if (soumis) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-4">✓</div>
        <h3 className="text-lg font-serif text-encre mb-2">Quizz soumis !</h3>
        {avisSoumission && <p role="status" className="text-sm text-attention mb-4">{avisSoumission}</p>}
        <p className="text-sm text-encre-douce">
          Le retour sera disponible une fois que ton professeur aura fermé le quizz.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-3 mb-6">
        <div className="min-w-0">
          {/* ⚠️ `flex-wrap` : 15 cases de 32 px ne tiennent pas sur une ligne à 375 px. */}
          <div className="flex flex-wrap gap-1">
            {questions.map((q, i) => (
              <button
                key={i}
                onClick={() => allerA(i)}
                disabled={pending}
                aria-label={`Question ${i + 1} — ${LIBELLE_CASE[etatCase(i)]}`}
                className={`w-8 h-8 text-xs rounded-md border transition-colors ${CLASSE_CASE[etatCase(i)]}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muet">
            <span className="inline-flex items-center gap-1"><span className={`inline-block w-3 h-3 rounded-sm border ${CLASSE_CASE.repondue}`} />répondue</span>
            <span className="inline-flex items-center gap-1"><span className={`inline-block w-3 h-3 rounded-sm border ${CLASSE_CASE.vue}`} />vue, sans réponse</span>
            <span className="inline-flex items-center gap-1"><span className={`inline-block w-3 h-3 rounded-sm border ${CLASSE_CASE['pas-vue']}`} />pas encore vue</span>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 pt-1.5">
          <span className="text-xs text-muet inline-flex items-center gap-1" title="Ne quitte pas la page pendant le quiz">
            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 1a4 4 0 0 0-4 4v2H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-1V5a4 4 0 0 0-4-4Zm2 6V5a2 2 0 1 0-4 0v2h4Z" clipRule="evenodd" />
            </svg>
            Page verrouillée
          </span>
          {secondesRestantes !== null && (
            <span className={`text-sm font-mono font-bold ${secondesRestantes < 120 ? 'text-retard' : 'text-encre-douce'}`}>
              {formatTemps(secondesRestantes)}
            </span>
          )}
        </div>
      </div>

      {recap ? (
        <Recapitulatif
          questions={questions}
          reponses={reponses}
          pending={pending}
          surQuestion={(i) => allerA(i)}
          surRetour={() => { setErreur(null); setRecap(false) }}
          surEnvoi={() => handleSoumettre()}
        />
      ) : (
        <>
      {/* Question */}
      <div className="bg-surface border border-bordure rounded-2xl p-6 mb-5 shadow-sm">
        <p className="text-xs text-muet mb-3">Question {indexQuestion + 1}/{questions.length}</p>
        <p className="text-base font-medium text-encre leading-relaxed">{question.enonce}</p>
      </div>

      {/* Les points — un curseur par réponse, au point près (décision du 22/09). */}
      <div className="bg-surface border border-bordure rounded-2xl p-4 sm:p-5 mb-4 shadow-sm">
        <p className="text-sm text-encre-douce leading-relaxed">
          Répartis <strong className="text-encre">100 points</strong> entre les réponses : plus tu en
          mets sur une, plus tu la crois juste. Tout sur une seule si tu es sûr, partagés si tu hésites.
        </p>

        <div className="mt-3 flex flex-col gap-2.5">
          {question.options.map((opt, i) => (
            <CurseurPoints
              key={`${question.id}-${i}`}
              id={`points-${question.id}-${i}`}
              lettre={LETTRES[i]}
              libelle={opt}
              valeur={jetonsActuels[i]}
              plafond={jetonsActuels[i] + Math.max(0, restants)}
              gele={pending}
              retenu={retenu === i}
              surValeur={(v) => poser(i, v)}
            />
          ))}
        </div>

        {/* Le total, en permanence — « sur 100 », pas « / 100 » : ce n'est pas une note. */}
        <div className="mt-3 flex items-center justify-between gap-3 rounded-[10px] bg-parchemin-fonce px-4 py-3">
          <span className="text-sm text-encre-douce">Points placés</span>
          <span className={`text-[15px] font-semibold tabular-nums ${restants === 0 ? 'text-ok' : 'text-encre'}`}>
            {100 - restants} sur 100{restants === 0 ? ' ✓' : ''}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-attention min-h-5">
            {restants > 0 && restants < 100
              ? `Il te reste ${restants} point${restants > 1 ? 's' : ''} à placer.`
              : !peutQuitter
                ? 'Cette réponse est déjà enregistrée : place tes 100 points (ou « Je ne sais pas »).'
                : ''}
          </p>
          <button
            onClick={resetNeutral}
            disabled={pending}
            className="text-sm text-muet hover:text-encre-douce underline min-h-11"
          >
            Je ne sais pas (25 partout)
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        {indexQuestion > 0 && (
          <button
            onClick={() => allerA(indexQuestion - 1)}
            disabled={pending}
            className="px-4 py-2.5 text-sm bg-parchemin-fonce text-encre-douce rounded-xl hover:bg-bordure"
          >
            ← Précédent
          </button>
        )}

        {indexQuestion < questions.length - 1 ? (
          <button
            onClick={suivant}
            disabled={!peutQuitter || pending}
            className="flex-1 py-2.5 text-sm bg-bouton text-surface rounded-xl hover:opacity-90 disabled:opacity-40 transition-colors"
          >
            {pending ? 'Sauvegarde…' : 'Suivant →'}
          </button>
        ) : (
          <button
            onClick={() => allerA('recap')}
            disabled={!peutQuitter || pending}
            className="flex-1 py-2.5 text-sm bg-bouton text-surface rounded-xl hover:opacity-90 disabled:opacity-40 transition-colors"
          >
            {pending ? 'Sauvegarde…' : 'Revoir mes réponses →'}
          </button>
        )}
      </div>
      {recapVu && indexQuestion < questions.length - 1 && (
        <button
          onClick={() => allerA('recap')}
          disabled={!peutQuitter || pending}
          className="mt-2 w-full min-h-11 text-sm text-muet hover:text-encre-douce underline disabled:opacity-40"
        >
          Revoir mes réponses
        </button>
      )}
        </>
      )}
      {/* ⛔ Le refus se DIT. Sans cela l'élève lisait « Quizz soumis ! » sur un
          envoi que le serveur avait refusé, et repartait — sa session restant
          ouverte, sa note jamais posée. Le ton reste celui d'un contretemps :
          rien n'est perdu, sa copie est intacte, il peut recommencer. */}
      {erreur && (
        <p role="alert" className="mt-4 text-sm text-attention text-center">
          {erreur}
          <span className="block text-muet mt-1">
            Tes réponses restent à l’écran. Garde cette page ouverte pour réessayer.
          </span>
        </p>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// LE RÉCAPITULATIF AVANT L'ENVOI (22/09, accord de Louis) — une ligne par
// question : ce que l'élève a placé, ou « sans réponse ». Toucher une ligne y
// ramène. ⛔ Aucune bonne réponse ici : ce composant ne la connaît pas, elle ne
// sort qu'à la fermeture du quiz (`chargerRetourQuizz`).
// ─────────────────────────────────────────────────────────────────────────────
function Recapitulatif({
  questions, reponses, pending, surQuestion, surRetour, surEnvoi,
}: {
  questions: QuestionPassation[]
  reponses: Record<string, [number, number, number, number]>
  pending: boolean
  surQuestion: (i: number) => void
  surRetour: () => void
  surEnvoi: () => void
}) {
  const complete = (id: string) => !!reponses[id] && somme(reponses[id]) === 100
  const sansReponse = questions.filter((q) => !complete(q.id)).length
  return (
    <>
      <div className="bg-surface border border-bordure rounded-2xl p-4 sm:p-6 mb-4 shadow-sm">
        <h3 className="text-lg font-serif text-encre">Avant d’envoyer</h3>
        <p className="mt-1 text-sm text-encre-douce leading-relaxed">
          Voici ce que tu as placé. Touche une question pour y revenir.
        </p>
        {sansReponse > 0 && (
          <p className="mt-2 text-sm text-attention">
            {sansReponse} question{sansReponse > 1 ? 's' : ''} sans réponse : {sansReponse > 1 ? 'elles compteront' : 'elle comptera'} 25 points sur chaque réponse.
          </p>
        )}
        <ol className="mt-4 flex flex-col gap-2">
          {questions.map((q, i) => {
            const jetons = complete(q.id) ? reponses[q.id] : null
            const places = jetons
              ? q.options.map((opt, j) => ({ lettre: LETTRES[j], opt, points: jetons[j] }))
                .filter((o) => o.points > 0).sort((a, b) => b.points - a.points)
              : []
            return (
              <li key={q.id}>
                <button
                  type="button"
                  onClick={() => surQuestion(i)}
                  disabled={pending}
                  className={`w-full text-left rounded-xl border p-3 transition-colors hover:bg-parchemin-fonce ${jetons ? 'border-bordure' : 'border-attention bg-attention-teinte'}`}
                >
                  <p className="text-sm text-encre leading-snug">
                    <span className="font-semibold tabular-nums mr-1.5">{i + 1}.</span>{q.enonce}
                  </p>
                  {jetons ? (
                    <ul className="mt-2 flex flex-col gap-1">
                      {places.map((o) => (
                        <li key={o.lettre} className="flex items-baseline gap-2 text-sm">
                          <span className="w-4 shrink-0 text-xs font-bold text-muet">{o.lettre}</span>
                          <span className="min-w-0 flex-1 text-encre-douce leading-snug">{o.opt}</span>
                          <span className="shrink-0 font-semibold tabular-nums text-encre">{o.points}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1.5 text-sm text-attention">Sans réponse — comptera 25 partout</p>
                  )}
                </button>
              </li>
            )
          })}
        </ol>
      </div>
      <div className="flex gap-3">
        <button
          onClick={surRetour}
          disabled={pending}
          className="px-4 py-2.5 text-sm bg-parchemin-fonce text-encre-douce rounded-xl hover:bg-bordure"
        >
          ← Revenir
        </button>
        <button
          onClick={surEnvoi}
          disabled={pending}
          className="flex-1 py-2.5 text-sm bg-ok text-surface rounded-xl hover:opacity-90 disabled:opacity-40 transition-colors font-medium"
        >
          {pending ? 'Envoi…' : 'Envoyer mes réponses'}
        </button>
      </div>
    </>
  )
}
