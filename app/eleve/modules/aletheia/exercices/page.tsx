// ============================================================================
// C5 · L4 — L'ONGLET EXERCICES DE L'ÉLÈVE : ce qu'il travaille À LA MAISON.
// ----------------------------------------------------------------------------
// « Côté élève : Livres, sa séance de lecture, EXERCICES, ce qu'il travaille à
//   la maison, et Examens, où vit la passation en classe. »   — `07-` §2, C5-L4
//
// ⭐ LE PARTAGE EST CELUI DU `06-` §1 : « lecture formative, À LA MAISON » ici ;
//    « lecture diagnostique, EN CLASSE » sous Examens.
//
// ⭐ CE QUI ARRIVE ICI VIENT DE LA RACINE, ET NE SE RÉÉCRIT PAS. C5-L2 avait
//    posé la `<section>` « Mes exercices de lecture » sur la racine élève, faute
//    d'onglet : elle DÉMÉNAGE, avec son message de vide. La lecture, sa porte et
//    son tri vivent dans le module partagé (`utils/codex-onglets/liste.ts`) —
//    cet écran n'a AUCUNE règle.
//
// ⛔ CE N'EST PAS UN TABLEAU DE BORD, ET SURTOUT PAS « L'ÉCRAN DE LA SEMAINE ».
//    « Le tableau de bord est le point d'entrée du cycle » (`01-` §2) et l'écran
//    de la semaine — sa frise, son héros « à faire maintenant » — est C6-L2.
//    ⚠️ Et le `02-` §6 C tend le même piège d'un autre côté : le RÉCAPITULATIF
//       DE SEMAINE et le BILAN DE FIN DE SEMAINE y sont décrits — ils
//       appartiennent au ROUTEUR, pas à cet onglet. Ceci est UNE LISTE ET UNE
//       PORTE.
//
// ⛔ AUCUNE LETTRE, AUCUNE NOTE, AUCUN POURCENTAGE (`06-` §5 ; `01-` §9) : « un
//    onglet qui range des exercices n'est pas un endroit où l'on découvre son
//    niveau ». Ce qui s'affiche est l'ÉTAT DU GESTE, jamais ce que l'élève vaut.
//
// ⚠️ LA PORTE EST `exercices_actif`, ET ELLE SE LIT DANS LE MODULE PARTAGÉ :
//    `exercicesMaisonDeLEleve` appelle `lireLaPorte` elle-même. On la relit ici
//    UNIQUEMENT pour distinguer les deux vides — jamais pour garder la liste.
//    ⛔ Et c'est `exercices_actif` SEUL : `chaine_actif` en particulier est le
//       seul des six qu'une MACHINE bascule (la coupure de coût l'éteint au
//       plafond mensuel), et l'emprunter comme garde d'écran fermerait un onglet
//       que personne n'a décidé de fermer (`07-` §5).
// ============================================================================

import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/admin'
import { lireLaPorte } from '@/utils/deroule/acces'
import { exercicesMaisonDeLEleve } from '@/utils/codex-onglets/liste'
import type { TonEtat } from '@/utils/codex-onglets/regles'
import { seuilAletheia } from '../gardes'

/** Les jetons de `globals.css`, jamais de hex en dur (`AGENTS.md`). */
const PASTILLE: Record<TonEtat, string> = {
  a_lire:   'bg-attention-teinte text-attention',
  a_faire:  'bg-info-teinte text-info',
  en_cours: 'bg-info-teinte text-info',
  attente:  'bg-parchemin-fonce text-muet',
  clos:     'bg-parchemin-fonce text-muet',
}

export default async function ExercicesAletheiaElevePage() {
  // ⛔ LES QUATRE GARDES D'ABORD — un onglet qu'on clique doit dire POURQUOI il
  //    refuse, jamais rendre une page vide.
  const seuil = await seuilAletheia()
  if (seuil.type === 'ecran') return seuil.noeud

  const admin = createAdminClient()
  // ⚠️ LA CLASSE EN CONTEXTE BORNE LA LISTE (`01-` §2, « dans les modules on
  //    reste par classe ») : un élève bi-classe ne voit jamais ici le travail de
  //    l'autre classe. Le seuil vient de la résoudre — on ne la relit pas.
  const [porte, exercices] = await Promise.all([
    lireLaPorte(admin),
    exercicesMaisonDeLEleve(admin, seuil.userId, seuil.active.classe_id, 'aletheia'),
  ])

  return (
    <div className="space-y-6 pb-8">
      {/* ⚠️ Le « ← Retour » de la page — c'est lui qui fait que les cartes de
          `CarteMessage` rendues DANS ce corps n'en portent pas un second. */}
      <Link href="/eleve" className="text-sm text-muet hover:text-encre-douce">← Retour</Link>

      <div>
        <h2 className="font-titre text-xl text-encre">Mes exercices de lecture</h2>
        <p className="font-corps text-sm text-muet mt-1">
          Ce que tu travailles <strong>à la maison</strong>, à l&apos;écran.
        </p>
      </div>

      {exercices.length > 0 ? (
        <div className="space-y-2">
          {exercices.map((e) => (
            <Link
              key={e.depotId}
              href={e.href}
              className="flex items-center justify-between gap-3 bg-surface border border-bordure rounded-xl px-4 py-3 hover:border-pigment transition-colors"
            >
              <p className="text-sm font-medium text-encre truncate min-w-0">{e.titre}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${PASTILLE[e.etat.ton]}`}>
                {e.etat.libelle}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        // ⭐⭐ SOUS UN ONGLET DÉDIÉ, LA RÈGLE DU VIDE CHANGE DE FORME — et c'est
        //    la seule chose que ce déménagement modifie. Sur la racine, le bloc
        //    ne s'affichait QUE s'il y avait quelque chose : la page portait
        //    d'abord des LIVRES, et un encart vide au-dessus d'eux aurait fait
        //    croire à une panne. Ici, ON VIENT DE CLIQUER EXPRÈS : un onglet
        //    vide DOIT dire quelque chose.
        // ⚠️ ET LES DEUX VIDES NE SE DISENT PAS DE LA MÊME FAÇON. « La porte est
        //    fermée » n'est pas « tu n'as rien à faire » — et l'élève n'a pas à
        //    connaître le nom d'un interrupteur pour comprendre son écran.
        <div className="bg-surface border border-bordure rounded-xl p-8 text-center">
          <p className="text-muet text-sm">
            {porte.exercicesActifs
              ? 'Aucun exercice de lecture pour le moment. Ceux que ton professeur te donne apparaîtront ici.'
              : 'Les exercices de lecture ne sont pas encore ouverts. Ton professeur t’indiquera quand ils commencent.'}
          </p>
        </div>
      )}
    </div>
  )
}
