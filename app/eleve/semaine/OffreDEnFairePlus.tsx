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

  return (
    <section>
      <h3 className="font-ui text-xs tracking-[0.1em] text-muet uppercase mb-2">
        En faire plus
      </h3>
      <div className="bg-surface border border-bordure rounded-xl p-5 space-y-3">
        <p className="text-sm text-encre">{invite}</p>
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
          className="font-ui text-sm text-encre border border-bordure rounded-full px-4 py-2
                     hover:bg-parchemin-fonce transition-colors disabled:opacity-50"
        >
          {enCours ? 'Un instant…' : 'Demander un exercice de plus'}
        </button>
        {reponse && <p className="text-sm text-encre-douce">{reponse}</p>}
      </div>
    </section>
  )
}
