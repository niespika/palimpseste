'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { fermerQuizz } from './actions'

interface EleveStatut {
  id: string
  display_name: string
  commence: boolean
  soumis: boolean
  submitted_at: string | null
  score_moyen: number | null
  auto: boolean
}

interface Props {
  quizId: string
  statut: string
  fermeAt: string | null
  eleves: EleveStatut[]
  moyenneCohorte: number | null
  ecartTypeCohorte: number | null
}

export function TableauLive({ quizId, statut, fermeAt, eleves: elevesInit, moyenneCohorte }: Props) {
  const router = useRouter()
  const [elevesLive, setElevesLive] = useState<EleveStatut[] | null>(null)
  const [confirmation, setConfirmation] = useState(false)
  const [pending, setPending] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [secondesRestantes, setSecondesRestantes] = useState<number | null>(null)

  // Tableau DÉRIVÉ, pas copié : pendant le live, le sondage de 10 s est la source
  // la plus fraîche ; une fois le quizz fermé, c'est le rendu serveur qui fait foi
  // (il porte les notes définitives). Sans cette dérivation, le `router.refresh()`
  // de la fermeture changeait le statut mais laissait le tableau sur les données
  // du premier rendu — donc sans les scores.
  const eleves = statut === 'lance' ? (elevesLive ?? elevesInit) : elevesInit

  // Timer
  useEffect(() => {
    if (!fermeAt || statut !== 'lance') return
    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(fermeAt).getTime() - Date.now()) / 1000))
      setSecondesRestantes(diff)
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [fermeAt, statut])

  // Rafraîchissement automatique toutes les 10s pendant le live
  const rafraichir = useCallback(async () => {
    if (statut !== 'lance') return
    const res = await fetch(`/api/quazian/live/${quizId}`)
    if (res.ok) {
      const data = await res.json()
      setElevesLive(data.eleves)
    }
  }, [quizId, statut])

  useEffect(() => {
    if (statut !== 'lance') return
    const interval = setInterval(rafraichir, 10000)
    return () => clearInterval(interval)
  }, [rafraichir, statut])

  // FAIL-VISIBLE (C7·L1) : ce bouton jetait le résultat de `fermerQuizz` à la
  // poubelle. Une fermeture qui échouait rendait la main sans un mot — le prof
  // voyait le quizz rester ouvert sans savoir pourquoi. Le `try/finally` relâche
  // le bouton même si l'action lève (patron C8·L1), et `router.refresh()` fait
  // apparaître l'écran fermé sans Cmd-R.
  async function handleFermer() {
    setPending(true)
    setErreur(null)
    try {
      const fd = new FormData()
      fd.append('quizId', quizId)
      const res = await fermerQuizz(fd)
      if ('error' in res && res.error) { setErreur(res.error); return }
      setConfirmation(false)
      router.refresh()
    } catch {
      setErreur('La fermeture n’a pas abouti (erreur serveur). Réessaie — rien n’a été figé.')
    } finally {
      setPending(false)
    }
  }

  const nbSoumis = eleves.filter((e) => e.soumis).length
  const total = eleves.length
  // Deux populations très différentes à la fermeture : celui qui a OUVERT sans
  // soumettre sera auto-soumis en 25/25/25/25 (il aura une note), celui qui n'a
  // jamais ouvert n'aura AUCUNE note. Les confondre, c'est annoncer au prof des
  // notes qui n'existeront pas.
  const nbEnCours = eleves.filter((e) => e.commence && !e.soumis).length
  const nbJamaisOuvert = eleves.filter((e) => !e.commence).length

  function formatTemps(s: number) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${String(sec).padStart(2, '0')}`
  }

  return (
    <div>
      {/* En-tête statut */}
      <div className="bg-surface border border-bordure rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3">
              {statut === 'lance' && (
                <span className="w-2 h-2 rounded-full bg-ok animate-pulse" />
              )}
              <span className="font-medium text-encre">
                {statut === 'lance' ? 'Quizz en cours' : 'Quizz terminé'}
              </span>
            </div>
            <p className="text-sm text-muet mt-1">
              {nbSoumis}/{total} élève{total > 1 ? 's' : ''} {statut === 'lance' ? 'ont soumis' : 'ont participé'}
            </p>
            {secondesRestantes !== null && secondesRestantes > 0 && (
              <p className={`text-2xl font-mono font-bold mt-2 ${secondesRestantes < 60 ? 'text-retard' : 'text-encre-douce'}`}>
                {formatTemps(secondesRestantes)}
              </p>
            )}
            {secondesRestantes === 0 && statut === 'lance' && (
              <p className="text-sm text-retard mt-1">Temps écoulé — ferme le quizz</p>
            )}
          </div>

          {statut === 'lance' && (
            <div className="text-right">
              <button
                onClick={() => { setErreur(null); setConfirmation(true) }}
                className="px-5 py-2.5 bg-retard text-surface text-sm rounded-xl hover:opacity-90 transition-colors"
              >
                Fermer le quizz
              </button>
              {erreur && !confirmation && <p className="text-xs text-retard mt-2 max-w-xs">{erreur}</p>}
            </div>
          )}
        </div>

        {/* Confirmation EN PAGE — jamais `confirm()`. Le dialogue natif est muet
            dans l'aperçu embarqué : le bouton semblait mort, aucune requête ne
            partait (règle d'or du 24/07, retombée ici pendant la recette C7·L1).
            Patron `BoutonSupprimerUnite`, à un cran : fermer un quizz est grave
            mais réparable, ça ne mérite pas la re-saisie du nom. */}
        {confirmation && (
          <div
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
            onClick={() => !pending && setConfirmation(false)}
          >
            <div className="bg-surface rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-serif text-encre">Fermer le quizz maintenant ?</h3>
              <div className="space-y-2 text-sm text-encre-douce">
                <p>
                  Les notes sont calculées et figées : la moyenne de cohorte, l&apos;écart-type et
                  la note /20 de chaque élève.
                </p>
                {nbEnCours > 0 && (
                  <p className="text-attention">
                    <strong>{nbEnCours} élève{nbEnCours > 1 ? 's' : ''}</strong> {nbEnCours > 1 ? 'ont' : 'a'} ouvert
                    le quizz sans soumettre : {nbEnCours > 1 ? 'leurs réponses manquantes seront comptées' : 'ses réponses manquantes seront comptées'} 25/25/25/25.
                  </p>
                )}
                {nbJamaisOuvert > 0 && (
                  <p className="text-muet">
                    <strong>{nbJamaisOuvert} élève{nbJamaisOuvert > 1 ? 's' : ''}</strong> {nbJamaisOuvert > 1 ? 'n’ont' : 'n’a'} jamais
                    ouvert le quizz : {nbJamaisOuvert > 1 ? 'ils n’auront aucune note' : 'il n’aura aucune note'}.
                  </p>
                )}
                {nbEnCours === 0 && nbJamaisOuvert === 0 && (
                  <p className="text-muet">Toute la classe a soumis.</p>
                )}
              </div>
              {erreur && <p className="text-sm text-retard">{erreur}</p>}
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setConfirmation(false)}
                  disabled={pending}
                  className="px-4 py-2 text-sm bg-parchemin-fonce text-encre-douce rounded-lg hover:opacity-90 disabled:opacity-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleFermer}
                  disabled={pending}
                  className="px-4 py-2 text-sm bg-retard text-surface rounded-lg hover:opacity-90 disabled:opacity-50 transition-colors"
                >
                  {pending ? 'Fermeture…' : 'Fermer le quizz'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Barre de progression */}
        {total > 0 && (
          <div className="mt-4 h-2 bg-parchemin-fonce rounded-full overflow-hidden">
            <div
              className="h-full bg-pigment transition-all duration-500"
              style={{ width: `${(nbSoumis / total) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Stats cohorte (quizz fermé) */}
      {statut === 'ferme' && moyenneCohorte !== null && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-surface border border-bordure rounded-xl p-4 text-center">
            <p className="text-2xl font-serif text-encre">{moyenneCohorte.toFixed(2)}</p>
            <p className="text-xs text-muet mt-1">score moyen cohorte</p>
          </div>
          <div className="bg-surface border border-bordure rounded-xl p-4 text-center">
            <p className="text-2xl font-serif text-encre">
              {Math.min(Math.max(10 + moyenneCohorte, 0), 20).toFixed(1)}/20
            </p>
            <p className="text-xs text-muet mt-1">note formative moyenne</p>
          </div>
        </div>
      )}

      {/* Tableau élèves */}
      <div className="bg-surface border border-bordure rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-bordure text-xs text-muet">
              <th className="text-left px-4 py-3">Élève</th>
              <th className="text-center px-4 py-3">Statut</th>
              {statut === 'ferme' && <th className="text-right px-4 py-3">Score</th>}
              {statut === 'ferme' && <th className="text-right px-4 py-3">Note /20</th>}
            </tr>
          </thead>
          <tbody>
            {eleves.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-muet py-8">
                  Aucun élève n'a encore démarré le quizz.
                </td>
              </tr>
            )}
            {eleves.map((e) => (
              <tr key={e.id} className="border-b border-bordure last:border-0">
                <td className="px-4 py-3 text-encre">{e.display_name}</td>
                <td className="px-4 py-3 text-center">
                  {e.soumis ? (
                    <span className="text-xs px-2 py-0.5 bg-ok-teinte text-ok rounded-full">
                      {e.auto ? 'Auto-soumis' : 'Soumis'}
                    </span>
                  ) : e.commence ? (
                    <span className="text-xs px-2 py-0.5 bg-parchemin-fonce text-muet rounded-full">
                      En cours…
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 bg-parchemin-fonce text-muet rounded-full">
                      Pas commencé
                    </span>
                  )}
                </td>
                {statut === 'ferme' && (
                  <td className="px-4 py-3 text-right font-mono text-encre-douce">
                    {e.score_moyen != null ? e.score_moyen.toFixed(2) : '—'}
                  </td>
                )}
                {statut === 'ferme' && (
                  <td className="px-4 py-3 text-right font-medium text-encre">
                    {e.score_moyen != null
                      ? `${Math.min(Math.max(10 + e.score_moyen, 0), 20).toFixed(1)}/20`
                      : '—'}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
