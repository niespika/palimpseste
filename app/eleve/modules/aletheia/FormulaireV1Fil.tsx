'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { soumettreV1 } from './actions'
import type { LibellesSeance } from '@/utils/aletheia/gabarits'
import FilEcrans, { type EcranFil } from '@/components/aletheia/FilEcrans'

// ============================================================================
// LA SAISIE DE LA SÉANCE, UN ÉCRAN PAR QUESTION — porte de l'étayage OUVERTE.
// (Porte fermée : `FormulaireV1Classique`, les cinq champs d'avant.)
//  · écran 0 (dès la 2ᵉ séance) : le rappel d'ouverture ;
//  · un écran par question du gabarit, l'aide sous le champ, « Précédent » garde le texte ;
//  · « Je ne sais pas » (questions 1 et 2) remplace la question par ses écrans : la ligne de
//    blocage, les trois propositions à cocher (question 1), le pourquoi / la phrase recopiée ;
//  · le dernier écran soumet.
// ============================================================================

interface Props {
  livreId: string
  semaine: number
  libelles: LibellesSeance
  theseInitial?: string
  argumentsInitial?: string
  accordInitial?: string
  questionsInitial?: string
  vocabulaireInitial?: string
  champFixeInitial?: string
  avecRappel?: boolean
  rappelInitial?: string
  propositions?: string[]
  numeroSeance: number
}

const champClasse = 'w-full px-3 py-2.5 border border-bordure rounded-lg text-[15px] font-corps leading-relaxed focus:outline-none focus:ring-2 focus:ring-pigment resize-y text-encre bg-surface'

function Aide({ children }: { children: React.ReactNode }) { return <p className="text-xs text-muet mt-2">{children}</p> }
function Etiquette({ children }: { children: React.ReactNode }) { return <p className="text-sm text-encre-douce mb-2">{children}</p> }

export default function FormulaireV1Fil({
  livreId, semaine, libelles: g, theseInitial = '', argumentsInitial = '', accordInitial = '', questionsInitial = '', vocabulaireInitial = '', champFixeInitial = '',
  avecRappel = false, rappelInitial = '', propositions = [], numeroSeance,
}: Props) {
  const router = useRouter()
  const [index, setIndex] = useState(0)
  const [rappel, setRappel] = useState(rappelInitial)
  const [these, setThese] = useState(theseInitial)
  const [args, setArgs] = useState(argumentsInitial)
  const [accord, setAccord] = useState(accordInitial)
  const [champFixe, setChampFixe] = useState(champFixeInitial)
  const [questions, setQuestions] = useState(questionsInitial)
  const [vocabulaire, setVocabulaire] = useState(vocabulaireInitial)
  const [jnsp1, setJnsp1] = useState(false)
  const [jnsp2, setJnsp2] = useState(false)
  const [blocage1, setBlocage1] = useState('')
  const [choix1, setChoix1] = useState('')
  const [pourquoi1, setPourquoi1] = useState('')
  const [blocage2, setBlocage2] = useState('')
  const [phrase2, setPhrase2] = useState('')
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [avertissement, setAvertissement] = useState<string | null>(null)

  const avecFixe = !!g.champFixe
  const suivant = (label = 'Suivant →', disabled = false) => ({ label, disabled, onClick: () => { setErreur(null); setIndex(i => i + 1) } })
  const zone = (v: string, set: (s: string) => void, rows: number, placeholder: string) => (
    <textarea value={v} onChange={e => set(e.target.value)} rows={rows} placeholder={placeholder} className={champClasse} />
  )
  const ligne = (v: string, set: (s: string) => void, placeholder: string) => (
    <input value={v} onChange={e => set(e.target.value)} placeholder={placeholder} className={champClasse} />
  )
  const lienJnsp = (on: () => void) => (
    <button type="button" onClick={on} className="mt-2 text-xs text-muet underline hover:text-encre">Je ne sais pas</button>
  )
  const lienMoiMeme = (off: () => void) => (
    <button type="button" onClick={off} className="mt-2 text-xs text-muet underline hover:text-encre">Finalement, je réponds moi-même</button>
  )

  // ── Les écrans, dans l'ordre ──
  const ecrans: EcranFil[] = []
  if (avecRappel) ecrans.push({
    id: 'rappel', titre: 'Avant de commencer',
    corps: <><Etiquette>Sans relire, quelle était l’idée de la séance dernière ?</Etiquette>{zone(rappel, setRappel, 4, 'Trois lignes, de mémoire.')}<Aide>Tu sauras au retour si tu l’avais.</Aide></>,
    suivant: suivant(),
  })
  // Question 1
  if (!jnsp1) ecrans.push({
    id: 'q1', titre: 'Question 1',
    corps: <><Etiquette>{g.champ1.question}</Etiquette>{zone(these, setThese, 5, g.champ1.aide)}{lienJnsp(() => setJnsp1(true))}</>,
    suivant: suivant('Suivant →', !these.trim()),
  })
  else {
    ecrans.push({
      id: 'q1-blocage', titre: 'Question 1 · je ne sais pas',
      corps: <><Etiquette>Dis en une ligne ce qui te bloque.</Etiquette>{ligne(blocage1, setBlocage1, 'Ex. : je ne vois pas où l’auteur dit ce qu’il pense')}<Aide>Cette ligne deviendra une de tes questions à l’auteur.</Aide>{lienMoiMeme(() => setJnsp1(false))}</>,
      suivant: suivant('Suivant →', !blocage1.trim()),
    })
    if (propositions.length > 0) ecrans.push({
      id: 'q1-propositions', titre: 'Laquelle dit l’idée du passage ?',
      corps: <>
        <div className="space-y-2">
          {propositions.map((p, i) => (
            <label key={i} className={`flex gap-2.5 items-start text-[15px] font-corps leading-snug rounded-lg border px-3 py-2.5 cursor-pointer ${choix1 === p ? 'border-pigment bg-pigment-teinte' : 'border-bordure bg-surface'}`}>
              <input type="radio" name="proposition1" checked={choix1 === p} onChange={() => setChoix1(p)} className="mt-1 accent-bouton shrink-0" />
              <span className="text-encre">{p}</span>
            </label>
          ))}
        </div>
        <Aide>Choisis, même sans certitude.</Aide>
      </>,
      suivant: suivant('Suivant →', !choix1),
    })
    ecrans.push({
      id: 'q1-pourquoi', titre: propositions.length ? 'Pourquoi celle-là ?' : 'Question 1 · je ne sais pas',
      corps: <>{propositions.length ? ligne(pourquoi1, setPourquoi1, 'Une ligne.') : <Aide>Ta ligne de blocage suffit : le retour partira de là.</Aide>}<Aide>Ce que tu viens de choisir sera relu avec toi au retour.</Aide></>,
      suivant: suivant(),
    })
  }
  // Question 2
  if (!jnsp2) ecrans.push({
    id: 'q2', titre: 'Question 2',
    corps: <><Etiquette>{g.champ2.question}</Etiquette>{zone(args, setArgs, 6, g.champ2.aide)}{lienJnsp(() => setJnsp2(true))}</>,
    suivant: suivant('Suivant →', !args.trim()),
  })
  else {
    ecrans.push({
      id: 'q2-blocage', titre: 'Question 2 · je ne sais pas',
      corps: <><Etiquette>Dis en une ligne ce qui te bloque.</Etiquette>{ligne(blocage2, setBlocage2, 'Ex. : je ne vois pas ce qui est un argument et ce qui est un exemple')}{lienMoiMeme(() => setJnsp2(false))}</>,
      suivant: suivant('Suivant →', !blocage2.trim()),
    })
    ecrans.push({
      id: 'q2-phrase', titre: 'La phrase qui t’a arrêté',
      corps: <><Etiquette>Recopie la phrase du passage qui t’a le plus arrêté, même sans la comprendre.</Etiquette>{zone(phrase2, setPhrase2, 3, 'La phrase, telle qu’elle est dans ton livre.')}</>,
      suivant: suivant(),
    })
  }
  if (avecFixe) ecrans.push({
    id: 'fixe', titre: `Question ${2 + 1}`,
    corps: <><Etiquette>{g.champFixe!.question}</Etiquette>{zone(champFixe, setChampFixe, 4, g.champFixe!.aide)}</>,
    suivant: suivant('Suivant →', !champFixe.trim()),
  })
  ecrans.push({
    id: 'tournante', titre: `Question ${avecFixe ? 4 : 3}`,
    corps: <><Etiquette>{g.tournante.question}</Etiquette>{zone(accord, setAccord, 5, g.tournante.aide)}</>,
    suivant: suivant('Suivant →', !accord.trim()),
  })
  ecrans.push({
    id: 'questions', titre: `Question ${avecFixe ? 5 : 4}`,
    corps: <><Etiquette>{g.questions.question}</Etiquette>{zone(questions, setQuestions, 4, g.questions.aide)}<Aide>Deux ou trois, une par ligne.</Aide></>,
    suivant: suivant('Suivant →', questions.split('\n').every(q => !q.trim())),
  })
  ecrans.push({
    id: 'vocabulaire', titre: `Question ${avecFixe ? 6 : 5}`,
    corps: <><Etiquette>{g.vocabulaire.question}</Etiquette>{zone(vocabulaire, setVocabulaire, 3, g.vocabulaire.aide)}<Aide>Un mot par ligne, facultatif.</Aide></>,
    suivant: { label: chargement ? 'Envoi…' : 'Soumettre mon travail', disabled: chargement, onClick: () => { void soumettre() } },
  })

  async function soumettre() {
    setErreur(null)
    const qs = questions.split('\n').map(q => q.trim()).filter(Boolean)
    const voc = vocabulaire.split('\n').map(v => v.trim()).filter(Boolean)
    if (jnsp1 && jnsp2 && !accord.trim()) { setErreur('Au moins une réponse à toi : réponds à la question suivante.'); return }
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
      if (res?.avertissement) { setAvertissement(res.avertissement); return }
      router.refresh()
    } catch {
      setErreur('L’envoi a échoué — ton texte est toujours là. Vérifie ta connexion et réessaie.')
    } finally {
      setChargement(false)
    }
  }

  if (avertissement) {
    return (
      <div className="bg-attention-teinte border border-attention rounded-xl p-5 space-y-3">
        <p className="text-sm text-attention">{avertissement}</p>
        <button onClick={() => setAvertissement(null)} className="text-sm font-medium text-attention underline hover:opacity-80">J’ai compris →</button>
      </div>
    )
  }

  const i = Math.min(index, ecrans.length - 1)
  const courant = { ...ecrans[i], erreur }
  return <FilEcrans fil={`Séance ${numeroSeance} · ${courant.id === 'rappel' ? 'Rappel' : 'Ta lecture'}`} ecrans={ecrans.map((e, k) => (k === i ? courant : e))} index={i} onIndex={setIndex} />
}
