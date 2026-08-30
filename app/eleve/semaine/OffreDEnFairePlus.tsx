'use client'

import { useState, useTransition } from 'react'
import { demanderUnExerciceDePlus } from './actions'

// ============================================================================
// C6 · L3 — LE TROISIÈME TEMPS DE L'ÉCRAN : « PUIS ON LUI OFFRE D'EN FAIRE PLUS ».
// ----------------------------------------------------------------------------
// `02-exercices.md` §6.C, la fin de la séquence : « Puis on lui offre d'en faire
// plus s'il le veut. C'est le budget optionnel du routeur : UN PULL, UN EXERCICE
// DEMANDÉ À LA FOIS, JAMAIS IMPOSÉ, et JAMAIS REPORTÉ d'une semaine sur l'autre. »
//
// ⛔ AUCUN NOMBRE ICI, ET C'EST LA RÈGLE, PAS UN CHOIX DE STYLE. « PAS DE
//    BUDGET-TEMPS HEBDOMADAIRE » (`06-` §2, en toutes lettres) : le quota est en
//    MINUTES et il se compte CÔTÉ SERVEUR ; côté élève, il se dit en exercices,
//    ou il ne se dit pas. *« Il te reste 12 minutes de bonus » est exactement ce
//    que la source interdit.*
//
// ⛔ ET LE BOUTON NE GARDE PAS LE DOUBLE CLIC — `disabled` ne survit ni à un
//    second onglet ni à un clic rapide. La garde est MÉCANIQUE et elle est en
//    base (`uk_depots_eleve_exercice`) ; `enCours` n'est là que pour ne pas
//    donner à l'élève l'impression que rien ne se passe.
//
// ⚠️ Le refus revient toujours AVEC UNE PHRASE : « le silence est un mensonge ».
//    Les trois vides du pull — quota épuisé, réserve vide, rien d'ouvert au
//    travail — ne se disent pas pareil, et c'est le serveur qui choisit laquelle.
// ============================================================================

export default function OffreDEnFairePlus({ invite }: { invite: string }) {
  const [reponse, setReponse] = useState<string | null>(null)
  const [enCours, demarrer] = useTransition()

  // ⚠️ LA CARTE PARLE LA LANGUE DU RAIL, ET C'EST SON SEUL CHANGEMENT. Le filet
  //    ocre et le bouton `bouton-plan` sont ceux de la maquette et des « boutons
  //    estompés » de `CLAUDE.md` ; la carte de REFUS, rendue par `page.tsx`,
  //    porte le même filet — les deux états de l'offre ne peuvent pas se
  //    présenter autrement l'un que l'autre. ⛔ Le reste — l'action, la garde du
  //    double clic, la phrase du retour — n'a pas bougé d'une ligne.
  return (
    <section className="rounded-xl border border-bordure border-t-[3px] border-t-bouton-plan
                        bg-surface p-4">
      <h3 className="mb-2.5 font-ui text-[11px] font-bold uppercase tracking-[0.11em] text-muet">
        En faire plus
      </h3>
      <p className="font-corps text-[15px] leading-snug text-encre">{invite}</p>
      <button
        type="button"
        disabled={enCours}
        onClick={() => demarrer(async () => {
          const r = await demanderUnExerciceDePlus()
          // ⭐ Servi : la page se recharge (l'action `revalidatePath`) et
          //   l'exercice apparaît dans la liste, avec son atelier et son lien.
          //   On garde la phrase le temps du rendu, sans jamais annoncer un
          //   succès que la base n'aurait pas écrit.
          setReponse(r.phrase)
        })}
        className="mt-3.5 flex min-h-[44px] w-full items-center justify-center rounded-[10px]
                   bg-bouton-plan px-5 font-ui text-sm font-semibold text-bouton-plan-texte
                   transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {enCours ? 'Un instant…' : 'Demander un exercice de plus'}
      </button>
      {reponse && <p className="mt-2.5 font-corps text-sm text-encre-douce">{reponse}</p>}
    </section>
  )
}
