// ============================================================================
// C10 · L1 — L'EXERCICE D'UNE SEMAINE COMPTÉE : trois choses, et rien d'autre.
// ----------------------------------------------------------------------------
// ⭐⭐ « L'exercice ne montre plus que LA CONSIGNE, LA RÉPONSE DE L'ÉLÈVE ET SON
//    RETOUR » (`07-` §2, chapitre `C10`). Ni matériau, ni candidats, ni
//    distracteurs, ni zones, ni réponse attendue — **et ils sont ABSENTS de la
//    charge servie, pas masqués** : `chargerLeDeroule` a déjà réduit la vue
//    (`utils/deroule/fermeture.ts`, `vueFermee`). Ce fichier ne peut donc pas
//    fuir ce qu'il ne reçoit pas, et c'est le point de l'architecture — *le
//    motif est écrit à la source : « l'exercice peut être resservi »*, à un autre
//    élève ou au même dans un autre cycle.
//
// ⭐ LE PRÉCÉDENT EST `ExerciceEnRevision`, et cet écran en reprend la coquille :
//    la même barre de titre, le même lien de retour, la même largeur. C'est le
//    même genre d'objet — un exercice qu'on ne travaille plus, mais qu'on relit.
//
// ⭐⭐ ET IL PORTE LE BOUTON DE LECTURE, BIEN EN VUE. C'est la seule porte de
//    sortie d'un exercice fermé : `actionValiderLaLecture` pose `statut = 'clos'`
//    sur le dépôt, la ligne quitte `a_lire`, et **le bilan de la semaine
//    s'ouvre**. Sans elle, un élève qui n'ouvre jamais son retour n'a jamais son
//    bilan — c'était déjà vrai, mais la fermeture le rend visible sur une
//    semaine morte, où l'élève ne reviendra peut-être pas. D'où le retour EN
//    PREMIER, avant la copie et avant la consigne.
//
// ⛔ CE N'EST PAS ICI QUE LES GESTES SONT REFUSÉS. Le refus vit au portier des
//    actions serveur (`app/deroule/actions.ts`), et il y vaut aussi pour
//    l'onglet resté ouvert depuis dimanche soir. Cet écran ne fait qu'être
//    honnête sur ce qu'il reste à faire : rien.
//
// ⚠️ AUCUN `<details open>` ICI. Chrome restaure l'état d'un `<details>` au
//    rechargement, et l'hydratation part alors en « hydration failed » — défaut
//    déjà payé. Les deux blocs repliés naissent fermés, et le restent.
// ============================================================================

import Link from 'next/link'
import { RetourSegmente } from './RetourSegmente'
import { TexteBalise } from './TexteBalise'
import { MESSAGE_SEMAINE_FERMEE } from '@/utils/deroule/fermeture'
import type { VueDuDeroule } from '@/utils/deroule/vue'
import type { Atelier } from '@/utils/codex-onglets/regles'

export function ExerciceFerme(
  { vue, atelier }: { vue: VueDuDeroule; atelier: Atelier },
) {
  // ⭐ LA RÉPONSE DE L'ÉLÈVE, ET LE MOT JUSTE POUR CHACUNE DES DEUX. `v1RemiseLe`
  //    est le discriminant, et c'est pour cela qu'il survit à la réduction : sans
  //    remise, ce que porte `texteV1` est un BROUILLON. « Un brouillon non remis
  //    se perd » ne supprime rien — il cesse d'être remettable —, et l'appeler
  //    « ta réponse » dirait à l'élève qu'il a rendu quelque chose.
  const aRemis = vue.v1RemiseLe !== null
  const copie = vue.texteVf ?? vue.texteV1
  // ⚠️ Quand il n'y a RIEN, on n'annonce pas « ton brouillon, tel que tu l'as
  //    laissé » pour dire ensuite qu'il n'y en a pas : le titre promettrait un
  //    texte que la ligne suivante retire. Trouvé au smoke du 07/09.
  const titreDeLaCopie = copie === null
    ? 'Ta réponse'
    : vue.texteVf !== null ? 'Ta version finale'
      : aRemis ? 'Ce que tu as rendu' : 'Ton brouillon, tel que tu l’as laissé'

  // Le plus récent d'abord — c'est celui que l'élève n'a pas encore lu.
  const recent = vue.retourFinal ?? vue.retourChaud
  const ancien = vue.retourFinal ? vue.retourChaud : null

  return (
    <div className="-mx-4 overflow-hidden border-y border-bordure bg-fond-module
                    sm:mx-0 sm:rounded-2xl sm:border">
      <div className="flex items-center gap-3 border-b border-bordure bg-surface px-4 py-3
                      sm:gap-4 sm:px-6">
        <Link
          href={`/eleve/modules/${atelier}`}
          className="min-h-11 shrink-0 whitespace-nowrap font-ui text-[13px] text-muet
                     hover:text-encre-douce sm:flex sm:items-center"
        >
          ← <span className="hidden sm:inline">Exercices</span>
        </Link>
        <span aria-hidden className="hidden h-5 w-px shrink-0 bg-bordure sm:block" />
        {/* ⚠️ `min-w-0` sur l'élément souple : sans lui, `flex` ne replie rien et
            un titre long écrase le lien de retour — défaut déjà payé (la ligne
            de synthèse écrasée à 12 px, tests verts). */}
        <h1 className="min-w-0 flex-1 truncate font-titre text-lg font-bold text-encre
                       sm:text-[23px]">
          {vue.titre}
        </h1>
      </div>

      <div className="space-y-5 px-4 py-6 sm:px-6 sm:py-8">
        {/* ── LE MOT DE LOUIS, mot pour mot, et une seule fois ────────────── */}
        <div className="rounded-xl border border-bordure bg-surface px-4 py-3.5 sm:px-5">
          <p className="font-marque text-[11px] font-semibold uppercase tracking-[0.11em]
                        text-muet">
            Semaine terminée
          </p>
          <p className="mt-1.5 font-corps text-[15px] leading-[1.55] text-encre">
            {MESSAGE_SEMAINE_FERMEE}
          </p>
        </div>

        {/* ── LE RETOUR, EN PREMIER : c'est la seule chose qui appelle encore
               un geste, et le bouton de lecture vit dedans. ───────────────── */}
        {recent && (
          <RetourSegmente
            key={recent.moment}
            depotId={vue.depotId}
            retour={recent}
            vue={vue}
            fermee
            titre={recent.moment === 'final' ? 'Ce qui a bougé' : 'Ton retour'}
            ancien={ancien ? (
              <details className="group rounded-xl border border-bordure bg-surface-retrait">
                <summary className="cursor-pointer list-none px-4 py-3 font-ui text-[13px]
                                    text-muet hover:text-encre-douce">
                  Ton premier retour
                </summary>
                <div className="px-4 pb-4">
                  <RetourSegmente
                    depotId={vue.depotId} retour={ancien} vue={vue} nu
                    titre="Ton premier retour" />
                </div>
              </details>
            ) : null}
          />
        )}

        {/* ── TA RÉPONSE, en lecture seule. ⛔ Aucun texte n'est effacé. ──── */}
        <section className="rounded-xl border border-bordure bg-surface p-4 sm:p-5">
          <h2 className="font-marque text-[11px] font-semibold uppercase tracking-[0.11em]
                         text-muet">
            {titreDeLaCopie}
          </h2>
          {copie
            ? (
              <p className="mt-2 whitespace-pre-wrap font-corps text-[16px] leading-[1.6]
                            text-encre">
                {copie}
              </p>
            )
            : (
              <p className="mt-2 font-corps text-[15px] italic leading-[1.55] text-muet">
                Tu n’avais rien écrit sur cet exercice.
              </p>
            )}
        </section>

        {/* ── LA CONSIGNE, repliée : elle rappelle ce qui était demandé. ──── */}
        <details className="group rounded-xl border border-bordure bg-surface-retrait">
          <summary className="min-h-11 cursor-pointer list-none px-4 py-3 font-ui text-[13px]
                              text-muet hover:text-encre-douce sm:px-5">
            La consigne <span aria-hidden className="group-open:hidden">▸</span>
            <span aria-hidden className="hidden group-open:inline">▾</span>
          </summary>
          <div className="px-4 pb-4 sm:px-5">
            <TexteBalise
              jetons={vue.consigne}
              className="font-corps text-[16px] leading-[1.6] text-encre-douce" />
          </div>
        </details>

        <p>
          <Link
            href={`/eleve/modules/${atelier}`}
            className="inline-flex min-h-12 items-center rounded-[10px] border border-bordure
                       bg-surface px-6 py-3.5 font-ui text-[15px] font-semibold text-encre"
          >
            Revenir à mes exercices
          </Link>
        </p>
      </div>
    </div>
  )
}
