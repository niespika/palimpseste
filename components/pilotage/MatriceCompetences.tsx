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
// ⚠️ L'écran est ANTÉRIEUR à C4 : le corriger n'est pas le refaire. La bascule
//    d'onglet, la liste d'élèves et le tri ne bougent pas.
//
// Et c'est ici que l'OPT-OUT atterrit — « le profil de la classe, au tableau de
// pilotage, porte l'opt-out : la compétence qu'un cours ne travaille pas »
// (`07-` §1.3). Il vivait au tableau des compétences, qui n'est pas son
// domicile ; la table, l'action et le routeur, eux, n'ont pas bougé.
// ============================================================================

import OptOutClasses from './OptOutClasses'
import type { RowPilotage } from '@/utils/matrice-pilotage'

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
  lignes, classeId, classeNom, optOut, affichageActif,
}: {
  lignes: RowPilotage[]
  classeId: string
  classeNom: string
  /** `competences_actives_par_classe`, pour cette classe : code → active. */
  optOut: Record<string, boolean>
  /** `scriptorium_params.competences_affichage_actif` — l'un des trois du `07-` §5. */
  affichageActif: boolean
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

      {/* ── Les niveaux : UN VIDE EXPLIQUÉ, jamais des colonnes inventées ──── */}
      <section className="rounded-xl border border-dashed border-bordure bg-surface p-4 space-y-2">
        <h2 className="font-titre text-lg text-encre">Les niveaux de la classe</h2>
        <p className="font-corps text-sm text-encre-douce max-w-3xl">
          {affichageActif
            ? <>Aucune lettre n&apos;est encore posée pour cette classe : une compétence n&apos;en
              reçoit une qu&apos;à sa première mesure exploitable. La grille apparaîtra quand les
              premières mesures seront écrites.</>
            : <>L&apos;affichage des lettres est <strong>fermé</strong>{' '}
              (<code>competences_affichage_actif</code>). Cet onglet reste ouvert, et il est vide
              pour cette raison-là — pas parce que la classe n&apos;a rien fait.</>}
        </p>
        <p className="font-ui text-xs text-muet max-w-3xl">
          {lignes.length === 0
            ? 'Aucun élève inscrit dans cette classe.'
            : `${lignes.length} élève${lignes.length > 1 ? 's' : ''} inscrit${lignes.length > 1 ? 's' : ''}`}
          {nbOptOut > 0 && ` · ${nbOptOut} compétence${nbOptOut > 1 ? 's' : ''} en opt-out`}
        </p>
      </section>
    </div>
  )
}
