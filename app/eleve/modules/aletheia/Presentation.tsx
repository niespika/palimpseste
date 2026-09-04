'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { marquerPresentationVueAction } from './actions'
import FilEcrans, { type EcranFil } from '@/components/aletheia/FilEcrans'

// ============================================================================
// LA PRÉSENTATION DU MODULE — une fois, avant la première séance (ou la première séance après
// le nouveau fonctionnement, pour les élèves qui ont lu avec Aletheia cet été). Quatre écrans :
// comment ça marche, ce que tu vas faire, combien de temps, ce qui a changé. Le temps est un
// chiffre CALCULÉ sur les séances réelles de la classe (`tempsMedianSeance`), jamais tapé.
// ============================================================================

function P({ children }: { children: React.ReactNode }) { return <p className="font-corps text-[16px] leading-relaxed text-encre mb-3">{children}</p> }

export default function Presentation({ temps, dejaVue, numeroSeance, onFermer }: {
  temps: { medianeMinutes: number | null; n: number }
  /** Rejouée depuis « revoir la présentation » : le dernier bouton ne marque rien. */
  dejaVue: boolean
  numeroSeance: number
  onFermer?: () => void
}) {
  const router = useRouter()
  const [index, setIndex] = useState(0)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const avance = () => setIndex(i => i + 1)

  async function terminer() {
    if (dejaVue) { onFermer?.(); router.refresh(); return }
    setChargement(true); setErreur(null)
    try {
      const r = await marquerPresentationVueAction()
      if (r?.error) { setErreur(r.error); return }
      router.refresh()
    } catch { setErreur('Ça n’a pas pu être enregistré — réessaie.') } finally { setChargement(false) }
  }

  const ecrans: EcranFil[] = [
    {
      id: 'marche', titre: 'Aletheia, comment ça marche',
      corps: <>
        <P>Chaque semaine, tu lis un morceau du livre <b>dans ton exemplaire</b>, puis tu viens ici dire ce que tu en as compris. On ne te demande pas d’avoir raison : on te demande de <b>relire</b>.</P>
        <P>Une séance se joue en trois temps : tu écris, tu reçois un retour qui te renvoie au texte, tu réécris.</P>
      </>,
      suivant: { label: 'Suivant →', onClick: avance }, precedent: false,
    },
    {
      id: 'faire', titre: 'Ce que tu vas faire',
      corps: <ol className="list-decimal pl-5 space-y-2 font-corps text-[16px] leading-relaxed text-encre">
        <li><b>Écrire</b> — quelques questions, une par écran. « Je ne sais pas » est une réponse possible.</li>
        <li><b>Chercher dans le texte</b> — le retour te montre un passage, ou te demande de surligner la phrase qui répond.</li>
        <li><b>Réécrire</b> — chaque champ, avec la relance qui le concerne à côté.</li>
        <li><b>Lire le retour final</b> — partie par partie, jusqu’à la synthèse.</li>
      </ol>,
      suivant: { label: 'Suivant →', onClick: avance },
    },
    {
      id: 'temps', titre: 'Combien de temps ?',
      corps: temps.medianeMinutes != null ? <>
        <p className="font-titre text-[44px] leading-none text-pigment my-3">≈ {temps.medianeMinutes} min</p>
        <P>C’est le temps que les élèves ont mis, en médiane, sur les séances précédentes — de l’ouverture de la séance à la clôture, la lecture du livre non comprise.</P>
        <p className="text-xs text-muet">Chiffre calculé sur {temps.n} séances réelles ; il suit ta classe.</p>
      </> : <>
        <p className="font-titre text-[36px] leading-none text-pigment my-3">Une demi-heure environ</p>
        <P>La lecture du livre non comprise. Le chiffre se précisera après les premières séances de ta classe : il sera calculé, pas deviné.</P>
      </>,
      suivant: { label: 'Suivant →', onClick: avance },
    },
    {
      id: 'change', titre: 'Ce qui a changé',
      corps: <>
        <P>Si tu as déjà lu avec Aletheia cet été : les cinq champs sont devenus des <b>questions</b> qui dépendent du livre ; le retour te <b>renvoie au texte</b> au lieu de le citer ; tu réponds aux relances <b>avant</b> de réécrire ; et le retour final se lit <b>une partie à la fois</b>.</P>
        <p className="text-xs text-muet">Tu retrouveras cette présentation depuis la page de la séance.</p>
      </>,
      suivant: { label: chargement ? '…' : `Commencer la séance ${numeroSeance} →`, onClick: () => { void terminer() }, disabled: chargement },
      erreur,
    },
  ]
  return <FilEcrans fil="Présentation" ecrans={ecrans} index={Math.min(index, ecrans.length - 1)} onIndex={setIndex} />
}
