// ============================================================================
// L'ONGLET COMPÉTENCES DU PROFIL DE CLASSE.
// ----------------------------------------------------------------------------
// ⭐ C4-L11 — LE SORT DE LA « ZONE EN CONSTRUCTION ».
//
// Cet onglet affichait une grille de CINQ COLONNES INVENTÉES — Analyser ·
// Interpréter · Argumenter · Problématiser · Conceptualiser —, une pastille
// vide par élève et par colonne, et un ruban « EN CONSTRUCTION ». Ce ne sont
// pas les SIX du référentiel, et une pastille vide est un signe qui ne compte
// rien. Deux sources commandent, et elles disent la même chose :
//
//   · « Un onglet dont l'interrupteur est à OFF S'AFFICHE, et son contenu DIT
//     POURQUOI IL EST VIDE. […] Un vide expliqué, jamais un onglet qui
//     clignote. »                                              — `07-` §5
//   · « Un écran n'affiche un nombre que si ce nombre compte quelque chose. […]
//     un chiffre qui ne mesure rien attire pourtant des décisions. »
//                                                              — `06-` §5
//
// D'où : LES CINQ COLONNES PARTENT, L'ONGLET RESTE, et son contenu dit ce qu'il
// attend. La grille des lettres reviendra quand elle aura de quoi se remplir —
// `competences_niveaux` (`07-` §1.3), derrière `competences_affichage_actif`.
//
// ⭐ ELLE A DE QUOI, ET LA VOICI. Le 26/08/2026, la chaîne a écrit ses premières
//    mesures réelles (11 élèves × 3 compétences). La grille rend LES SIX du
//    référentiel — pas les cinq inventées — derrière le MÊME interrupteur, qui
//    n'a donc pas eu à être créé : `competences_affichage_actif` a toujours été
//    l'interrupteur de cet écran-là.
//
// ⚠️ LE VIDE RESTE EXPLIQUÉ, et il a maintenant DEUX raisons distinctes qu'un
//    seul message confondait : l'interrupteur est fermé, OU aucune mesure n'est
//    encore écrite. Le texte qui disait « aucune lettre n'est encore posée »
//    aurait MENTI dès la première mesure — il ne se déduisait de rien.
//
// ⚠️ L'écran est ANTÉRIEUR à C4 : le corriger n'est pas le refaire. La bascule
//    d'onglet, la liste d'élèves et le tri ne bougent pas.
//
// Et c'est ici que l'OPT-OUT atterrit — « le profil de la classe, au tableau de
// pilotage, porte l'opt-out : la compétence qu'un cours ne travaille pas »
// (`07-` §1.3). Il vivait au tableau des compétences, qui n'est pas son
// domicile ; la table, l'action et le routeur, eux, n'ont pas bougé.
// ============================================================================

import OptOutClasses from './OptOutClasses'
import GrilleCompetences from './GrilleCompetences'
import type { RowPilotage } from '@/utils/matrice-pilotage'
import type { GrilleCompetencesClasse } from '@/utils/competences-classe'

/** Les six du référentiel, dans l'ordre du `07-` §1.2 — jamais une liste inventée. */
export const LES_SIX_COMPETENCES: ReadonlyArray<{ code: string; nom: string }> = [
  { code: 'expression', nom: 'Expression' },
  { code: 'argumentation', nom: 'Argumentation' },
  { code: 'structure', nom: 'Structure' },
  { code: 'connaissance', nom: 'Connaissance' },
  { code: 'synthese', nom: 'Synthèse' },
  { code: 'questionnement', nom: 'Questionnement' },
]

export default function MatriceCompetences({
  lignes, classeId, classeNom, optOut, affichageActif, grille, tz,
}: {
  lignes: RowPilotage[]
  classeId: string
  classeNom: string
  /** `competences_actives_par_classe`, pour cette classe : code → active. */
  optOut: Record<string, boolean>
  /** `scriptorium_params.competences_affichage_actif` — l'un des trois du `07-` §5. */
  affichageActif: boolean
  /** Les six colonnes et leurs cellules. `null` quand l'affichage est fermé. */
  grille: GrilleCompetencesClasse | null
  /** Le fuseau de l'école (`lireFuseau`) — `mesure_at` est un instant. */
  tz: string
}) {
  const nbOptOut = LES_SIX_COMPETENCES.filter((c) => optOut[c.code] === false).length
  return (
    <div className="space-y-3">
      {/* ── L'opt-out : le seul geste de cet onglet, et il est réel ────────── */}
      <section className="rounded-xl border border-bordure bg-surface p-4 space-y-3">
        <h2 className="font-titre text-lg text-encre">
          Ce que ce cours travaille — l&apos;opt-out
        </h2>
        <p className="font-corps text-sm text-encre-douce max-w-3xl">
          Une compétence déclarée <code>evaluee</code> l&apos;est{' '}
          <strong>pour toutes les classes</strong>, sans second geste. Ce qui se pose ici est le
          retrait : <strong>la compétence que ce cours ne travaille pas</strong>. Le routeur lit ce
          choix pour assigner ; il ne l&apos;écrit jamais.
        </p>
        <OptOutClasses
          classes={[{ id: classeId, nom: classeNom }]}
          competences={LES_SIX_COMPETENCES.map((c) => ({ ...c }))}
          etat={Object.fromEntries(
            LES_SIX_COMPETENCES.map((c) => [`${classeId}|${c.code}`, optOut[c.code] ?? true]))}
        />
      </section>

      {/* ── Les niveaux : LA GRILLE, ou un vide qui dit LAQUELLE de ses deux
          raisons s'applique — jamais un message qui vaut pour les deux ──── */}
      {affichageActif && grille && (grille.nbMesures > 0 || grille.nbLettres > 0) ? (
        <GrilleCompetences
          eleves={lignes.map((l) => ({ eleveId: l.eleveId, nom: l.nom }))}
          colonnes={grille.colonnes}
          cellules={grille.cellules}
          tz={tz}
        />
      ) : (
        <section className="rounded-xl border border-dashed border-bordure bg-surface p-4 space-y-2">
          <h2 className="font-titre text-lg text-encre">Les niveaux de la classe</h2>
          <p className="font-corps text-sm text-encre-douce max-w-3xl">
            {!affichageActif
              ? <>L&apos;affichage des lettres est <strong>fermé</strong>{' '}
                (<code>competences_affichage_actif</code>). Cet onglet reste ouvert, et il est vide
                pour cette raison-là — pas parce que la classe n&apos;a rien fait.</>
              : (grille?.incidents.length ?? 0) > 0
                ? <>La grille n&apos;a rien à montrer, <strong>et une lecture a échoué</strong> :
                  on ne peut pas dire si la classe n&apos;a rien, ou si la base n&apos;a rien
                  rendu. Le détail est en dessous.</>
                : <>Aucune lettre, aucune mesure pour les élèves de cette classe : une compétence
                  ne reçoit sa lettre qu&apos;à sa première mesure exploitable. La grille
                  apparaîtra dès le premier dépôt passé à la chaîne.</>}
          </p>
          <p className="font-ui text-xs text-muet max-w-3xl">
            {lignes.length === 0
              ? 'Aucun élève inscrit dans cette classe.'
              : `${lignes.length} élève${lignes.length > 1 ? 's' : ''} inscrit${lignes.length > 1 ? 's' : ''}`}
            {nbOptOut > 0 && ` · ${nbOptOut} compétence${nbOptOut > 1 ? 's' : ''} en opt-out`}
          </p>
        </section>
      )}

      {/* Une lecture ratée n'est pas une base vide — l'écran le dit plutôt que
          d'afficher une grille amputée sans un symptôme. */}
      {(grille?.incidents.length ?? 0) > 0 && (
        <section className="rounded-xl border border-retard/40 bg-retard-teinte p-3">
          <p className="font-ui text-xs text-retard">
            Lecture incomplète — la grille ci-dessus peut être partielle :
          </p>
          <ul className="mt-1 space-y-0.5">
            {grille!.incidents.map((i) => (
              <li key={i} className="font-corps text-xs text-retard">· {i}</li>
            ))}
          </ul>
        </section>
      )}

    </div>
  )
}
