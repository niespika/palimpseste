// ============================================================================
// « CET EXERCICE EST EN RÉVISION » — l'écran qui remplace un 404.
// ----------------------------------------------------------------------------
// ⭐⭐ DEMANDE DE LOUIS, 31/08 : « si je confirme un problème, il ne faut pas un
//    404, mais juste "cet exercice est en révision par le prof, reviens plus
//    tard" ». Le 404 était exact et illisible : l'élève venait de signaler, et
//    la page disparaissait sans un mot — *c'est-à-dire au moment précis où il
//    avait fait ce qu'on lui demandait de faire.*
//
// ⛔ CET ÉCRAN NE SERT NI CONSIGNE, NI MATÉRIAU, NI COPIE. Il dit un état, et il
//    rend le titre — que l'élève a déjà lu — pour qu'il reconnaisse ce qu'il
//    avait ouvert. Rien d'autre ne descend jusqu'ici (`exerciceEnRevision`).
//
// ⚠️ IL NE PARLE PAS D'ASSIDUITÉ. Les deux agrégats sont ceux du professeur
//    (`06-` §5) ; dire à l'élève « ça ne comptera pas contre toi » serait lui
//    montrer un compte qu'il ne voit nulle part ailleurs, et promettre à sa
//    place ce que le professeur seul arbitre.
//
// ⚠️ ET IL NE PROMET PAS DE DATE. « Reviens plus tard » est vrai ; « demain » ne
//    le serait pas — la révision est un geste du professeur, sans échéance.
// ============================================================================

import Link from 'next/link'
import type { Atelier } from '@/utils/codex-onglets/regles'
import type { ExerciceEnRevision as Etat } from '@/utils/signalements/serveur'

export function ExerciceEnRevision(
  { etat, atelier }: { etat: Etat; atelier: Atelier },
) {
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
        <h1 className="min-w-0 flex-1 truncate font-titre text-lg font-bold text-encre
                       sm:text-[23px]">
          {etat.titre}
        </h1>
      </div>

      <div className="px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-xl space-y-4 text-center">
          <p className="font-marque text-[11px] font-semibold uppercase tracking-[0.11em]
                        text-attention">
            En révision
          </p>
          <p className="font-corps text-[17px] leading-[1.5] text-encre">
            Cet exercice est <strong>en révision par ton professeur</strong>. Il n’y a rien à faire
            dessus pour l’instant — <strong>reviens plus tard</strong> : s’il le remet en service,
            tu le retrouveras dans ta liste.
          </p>

          {etat.monTexte && (
            <div className="rounded-xl border border-bordure bg-surface p-4 text-left">
              <p className="font-ui text-xs uppercase tracking-[0.11em] text-muet">
                Ce que tu avais signalé
              </p>
              <p className="mt-1.5 font-corps text-[15px] leading-[1.55] text-encre-douce
                            whitespace-pre-wrap">
                {etat.monTexte}
              </p>
              {etat.confirme && (
                <p className="mt-2.5 font-ui text-xs text-ok">
                  ✓ Ton professeur a confirmé : l’exercice a bien un problème.
                </p>
              )}
            </div>
          )}

          <p>
            <Link
              href={`/eleve/modules/${atelier}`}
              className="inline-flex min-h-12 items-center rounded-[10px] bg-bouton px-6 py-3.5
                         font-ui text-[15px] font-semibold text-bouton-texte"
            >
              Revenir à mes exercices
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
