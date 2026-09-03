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
  /** (E5) Rappel d'ouverture demandé (porte ouverte, à partir de la deuxième séance exposée). */
  avecRappel?: boolean
  rappelInitial?: string
  /**
   * (E8) « Je ne sais pas » recevable aux deux premières questions (porte ouverte). Pour la
   * première, les trois propositions (la thèse en registre élève + deux distracteurs, déjà
   * mélangées) ; sans propositions, seule la ligne de blocage est demandée.
   */
  jeNeSaisPas?: boolean
  propositions?: string[]
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
  aides = AIDES_V1_DEFAUT, libelles, avecRappel = false, rappelInitial = '', jeNeSaisPas = false, propositions = [],
}: Props) {
  const router = useRouter()
  const [rappel, setRappel] = useState(rappelInitial)
  const [these, setThese] = useState(theseInitial)
  const [args, setArgs] = useState(argumentsInitial)
  const [accord, setAccord] = useState(accordInitial)
  const [champFixe, setChampFixe] = useState(champFixeInitial)
  const [questions, setQuestions] = useState(questionsInitial)
  const [vocabulaire, setVocabulaire] = useState(vocabulaireInitial)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [avertissement, setAvertissement] = useState<string | null>(null)
  // (E8) Un « je ne sais pas » par emplacement : ouvert ou non, et ce qu'il dit.
  const [jnsp1, setJnsp1] = useState(false)
  const [jnsp2, setJnsp2] = useState(false)
  const [blocage1, setBlocage1] = useState('')
  const [choix1, setChoix1] = useState('')
  const [pourquoi1, setPourquoi1] = useState('')
  const [blocage2, setBlocage2] = useState('')
  const [phrase2, setPhrase2] = useState('')

  const g = libelles
  const avecFixe = !!g?.champFixe

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErreur(null)
    const qs = questions.split('\n').map(q => q.trim()).filter(Boolean)
    const voc = vocabulaire.split('\n').map(v => v.trim()).filter(Boolean)
    if (jnsp1 && !blocage1.trim()) { setErreur('Dis en une ligne ce qui te bloque sur la première question.'); return }
    if (jnsp1 && propositions.length > 0 && !choix1) { setErreur('Choisis une des propositions, même sans certitude.'); return }
    if (jnsp2 && !blocage2.trim()) { setErreur('Dis en une ligne ce qui te bloque sur la deuxième question.'); return }
    if (jnsp1 && jnsp2 && !accord.trim()) { setErreur('Au moins une réponse à toi : réponds à la question suivante.'); return }
    if (!jnsp1 && !these.trim()) { setErreur(g ? 'Réponds à la première question.' : 'Écris l’idée principale du chapitre.'); return }
    if (!jnsp2 && !args.trim()) { setErreur(g ? 'Réponds à la deuxième question.' : 'Indique les arguments avancés par l’auteur.'); return }
    if (avecFixe && !champFixe.trim()) { setErreur('Dis quelle thèse l’auteur préfère, selon toi.'); return }
    if (!accord.trim()) { setErreur(g ? `Réponds à la question « ${g.tournante.question} »` : 'Dis si tu es d’accord ou non, et pourquoi.'); return }
    if (qs.length === 0) { setErreur('Pose au moins une question (une par ligne).'); return }
    setChargement(true)
    try {
      const res = await soumettreV1(livreId, semaine, {
        these, arguments: args, accord, questions: qs, vocabulaire: voc,
        ...(avecFixe ? { champ_fixe: champFixe } : {}),
        ...(avecRappel ? { rappel } : {}),
        ...(jnsp1 || jnsp2 ? { jnsp: {
          ...(jnsp1 ? { champ1: { blocage: blocage1, choix: choix1, pourquoi: pourquoi1 } } : {}),
          ...(jnsp2 ? { champ2: { blocage: blocage2, phrase: phrase2 } } : {}),
        } } : {}),
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
      {avecRappel && (
        <div className="bg-parchemin-fonce/60 border border-bordure rounded-xl p-3">
          <Etiquette titre="Avant de commencer : sans relire, quelle était l’idée de la séance dernière ?" />
          <textarea value={rappel} onChange={e => setRappel(e.target.value)} rows={2}
            placeholder="Trois lignes, de mémoire. Tu sauras au retour si tu l’avais."
            className={champClasse} />
        </div>
      )}
      <div>
        {g ? <Etiquette titre={g.champ1.question} /> : <Etiquette titre="Idée principale" detail="— ce que dit le chapitre, selon toi" />}
        {jnsp1 ? (
          <div className="bg-parchemin-fonce/60 border border-bordure rounded-lg p-3 space-y-2" data-jnsp="1">
            <label className="block text-xs text-encre-douce">Dis en une ligne ce qui te bloque.</label>
            <input value={blocage1} onChange={e => setBlocage1(e.target.value)} placeholder="Ex. : je ne vois pas où l’auteur dit ce qu’il pense" className={champClasse} />
            {propositions.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs text-encre-douce">Laquelle de ces trois phrases te semble dire l’idée du passage ? Choisis, même sans certitude.</p>
                {propositions.map((p, i) => (
                  <label key={i} className={`flex gap-2 items-start text-sm rounded-lg border px-2.5 py-1.5 cursor-pointer ${choix1 === p ? 'border-pigment bg-pigment-teinte' : 'border-bordure bg-surface'}`}>
                    <input type="radio" name="proposition1" checked={choix1 === p} onChange={() => setChoix1(p)} className="mt-1 accent-bouton" />
                    <span className="text-encre">{p}</span>
                  </label>
                ))}
                <input value={pourquoi1} onChange={e => setPourquoi1(e.target.value)} placeholder="Pourquoi celle-là ? Une ligne." className={champClasse} />
              </div>
            )}
            <button type="button" onClick={() => setJnsp1(false)} className="text-xs text-muet underline hover:text-encre">Finalement, je réponds moi-même</button>
          </div>
        ) : (
          <textarea value={these} onChange={e => setThese(e.target.value)} rows={3}
            placeholder={g ? g.champ1.aide : aides.these}
            className={champClasse} />
        )}
        {jeNeSaisPas && !jnsp1 && (
          <button type="button" onClick={() => setJnsp1(true)} className="mt-1 text-xs text-muet underline hover:text-encre">Je ne sais pas</button>
        )}
      </div>
      <div>
        {g ? <Etiquette titre={g.champ2.question} /> : <Etiquette titre="Arguments" detail="— les raisons que l’auteur avance pour la soutenir" />}
        {jnsp2 ? (
          <div className="bg-parchemin-fonce/60 border border-bordure rounded-lg p-3 space-y-2" data-jnsp="2">
            <label className="block text-xs text-encre-douce">Dis en une ligne ce qui te bloque.</label>
            <input value={blocage2} onChange={e => setBlocage2(e.target.value)} placeholder="Ex. : je ne vois pas ce qui est un argument et ce qui est un exemple" className={champClasse} />
            <label className="block text-xs text-encre-douce">Recopie la phrase du passage qui t’a le plus arrêté, même sans la comprendre.</label>
            <textarea value={phrase2} onChange={e => setPhrase2(e.target.value)} rows={2} placeholder="La phrase, telle qu’elle est dans ton livre." className={champClasse} />
            <button type="button" onClick={() => setJnsp2(false)} className="text-xs text-muet underline hover:text-encre">Finalement, je réponds moi-même</button>
          </div>
        ) : (
          <textarea value={args} onChange={e => setArgs(e.target.value)} rows={4}
            placeholder={g ? g.champ2.aide : aides.arguments}
            className={champClasse} />
        )}
        {jeNeSaisPas && !jnsp2 && (
          <button type="button" onClick={() => setJnsp2(true)} className="mt-1 text-xs text-muet underline hover:text-encre">Je ne sais pas</button>
        )}
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
