'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { soumettreV1 } from './actions'
import { AIDES_V1_DEFAUT, type AidesV1 } from './aides-v1'
import type { LibellesSeance } from '@/utils/aletheia/gabarits'

interface Props {
  livreId: string
  semaine: number
  theseInitial?: string
  argumentsInitial?: string
  accordInitial?: string
  questionsInitial?: string
  vocabulaireInitial?: string
  champFixeInitial?: string
  /** Bulles d'aide « comment remplir » (éditables par le prof, T6). */
  aides?: AidesV1
  /**
   * (E3) Les QUESTIONS du gabarit de lecture de cette séance. Absent ⇒ les libellés
   * d'avant, à l'octet près (porte fermée, ou page qui ne les passe pas).
   */
  libelles?: LibellesSeance
}

const champClasse =
  'w-full px-3 py-2 border border-bordure rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pigment resize-y text-encre'

function Etiquette({ titre, detail }: { titre: string; detail?: string }) {
  return (
    <label className="block text-xs font-medium text-muet mb-1">
      {titre}{detail && <> <span className="font-normal">{detail}</span></>}
    </label>
  )
}

// Saisie V1 — 5 champs (SPEC §1) : idée principale, arguments, accord, questions, vocabulaire.
// Avec `libelles` (E3), les cinq emplacements portent les questions du gabarit, plus la
// question FIXE du dialogué ; les colonnes de base gardent leurs noms.
export default function FormulaireV1({
  livreId, semaine,
  theseInitial = '', argumentsInitial = '', accordInitial = '', questionsInitial = '', vocabulaireInitial = '', champFixeInitial = '',
  aides = AIDES_V1_DEFAUT, libelles,
}: Props) {
  const router = useRouter()
  const [these, setThese] = useState(theseInitial)
  const [args, setArgs] = useState(argumentsInitial)
  const [accord, setAccord] = useState(accordInitial)
  const [champFixe, setChampFixe] = useState(champFixeInitial)
  const [questions, setQuestions] = useState(questionsInitial)
  const [vocabulaire, setVocabulaire] = useState(vocabulaireInitial)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [avertissement, setAvertissement] = useState<string | null>(null)

  const g = libelles
  const avecFixe = !!g?.champFixe

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErreur(null)
    const qs = questions.split('\n').map(q => q.trim()).filter(Boolean)
    const voc = vocabulaire.split('\n').map(v => v.trim()).filter(Boolean)
    if (!these.trim()) { setErreur(g ? 'Réponds à la première question.' : 'Écris l’idée principale du chapitre.'); return }
    if (!args.trim()) { setErreur(g ? 'Réponds à la deuxième question.' : 'Indique les arguments avancés par l’auteur.'); return }
    if (avecFixe && !champFixe.trim()) { setErreur('Dis quelle thèse l’auteur préfère, selon toi.'); return }
    if (!accord.trim()) { setErreur(g ? `Réponds à la question « ${g.tournante.question} »` : 'Dis si tu es d’accord ou non, et pourquoi.'); return }
    if (qs.length === 0) { setErreur('Pose au moins une question (une par ligne).'); return }
    setChargement(true)
    try {
      const res = await soumettreV1(livreId, semaine, {
        these, arguments: args, accord, questions: qs, vocabulaire: voc,
        ...(avecFixe ? { champ_fixe: champFixe } : {}),
      })
      if (res?.error) { setErreur(res.error); return }
      // Rendu accepté mais signalé « petit malin » : on montre le message avant de continuer.
      if (res?.avertissement) { setAvertissement(res.avertissement); return }
      router.refresh()
    } catch {
      // (B2) La Server Action a REJETÉ (réseau coupé, session expirée, déploiement en
      // cours). Sans ce catch, rien ne s'affichait : le spinner s'arrêtait (finally) et
      // l'élève croyait la page cassée. Son texte reste dans le formulaire (state React
      // intact) → il peut renvoyer sans rien retaper.
      setErreur('L’envoi a échoué — ton texte est toujours là. Vérifie ta connexion et réessaie.')
    } finally {
      setChargement(false)
    }
  }

  if (avertissement) {
    return (
      <div className="bg-attention-teinte border border-attention rounded-xl p-5 space-y-3">
        <p className="text-sm text-attention">{avertissement}</p>
        <button onClick={() => setAvertissement(null)}
          className="text-sm font-medium text-attention underline hover:opacity-80">
          J’ai compris →
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        {g ? <Etiquette titre={g.champ1.question} /> : <Etiquette titre="Idée principale" detail="— ce que dit le chapitre, selon toi" />}
        <textarea value={these} onChange={e => setThese(e.target.value)} rows={3}
          placeholder={g ? g.champ1.aide : aides.these}
          className={champClasse} />
      </div>
      <div>
        {g ? <Etiquette titre={g.champ2.question} /> : <Etiquette titre="Arguments" detail="— les raisons que l’auteur avance pour la soutenir" />}
        <textarea value={args} onChange={e => setArgs(e.target.value)} rows={4}
          placeholder={g ? g.champ2.aide : aides.arguments}
          className={champClasse} />
      </div>
      {g?.champFixe && (
        <div>
          <Etiquette titre={g.champFixe.question} />
          <textarea value={champFixe} onChange={e => setChampFixe(e.target.value)} rows={3}
            placeholder={g.champFixe.aide}
            className={champClasse} />
        </div>
      )}
      <div>
        {g ? <Etiquette titre={g.tournante.question} /> : <Etiquette titre="Ton accord" detail="— es-tu d’accord ou non, et pourquoi ?" />}
        <textarea value={accord} onChange={e => setAccord(e.target.value)} rows={3}
          placeholder={g ? g.tournante.aide : aides.accord}
          className={champClasse} />
      </div>
      <div>
        {g ? <Etiquette titre={g.questions.question} detail="(2-3, une par ligne)" /> : <Etiquette titre="Tes questions" detail="(2-3, une par ligne)" />}
        <textarea value={questions} onChange={e => setQuestions(e.target.value)} rows={3}
          placeholder={g ? g.questions.aide : aides.questions}
          className={champClasse} />
      </div>
      <div>
        {g ? <Etiquette titre={g.vocabulaire.question} detail="(un par ligne, facultatif)" /> : <Etiquette titre="Vocabulaire" detail="— les mots que tu ne comprends pas (un par ligne, facultatif)" />}
        <textarea value={vocabulaire} onChange={e => setVocabulaire(e.target.value)} rows={2}
          placeholder={g ? g.vocabulaire.aide : aides.vocabulaire}
          className={champClasse} />
      </div>
      {erreur && <p className="text-retard text-sm">{erreur}</p>}
      <button type="submit" disabled={chargement}
        className="w-full bg-bouton text-surface py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50">
        {chargement ? 'Envoi…' : 'Soumettre mon travail'}
      </button>
    </form>
  )
}
