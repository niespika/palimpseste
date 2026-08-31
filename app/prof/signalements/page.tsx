// ============================================================================
// PILOTAGE · SIGNALEMENTS — « la page qui m'indique tous les problèmes
// d'exercice signalés » (demande de Louis, 31/08/2026).
// ----------------------------------------------------------------------------
// ⭐⭐ MAÎTRE-DÉTAIL, ET LA DONNÉE COMMANDE LA FORME. Deux mesures :
//    · en production, **4 instances portent 86 dépôts — 16, 23, 23 et 24 élèves
//      sur la MÊME**. Un exercice cassé, c'est jusqu'à 24 commentaires : la
//      colonne de gauche liste des EXERCICES, jamais des signalements ;
//    · la « première ligne » d'une consigne fait **129 caractères en médiane**,
//      p90 179, max 298 (452 instances, 31/08). **Il n'existe pas de titre.**
//      Les vignettes sont donc des BLOCS à deux lignes tronquées, et non des
//      lignes de tableau — la maquette « pastille + titre + compte + bouton »
//      ne peut pas exister ici. *C'est la leçon payée sur « Ma semaine ».*
//
// ⛔ CETTE PAGE NE CORRIGE PAS L'INSTANCE : elle y mène. « Corriger une instance
//    se fait à l'écran — c'est aussi LE SEUL CHEMIN » (`07-` §1.1), et cet écran
//    est `/prof/conception/[id]`, avec son aperçu côté élève.
//
// ⚠️ ELLE NE SE FERME PAS DERRIÈRE SON INTERRUPTEUR — comme `/prof/routeur` ne
//    se ferme pas derrière `routeur_actif` : l'interrupteur commande LES ÉLÈVES,
//    pas le professeur qui pilote. Il se LIT pour être MONTRÉ, et se bascule ici.
// ============================================================================

import Link from 'next/link'
import { garderProf } from '@/utils/routeur/acces'
import { lireFuseau } from '@/utils/fuseau-serveur'
import { chargerLaFileDesSignalements } from '@/utils/signalements/serveur'
import PorteDuSignalement from './PorteDuSignalement'
import PanneauExercice from './PanneauExercice'

export const dynamic = 'force-dynamic'

export default async function SignalementsPage({
  searchParams,
}: { searchParams: Promise<{ sel?: string }> }) {
  const { admin } = await garderProf()
  const { sel } = await searchParams
  const fuseau = await lireFuseau()
  const file = await chargerLaFileDesSignalements(admin, fuseau, new Date().toISOString())

  const active = file.lignes.find((l) => l.identite.exerciceId === sel) ?? file.lignes[0] ?? null

  return (
    <div className="space-y-6 pb-12">
      <header className="space-y-2">
        <p className="font-ui text-[11px] uppercase tracking-[0.14em] text-muet">
          Pilotage · Signalements
        </p>
        <h1 className="font-titre text-3xl text-encre">Les exercices signalés</h1>
        <p className="font-corps text-encre-douce max-w-3xl">
          Ce que les élèves disent d’un exercice qui ne va pas.{' '}
          <strong className="text-encre">Un signalement ne change rien tout seul</strong> : c’est
          votre arbitrage qui retire un exercice du comptage d’assiduité, ou l’y remet.
        </p>
      </header>

      {file.incidents.length > 0 && (
        <ul className="rounded-xl border border-retard/40 bg-retard-teinte/40 px-4 py-3 font-ui
                       text-sm text-encre-douce space-y-1">
          {file.incidents.map((i) => <li key={i}>⚠ {i}</li>)}
        </ul>
      )}

      <PorteDuSignalement actif={file.porteOuverte} />

      {/* ⭐⭐ L'ÉCHÉANCE EN TÊTE, PARCE QU'ELLE SE PÉRIME. Le cron d'assiduité
          tombe le lundi à 18:00 UTC et compte la semaine ÉCOULÉE ; passé cette
          heure, « un chiffre déjà montré au professeur ne bouge plus »
          (`06-` §5). Ce bandeau est le seul endroit d'où le professeur peut
          savoir qu'un geste va cesser d'avoir un effet. */}
      {file.enAttente > 0 && (
        <p className="rounded-xl border border-attention/35 bg-attention-teinte px-4 py-3
                      font-corps text-sm text-encre">
          <strong className="font-ui">{file.enAttente} signalement(s) à trancher.</strong>{' '}
          {file.enAttenteHorsFenetre > 0 && (
            <>
              {file.enAttenteHorsFenetre} d’entre eux portent sur une semaine{' '}
              <strong>déjà comptée</strong> : les trancher reste utile, mais l’assiduité de cette
              semaine-là ne bougera plus.{' '}
            </>
          )}
          Le comptage d’assiduité tombe le <strong>lundi à 18:00 UTC</strong>.
        </p>
      )}

      {file.lignes.length === 0 ? (
        <Vide porteOuverte={file.porteOuverte} />
      ) : (
        // ⚠️ EMPILÉ SUR TÉLÉPHONE, CÔTE À CÔTE À PARTIR DE `lg`. La liste garde
        //    une largeur fixe : à `md`, deux colonnes mettraient un bloc de
        //    consigne de 129 caractères dans 180 px.
        <div className="grid gap-5 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:items-start">
          <nav className="space-y-2" aria-label="Exercices signalés">
            {file.lignes.map((l) => (
              <Vignette
                key={l.exerciceId} ligne={l}
                actif={active?.exerciceId === l.exerciceId}
              />
            ))}
          </nav>
          {active && <PanneauExercice ligne={active} />}
        </div>
      )}
    </div>
  )
}

/**
 * ⭐ UNE VIGNETTE EST UN BLOC, PAS UNE LIGNE — c'est la mesure qui l'impose
 *    (129 caractères en médiane). Deux lignes tronquées, et l'essentiel — combien
 *    d'élèves, combien attendent — au-dessus, où il se lit sans tronquer.
 */
function Vignette({
  ligne, actif,
}: { ligne: Awaited<ReturnType<typeof chargerLaFileDesSignalements>>['lignes'][number]
  actif: boolean }) {
  const id = ligne.identite
  return (
    <Link
      href={`/prof/signalements?sel=${id.exerciceId}`}
      aria-current={actif ? 'page' : undefined}
      className={`block rounded-xl border p-3 transition-colors ${actif
        ? 'border-liseret bg-surface'
        : 'border-bordure bg-parchemin hover:bg-parchemin-fonce'}`}
    >
      <div className="flex flex-wrap items-baseline gap-x-2 font-ui text-[11px] text-muet">
        {id.cran !== null && <span>cran {id.cran}</span>}
        {id.typeLibelle && <span className="truncate">· {id.typeLibelle}</span>}
        {id.bloque && <span className="text-attention">· hors du pool</span>}
      </div>
      <p className="mt-1 font-corps text-sm leading-[1.45] text-encre line-clamp-2">
        {id.premiereLigne}
      </p>
      <p className="mt-1.5 font-ui text-xs text-encre-douce">
        {ligne.signalements.length} élève(s)
        {ligne.enAttente > 0
          ? <span className="text-attention"> · {ligne.enAttente} à trancher</span>
          : <span className="text-muet"> · tranché</span>}
      </p>
    </Link>
  )
}

/**
 * ⚠️ « Aucun signalement » ne veut pas dire la même chose selon la porte, et un
 *    écran qui ne fait pas la différence laisse chercher une panne là où il n'y
 *    a qu'un interrupteur.
 */
function Vide({ porteOuverte }: { porteOuverte: boolean }) {
  return (
    <p className="rounded-xl border border-bordure bg-parchemin px-4 py-8 text-center font-corps
                  text-encre-douce">
      {porteOuverte
        ? 'Aucun exercice signalé.'
        : 'Aucun exercice signalé — et les élèves ne peuvent pas encore le faire.'}
      <span className="mt-1 block font-ui text-xs text-muet">
        {porteOuverte
          ? 'Les élèves voient la case en pied de chaque exercice.'
          : 'Ouvrez ci-dessus pour que la case apparaisse chez eux.'}
      </span>
    </p>
  )
}
