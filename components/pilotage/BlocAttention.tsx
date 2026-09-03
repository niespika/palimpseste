'use client'

// ============================================================================
// C6 · L1 — CE QUI DEMANDE L'ATTENTION DU PROFESSEUR.
// ----------------------------------------------------------------------------
// « C'est la page où le professeur voit ce qui demande son attention, et elle
//   porte donc QUATRE DRAPEAUX » (`07-` §2, C6-L1).
//
// ⛔ UNE PAGE, PAS TROIS. Ce bloc s'installe SOUS l'onglet Compétences du profil
//    de classe, au-dessus de la grille — l'attention d'abord, l'état ensuite.
//    « Un module = 2-3 onglets » (`AGENTS.md`), le profil de classe en porte
//    DEUX (Activité · Compétences), et **aucun troisième n'est posé ici**.
//
// ⛔ AUCUN NOMBRE QUI NE COMPTE RIEN. « Un écran n'affiche un nombre que si ce
//    nombre compte quelque chose […] un chiffre qui ne mesure rien attire
//    pourtant des décisions » (`06-` §5). Les seuls nombres de ce bloc sont des
//    DÉCOMPTES RÉELS — combien de dossiers, combien d'actes, combien d'élèves.
//    ⛔ Aucune « confiance » agrégée, aucun score de 0 à 100 : « rien ne la
//       définit aujourd'hui ».
//
// ⛔ NI PLAFOND NI FILE D'ATTENTE (`01-` §8.4). Pas de « 5 premiers », pas de
//    pagination qui cache le reste : la liste rendue est la liste entière.
//
// ⚠️ LE VIDE S'EXPLIQUE, ET IL A PLUSIEURS RAISONS QU'UN SEUL MESSAGE
//    CONFONDRAIT (`07-` §5, précisé par C5-L4) : « rien ne demande votre
//    attention », « le calendrier ne dit pas les cycles », « une lecture a
//    échoué ». Sous un onglet qu'on vient de cliquer, le bloc DOIT dire pourquoi.
//
// ⚠️ Les jetons viennent de `globals.css`, jamais un hex en dur (`AGENTS.md`).
//    Le vocabulaire visuel est celui du Pilotage — `border-bordure`, `bg-surface`,
//    `text-encre-douce`, `border-retard` pour un incident.
// ============================================================================

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { LIBELLE_NATURE, type Drapeau, type NatureDrapeau } from '@/utils/pilotage/attention'
import type { DistributionContestations } from '@/utils/pilotage/attention'
import { PHRASE_SIGNAL, type DistributionFaisceau } from '@/utils/integrite-faisceau'
// ⭐ LE PATRON DE NEXT 16.2, ET C'EST CELUI QUE LA DOC EMBARQUÉE PRESCRIT :
//    « To use Server Functions in Client Components you need to create your
//    Server Functions in a DEDICATED FILE with the `use server` directive at the
//    top of the file. These can then be IMPORTED into Client Components »
//    (`node_modules/next/dist/docs/…/directives/use-server.md`). ⛔ On ne fait
//    donc PAS descendre des fermetures `'use server'` en props.
import {
  actionTraiterDossierN3, actionExaminerContestation, actionConfirmerFaisceau,
  actionEcarterCitationsComposees,
} from '@/app/prof/classes/actions'

/** La teinte de chaque nature. Trois natures appellent un geste, deux non. */
const TEINTE_NATURE: Record<NatureDrapeau, string> = {
  dossier_n3: 'border-retard/40 bg-retard-teinte',
  faisceau_integrite: 'border-attention/40 bg-attention-teinte',
  // ⭐ La citation composée porte la teinte du RETARD, comme le dossier N3 :
  //    c'est la plateforme qui a fauté, et un élève a pu lire une phrase qu'il
  //    n'a pas écrite. ⚠️ Corriger ou retirer le retour se fait à son écran, pas
  //    depuis cette liste ; ici, le seul geste est « Effacer » le signal (02/09 :
  //    l'OCR avait mal lu des copies, et 19 signaux n'avaient rien à corriger).
  citation_composee: 'border-retard/40 bg-retard-teinte',
  contestations_repetees: 'border-attention/40 bg-attention-teinte',
  fraicheur_ancre: 'border-bordure bg-parchemin-fonce',
}

function LigneDrapeau({ d, classeId }: { d: Drapeau; classeId: string }) {
  const [enCours, demarrer] = useTransition()
  const [retour, setRetour] = useState<string | null>(null)
  const [ouvert, setOuvert] = useState(false)

  function jouer() {
    if (!d.geste) return
    demarrer(async () => {
      const [a, b, c] = d.geste!.ref.split('|')
      const r = d.geste!.action === 'traiter_n3'
        ? await actionTraiterDossierN3(classeId, a, b, c)
        : d.geste!.action === 'traiter_contestation'
          ? await actionExaminerContestation(classeId, a, b)
          : d.geste!.action === 'ecarter_citation'
            ? await actionEcarterCitationsComposees(classeId, [d.geste!.ref])
            : await actionConfirmerFaisceau(classeId, d.geste!.ref)
      setRetour(r.message)
    })
  }

  return (
    <li className={`rounded-xl border ${TEINTE_NATURE[d.nature]} px-4 py-3 space-y-2`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="font-ui text-[11px] uppercase tracking-[0.12em] text-muet">
            {LIBELLE_NATURE[d.nature]}
            {/* ⭐ Le re-signalement se DIT, il ne se devine pas à une couleur :
                « rien ne se distingue par la seule couleur ». */}
            {d.enTete && <span className="text-retard"> · RE-SIGNALÉ</span>}
          </p>
          <p className="font-titre text-base text-encre leading-snug">
            <Link href={`/prof/eleves/${d.eleveId}`} className="hover:underline">{d.eleveNom}</Link>
          </p>
          <p className="font-corps text-sm text-encre-douce max-w-3xl">{d.phrase}</p>
        </div>
        {d.geste && (
          <button
            type="button"
            onClick={jouer}
            disabled={enCours || retour !== null}
            className="font-ui text-sm px-3 py-1.5 rounded-lg border border-bordure bg-surface
                       text-encre hover:bg-parchemin-fonce disabled:opacity-50 shrink-0"
          >
            {enCours ? '…' : d.geste.mot}
          </button>
        )}
      </div>

      {d.detail.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setOuvert((v) => !v)}
            className="font-ui text-xs text-muet hover:text-encre"
            aria-expanded={ouvert}
          >
            {ouvert ? '− Replier le dossier' : `+ Le dossier (${d.detail.length})`}
          </button>
          {ouvert && (
            <ul className="mt-1.5 space-y-1">
              {d.detail.map((t, i) => (
                <li key={i} className="font-corps text-xs text-encre-douce">· {t}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {retour && <p className="font-ui text-xs text-ok">{retour}</p>}
    </li>
  )
}

/**
 * ⭐ « TOUT EFFACER » — les citations composées d'un coup. Sur T5, le 02/09, la
 *    page en portait 19 : un bouton par ligne ne suffit pas quand la cause est
 *    une transcription de copies fausse pour toute la classe. ⛔ Il n'efface
 *    QUE cette nature : un dossier N3 ou un faisceau ne s'effacent pas en lot.
 */
function ToutEffacerLesCitations({ classeId, refs }: { classeId: string; refs: string[] }) {
  const [enCours, demarrer] = useTransition()
  const [retour, setRetour] = useState<string | null>(null)
  if (refs.length < 2) return null
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border
                    border-dashed border-bordure px-3 py-2">
      <p className="font-corps text-xs text-encre-douce min-w-0">
        {refs.length} signaux de citation composée. Si la copie a été mal transcrite, ils n’ont
        rien à corriger.
      </p>
      <button
        type="button"
        disabled={enCours || retour !== null}
        onClick={() => demarrer(async () => {
          const r = await actionEcarterCitationsComposees(classeId, refs)
          setRetour(r.message)
        })}
        className="font-ui text-sm px-3 py-1.5 rounded-lg border border-bordure bg-surface
                   text-encre hover:bg-parchemin-fonce disabled:opacity-50 shrink-0"
      >
        {enCours ? '…' : `Effacer les ${refs.length} signaux`}
      </button>
      {retour && <p className="font-ui text-xs text-ok basis-full">{retour}</p>}
    </div>
  )
}

export default function BlocAttention({
  classeId, drapeaux, distribution, distributionFaisceau, reglages, cyclesConnus, incidents,
  regarde,
}: {
  classeId: string
  drapeaux: Drapeau[]
  distribution: DistributionContestations
  distributionFaisceau: DistributionFaisceau
  reglages: { contestations: number | null; faisceau: number | null }
  cyclesConnus: boolean
  incidents: string[]
  regarde: {
    eleves: number; dossiersN3: number; elevesEnN3: number; depotsMaison: number; actes: number
  }
}) {
  return (
    <section className="rounded-xl border border-bordure bg-surface p-4 space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-titre text-lg text-encre">Ce qui demande votre attention</h2>
        <p className="font-ui text-xs text-muet">
          {/* Des DÉCOMPTES RÉELS, jamais un score. */}
          {regarde.eleves} élève{regarde.eleves > 1 ? 's' : ''} regardé
          {regarde.eleves > 1 ? 's' : ''} · {regarde.dossiersN3} dossier
          {regarde.dossiersN3 > 1 ? 's' : ''} N3 ouvert{regarde.dossiersN3 > 1 ? 's' : ''}
          {/* ⚠️ DEUX nombres, pas un : « ta file compte des DOSSIERS, pas des
              élèves » — un élève peut en porter plusieurs à la fois, sur la
              même compétence (la clé est élève × compétence × observable). */}
          {regarde.dossiersN3 > 0 && ` chez ${regarde.elevesEnN3} élève${regarde.elevesEnN3 > 1 ? 's' : ''}`} ·{' '}
          {regarde.actes} contestation{regarde.actes > 1 ? 's' : ''} ·{' '}
          {regarde.depotsMaison} dépôt{regarde.depotsMaison > 1 ? 's' : ''} maison au faisceau
        </p>
      </div>

      <ToutEffacerLesCitations
        classeId={classeId}
        refs={drapeaux.filter((d) => d.geste?.action === 'ecarter_citation').map((d) => d.geste!.ref)}
      />

      {drapeaux.length > 0 ? (
        <ul className="space-y-2">
          {drapeaux.map((d) => (
            <LigneDrapeau key={`${d.nature}|${d.cle}`} d={d} classeId={classeId} />
          ))}
        </ul>
      ) : (
        // ⚠️ LE VIDE DIT LAQUELLE DE SES RAISONS S'APPLIQUE — jamais un message
        //    qui vaut pour toutes.
        <p className="font-corps text-sm text-encre-douce max-w-3xl">
          {incidents.length > 0
            ? <>Aucun drapeau à montrer, <strong>et une lecture a échoué</strong> : on ne peut pas
              dire si rien ne demande votre attention, ou si la base n’a rien rendu. Le détail est
              en dessous.</>
            : !cyclesConnus
              ? <>Aucun drapeau. <strong>Le calendrier ne rend aucune semaine d’enseignement</strong> :
                les comptes en cycles — la fraîcheur d’ancre, le re-signalement d’un dossier N3 —
                ne peuvent pas se faire. Les autres drapeaux, eux, ont bien été cherchés.</>
              : <>Rien ne demande votre attention sur cette classe. <strong>Une file vide en début
                d’année est le régime normal</strong> : un dossier N3 n’existe que sur une compétence
                évaluée, hors profil provisoire, et ses compteurs ne démarrent qu’au segment 3.</>}
        </p>
      )}

      {/* ── La distribution des contestations — montrée MÊME sans seuil réglé.
          C'est elle que l'entrée demande : « combien d'élèves contestent, à
          quelle fréquence, et sur quoi ». Sans elle, personne ne pourra régler
          un seuil qu'il ne voit pas. ──────────────────────────────────────── */}
      <div className="rounded-lg border border-dashed border-bordure px-3 py-2 space-y-1">
        <p className="font-ui text-[11px] uppercase tracking-[0.12em] text-muet">
          La distribution des contestations
        </p>
        <p className="font-corps text-xs text-encre-douce max-w-3xl">
          {distribution.actes === 0
            ? 'Aucune contestation sur cette classe.'
            : <>{distribution.eleves} élève{distribution.eleves > 1 ? 's' : ''} ·{' '}
              {distribution.actes} acte{distribution.actes > 1 ? 's' : ''} distinct
              {distribution.actes > 1 ? 's' : ''} ·{' '}
              {distribution.citationsAbsentes} sur une citation absente
              {distribution.parEleve.length > 0 && <>
                {' '}· le plus haut compte pour un élève : {distribution.parEleve[0].actes}</>}
            </>}
        </p>
        <p className="font-ui text-[11px] text-muet max-w-3xl">
          {reglages.contestations === null
            ? <>Aucun seuil de répétition n’est réglé : <strong>le drapeau des contestations
              répétées ne se lève pas</strong>, et c’est voulu — le seuil se lira sur cette
              distribution, un seuil posé d’avance deviendrait la cible que le dispositif apprend
              à viser. <em>La file d’examen humain, elle, n’attend aucun seuil.</em></>
            : <>Seuil de répétition réglé à {reglages.contestations} acte
              {reglages.contestations > 1 ? 's' : ''} non traité
              {reglages.contestations > 1 ? 's' : ''}.</>}
        </p>
      </div>

      {/* ── La distribution du FAISCEAU — montrée MÊME sans seuil réglé, et pour
          la même raison. Le seuil « se lira sur la distribution observée » :
          sans elle, le refus de chiffrer d'avance se mordrait la queue — rien à
          lire, donc rien à régler, donc un faisceau muet pour toujours. ───── */}
      <div className="rounded-lg border border-dashed border-bordure px-3 py-2 space-y-1">
        <p className="font-ui text-[11px] uppercase tracking-[0.12em] text-muet">
          Le faisceau d’intégrité — ce qui a été observé
        </p>
        {distributionFaisceau.depotsRegardes === 0 ? (
          <p className="font-corps text-xs text-encre-douce max-w-3xl">
            Aucun dépôt à regarder. <strong>Le faisceau ne regarde que le formatif fait à la
            maison</strong> : les passations en classe n’y entrent jamais.
          </p>
        ) : (
          <>
            <p className="font-corps text-xs text-encre-douce max-w-3xl">
              {distributionFaisceau.depotsRegardes} dépôt
              {distributionFaisceau.depotsRegardes > 1 ? 's' : ''} maison regardé
              {distributionFaisceau.depotsRegardes > 1 ? 's' : ''} · combien lèvent N signaux
              sur 7 :{' '}
              {distributionFaisceau.parNombreDeSignaux
                .map((n, i) => (n > 0 ? `${i} → ${n}` : null))
                .filter(Boolean).join(' · ')}
            </p>
            {/* ⭐ CE QUE CHAQUE SEUIL POSSIBLE ATTRAPERAIT — la lecture la plus
                directe de la distribution, et elle se lit sans avoir rien réglé. */}
            <p className="font-ui text-[11px] text-muet max-w-3xl">
              Ce qu’un seuil attraperait :{' '}
              {distributionFaisceau.simulation
                .filter((x) => x.depots > 0)
                .map((x) => `${x.seuil}+ → ${x.depots}`)
                .join(' · ') || 'aucun dépôt, quel que soit le seuil'}
            </p>
            <p className="font-ui text-[11px] text-muet max-w-3xl">
              Par signal :{' '}
              {distributionFaisceau.parSignal
                .map((s) => `${PHRASE_SIGNAL[s.signal]} ${s.leve}/${s.leve + s.eteint}`
                  + (s.nonMesure > 0 ? ` (${s.nonMesure} non mesuré${s.nonMesure > 1 ? 's' : ''})` : ''))
                .join(' · ')}
            </p>
          </>
        )}
        <p className="font-ui text-[11px] text-muet max-w-3xl">
          {reglages.faisceau === null
            ? <>Aucun seuil de convergence n’est réglé : <strong>aucun drapeau d’intégrité ne
              part</strong>, et c’est voulu — il se lira sur la distribution ci-dessus.</>
            : <>Seuil réglé à {reglages.faisceau} signal(aux) sur 7.</>}
        </p>
      </div>

      {/* Une lecture ratée n'est pas une base vide — l'écran le dit. */}
      {incidents.length > 0 && (
        <div className="rounded-lg border border-retard/40 bg-retard-teinte p-3">
          <p className="font-ui text-xs text-retard">
            Lecture incomplète — les drapeaux ci-dessus peuvent être partiels :
          </p>
          <ul className="mt-1 space-y-0.5">
            {incidents.map((i) => (
              <li key={i} className="font-corps text-xs text-retard">· {i}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
