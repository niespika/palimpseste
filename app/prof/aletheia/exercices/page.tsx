// ============================================================================
// C5 · L4 — L'ONGLET EXERCICES DU PROFESSEUR : toute la lecture sous un toit.
// ----------------------------------------------------------------------------
// « Côté professeur : Livres […], EXERCICES — *tout ce qui touche un exercice de
//   lecture vit sous un seul onglet* : le renvoi à la conception, le dépôt d'un
//   texte et la validation de sa RÉFÉRENCE DÉCOMPOSÉE, les PASSATIONS EN CLASSE,
//   les EXAMENS DIAGNOSTIQUES À CONCEVOIR — et Paramètres, tel quel. »
//                                                            — `07-` §2, C5-L4
//
// ⭐ CET ONGLET RÉUNIT QUATRE CHOSES, ET IL N'EN FABRIQUE AUCUNE : deux renvois
//    (la conception, les textes), l'encart des examens diagnostiques à concevoir
//    (C4-L9, qui vivait en tête de la RACINE prof), et la liste des passations
//    en classe de lecture (la lecture de C4-L6, dont l'atelier est devenu un
//    paramètre). Il les met sous le même toit ; il ne les réécrit pas.
//
// ⛔ ON NE DÉMÉNAGE PAS `app/prof/conception/` — décision de Louis, 27/08 :
//    « ça va me demander un peu plus de réflexion, donc pour le moment on fait
//    juste un renvoi ». On y RENVOIE PAR UN LIEN, exactement comme Codex.
//    ⚠️ Le coût du déménagement, pour que personne ne le retente en passant :
//       DIX `revalidatePath` sur des chemins Aletheia dans SIX fichiers, plus
//       `utils/integrite-preuve.ts:154`, `app/prof/corpus/page.tsx:237`,
//       `components/examens/EcranConceptionExamen.tsx:102` et `:114`, et
//       l'entrée « Conception » du Pilotage (`configNavigation.ts`). ⛔ Un
//       `revalidatePath` sur un chemin mort NE LÈVE AUCUNE ERREUR : l'écran
//       reste périmé, et personne ne sait pourquoi.
//
// ⛔ AUCUNE FILE DE VALIDATION ICI. `nombreAValiderCodex` lit `codex_travaux`,
//    la SYNTHÈSE EN CLASSE de Codex : il n'y a AUCUN équivalent côté lecture, et
//    le retour d'un exercice de lecture est publié par la chaîne. On ne fabrique
//    pas une file qui n'existe pas.
//
// ⛔ AUCUNE SYNTHÈSE EN CLASSE NON PLUS : elle est une ÉCRITURE (`06-` §1), elle
//    vit dans Codex, et « son nom est "la synthèse en classe", et pas un autre »
//    (`01-` §10).
// ============================================================================

import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/admin'
import { examensAConcevoir } from '@/utils/examens/plan'
import EncartAConcevoir from '@/components/examens/EncartAConcevoir'
import { passationsDeClasse } from '@/utils/codex-onglets/liste'
import { formatInstant } from '@/utils/fuseau'
import { lireFuseau } from '@/utils/fuseau-serveur'

export default async function ExercicesAletheiaProfPage() {
  const admin = createAdminClient()
  // ⚠️ `Promise.all` SUR DES REQUÊTES DÉJÀ LANCÉES, jamais sur des constructeurs :
  //    le constructeur de requête de supabase-js est PARESSEUX (il ne part qu'au
  //    premier `then`), et du code qui paraît parallèle peut être séquentiel.
  //    Les trois appels ci-dessous sont des fonctions `async` — elles partent à
  //    l'appel, pas au `await`.
  const [examens, passations, fuseau] = await Promise.all([
    // C4-L9 — « le professeur voit ce qu'il a à concevoir, DANS SON MODULE ».
    // ⚠️ `EncartAConcevoir` REND `null` SUR LISTE VIDE, et la liste est vide
    //    quand la porte du plan est fermée : une page nue n'est pas la preuve
    //    qu'il est cassé.
    examensAConcevoir(admin, 'aletheia'),
    // ⭐ La liste de C4-L6, dont C5-L4 a fait de l'atelier un paramètre. La règle
    //    qu'elle porte — LA LIGNE DE PLAN D'ABORD, LE MODE ENSUITE — ne s'inverse
    //    pas : l'explication de texte mesure l'Expression EN `composer`, et la
    //    règle des modes l'enverrait dans Codex quand le `06-` §1 la range en
    //    LECTURE. ⚠️ `passation_classe_actif` à OFF ne vide PAS cet inventaire :
    //    l'interrupteur garde l'ÉCRAN (`utils/passation/acces.ts`).
    passationsDeClasse(admin, 'aletheia'),
    // ⚠️ `fenetre_debut` est un INSTANT (`timestamptz`), pas une date pure : il
    //    se formate DANS LE FUSEAU (`formatJour` est réservé aux colonnes `date`).
    lireFuseau(),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-titre text-xl text-encre">Les exercices de lecture</h2>
        <p className="font-corps text-sm text-muet mt-1">
          Tout ce qui touche un exercice de lecture — sa conception, son texte, sa passation
          en classe — vit sous cet onglet.
        </p>
      </div>

      {/* Les portes de l'onglet : ce qui vit ailleurs, et où l'on y va. */}
      <nav className="flex flex-wrap items-center gap-2">
        <Link
          href="/prof/conception/nouvelle?porte=aletheia"
          className="font-ui text-xs inline-flex items-center gap-2 rounded-lg border border-bordure bg-surface px-3 py-2 text-encre hover:border-pigment transition-colors"
        >
          Concevoir un exercice de lecture →
        </Link>
        {/* ⭐ Le dépôt d'un texte, sa décomposition et la validation de sa
            RÉFÉRENCE sont un geste DE LECTURE par excellence (`02-` §6 A ;
            C5-L1) — et « une référence non validée n'entre jamais en Phase 2 ». */}
        <Link
          href="/prof/conception/textes"
          className="font-ui text-xs inline-flex items-center gap-2 rounded-lg border border-bordure bg-surface px-3 py-2 text-encre hover:border-pigment transition-colors"
        >
          Les textes et leurs références →
        </Link>
        <Link
          href="/prof/conception"
          className="font-ui text-xs inline-flex items-center gap-2 rounded-lg border border-bordure bg-surface px-3 py-2 text-encre hover:border-pigment transition-colors"
        >
          Tout ce qui a été conçu →
        </Link>
      </nav>

      {/* C4-L9 — l'encart qui vivait en tête de la RACINE prof. Il déménage ici
          avec son module ; son code ne bouge pas d'une ligne. */}
      <EncartAConcevoir module="aletheia" examens={examens} />

      {/* ⭐ LA SECONDE PORTE VERS `app/prof/aletheia/passation/[exerciceId]`.
          La première — `app/prof/conception/[id]`, « là où le professeur vient
          déjà d'assigner » — RESTE : deux portes vers le même écran ne sont pas
          un doublon, ce sont deux chemins qu'il emprunte à deux moments.
          ⚠️ Avant ce lot, cet écran n'avait qu'UN SEUL lien dans tout le dépôt. */}
      {passations.length > 0 ? (
        <div className="bg-surface border border-bordure rounded-xl p-4">
          <h3 className="font-ui text-[11px] font-medium uppercase tracking-[0.12em] text-muet mb-2">
            Passations en classe · {passations.length}
          </h3>
          <div className="space-y-2">
            {passations.map((p) => (
              <div key={p.exerciceId}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-bordure px-3 py-2">
                <span className="font-corps text-sm text-encre flex-1 min-w-0 truncate">
                  {p.titre}
                  {p.classeNom && <span className="text-muet"> — {p.classeNom}</span>}
                </span>
                {p.quand && (
                  <span className="font-ui text-xs text-muet shrink-0">
                    {formatInstant(p.quand, fuseau, { day: 'numeric', month: 'short' })}
                  </span>
                )}
                <Link href={p.href} className="font-ui text-xs text-pigment hover:underline shrink-0">
                  Ouvrir →
                </Link>
              </div>
            ))}
          </div>
        </div>
      ) : (
        // ⭐ UN VIDE EXPLIQUÉ, JAMAIS UN ÉCRAN QUI SE TAIT (`07-` §5). On vient de
        //    cliquer cet onglet exprès : il doit dire quelque chose.
        <p className="font-corps text-sm text-muet">
          Aucune passation de lecture en classe pour le moment. Elles apparaissent ici dès
          qu&apos;un examen diagnostique de lecture est conçu et assigné.
        </p>
      )}
    </div>
  )
}
