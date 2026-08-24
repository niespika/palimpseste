'use client'
// ============================================================================
// L'ALLUMAGE — CE QUE LE PROFESSEUR VOIT ET BASCULE (`07-` §5).
// ----------------------------------------------------------------------------
// ⭐ DEUX GROUPES, JAMAIS SIX CASES EN LIGNE. Le §5 sépare les trois du
//    professeur — « ce qu'il décide d'ouvrir » — des trois du chantier — « ce
//    lot est-il construit et éprouvé ? » — et dit pourquoi : « c'est pourquoi
//    ils ne se mélangent pas aux premiers ». La mise en page PORTE cette règle.
//
// ⭐ CHAQUE INTERRUPTEUR DIT SA QUESTION, recopiée du §5, ET CE QU'IL COMMANDE.
//    Un interrupteur nu se bascule au hasard : on l'essaie, on ne voit rien, et
//    on appelle « bug » ce qu'on n'a pas compris. C'est exactement ce qui guette
//    le couple `passation_classe_actif` / `exercices_actif` — qui ne suffit
//    qu'au professeur — et `routeur_actif`, qui n'allume rien tant que
//    `competences_niveaux.lettre` n'a pas d'écrivain (C4-L12).
//
// ⚠️ AUCUN GRISAGE, AUCUNE SÉQUENCE IMPOSÉE : « ils s'ouvrent dans l'ordre que
//    le professeur décide ». L'écran informe, il n'interdit pas.
//
// ⚠️ LE BASCULEUR EST `components/pilotage/Interrupteur.tsx` — écrit « pour les
//    futurs réglages » et resté sans importeur jusqu'ici. On ne redessine pas un
//    toggle : celui-là est jetonné et porte déjà `role="switch"`.
// ============================================================================

import { useActionState, useRef } from 'react'
import Interrupteur from '@/components/pilotage/Interrupteur'
import { basculer, type Retour } from './actions'
import type { FicheDInterrupteur } from '@/utils/allumage'

export interface ChargeAllumage {
  etat: Record<string, boolean>
  fiches: FicheDInterrupteur[]
}

/**
 * Les segments entre accents graves se rendent en `<code>` — un nom de colonne
 * n'est pas de la prose, et la charte lui donne sa propre fonte. Sans cela les
 * accents s'affichent tels quels, ce que la première capture a montré.
 */
function AvecCode({ texte }: { texte: string }) {
  return (
    <>
      {texte.split('`').map((part, i) =>
        i % 2 === 1
          ? <code key={i} className="font-ui text-[0.9em] text-encre">{part}</code>
          : <span key={i}>{part}</span>,
      )}
    </>
  )
}

export default function VueAllumage({ charge }: { charge: ChargeAllumage }) {
  const duProf = charge.fiches.filter((f) => f.nature === 'professeur')
  const duChantier = charge.fiches.filter((f) => f.nature === 'chantier')
  const ouverts = charge.fiches.filter((f) => charge.etat[f.nom]).length

  return (
    <div className="space-y-8">
      <p className="font-corps text-sm text-muet">
        {ouverts === 0
          ? 'Les six sont fermés.'
          : `${ouverts} ouvert${ouverts > 1 ? 's' : ''} sur six.`}
      </p>

      <Groupe
        titre="Ce que vous décidez d’ouvrir"
        sous="Ces trois-là répondent à des questions qui sont les vôtres — ce que vous ouvrez, et
              dans quel ordre. Aucun ordre n’est imposé."
        fiches={duProf}
        etat={charge.etat}
      />

      <Groupe
        titre="Ce qui est construit et éprouvé"
        sous="Ces trois-là ne répondent pas à une question pédagogique mais à une question de
              chantier : ce lot est-il bâti et passé en recette ? Chacun est né à OFF avec son lot."
        fiches={duChantier}
        etat={charge.etat}
      />

      <div className="space-y-3">
        <p className="rounded-xl border border-bordure bg-surface px-4 py-3 font-corps text-sm
                      text-encre-douce">
          <strong className="font-ui text-encre">Il n’y en aura jamais un septième.</strong>{' '}
          « Un onglet, une liste, une porte ne sont pas des fonctionnalités à gater » : un écran
          dont l’interrupteur est fermé <strong>s’affiche quand même</strong> et dit pourquoi il
          est vide. <em>Un vide expliqué, jamais un onglet qui clignote.</em>
        </p>

        <p className="rounded-xl border border-bordure bg-attention-teinte/50 px-4 py-3
                      font-corps text-sm text-encre-douce">
          <strong className="font-ui text-attention">Et refermez derrière vous.</strong>{' '}
          La convention du dépôt est que <strong>les six restent à OFF jusqu’à la recette</strong>,
          et chaque lot les re-constate à OFF en clôture. Un interrupteur laissé ouvert casse le
          contrôle d’entrée du lot suivant — ouvrez-en un{' '}
          <em>pour la durée d’un contrôle</em>, puis refermez-le.
        </p>
      </div>
    </div>
  )
}

function Groupe({
  titre, sous, fiches, etat,
}: {
  titre: string
  sous: string
  fiches: FicheDInterrupteur[]
  etat: Record<string, boolean>
}) {
  return (
    <section className="space-y-3">
      <header className="space-y-1">
        <h2 className="font-titre text-xl text-encre">{titre}</h2>
        <p className="font-corps text-sm text-encre-douce max-w-3xl">{sous}</p>
      </header>
      <ul className="space-y-3">
        {fiches.map((f) => (
          <li key={f.nom}>
            <Carte fiche={f} actif={!!etat[f.nom]} />
          </li>
        ))}
      </ul>
    </section>
  )
}

function Carte({ fiche, actif }: { fiche: FicheDInterrupteur; actif: boolean }) {
  const [retour, action, enCours] = useActionState<Retour | null, FormData>(basculer, null)
  const formRef = useRef<HTMLFormElement>(null)
  // Le retour ne vaut que pour CET interrupteur : les six cartes partagent
  // l'écran, jamais leur état.
  const mien = retour && retour.nom === fiche.nom ? retour : null

  return (
    <article
      className={`rounded-xl border px-4 py-3 space-y-2 transition-colors ${
        actif ? 'border-ok bg-ok-teinte/40' : 'border-bordure bg-surface'}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-ui text-base text-encre">{fiche.titre}</h3>
            <span
              className={`font-ui text-[11px] uppercase tracking-[0.12em] rounded px-2 py-0.5 ${
                actif ? 'bg-ok text-parchemin' : 'bg-parchemin-fonce text-muet'}`}
            >
              {actif ? 'ouvert' : 'fermé'}
            </span>
            {fiche.posePar && (
              <span className="font-ui text-[11px] text-muet-clair">posé par {fiche.posePar}</span>
            )}
          </div>
          <p className="font-corps text-sm text-encre-douce">{fiche.question}</p>
          <code className="font-ui text-[11px] text-muet">{fiche.nom}</code>
        </div>

        {/* ⚠️ Le `<form>` porte l'état VOULU en champ caché, jamais « l'inverse de
            ce que je crois voir » : deux onglets ouverts sur cet écran se
            contrediraient, et le dernier clic gagnerait sur une valeur périmée. */}
        <form ref={formRef} action={action} className="shrink-0 pt-1">
          <input type="hidden" name="interrupteur" value={fiche.nom} />
          <input type="hidden" name="vers" value={actif ? 'off' : 'on'} />
          <Interrupteur
            checked={actif}
            disabled={enCours}
            label={`${actif ? 'Refermer' : 'Ouvrir'} ${fiche.titre} (${fiche.nom})`}
            onChange={() => formRef.current?.requestSubmit()}
          />
        </form>
      </div>

      <ul className="space-y-0.5">
        {fiche.commande.map((c) => (
          <li key={c} className="font-corps text-sm text-encre-douce flex gap-2">
            <span aria-hidden className="text-puce">◆</span>
            <span><AvecCode texte={c} /></span>
          </li>
        ))}
      </ul>

      {fiche.avertissement && (
        <p className="rounded border border-bordure bg-attention-teinte/50 px-3 py-2
                      font-corps text-sm text-encre-douce">
          <AvecCode texte={fiche.avertissement} />
        </p>
      )}

      {mien && (
        <p role="status" className={`font-ui text-sm ${mien.ok ? 'text-ok' : 'text-retard'}`}>
          {mien.message}
        </p>
      )}
    </article>
  )
}
